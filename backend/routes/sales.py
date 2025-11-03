# routes/sales.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Sale
from schemas import SaleItem

router = APIRouter()

@router.get("/sales/recent", response_model=List[SaleItem])
def recent_sales(limit: int = 20, db: Session = Depends(get_db)):
    q = db.query(Sale).order_by(Sale.created_at.desc()).limit(limit).all()
    return [
        {
            "id": s.id,
            "store": s.store,
            "channel": s.channel,
            "value": s.value,
            "created_at": s.created_at.isoformat()
        } for s in q
    ]

@router.get("/sales/aggregates/channels")
def channels(db: Session = Depends(get_db)):
    q = db.query(Sale.channel).distinct().all()
    return [{"channel": c[0]} for c in q]

@router.get("/sales/aggregates/stores")
def stores(db: Session = Depends(get_db)):
    q = db.query(Sale.store).distinct().all()
    return [{"store": s[0]} for s in q]
