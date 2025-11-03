# models.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Sale(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)
    store = Column(String, index=True)
    channel = Column(String, index=True)
    value = Column(Float, default=0.0)
    delivery_time_min = Column(Float, default=0.0)
    product_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
