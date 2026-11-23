"""
DEMO-WXGOV-001 — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, data, governance, agentops

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("DEMO-WXGOV-001 — AI Governance + AgentOps")
    logger.info(f"Mode: {settings.demo_mode.upper()}")
    logger.info("⚠️  All data is SYNTHETIC — no real client data")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down DEMO-WXGOV-001")


app = FastAPI(
    title="DEMO-WXGOV-001 — AI Governance + AgentOps",
    description="IBM watsonx Governance + AgentOps Demo API. All data is synthetic.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(data.router, prefix="/api/data")
app.include_router(governance.router, prefix="/api/governance")
app.include_router(agentops.router, prefix="/api/agentops")
