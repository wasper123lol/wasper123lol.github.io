// Конфигурация маркетплейса
const MARKETPLACE_CONFIG = {
    name: "Silk Road",
    adminUsername: "@ADMIN_ID1214",
    storageKey: "silk_road_marketplace",
    currency: "$"
};

// Данные маркетплейса
let marketplaceData = {
    products: [],
    users: [],
    blockedProducts: []
};

// DOM элементы
const elements = {
    accountList: document.getElementById("account-list"),
    addProductBtn: document.getElementById("add-product-btn"),
    addProductModal: document.getElementById("add-product-modal"),
    privacyModal: document.getElementById("privacy-modal"),
    adminPanel: document.getElementById("admin-panel"),
    adminLink: document.getElementById("admin-link"),
    closeButtons: document.querySelectorAll(".close-modal"),
    acceptPrivacyBtn: document.getElementById("accept-privacy"),
    privacyLinks: document.querySelectorAll(".privacy-link"),
    productForm: document.getElementById("product-form"),
    searchInput: document.getElementById("search-input"),
    sortSelect: document.getElementById("sort-select"),
    adminProductsList: document.getElementById("admin-products-list"),
    totalProducts: document.getElementById("total-products"),
    blockedProducts: document.getElementById("blocked-products")
};

// Инициализация маркетплейса
function initMarketplace() {
    loadData();
    setupEventListeners();
    checkAdminStatus();
    renderProducts();
    
    if (!localStorage.getItem("privacyAccepted")) {
        elements.privacyModal.style.display = "flex";
    }
}

// Загрузка данных из localStorage
function loadData() {
    const savedData = localStorage.getItem(MARKETPLACE_CONFIG.storageKey);
    if (savedData) {
        marketplaceData = JSON.parse(savedData);
    }
}

// Сохранение данных в localStorage
function saveData() {
    localStorage.setItem(
        MARKETPLACE_CONFIG.storageKey,
        JSON.stringify(marketplaceData)
    );
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Закрытие модальных окон
    elements.closeButtons.forEach(btn => {
        btn.addEventListener("click", closeAllModals);
    });

    // Политика конфиденциальности
    elements.acceptPrivacyBtn.addEventListener("click", acceptPrivacy);
    elements.privacyLinks.forEach(link => {
        link.addEventListener("click", showPrivacyModal);
    });

    // Добавление товара
    elements.addProductBtn.addEventListener("click", handleAddProductClick);
    elements.productForm.addEventListener("submit", handleProductSubmit);

    // Админ-панель
    if (elements.adminLink) {
        elements.adminLink.addEventListener("click", showAdminPanel);
    }

    // Поиск и сортировка
    if (elements.searchInput) {
        elements.searchInput.addEventListener("input", renderProducts);
    }
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener("change", renderProducts);
    }
}

// Регистрация пользователя
function registerUser() {
    const tgUsername = prompt("Введите ваш Telegram (@username):");
    if (!tgUsername) {
        alert("Укажите юзернейм!");
        return false;
    }

    // Проверка формата юзернейма
    if (!tgUsername.startsWith("@")) {
        alert("Юзернейм должен начинаться с @");
        return false;
    }

    currentUser = tgUsername;
    alert(`🔐 Ваш юзернейм: ${tgUsername}\nУбедитесь, что он правильный!`);
    
    // Проверяем, не админ ли это
    checkAdminStatus();
    
    return true;
}

// Проверка статуса админа
function checkAdminStatus() {
    if (currentUser && currentUser.toLowerCase() === MARKETPLACE_CONFIG.adminUsername.toLowerCase()) {
        elements.adminLink.style.display = "block";
    } else {
        elements.adminLink.style.display = "none";
    }
}

// Обработчик клика на добавление товара
function handleAddProductClick() {
    if (!currentUser && !registerUser()) return;
    elements.addProductModal.style.display = "flex";
}

// Обработчик отправки формы товара
function handleProductSubmit(e) {
    e.preventDefault();
    const [name, desc, price, seller] = e.target.elements;
    
    // Валидация данных
    if (name.value.length < 3) {
        alert("Название должно быть не короче 3 символов");
        return;
    }
    
    if (desc.value.length < 10) {
        alert("Описание должно быть не короче 10 символов");
        return;
    }
    
    if (parseFloat(price.value) <= 0) {
        alert("Цена должна быть больше 0");
        return;
    }
    
    if (!seller.value.startsWith("@")) {
        alert("Юзернейм должен начинаться с @");
        return;
    }

    // Добавление товара
    const newProduct = {
        id: Date.now(),
        name: name.value,
        desc: desc.value,
        price: parseFloat(price.value).toFixed(2),
        seller: seller.value,
        date: new Date().toISOString(),
        isBlocked: false,
        rating: 0,
        reviews: []
    };

    marketplaceData.products.push(newProduct);
    saveData();
    renderProducts();
    elements.addProductModal.style.display = "none";
    e.target.reset();
    
    alert("Товар успешно добавлен!");
}

// Рендер списка товаров
function renderProducts() {
    let productsToDisplay = [...marketplaceData.products];
    
    // Фильтрация заблокированных
    productsToDisplay = productsToDisplay.filter(p => !p.isBlocked);
    
    // Поиск
    if (elements.searchInput && elements.searchInput.value) {
        const searchTerm = elements.searchInput.value.toLowerCase();
        productsToDisplay = productsToDisplay.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.desc.toLowerCase().includes(searchTerm)
        );
    }
    
    // Сортировка
    if (elements.sortSelect) {
        switch (elements.sortSelect.value) {
            case "price-asc":
                productsToDisplay.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                productsToDisplay.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                productsToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
        }
    }
    
    // Отрисовка
    elements.accountList.innerHTML = productsToDisplay
        .map(product => `
            <div class="account-card" data-id="${product.id}">
                <h3>${product.name}</h3>
                <p>${product.desc}</p>
                <p class="price">💰 ${product.price}${MARKETPLACE_CONFIG.currency}</p>
                <div class="product-meta">
                    <p class="seller">👤 Продавец: <a href="https://t.me/${product.seller.replace("@", "")}" target="_blank">${product.seller}</a></p>
                    <small>${new Date(product.date).toLocaleDateString()}</small>
                </div>
                <div class="product-actions">
                    <button class="btn" onclick="handleBuyClick('${product.seller}')">Купить</button>
                    ${currentUser === product.seller ? `<button class="btn danger" onclick="handleDeleteProduct(${product.id})">Удалить</button>` : ''}
                </div>
            </div>
        `).join("");
}

// Показать админ-панель
function showAdminPanel(e) {
    if (e) e.preventDefault();
    
    if (currentUser !== MARKETPLACE_CONFIG.adminUsername) {
        alert("Доступ запрещен!");
        return;
    }
    
    elements.adminPanel.style.display = "flex";
    renderAdminPanel();
}

// Рендер админ-панели
function renderAdminPanel() {
    elements.totalProducts.textContent = marketplaceData.products.length;
    elements.blockedProducts.textContent = marketplaceData.products.filter(p => p.isBlocked).length;
    
    elements.adminProductsList.innerHTML = marketplaceData.products
        .map(product => `
            <div class="admin-product-card" data-id="${product.id}">
                <h4>${product.name} (${product.price}${MARKETPLACE_CONFIG.currency})</h4>
                <p>${product.desc}</p>
                <div class="admin-product-meta">
                    <span>Продавец: ${product.seller}</span>
                    <span>Дата: ${new Date(product.date).toLocaleDateString()}</span>
                </div>
                <div class="admin-product-actions">
                    <button onclick="toggleBlockProduct(${product.id})">
                        ${product.isBlocked ? "Разблокировать" : "Заблокировать"}
                    </button>
                    <button class="danger" onclick="deleteProduct(${product.id})">Удалить</button>
                </div>
            </div>
        `).join("");
}

// Управление товарами (глобальные функции для использования в HTML)
window.handleBuyClick = (seller) => {
    alert(`Свяжитесь с ${seller} в Telegram для покупки.`);
};

window.toggleBlockProduct = (id) => {
    marketplaceData.products = marketplaceData.products.map(p => 
        p.id === id ? {...p, isBlocked: !p.isBlocked} : p
    );
    saveData();
    renderProducts();
    renderAdminPanel();
};

window.deleteProduct = (id) => {
    if (confirm("Вы уверены, что хотите удалить этот товар?")) {
        marketplaceData.products = marketplaceData.products.filter(p => p.id !== id);
        saveData();
        renderProducts();
        renderAdminPanel();
    }
};

window.handleDeleteProduct = (id) => {
    if (confirm("Вы уверены, что хотите удалить свой товар?")) {
        marketplaceData.products = marketplaceData.products.filter(p => p.id !== id);
        saveData();
        renderProducts();
    }
};

// Вспомогательные функции
function closeAllModals() {
    elements.addProductModal.style.display = "none";
    elements.privacyModal.style.display = "none";
    elements.adminPanel.style.display = "none";
}

function acceptPrivacy() {
    localStorage.setItem("privacyAccepted", "true");
    elements.privacyModal.style.display = "none";
}

function showPrivacyModal() {
    elements.privacyModal.style.display = "flex";
}

// Запуск маркетплейса
let currentUser = localStorage.getItem("marketplace_user") || null;
initMarketplace();