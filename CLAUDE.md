# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack web application with a React/TypeScript frontend and FastAPI/Python backend. Despite the repo name, there is no Electron integration currently — it's a standard browser-based app.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`backend/`)

```bash
# Activate venv first
source venv/bin/activate

python -m uvicorn main:app --reload   # Dev server at http://localhost:8000
```

No tests are currently configured for either frontend or backend.

## Architecture

### Frontend (`frontend/src/`)

- **React 19** with the React Compiler (Babel plugin) enabled via `vite.config.ts`
- **Vite 7** as bundler; **Tailwind CSS 3** for styling
- TypeScript strict mode (`tsconfig.app.json`)
- Entry: `main.tsx` → `App.tsx`

### Backend (`backend/`)

FastAPI application with PostgreSQL via SQLModel (SQLAlchemy + Pydantic hybrid).

**Layers:**
- `app/core/config.py` — Pydantic settings from `.env`
- `app/core/db.py` — SQLModel engine and table initialization
- `app/core/security.py` — JWT (HS256) and bcrypt password hashing
- `app/models.py` — `User` and `Item` SQLModel table models
- `app/crud.py` — DB operations
- `app/deps.py` — FastAPI dependency injection (session, current user)
- `routers/` — Route handlers

**API routes:**
- `POST /api/v1/user/login/access-token` — OAuth2 password login
- `GET|POST /api/v1/users` — User management
- `GET|POST|DELETE /api/v1/items` — Item CRUD (requires auth)
- `GET /headers/set-cookie`, `GET /headers/status` — CORS/cookie testing
- `POST /files` — File upload

### Frontend ↔ Backend

- Frontend uses `fetch()` with `credentials: "include"` for cookie-based session handling
- Backend CORS allows `http://localhost:5173` and `http://127.0.0.1:5173`
- Authentication: JWT bearer tokens via OAuth2PasswordBearer

## Environment

Root `.env` configures both services. Key variables:

```
FRONTEND_HOST=http://localhost:5173
BACKEND_CORS_ORIGINS=http://localhost,http://localhost:5173,...
SECRET_KEY=...          # JWT signing key
POSTGRES_SERVER=localhost
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=app_db
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=12345678
```

Backend also has its own `backend/.env` for overrides.
