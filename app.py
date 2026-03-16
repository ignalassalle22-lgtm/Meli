from flask import Flask, jsonify, render_template, request
import requests
from datetime import datetime
import concurrent.futures

app = Flask(__name__)

ML_BASE_URL = "https://api.mercadolibre.com"

SITES = {
    "MLA": {"name": "Argentina", "currency": "ARS", "flag": "🇦🇷"},
    "MLB": {"name": "Brasil", "currency": "BRL", "flag": "🇧🇷"},
    "MLM": {"name": "México", "currency": "MXN", "flag": "🇲🇽"},
    "MLC": {"name": "Chile", "currency": "CLP", "flag": "🇨🇱"},
    "MCO": {"name": "Colombia", "currency": "COP", "flag": "🇨🇴"},
    "MLU": {"name": "Uruguay", "currency": "UYU", "flag": "🇺🇾"},
    "MPE": {"name": "Perú", "currency": "PEN", "flag": "🇵🇪"},
}

SEASONAL_CATEGORIES = {
    "MLA": {
        1:  {"name": "Verano", "icon": "☀️",   "keywords": ["ventilador", "pileta inflable", "traje de baño", "protector solar", "reposera"]},
        2:  {"name": "Verano", "icon": "☀️",   "keywords": ["aire acondicionado", "ojotas", "sombrilla playa", "heladera portatil", "mate"]},
        3:  {"name": "Otoño",  "icon": "🍂",   "keywords": ["paraguas", "impermeable", "botas de lluvia", "calefactor", "térmica"]},
        4:  {"name": "Otoño",  "icon": "🍂",   "keywords": ["campera", "buzos", "abrigo", "calefactor electrico", "frazada"]},
        5:  {"name": "Otoño",  "icon": "🍂",   "keywords": ["estufa a gas", "botas cuero", "colchon termico", "guantes", "bufanda"]},
        6:  {"name": "Invierno","icon": "❄️",   "keywords": ["estufa electrica", "calefactor tiro balanceado", "frazada termica", "campera de pluma", "botas nieve"]},
        7:  {"name": "Invierno","icon": "❄️",   "keywords": ["calefaccion", "ropa termica", "sierras nevadas", "chocolatera", "humidificador"]},
        8:  {"name": "Invierno","icon": "❄️",   "keywords": ["deshumidificador", "aislante pared", "caño estufas", "gorros lana", "medias termicas"]},
        9:  {"name": "Primavera","icon": "🌸",  "keywords": ["mochilas escolares", "utiles escolares", "ropa deportiva", "bicicleta", "jardineria"]},
        10: {"name": "Primavera","icon": "🌸",  "keywords": ["decoracion jardin", "semillas flores", "herramientas jardin", "zapatillas running", "roller"]},
        11: {"name": "Pre-Verano","icon": "🌞", "keywords": ["traje de baño", "ventilador techo", "juegos de agua", "camping", "inflable"]},
        12: {"name": "Navidad", "icon": "🎄",  "keywords": ["arbol navidad", "adornos navideños", "luces navidad", "juguetes navidad", "regalo electronico"]},
    }
}

def get_headers():
    return {
        "Accept": "application/json",
        "User-Agent": "MercadoLibreAnalyzer/1.0"
    }


def format_product(item):
    price = item.get("price", 0)
    original_price = item.get("original_price")
    discount = 0
    if original_price and original_price > price:
        discount = round((1 - price / original_price) * 100)

    thumbnail = item.get("thumbnail", "")
    if thumbnail:
        thumbnail = thumbnail.replace("http://", "https://")
        # Get better quality image
        thumbnail = thumbnail.replace("-I.jpg", "-O.jpg")

    return {
        "id": item.get("id", ""),
        "title": item.get("title", ""),
        "price": price,
        "currency_id": item.get("currency_id", ""),
        "original_price": original_price,
        "discount": discount,
        "thumbnail": thumbnail,
        "permalink": item.get("permalink", ""),
        "sold_quantity": item.get("sold_quantity", 0),
        "available_quantity": item.get("available_quantity", 0),
        "condition": item.get("condition", ""),
        "seller": item.get("seller", {}).get("nickname", ""),
        "free_shipping": item.get("shipping", {}).get("free_shipping", False),
        "rating": round(item.get("reviews", {}).get("rating_average", 0) if item.get("reviews") else 0, 1),
        "reviews_count": item.get("reviews", {}).get("total", 0) if item.get("reviews") else 0,
        "category_id": item.get("category_id", ""),
        "tags": item.get("tags", []),
    }


@app.route("/")
def index():
    return render_template("index.html", sites=SITES)


@app.route("/api/sites")
def api_sites():
    return jsonify(SITES)


@app.route("/api/categories/<site_id>")
def api_categories(site_id):
    try:
        r = requests.get(f"{ML_BASE_URL}/sites/{site_id}/categories", headers=get_headers(), timeout=10)
        r.raise_for_status()
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/trending/<site_id>")
def api_trending(site_id):
    category_id = request.args.get("category_id")
    try:
        url = f"{ML_BASE_URL}/trends/{site_id}/{category_id}" if category_id else f"{ML_BASE_URL}/trends/{site_id}"
        r = requests.get(url, headers=get_headers(), timeout=10)
        r.raise_for_status()
        trends = r.json()

        def fetch_trend_products(trend):
            keyword = trend.get("keyword", "")
            params = {"q": keyword, "limit": 4, "sort": "relevance"}
            if category_id:
                params["category"] = category_id
            try:
                sr = requests.get(f"{ML_BASE_URL}/sites/{site_id}/search", params=params, headers=get_headers(), timeout=8)
                if sr.ok:
                    items = sr.json().get("results", [])
                    return {
                        "keyword": keyword,
                        "url": trend.get("url", ""),
                        "products": [format_product(i) for i in items[:4]],
                    }
            except Exception:
                pass
            return {"keyword": keyword, "url": trend.get("url", ""), "products": []}

        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            results = list(executor.map(fetch_trend_products, trends[:10]))

        return jsonify([r for r in results if r["products"]])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/most-sold/<site_id>")
def api_most_sold(site_id):
    category_id = request.args.get("category_id")
    limit = int(request.args.get("limit", 20))
    try:
        params = {"sort": "sold_quantity_desc", "limit": limit}
        if category_id:
            params["category"] = category_id
        r = requests.get(f"{ML_BASE_URL}/sites/{site_id}/search", params=params, headers=get_headers(), timeout=10)
        r.raise_for_status()
        data = r.json()
        return jsonify({
            "total": data.get("paging", {}).get("total", 0),
            "products": [format_product(i) for i in data.get("results", [])],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cyclical/<site_id>")
def api_cyclical(site_id):
    month = datetime.now().month
    site_seasons = SEASONAL_CATEGORIES.get(site_id, SEASONAL_CATEGORIES.get("MLA", {}))
    season_data = site_seasons.get(month, site_seasons.get(1, {}))
    keywords = season_data.get("keywords", [])

    def fetch_seasonal_keyword(keyword):
        params = {"q": keyword, "sort": "sold_quantity_desc", "limit": 5}
        try:
            r = requests.get(f"{ML_BASE_URL}/sites/{site_id}/search", params=params, headers=get_headers(), timeout=8)
            if r.ok:
                items = r.json().get("results", [])
                return {
                    "keyword": keyword,
                    "products": [format_product(i) for i in items[:5]],
                }
        except Exception:
            pass
        return {"keyword": keyword, "products": []}

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(fetch_seasonal_keyword, keywords))

    return jsonify({
        "season": season_data.get("name", ""),
        "icon": season_data.get("icon", "📦"),
        "month": month,
        "categories": [r for r in results if r["products"]],
    })


@app.route("/api/stats/<site_id>")
def api_stats(site_id):
    """Get quick stats: top categories by total listings."""
    try:
        r = requests.get(f"{ML_BASE_URL}/sites/{site_id}/categories", headers=get_headers(), timeout=10)
        r.raise_for_status()
        categories = r.json()

        def fetch_cat_count(cat):
            try:
                sr = requests.get(
                    f"{ML_BASE_URL}/sites/{site_id}/search",
                    params={"category": cat["id"], "limit": 1},
                    headers=get_headers(),
                    timeout=6,
                )
                if sr.ok:
                    total = sr.json().get("paging", {}).get("total", 0)
                    return {"id": cat["id"], "name": cat["name"], "total": total}
            except Exception:
                pass
            return {"id": cat["id"], "name": cat["name"], "total": 0}

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            stats = list(executor.map(fetch_cat_count, categories[:15]))

        stats.sort(key=lambda x: x["total"], reverse=True)
        return jsonify(stats[:10])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
