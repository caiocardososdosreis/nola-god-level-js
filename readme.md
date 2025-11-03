# Nola Dashboard - Analytics para Restaurantes

## Descrição
Este projeto é um **dashboard de análises para restaurantes**.  
O frontend é feito em **HTML, CSS e JavaScript** e consome dados do backend em **Python (FastAPI + SQLite)**.

O dashboard permite:
- Visualizar KPIs: Faturamento Total, Ticket Médio, Vendas Totais, Lojas Ativas
- Consultar vendas recentes
- Filtrar por loja e canal
- Criar análises personalizadas com gráficos e tabelas
- Exportar dados em CSV

---

## Estrutura do Projeto

nola-god-level-js/
├── frontend/ # Frontend (HTML/JS/CSS)
│ ├── index.html
│ ├── script.js
│ └── style.css
├── backend/ # Backend (API REST)
│ ├── main.py
│ ├── database.py
│ ├── models.py
│ ├── schemas.py
│ ├── routes/
│ │ ├── analytics.py
│ │ ├── metrics.py
│ │ └── sales.py
│ └── seed.py
├── requirements.txt # Dependências Python
└── README.md# nola-god-level-js
