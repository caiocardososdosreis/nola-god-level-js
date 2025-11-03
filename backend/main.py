# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import metrics, sales, analytics
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nola Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(metrics.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
