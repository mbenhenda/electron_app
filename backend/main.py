from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine, init_db
from routers import auth, files, items, status, users


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        init_db(session)
    yield


app = FastAPI(
    title="API for React + FastAPI App",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(status.router, prefix="/headers", tags=["status"])


@app.get("/", tags=["root"])
def read_root():
    return {"Hello": "World"}
