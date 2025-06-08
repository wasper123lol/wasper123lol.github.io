// Конфигурация маркетплейса
const MARKETPLACE_CONFIG = {
    name: "Silk Road Marketplace",
    adminUsername: "@ADMIN_ID1214",
    storageKey: "silk_road_marketplace_data",
    currency: "$",
    maxMediaFiles: 3,
    defaultAvatar: "https://via.placeholder.com/40"
};

// Состояние приложения
const state = {
    currentUser: null,
    currentProduct: null,
    currentChat: null,
    currentOrder: null,
    mediaFiles: [],
    categories: [
        { id: "accounts", name: "Аккаунты", icon: "fas fa-user" },
        { id: "digital", name: "Цифровые товары", icon: "fas fa-file-code" },
        { id: "services", name: "Услуги", icon: "fas fa-handshake" },
        { id: "other", name: "Другое", icon: "fas fa-box" }
    ]
};

// DOM элементы
const elements = {
    // Основные элементы
    productsGrid: document.getElementById("products-grid"),
    categoryProducts: document.getElementById("category-products"),
    searchInput: document.getElementById("search-input"),
    categoryFilter: document.getElementById("category-filter"),
    sortSelect: document.getElementById("sort-select"),
    addProductBtn: document.getElementById("add-product-btn"),
    authBtn: document.getElementById("auth-btn"),
    authText: document.getElementById("auth-text"),
    adminLink: document.getElementById("admin-link"),
    privacyLinks: document.querySelectorAll(".privacy-link"),
    
    // Модальные окна
    modals: {
        addProduct: document.getElementById("add-product-modal"),
        viewProduct: document.getElementById("view-product-modal"),
        chat: document.getElementById("chat-modal"),
        confirmOrder: document.getElementById("confirm-order-modal"),
        confirmDelivery: document.getElementById("delivery-confirm-modal"),
        privacy: document.getElementById("privacy-modal"),
        admin: document.getElementById("admin-panel")
    },
    
    // Формы
    forms: {
        product: document.getElementById("product-form"),
    },
    
    // Элементы форм
    formElements: {
        productName: document.getElementById("product-name"),
        productCategory: document.getElementById("product-category"),
        productDesc: document.getElementById("product-desc"),
        productPrice: document.getElementById("product-price"),
        productMedia: document.getElementById("product-media"),
        mediaUpload: document.getElementById("media-upload"),
        mediaPreview: document.getElementById("media-preview"),
        reviewText: document.getElementById("review-text")
    },
    
    // Элементы чата
    chatElements: {
        messages: document.getElementById("chat-messages"),
        input: document.getElementById("chat-input"),
        sendBtn: document.getElementById("send-message-btn"),
        sellerName: document.getElementById("seller-name"),
        sellerAvatar: document.getElementById("seller-avatar"),
        sellerRating: document.getElementById("seller-rating")
    },
    
    // Элементы подтверждения заказа
    orderElements: {
        productName: document.getElementById("order-product-name"),
        productPrice: document.getElementById("order-product-price"),
        seller: document.getElementById("order-seller"),
        total: document.getElementById("order-total"),
        confirmBtn: document.getElementById("confirm-order-btn")
    },
    
    // Элементы админ-панели
    adminElements: {
        productsList: document.getElementById("admin-products-list"),
        ordersList: document.getElementById("admin-orders-list"),
        totalProducts: document.getElementById("total-products"),
        blockedProducts: document.getElementById("blocked-products"),
        totalUsers: document.getElementById("total-users")
    },
    
    // Табы
    tabs: {
        all: document.getElementById("all-products-tab"),
        categories: document.getElementById("categories-tab")
    },
    
    // Кнопки табов
    tabButtons: document.querySelectorAll(".marketplace-tab"),
    
    // Категории
    categoryOptions: document.querySelectorAll(".category-option")
};

// Инициализация приложения
function init() {
    loadData();
    setupEventListeners();
    checkAuthState();
    renderProducts();
    renderCategories();
    
    if (!localStorage.getItem("privacyAccepted")) {
        showModal("privacy");
    }
}

// Загрузка данных из localStorage
function loadData() {
    const savedData = localStorage.getItem(MARKETPLACE_CONFIG.storageKey);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            state.products = data.products || [];
            state.users = data.users || [];
            state.orders = data.orders || [];
            state.chats = data.chats || [];
            state.reviews = data.reviews || [];
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
        }
    } else {
        // Инициализация пустых данных
        state.products = [];
        state.users = [];
        state.orders = [];
        state.chats = [];
        state.reviews = [];
    }
}

// Сохранение данных в localStorage
function saveData() {
    const data = {
        products: state.products,
        users: state.users,
        orders: state.orders,
        chats: state.chats,
        reviews: state.reviews,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(MARKETPLACE_CONFIG.storageKey, JSON.stringify(data));
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки модальных окон
    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.addEventListener("click", closeAllModals);
    });
    
    // Кнопка принятия политики
    document.getElementById("accept-privacy").addEventListener("click", () => {
        localStorage.setItem("privacyAccepted", "true");
        closeAllModals();
    });
    
    // Ссылки на политику
    elements.privacyLinks.forEach(link => {
        link.addEventListener("click", () => showModal("privacy"));
    });
    
    // Кнопка авторизации
    elements.authBtn.addEventListener("click", handleAuth);
    
    // Кнопка добавления товара
    elements.addProductBtn.addEventListener("click", handleAddProductClick);
    
    // Форма добавления товара
    elements.forms.product.addEventListener("submit", handleProductSubmit);
    
    // Загрузка медиа
    elements.formElements.mediaUpload.addEventListener("click", () => {
        elements.formElements.productMedia.click();
    });
    
    elements.formElements.productMedia.addEventListener("change", handleMediaUpload);
    
    // Перетаскивание файлов
    elements.formElements.mediaUpload.addEventListener("dragover", (e) => {
        e.preventDefault();
        elements.formElements.mediaUpload.style.borderColor = MARKETPLACE_CONFIG.primary;
    });
    
    elements.formElements.mediaUpload.addEventListener("dragleave", () => {
        elements.formElements.mediaUpload.style.borderColor = "rgba(255, 255, 255, 0.2)";
    });
    
    elements.formElements.mediaUpload.addEventListener("drop", (e) => {
        e.preventDefault();
        elements.formElements.mediaUpload.style.borderColor = "rgba(255, 255, 255, 0.2)";
        
        if (e.dataTransfer.files.length > 0) {
            elements.formElements.productMedia.files = e.dataTransfer.files;
            handleMediaUpload();
        }
    });
    
    // Чат
    elements.chatElements.sendBtn.addEventListener("click", sendMessage);
    elements.chatElements.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
    
    // Подтверждение заказа
    elements.orderElements.confirmBtn.addEventListener("click", confirmOrder);
    
    // Подтверждение получения
    document.getElementById("confirm-delivery-btn").addEventListener("click", confirmDelivery);
    
    // Рейтинг
    document.querySelectorAll("#rating-stars .fa-star").forEach(star => {
        star.addEventListener("click", handleRatingClick);
    });
    
    // Поиск и фильтры
    elements.searchInput.addEventListener("input", renderProducts);
    elements.categoryFilter.addEventListener("change", renderProducts);
    elements.sortSelect.addEventListener("change", renderProducts);
    
    // Табы
    elements.tabButtons.forEach(tab => {
        tab.addEventListener("click", () => {
            const tabId = tab.getAttribute("data-tab");
            switchTab(tabId);
        });
    });
    
    // Категории
    elements.categoryOptions.forEach(option => {
        option.addEventListener("click", () => {
            const category = option.getAttribute("data-category");
            filterByCategory(category);
        });
    });
    
    // Админ-панель
    elements.adminLink?.addEventListener("click", showAdminPanel);
}

// Управление модальными окнами
function showModal(modalName) {
    closeAllModals();
    elements.modals[modalName].style.display = "flex";
}

function closeAllModals() {
    for (const modal in elements.modals) {
        elements.modals[modal].style.display = "none";
    }
}

// Авторизация пользователя
function handleAuth() {
    if (state.currentUser) {
        // Выход
        state.currentUser = null;
        localStorage.removeItem("marketplace_user");
        checkAuthState();
        alert("Вы вышли из системы");
    } else {
        // Вход
        const tgUsername = prompt("Введите ваш Telegram username (начинается с @):");
        if (!tgUsername) return;
        
        if (!tgUsername.startsWith("@")) {
            alert("Username должен начинаться с @");
            return;
        }
        
        state.currentUser = tgUsername;
        localStorage.setItem("marketplace_user", tgUsername);
        checkAuthState();
        
        // Проверяем, новый ли это пользователь
        const existingUser = state.users.find(u => u.username === tgUsername);
        if (!existingUser) {
            state.users.push({
                username: tgUsername,
                joinDate: new Date().toISOString(),
                rating: 0,
                reviews: []
            });
            saveData();
        }
        
        alert(`Добро пожаловать, ${tgUsername}!`);
    }
}

// Проверка состояния авторизации
function checkAuthState() {
    const savedUser = localStorage.getItem("marketplace_user");
    if (savedUser) {
        state.currentUser = savedUser;
    }
    
    if (state.currentUser) {
        elements.authText.textContent = state.currentUser;
        elements.addProductBtn.style.display = "block";
        
        // Проверка на админа
        if (state.currentUser.toLowerCase() === MARKETPLACE_CONFIG.adminUsername.toLowerCase()) {
            elements.adminLink.style.display = "block";
        } else {
            elements.adminLink.style.display = "none";
        }
    } else {
        elements.authText.textContent = "Войти";
        elements.addProductBtn.style.display = "none";
        elements.adminLink.style.display = "none";
    }
}

// Обработчик клика на добавление товара
function handleAddProductClick() {
    if (!state.currentUser) {
        alert("Сначала войдите в систему");
        return handleAuth();
    }
    
    state.mediaFiles = [];
    elements.formElements.mediaPreview.innerHTML = "";
    showModal("addProduct");
}

// Обработчик загрузки медиа
function handleMediaUpload() {
    const files = elements.formElements.productMedia.files;
    if (!files || files.length === 0) return;
    
    // Ограничение количества файлов
    const remainingSlots = MARKETPLACE_CONFIG.maxMediaFiles - state.mediaFiles.length;
    if (remainingSlots <= 0) {
        alert(`Максимум ${MARKETPLACE_CONFIG.maxMediaFiles} файлов`);
        return;
    }
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        const fileType = file.type.split("/")[0];
        
        if (fileType !== "image" && fileType !== "video") {
            alert("Можно загружать только изображения и видео");
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            state.mediaFiles.push({
                type: fileType,
                data: e.target.result,
                name: file.name
            });
            renderMediaPreview();
        };
        reader.readAsDataURL(file);
    }
    
    elements.formElements.productMedia.value = "";
}

// Рендер превью медиа
function renderMediaPreview() {
    elements.formElements.mediaPreview.innerHTML = "";
    
    state.mediaFiles.forEach((file, index) => {
        const previewItem = document.createElement("div");
        previewItem.className = "preview-item";
        
        if (file.type === "image") {
            previewItem.innerHTML = `
                <img src="${file.data}" alt="${file.name}">
                <div class="remove-preview" data-index="${index}">&times;</div>
            `;
        } else {
            previewItem.innerHTML = `
                <video src="${file.data}"></video>
                <div class="remove-preview" data-index="${index}">&times;</div>
            `;
        }
        
        elements.formElements.mediaPreview.appendChild(previewItem);
    });
    
    // Обработчики удаления превью
    document.querySelectorAll(".remove-preview").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(btn.getAttribute("data-index"));
            state.mediaFiles.splice(index, 1);
            renderMediaPreview();
            e.stopPropagation();
        });
    });
}

// Обработчик отправки формы товара
function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!state.currentUser) {
        alert("Сначала войдите в систему");
        return;
    }
    
    // Валидация
    if (elements.formElements.productName.value.length < 3) {
        alert("Название должно быть не короче 3 символов");
        return;
    }
    
    if (elements.formElements.productDesc.value.length < 10) {
        alert("Описание должно быть не короче 10 символов");
        return;
    }
    
    if (!elements.formElements.productCategory.value) {
        alert("Выберите категорию");
        return;
    }
    
    const price = parseFloat(elements.formElements.productPrice.value);
    if (isNaN(price) || price <= 0) {
        alert("Укажите корректную цену");
        return;
    }
    
    // Создание товара
    const newProduct = {
        id: Date.now().toString(),
        name: elements.formElements.productName.value,
        description: elements.formElements.productDesc.value,
        category: elements.formElements.productCategory.value,
        price: price.toFixed(2),
        seller: state.currentUser,
        media: [...state.mediaFiles],
        date: new Date().toISOString(),
        isBlocked: false,
        rating: 0
    };
    
    state.products.push(newProduct);
    saveData();
    renderProducts();
    closeAllModals();
    
    alert("Товар успешно добавлен!");
    e.target.reset();
    state.mediaFiles = [];
}

// Рендер товаров
function renderProducts() {
    let productsToDisplay = [...state.products];
    
    // Фильтрация заблокированных
    productsToDisplay = productsToDisplay.filter(p => !p.isBlocked);
    
    // Поиск
    const searchTerm = elements.searchInput.value.toLowerCase();
    if (searchTerm) {
        productsToDisplay = productsToDisplay.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm) ||
            p.seller.toLowerCase().includes(searchTerm)
        );
    }
    
    // Фильтр по категории
    const categoryFilter = elements.categoryFilter.value;
    if (categoryFilter) {
        productsToDisplay = productsToDisplay.filter(p => p.category === categoryFilter);
    }
    
    // Сортировка
    switch (elements.sortSelect.value) {
        case "price-asc":
            productsToDisplay.sort((a, b) => a.price - b.price);
            break;
        case "price-desc":
            productsToDisplay.sort((a, b) => b.price - a.price);
            break;
        case "rating":
            productsToDisplay.sort((a, b) => b.rating - a.rating);
            break;
        case "newest":
        default:
            productsToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // Отрисовка
    if (productsToDisplay.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Товаров не найдено</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
    } else {
        elements.productsGrid.innerHTML = productsToDisplay.map(product => `
            <div class="product-card" data-id="${product.id}">
                ${product.media.length > 0 ? `
                    <div class="product-media">
                        ${product.media[0].type === "image" ? 
                            `<img src="${product.media[0].data}" alt="${product.name}">` : 
                            `<video src="${product.media[0].data}" controls></video>`}
                        <div class="product-badge">${getCategoryName(product.category)}</div>
                    </div>
                ` : `
                    <div class="product-media">
                        <div class="media-placeholder">
                            <i class="${getCategoryIcon(product.category)}"></i>
                        </div>
                        <div class="product-badge">${getCategoryName(product.category)}</div>
                    </div>
                `}
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${product.price}${MARKETPLACE_CONFIG.currency}</div>
                    <div class="product-meta">
                        <div class="product-seller">
                            <img src="${MARKETPLACE_CONFIG.defaultAvatar}" alt="Seller">
                            <span>${product.seller}</span>
                        </div>
                        <small>${new Date(product.date).toLocaleDateString()}</small>
                    </div>
                    <div class="product-actions">
                        <button class="btn" onclick="viewProduct('${product.id}')">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }
}

// Просмотр товара
function viewProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.currentProduct = product;
    
    // Отрисовка модального окна товара
    document.getElementById("view-product-title").textContent = product.name;
    
    const content = document.getElementById("view-product-content");
    content.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1;">
                ${product.media.length > 0 ? product.media.map(media => 
                    media.type === "image" ? 
                        `<img src="${media.data}" alt="${product.name}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">` :
                        `<video src="${media.data}" controls style="width: 100%; border-radius: 8px; margin-bottom: 10px;"></video>`
                ).join("") : `
                    <div style="background: var(--darker); height: 200px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                        <i class="${getCategoryIcon(product.category)}" style="font-size: 50px; color: var(--gray);"></i>
                    </div>
                `}
            </div>
            <div style="flex: 1;">
                <h3 style="m