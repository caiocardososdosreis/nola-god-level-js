# routes/analytics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from models import Sale
from schemas import AnalyticsRequest, AnalyticsItem
import datetime

router = APIRouter()

DIAS_PT = {
    "Monday": "Segunda-feira",
    "Tuesday": "Terça-feira",
    "Wednesday": "Quarta-feira",
    "Thursday": "Quinta-feira",
    "Friday": "Sexta-feira",
    "Saturday": "Sábado",
    "Sunday": "Domingo"
}

@router.post("/analytics", response_model=List[AnalyticsItem])
def analytics(payload: AnalyticsRequest, db: Session = Depends(get_db)):
    metric = payload.metric
    groupBy = payload.groupBy
    filters = payload.filters or []
    timeRange = payload.timeRange or {}

    q = db.query(Sale)

    if timeRange.get("start"):
        try:
            start = datetime.datetime.fromisoformat(timeRange["start"])
            q = q.filter(Sale.created_at >= start)
        except:
            pass
    if timeRange.get("end"):
        try:
            end = datetime.datetime.fromisoformat(timeRange["end"]) + datetime.timedelta(days=1)
            q = q.filter(Sale.created_at < end)
        except:
            pass

    for f in filters:
        if f.dimension == "STORE":
            q = q.filter(Sale.store == f.value)
        if f.dimension == "CHANNEL":
            q = q.filter(Sale.channel == f.value)

    rows = q.all()
    buckets: Dict[str, List[Sale]] = {}

    for s in rows:
        if groupBy == "CHANNEL":
            key = s.channel or "Unknown"
        elif groupBy == "STORE":
            key = s.store or "Unknown"
        elif groupBy == "DAY_OF_WEEK":
            key = DIAS_PT.get(s.created_at.strftime("%A"), s.created_at.strftime("%A"))
        elif groupBy == "MONTH_YEAR":
            key = s.created_at.strftime("%m/%Y")
        else:
            key = getattr(s, groupBy.lower(), "Unknown")
        buckets.setdefault(key, []).append(s)

    result = []
    for k, items in buckets.items():
        total = 0.0
        if metric == "TOTAL_REVENUE":
            total = sum(i.value for i in items)
        elif metric == "AVG_TICKET":
            total = sum(i.value for i in items)/len(items) if len(items) >0 else 0.0
        elif metric == "TIME_DELIVERY":
            total = sum(i.delivery_time_min for i in items)/len(items) if len(items) >0 else 0.0
        elif metric == "PRODUCT_SALES":
            total = sum(i.product_count for i in items)
        else:
            total = sum(i.value for i in items)
        result.append({"dimension_key": k, "total": round(float(total),2)})

    return sorted(result, key=lambda x: x["total"], reverse=True)
