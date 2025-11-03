# routes/metrics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Sale
from sqlalchemy import func
from schemas import MetricResponse

router = APIRouter()

@router.get("/metrics", response_model=MetricResponse)
def get_metrics(store: str = None, channel: str = None, db: Session = Depends(get_db)):
    q = db.query(Sale)
    if store:
        q = q.filter(Sale.store == store)
    if channel:
        q = q.filter(Sale.channel == channel)

    totalRevenue = db.query(func.coalesce(func.sum(Sale.value), 0.0)).filter(
        *( [Sale.store == store] if store else [] ) +
        *( [Sale.channel == channel] if channel else [] )
    ).scalar() or 0.0

    totalSales = q.count()
    totalStores = len(set(s.store for s in q.all()))
    avgTicket = (totalRevenue / totalSales) if totalSales > 0 else 0.0

    return {
        "totalRevenue": round(float(totalRevenue),2),
        "avgTicket": round(float(avgTicket),2),
        "totalSales": int(totalSales),
        "totalStores": int(totalStores)
    }
