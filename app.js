// ============================================================
// 1. Constants & Configurations
// ============================================================
const WHATSAPP_NUMBER = "967777000000";
const STORAGE_KEYS = {
    cars: "mohammed_cars",
    favorites: "mohammed_favorites",
    theme: "mohammed_theme"
};
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80";

// ============================================================
// 2. State Management (LocalStorage Integration)
// ============================================================
const state = {
    cars: [],
    favorites: [],
    comparison: [],
    filteredCars: [],
    selectedCarId: null
};

function loadState() {
    const storedCars = localStorage.getItem(STORAGE_KEYS.cars);
    const storedFavorites = localStorage.getItem(STORAGE_KEYS.favorites);
    state.cars = storedCars ? JSON.parse(storedCars) : [...INITIAL_CARS];
    state.favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
}

function saveCars() {
    localStorage.setItem(STORAGE_KEYS.cars, JSON.stringify(state.cars));
}

function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
}

// ============================================================
// 3. Utility & Helper Functions (Toast, Formatting)
// ============================================================
function formatPrice(value) {
    return `${Number(value).toLocaleString("ar-YE")} ريال`;
}

function formatNumber(value) {
    return Number(value).toLocaleString("ar-YE");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
    document.body.style.overflow = "";
}

// ============================================================
// 4. UI Rendering Functions (Grid, Cards, Stats)
// ============================================================
function renderBrandFilter() {
    const select = document.getElementById("brandFilter");
    const current = select.value;
    const brands = [...new Set(state.cars.map(car => car.brand))].sort();
    select.innerHTML = '<option value="all">كل الماركات</option>';
    brands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        select.appendChild(option);
    });
    select.value = brands.includes(current) ? current : "all";
}

function renderStats() {
    document.getElementById("statCars").textContent = state.cars.length;
    document.getElementById("statBrands").textContent = new Set(state.cars.map(car => car.brand)).size;
    document.getElementById("favoriteCount").textContent = state.favorites.length;
}

function createCarCard(car) {
    const isFavorite = state.favorites.includes(car.id);
    const isCompared = state.comparison.includes(car.id);
    return `
        <article class="car-card">
            <div class="car-image">
                <img src="${escapeHtml(car.image || DEFAULT_IMAGE)}" alt="${escapeHtml(car.brand + " " + car.name)}" loading="lazy" onerror="this.src='${DEFAULT_IMAGE}'">
                <span class="badge">${escapeHtml(car.condition)}</span>
                <button class="fav-btn ${isFavorite ? "active" : ""}" data-favorite="${car.id}" title="المفضلة">${isFavorite ? "♥" : "♡"}</button>
            </div>
            <div class="car-body">
                <div class="car-top">
                    <h3>${escapeHtml(car.brand)} ${escapeHtml(car.name)}</h3>
                    <div class="car-price">${formatPrice(car.price)}</div>
                </div>
                <div class="car-meta">
                    <span>📅 ${car.year}</span>
                    <span>🛣️ ${formatNumber(car.km)} كم</span>
                    <span>⚙️ ${escapeHtml(car.gear)}</span>
                </div>
                <div class="car-actions">
                    <button class="btn btn-primary" data-details="${car.id}">التفاصيل</button>
                    <button class="btn btn-muted" data-compare="${car.id}">${isCompared ? "✓ تمت المقارنة" : "＋ مقارنة"}</button>
                </div>
            </div>
        </article>
    `;
}

function renderCars(cars) {
    const grid = document.getElementById("carsGrid");
    const empty = document.getElementById("emptyState");
    grid.innerHTML = cars.map(createCarCard).join("");
    empty.classList.toggle("hidden", cars.length !== 0);
}

function applyFilters() {
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const brand = document.getElementById("brandFilter").value;
    const condition = document.getElementById("conditionFilter").value;
    const favoritesOnly = document.getElementById("favoritesOnly").checked;
    const sort = document.getElementById("sortSelect").value;

    let cars = state.cars.filter(car => {
        const haystack = `${car.brand} ${car.name} ${car.year}`.toLowerCase();
        const matchesSearch = haystack.includes(search);
        const matchesBrand = brand === "all" || car.brand === brand;
        const matchesCondition = condition === "all" || car.condition === condition;
        const matchesFavorite = !favoritesOnly || state.favorites.includes(car.id);
        return matchesSearch && matchesBrand && matchesCondition && matchesFavorite;
    });

    if (sort === "newest") {
        cars.sort((a, b) => b.year - a.year);
    } else if (sort === "priceAsc") {
        cars.sort((a, b) => a.price - b.price);
    } else if (sort === "priceDesc") {
        cars.sort((a, b) => b.price - a.price);
    } else if (sort === "kmAsc") {
        cars.sort((a, b) => a.km - b.km);
    }

    state.filteredCars = cars;
    renderCars(cars);
}

// ============================================================
// 5. Search, Filter & Sort Logic
// ============================================================
function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("brandFilter").value = "all";
    document.getElementById("conditionFilter").value = "all";
    document.getElementById("sortSelect").value = "newest";
    document.getElementById("favoritesOnly").checked = false;
    applyFilters();
}

// ============================================================
// 6. Favorites System Logic
// ============================================================
function toggleFavorite(carId) {
    const index = state.favorites.indexOf(carId);
    if (index >= 0) {
        state.favorites.splice(index, 1);
        showToast("تمت إزالة السيارة من المفضلة.");
    } else {
        state.favorites.push(carId);
        showToast("تمت إضافة السيارة إلى المفضلة ❤️");
    }
    saveFavorites();
    renderStats();
    applyFilters();
}

// ============================================================
// 7. Car Comparison Logic
// ============================================================
function toggleComparison(carId) {
    const index = state.comparison.indexOf(carId);
    if (index >= 0) {
        state.comparison.splice(index, 1);
        showToast("تمت إزالة السيارة من المقارنة.");
    } else {
        if (state.comparison.length >= 3) {
            showToast("يمكنك اختيار 3 سيارات فقط للمقارنة.");
            return;
        }
        state.comparison.push(carId);
        showToast("تمت إضافة السيارة للمقارنة.");
    }
    renderComparisonBar();
    applyFilters();
}

function renderComparisonBar() {
    const bar = document.getElementById("compareBar");
    const items = document.getElementById("compareItems");
    document.getElementById("compareCount").textContent = state.comparison.length;
    items.innerHTML = state.comparison.map(id => {
        const car = state.cars.find(item => item.id === id);
        return `<span class="compare-chip">${escapeHtml(car.brand)} ${escapeHtml(car.name)}</span>`;
    }).join("");
    bar.classList.toggle("hidden", state.comparison.length === 0);
}

function renderComparisonModal() {
    const cars = state.comparison.map(id => state.cars.find(car => car.id === id)).filter(Boolean);
    if (!cars.length) {
        showToast("اختر سيارتين أو أكثر للمقارنة.");
        return;
    }
    const rows = [
        ["الصورة", car => `<img src="${escapeHtml(car.image || DEFAULT_IMAGE)}" alt="${escapeHtml(car.name)}">`],
        ["الماركة", car => escapeHtml(car.brand)],
        ["الموديل", car => escapeHtml(car.name)],
        ["السنة", car => car.year],
        ["السعر", car => formatPrice(car.price)],
        ["الممشى", car => `${formatNumber(car.km)} كم`],
        ["الحالة", car => escapeHtml(car.condition)],
        ["القير", car => escapeHtml(car.gear)]
    ];
    let html = '<div class="compare-table"><table><thead><tr><th>المواصفة</th>';
    html += cars.map(car => `<th>${escapeHtml(car.brand)} ${escapeHtml(car.name)}</th>`).join("");
    html += "</tr></thead><tbody>";
    rows.forEach(([label, renderer]) => {
        html += `<tr><th>${label}</th>${cars.map(renderer).map(value => `<td>${value}</td>`).join("")}</tr>`;
    });
    html += "</tbody></table></div>";
    document.getElementById("compareTable").innerHTML = html;
    openModal("compareModal");
}

// ============================================================
// 8. Car Details Modal & Finance Calculator
// ============================================================
function calculateInstallment(price, downPayment, months, annualRate) {
    const principal = Math.max(0, price - downPayment);
    if (!principal || !months) {
        return 0;
    }
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) {
        return principal / months;
    }
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
}

function updateFinanceResult() {
    const price = Number(document.getElementById("financePrice").value) || 0;
    const down = Number(document.getElementById("financeDown").value) || 0;
    const months = Number(document.getElementById("financeMonths").value) || 0;
    const rate = Number(document.getElementById("financeRate").value) || 0;
    const result = calculateInstallment(price, down, months, rate);
    document.getElementById("financeResult").textContent = `${formatPrice(Math.round(result))} شهرياً`;
    document.getElementById("previewInstallment").textContent = formatPrice(Math.round(result));
}

function openCarDetails(carId) {
    const car = state.cars.find(item => item.id === carId);
    if (!car) return;
    state.selectedCarId = carId;
    document.getElementById("carDetails").innerHTML = `
        <div class="details-grid">
            <div>
                <img class="details-image" src="${escapeHtml(car.image || DEFAULT_IMAGE)}" alt="${escapeHtml(car.brand + " " + car.name)}" onerror="this.src='${DEFAULT_IMAGE}'">
                <div class="detail-actions">
                    <button class="btn btn-primary" id="whatsappCar">واتساب</button>
                    <button class="btn btn-muted" id="shareCar">مشاركة</button>
                </div>
            </div>
            <div>
                <span class="eyebrow">${escapeHtml(car.condition)}</span>
                <h2>${escapeHtml(car.brand)} ${escapeHtml(car.name)}</h2>
                <p>${escapeHtml(car.desc)}</p>
                <div class="detail-specs">
                    <div class="spec"><small>السنة</small><strong>${car.year}</strong></div>
                    <div class="spec"><small>السعر</small><strong>${formatPrice(car.price)}</strong></div>
                    <div class="spec"><small>الممشى</small><strong>${formatNumber(car.km)} كم</strong></div>
                    <div class="spec"><small>القير</small><strong>${escapeHtml(car.gear)}</strong></div>
                </div>
                <div class="finance-box">
                    <h3>حاسبة التمويل</h3>
                    <div class="finance-fields">
                        <label>السعر<input id="financePrice" type="number" value="${car.price}"></label>
                        <label>الدفعة الأولى<input id="financeDown" type="number" value="0" min="0"></label>
                        <label>المدة بالشهور<input id="financeMonths" type="number" value="36" min="1"></label>
                        <label>المرابحة السنوية %<input id="financeRate" type="number" value="8" min="0" step="0.1"></label>
                    </div>
                    <div id="financeResult" class="finance-result">0 ريال شهرياً</div>
                </div>
            </div>
        </div>
    `;
    ["financePrice","financeDown","financeMonths","financeRate"].forEach(id => {
        document.getElementById(id).addEventListener("input", updateFinanceResult);
    });
    document.getElementById("whatsappCar").addEventListener("click", () => sendCarToWhatsApp(car));
    document.getElementById("shareCar").addEventListener("click", () => shareCar(car));
    openModal("carModal");
    updateFinanceResult();
}

// ============================================================
// 9. Add New Car Logic & Persistence
// ============================================================
function resetAddCarForm() {
    document.getElementById("addCarForm").reset();
}

function addNewCar(event) {
    event.preventDefault();
    const car = {
        id: Date.now(),
        brand: document.getElementById("newBrand").value.trim(),
        name: document.getElementById("newName").value.trim(),
        year: Number(document.getElementById("newYear").value),
        condition: document.getElementById("newCondition").value,
        price: Number(document.getElementById("newPrice").value),
        km: Number(document.getElementById("newKm").value),
        gear: document.getElementById("newGear").value,
        image: document.getElementById("newImage").value.trim() || DEFAULT_IMAGE,
        desc: document.getElementById("newDesc").value.trim() || "سيارة مضافة حديثاً إلى معرض محمد مبروك."
    };
    state.cars.unshift(car);
    saveCars();
    renderBrandFilter();
    renderStats();
    applyFilters();
    resetAddCarForm();
    closeModal("addCarModal");
    showToast("تمت إضافة السيارة بنجاح.");
}

// ============================================================
// 10. WhatsApp & Web Share Handlers
// ============================================================
function sendCarToWhatsApp(car) {
    const message = `السلام عليكم، أرغب بالاستفسار عن السيارة ${car.brand} ${car.name} موديل ${car.year}، بسعر ${formatPrice(car.price)}.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

async function shareCar(car) {
    const text = `${car.brand} ${car.name} | ${car.year} | ${formatPrice(car.price)} | ${formatNumber(car.km)} كم`;
    if (navigator.share) {
        try {
            await navigator.share({ title: "معرض محمد مبروك", text });
            return;
        } catch (error) {
            // المستخدم أغلق نافذة المشاركة.
        }
    }
    try {
        await navigator.clipboard.writeText(text);
        showToast("تم نسخ تفاصيل السيارة.");
    } catch (error) {
        showToast("تعذر نسخ التفاصيل.");
    }
}

function sendSellRequest(event) {
    event.preventDefault();
    const name = document.getElementById("sellerName").value.trim();
    const phone = document.getElementById("sellerPhone").value.trim();
    const car = document.getElementById("sellerCar").value.trim();
    const year = document.getElementById("sellerYear").value.trim();
    const message = `طلب بيع سيارة%0Aالاسم: ${name}%0Aالهاتف: ${phone}%0Aالسيارة: ${car}%0Aالسنة: ${year}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
}

// ============================================================
// 11. Theme Switcher (Dark/Light Mode)
// ============================================================
function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    if (theme === "light") {
        document.body.classList.add("light");
        document.getElementById("themeToggle").textContent = "☀️";
    }
}

function toggleTheme() {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    localStorage.setItem(STORAGE_KEYS.theme, isLight ? "light" : "dark");
    document.getElementById("themeToggle").textContent = isLight ? "☀️" : "🌙";
}

// ============================================================
// 12. Event Listeners
// ============================================================
function setupEventListeners() {
    document.getElementById("searchInput").addEventListener("input", applyFilters);
    document.getElementById("brandFilter").addEventListener("change", applyFilters);
    document.getElementById("conditionFilter").addEventListener("change", applyFilters);
    document.getElementById("sortSelect").addEventListener("change", applyFilters);
    document.getElementById("favoritesOnly").addEventListener("change", applyFilters);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));
    document.getElementById("addCarButton").addEventListener("click", () => openModal("addCarModal"));
    document.getElementById("heroAddCar").addEventListener("click", () => openModal("addCarModal"));
    document.getElementById("addCarForm").addEventListener("submit", addNewCar);
    document.getElementById("sellForm").addEventListener("submit", sendSellRequest);
    document.getElementById("compareNow").addEventListener("click", renderComparisonModal);
    document.getElementById("clearCompare").addEventListener("click", () => {
        state.comparison = [];
        renderComparisonBar();
        applyFilters();
    });
    document.getElementById("favoritesNav").addEventListener("click", () => {
        document.getElementById("favoritesOnly").checked = true;
        document.getElementById("cars").scrollIntoView({ behavior: "smooth" });
        applyFilters();
    });

    document.addEventListener("click", event => {
        const favorite = event.target.closest("[data-favorite]");
        const compare = event.target.closest("[data-compare]");
        const details = event.target.closest("[data-details]");
        const close = event.target.closest("[data-close]");
        if (favorite) toggleFavorite(Number(favorite.dataset.favorite));
        if (compare) toggleComparison(Number(compare.dataset.compare));
        if (details) openCarDetails(Number(details.dataset.details));
        if (close) closeModal(close.dataset.close);
        if (event.target.matches("#mainNav a")) document.getElementById("mainNav").classList.remove("open");
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            ["carModal","addCarModal","compareModal"].forEach(id => {
                if (!document.getElementById(id).classList.contains("hidden")) closeModal(id);
            });
        }
    });
}

// ============================================================
// 13. App Initialization
// ============================================================
function initializeApp() {
    loadState();
    loadTheme();
    renderBrandFilter();
    renderStats();
    renderComparisonBar();
    setupEventListeners();
    applyFilters();
}

document.addEventListener("DOMContentLoaded", initializeApp);
