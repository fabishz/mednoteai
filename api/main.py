from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import datasets, insights, reports, system
from scheduler.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
LOGGER = logging.getLogger("api")

app = FastAPI(title="AI Data Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY", "").strip()
PUBLIC_PATH_PREFIXES = ("/docs", "/openapi.json", "/redoc")


@app.middleware("http")
async def api_key_guard(request: Request, call_next):
    if not API_KEY:
        return await call_next(request)

    if request.url.path.startswith(PUBLIC_PATH_PREFIXES):
        return await call_next(request)

    header_key = request.headers.get("x-api-key", "").strip()
    if header_key != API_KEY:
        return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

    return await call_next(request)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(datasets.router)
app.include_router(reports.router)
app.include_router(insights.router)
app.include_router(system.router)


@app.on_event("startup")
async def startup_event() -> None:
    start_scheduler()
    LOGGER.info("Background scheduler started")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    stop_scheduler()
    LOGGER.info("Background scheduler stopped")
