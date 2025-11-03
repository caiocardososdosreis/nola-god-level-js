# seed.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import datetime
import random

Base = models.Base
Base.metadata.create_all(bind=engine)

stores = ["Unidade Centro", "Unidade Paulista", "Unidade Jardins"]
channels = ["iFood", "Rappi", "Balcão", "WhatsApp", "App Próprio"]

db: Session = SessionLocal()

for i in range(50):
    sale = models.Sale(
        store=random.choice(stores),
        channel=random.choice(channels),
        value=round(random.uniform(20, 500),2),
        delivery_time_min=random.randint(20,70),
        product_count=random.randint(1,5),
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0,180))
    )
    db.add(sale)

db.commit()
db.close()
print("✅ Banco populado com dados de exemplo.")
