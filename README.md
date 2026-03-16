# MeLi Analytics

Web app que analiza Mercado Libre y muestra:
- **Tendencias** — búsquedas más populares en tiempo real
- **Más Vendidos** — productos con mayor volumen de ventas por categoría
- **Estacionales/Cíclicos** — productos con demanda según la época del año
- **Gráficos** — distribución de categorías y descuentos

## Setup

```bash
pip install -r requirements.txt
python app.py
```

Luego abrir http://localhost:5000

## Países soportados
Argentina (MLA), Brasil (MLB), México (MLM), Chile (MLC), Colombia (MCO), Uruguay (MLU), Perú (MPE)

## API Endpoints internos
- `GET /api/categories/<site_id>` — Categorías del sitio
- `GET /api/trending/<site_id>?category_id=` — Tendencias
- `GET /api/most-sold/<site_id>?category_id=` — Más vendidos
- `GET /api/cyclical/<site_id>` — Productos estacionales del mes actual
- `GET /api/stats/<site_id>` — Estadísticas de publicaciones por categoría
