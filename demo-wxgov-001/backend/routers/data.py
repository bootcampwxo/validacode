"""Data router — complaints and dashboard"""
from fastapi import APIRouter, Query
from typing import Optional
from services.synthetic_data_service import get_dashboard_data, get_complaints

router = APIRouter()


@router.get("/dashboard")
def dashboard():
    return get_dashboard_data()


@router.get("/complaints")
def complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    governance_flagged: Optional[bool] = None,
    search: Optional[str] = None,
):
    return get_complaints(
        page=page,
        page_size=page_size,
        status=status,
        priority=priority,
        governance_flagged=governance_flagged,
        search=search,
    )
