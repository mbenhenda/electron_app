import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from jwt.exceptions import JWTException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app import crud
from app.core import security
from app.core.config import settings
from app.deps import CurrentUser, SessionDep, get_current_active_superuser  # noqa: F401
from app.models import Message, NewPassword, RefreshToken, User, UserPublic
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE = "refresh_token"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE,
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT != "local",
        samesite="lax",
        max_age=security.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth",
    )


def _issue_tokens(session: Session, response: Response, user: User) -> AccessTokenResponse:
    access_token = security.create_access_token(user.id)
    refresh_token, jti = security.create_refresh_token(user.id)

    expires_at = datetime.now(timezone.utc) + timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
    session.add(RefreshToken(user_id=user.id, jti=jti, expires_at=expires_at))
    session.commit()

    _set_refresh_cookie(response, refresh_token)
    return AccessTokenResponse(access_token=access_token)


@router.post("/login", response_model=AccessTokenResponse)
def login(body: LoginRequest, response: Response, session: SessionDep) -> AccessTokenResponse:
    user = crud.authenticate(session=session, email=body.email, password=body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return _issue_tokens(session, response, user)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(request: Request, response: Response, session: SessionDep) -> AccessTokenResponse:
    token = request.cookies.get(_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    except JWTException:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    jti: str = payload.get("jti", "")
    user_id: str = payload.get("sub", "")

    db_token = session.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
    if not db_token:
        # Token not in DB — possible reuse attack; revoke all sessions for this user
        stale = session.exec(
            select(RefreshToken).where(RefreshToken.user_id == uuid.UUID(user_id))
        ).all()
        for t in stale:
            session.delete(t)
        session.commit()
        raise HTTPException(status_code=401, detail="Refresh token reuse detected — all sessions revoked")

    user = session.get(User, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Rotate: delete the used token before issuing a new one
    session.delete(db_token)
    session.commit()

    return _issue_tokens(session, response, user)


@router.post("/logout", response_model=Message)
def logout(request: Request, response: Response, session: SessionDep) -> Message:
    token = request.cookies.get(_COOKIE)
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
            jti = payload.get("jti", "")
            db_token = session.exec(select(RefreshToken).where(RefreshToken.jti == jti)).first()
            if db_token:
                session.delete(db_token)
                session.commit()
        except JWTException:
            pass

    response.delete_cookie(_COOKIE, path="/auth")
    return Message(message="Logged out successfully")


@router.get("/me", response_model=UserPublic)
def get_me(current_user: CurrentUser) -> Any:
    return current_user


@router.post("/password-recovery/{email}", response_model=Message)
def recover_password(email: str, session: SessionDep) -> Message:
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(email_to=user.email, email=email, token=token)
    send_email(email_to=user.email, subject=email_data.subject, html_content=email_data.html_content)
    return Message(message="Password recovery email sent")


@router.post("/reset-password", response_model=Message)
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    user.hashed_password = security.get_password_hash(body.new_password)
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")
