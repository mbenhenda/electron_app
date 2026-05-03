from fastapi import APIRouter, Request, Response
import uuid

router = APIRouter()


@router.get("/set-cookie")
def set_cookie(response: Response):
    my_uuid = uuid.uuid4()
    print(my_uuid)
    response.set_cookie(key="mycookie", value=str(my_uuid), httponly=True)
    return {"message": "Cookie set!"}


@router.get("/status")
def read_status(request: Request):
    # Factorisation récupération headers
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    user_agent = request.headers.get("user-agent")
    cookies = request.cookies

    print(f"Origin: {origin}, Referer: {referer}, User-Agent: {user_agent}")
    return {
        "origin": origin,
        "referer": referer,
        "user_agent": user_agent,
        "cookies": cookies,
    }
