/* ===== STATE ===== */
const state = {
  category: "",
  categories: [],
  activeTab: "trending",
  charts: {},
  statsData: [],
  mostSoldData: [],
};

/* ===== DOM REFS ===== */
const $ = (id) => document.getElementById(id);
const categoriesScroll = $("categories-scroll");
const loadingOverlay = $("loading-overlay");
const toast = $("toast");
let toastTimer = null;

/* ===== UTILS ===== */
function showLoading() { loadingOverlay.classList.remove("hidden"); }
function hideLoading() { loadingOverlay.classList.add("hidden"); }

function showToast(msg, dur = 3000) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), dur);
}

function formatPrice(price) {
  if (!price) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(price);
}

function formatNumber(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function stars(rating) {
  if (!rating) return "";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function conditionLabel(c) {
  return c === "new" ? "" : c === "used" ? "Usado" : "";
}

/* ===== PRODUCT CARD ===== */
function renderProductCard(p) {
  const disc = p.discount > 0 ? `<span class="badge-discount">-${p.discount}%</span>` : "";
  const free = p.free_shipping ? `<span class="badge-free">Envío gratis</span>` : "";
  const used = p.condition === "used" ? `<span class="badge-used">Usado</span>` : "";
  const orig = p.original_price && p.discount > 0
    ? `<div class="product-original-price">${formatPrice(p.original_price)}</div>`
    : "";
  const rating = p.rating
    ? `<span class="product-rating">${stars(p.rating)}</span>`
    : "";
  const sold = p.sold_quantity
    ? `<span class="product-sold">${formatNumber(p.sold_quantity)} vendidos</span>`
    : "";
  const seller = p.seller ? `<span class="product-seller">${p.seller}</span>` : "";

  const img = p.thumbnail
    ? `<img class="product-img" src="${p.thumbnail}" alt="${escapeHtml(p.title)}" loading="lazy" />`
    : `<div class="product-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">📦</div>`;

  return `
    <a class="product-card" href="${p.permalink}" target="_blank" rel="noopener">
      <div class="product-img-wrap">
        ${img}
        ${disc}${free}${used}
      </div>
      <div class="product-body">
        <div class="product-title">${escapeHtml(p.title)}</div>
        ${orig}
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-meta">
          ${rating}
          ${sold}
          ${seller}
        </div>
      </div>
    </a>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ===== SKELETON LOADERS ===== */
function skeletonCards(n = 8) {
  return Array(n).fill(`
    <div class="product-card" style="pointer-events:none">
      <div class="product-img-wrap skeleton" style="aspect-ratio:1"></div>
      <div class="product-body" style="gap:0.5rem">
        <div class="skeleton" style="height:12px;border-radius:4px;width:90%"></div>
        <div class="skeleton" style="height:12px;border-radius:4px;width:70%"></div>
        <div class="skeleton" style="height:18px;border-radius:4px;width:50%;margin-top:4px"></div>
      </div>
    </div>`).join("");
}

/* ===== API CALLS ===== */
async function apiFetch(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/* ===== LOAD CATEGORIES ===== */
async function loadCategories() {
  categoriesScroll.innerHTML = `<button class="cat-btn active" data-id="">Todas</button><span class="spinner"></span>`;
  try {
    const cats = await apiFetch(`/api/categories`);
    state.categories = cats;
    categoriesScroll.innerHTML = `<button class="cat-btn active" data-id="">Todas</button>` +
      cats.slice(0, 20).map(c =>
        `<button class="cat-btn" data-id="${c.id}">${c.name}</button>`
      ).join("");

    categoriesScroll.querySelectorAll(".cat-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        categoriesScroll.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.category = btn.dataset.id;
        refreshActiveTab();
      });
    });
  } catch (e) {
    showToast("Error cargando categorías");
  }
}

/* ===== LOAD STATS BAR ===== */
async function loadStats() {
  ["stat-0","stat-1","stat-2","stat-3"].forEach(id => {
    const el = $(id);
    if (el) el.classList.add("skeleton");
  });
  try {
    const data = await apiFetch(`/api/stats`);
    state.statsData = data;
    const bar = $("stats-bar");
    bar.innerHTML = data.slice(0, 4).map(s => `
      <div class="stat-item">
        <div class="stat-name">${s.name}</div>
        <div class="stat-value">${formatNumber(s.total)}</div>
        <div class="stat-sub">publicaciones</div>
      </div>`).join("");

    // update chart if visible
    if (state.activeTab === "chart") renderCategoryChart();
  } catch (_) {}
}

/* ===== LOAD TRENDING ===== */
async function loadTrending() {
  const container = $("trending-container");
  container.innerHTML = skeletonCards(8);
  try {
    const params = state.category ? `?category_id=${state.category}` : "";
    const data = await apiFetch(`/api/trending${params}`);

    if (!data.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">No hay tendencias disponibles para esta selección.</div></div>`;
      return;
    }

    container.innerHTML = data.map((trend, i) => `
      <div class="trend-group">
        <div class="trend-keyword">
          <span class="trend-rank">${i + 1}</span>
          <span class="trend-keyword-text">${escapeHtml(trend.keyword)}</span>
          ${trend.url ? `<a class="trend-keyword-link" href="${trend.url}" target="_blank" rel="noopener">Ver en MeLi →</a>` : ""}
        </div>
        <div class="trend-products">
          ${trend.products.map(p => renderProductCard(p)).join("")}
        </div>
      </div>`).join('<hr class="divider">');
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Error al cargar tendencias: ${e.message}</div></div>`;
  }
}

/* ===== LOAD MOST SOLD ===== */
async function loadMostSold() {
  const container = $("most-sold-container");
  container.innerHTML = skeletonCards(12);
  try {
    const params = state.category ? `?category_id=${state.category}` : "";
    const data = await apiFetch(`/api/most-sold${params}`);
    state.mostSoldData = data.products || [];

    if (!state.mostSoldData.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">No se encontraron productos.</div></div>`;
      return;
    }

    container.innerHTML = state.mostSoldData.map(p => renderProductCard(p)).join("");

    if (state.activeTab === "chart") renderDiscountChart();
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Error: ${e.message}</div></div>`;
  }
}

/* ===== LOAD CYCLICAL ===== */
async function loadCyclical() {
  const container = $("cyclical-container");
  const header = $("cyclical-header");
  container.innerHTML = `<div style="text-align:center;padding:2rem"><span class="spinner"></span></div>`;
  try {
    const data = await apiFetch(`/api/cyclical`);

    header.innerHTML = `
      <h2>${data.icon || "🔄"} Productos Estacionales — ${data.season}</h2>
      <p>Productos con mayor demanda en esta época del año (${getMonthName(data.month)})</p>`;

    if (!data.categories || !data.categories.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">No se encontraron productos estacionales.</div></div>`;
      return;
    }

    const banner = `
      <div class="season-banner">
        <div class="season-icon">${data.icon || "📦"}</div>
        <div>
          <div class="season-title">Temporada: ${data.season}</div>
          <div class="season-sub">Los productos más buscados y vendidos en ${getMonthName(data.month)}</div>
        </div>
      </div>`;

    const groups = data.categories.map(group => `
      <div class="cyclical-group">
        <div class="cyclical-keyword">${escapeHtml(group.keyword)}</div>
        <div class="cyclical-products">
          ${group.products.map(p => renderProductCard(p)).join("")}
        </div>
      </div>`).join('<hr class="divider">');

    container.innerHTML = banner + groups;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Error: ${e.message}</div></div>`;
  }
}

function getMonthName(m) {
  return ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m - 1] || "";
}

/* ===== CHARTS ===== */
const CHART_COLORS = ["#3483FA","#FFE600","#00A650","#F04E37","#FF7733","#9B59B6","#1ABC9C","#E74C3C","#2ECC71","#F39C12"];

function renderCategoryChart() {
  const ctx = $("chart-categories");
  if (!ctx || !state.statsData.length) return;

  if (state.charts.categories) state.charts.categories.destroy();

  const top = state.statsData.slice(0, 8);
  state.charts.categories = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top.map(s => s.name.length > 22 ? s.name.slice(0, 22) + "…" : s.name),
      datasets: [{
        label: "Publicaciones",
        data: top.map(s => s.total),
        backgroundColor: CHART_COLORS,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${formatNumber(ctx.parsed.x)} publicaciones` }
        }
      },
      scales: {
        x: { grid: { color: "#2D3A55" }, ticks: { color: "#8B9AB1" } },
        y: { grid: { display: false }, ticks: { color: "#E8EAED", font: { size: 11 } } }
      }
    }
  });
}

function renderDiscountChart() {
  const ctx = $("chart-discounts");
  if (!ctx || !state.mostSoldData.length) return;

  if (state.charts.discounts) state.charts.discounts.destroy();

  const buckets = { "0%": 0, "1-10%": 0, "11-25%": 0, "26-40%": 0, "+40%": 0 };
  state.mostSoldData.forEach(p => {
    const d = p.discount || 0;
    if (d === 0) buckets["0%"]++;
    else if (d <= 10) buckets["1-10%"]++;
    else if (d <= 25) buckets["11-25%"]++;
    else if (d <= 40) buckets["26-40%"]++;
    else buckets["+40%"]++;
  });

  state.charts.discounts = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(buckets),
      datasets: [{
        data: Object.values(buckets),
        backgroundColor: CHART_COLORS,
        borderColor: "#1A1A2E",
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#E8EAED", padding: 12, font: { size: 12 } }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} productos` }
        }
      }
    }
  });
}

/* ===== TAB SWITCHING ===== */
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabId));
  document.querySelectorAll(".tab-content").forEach(el => el.classList.toggle("hidden", el.id !== `tab-${tabId}`));

  if (tabId === "chart") {
    setTimeout(() => {
      if (!state.statsData.length) loadStats().then(renderCategoryChart);
      else renderCategoryChart();
      if (!state.mostSoldData.length) loadMostSold().then(renderDiscountChart);
      else renderDiscountChart();
    }, 50);
  }
}

/* ===== REFRESH ACTIVE TAB ===== */
function refreshActiveTab() {
  switch (state.activeTab) {
    case "trending":   loadTrending();   break;
    case "most-sold":  loadMostSold();   break;
    case "cyclical":   loadCyclical();   break;
    case "chart":
      Promise.all([
        state.statsData.length ? Promise.resolve() : loadStats(),
        state.mostSoldData.length ? Promise.resolve() : loadMostSold(),
      ]).then(() => { renderCategoryChart(); renderDiscountChart(); });
      break;
  }
}

/* ===== INIT ===== */
function init() {
  // Tab clicks
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
      if (tabId !== "chart") refreshActiveTab();
    });
  });

  // Initial load
  showLoading();
  Promise.all([loadCategories(), loadStats()])
    .then(() => loadTrending())
    .finally(() => hideLoading());
}

document.addEventListener("DOMContentLoaded", init);
