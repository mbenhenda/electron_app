"""
Create or promote a superuser.

Usage:
    python -m scripts.create_superuser --email admin@example.com --password secret123
    python -m scripts.create_superuser  # prompts interactively

In Docker:
    docker compose exec backend python -m scripts.create_superuser \
        --email admin@example.com --password secret123
"""

import argparse
import getpass
import sys

# Ensure the backend root is on sys.path when run as a module
from sqlmodel import Session, select

from app.core.db import engine, init_db
from app.core.security import get_password_hash
from app.models import User, UserCreate
from app import crud


def create_superuser(email: str, password: str) -> None:
    with Session(engine) as session:
        # Ensure tables exist (idempotent)
        init_db(session)

        existing = crud.get_user_by_email(session=session, email=email)
        if existing:
            if existing.is_superuser:
                print(f"[info] {email} is already a superuser.")
                return
            # Promote existing user
            existing.is_superuser = True
            session.add(existing)
            session.commit()
            print(f"[ok] Promoted {email} to superuser.")
            return

        user_in = UserCreate(email=email, password=password, is_superuser=True)
        crud.create_user(session=session, user_create=user_in)
        print(f"[ok] Superuser {email} created successfully.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote a superuser")
    parser.add_argument("--email", help="Superuser email address")
    parser.add_argument("--password", help="Superuser password (min 8 chars)")
    args = parser.parse_args()

    email = args.email or input("Email: ").strip()
    if not email:
        print("[error] Email is required.", file=sys.stderr)
        sys.exit(1)

    password = args.password or getpass.getpass("Password: ")
    if len(password) < 8:
        print("[error] Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    create_superuser(email, password)


if __name__ == "__main__":
    main()
