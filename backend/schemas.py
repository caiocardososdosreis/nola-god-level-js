# schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict
import datetime

class MetricResponse(BaseModel):
    totalRevenue: float
    avgTicket: float
    totalSales: int
    totalStores: int

class SaleItem(BaseModel):
    id: int
    store: str
    channel: str
    value: float
    created_at: datetime.datetime

class FilterItem(BaseModel):
    dimension: str
    value: str

class AnalyticsRequest(BaseModel):
    metric: str
    groupBy: str
    filters: Optional[List[FilterItem]] = []
    timeRange: Optional[Dict[str, str]] = {}

class AnalyticsItem(BaseModel):
    dimension_key: str
    total: float
