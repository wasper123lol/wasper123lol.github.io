// Конфигурация маркетплейса
const MARKETPLACE_CONFIG = {
    name: "Silk Road Marketplace",
    adminUsername: "@ADMIN_ID1214",
    storageKey: "silk_road_marketplace_data",
    currency: "$",
    maxMediaFiles: 3,
    defaultAvatar: "https://via.placeholder.com/40",
    paymentLinkForBuyer: "http://t.me/send?start=IV48WZkO2liV"
};

// Состояние приложения
const state = {
    currentUser: null,
    currentProduct: null,
    currentChat: null,
    mediaFiles: [],
    categories: [
        { id: "accounts", name: "Аккаунты", icon: "fas fa-user" },
        { id: "digital", name: "Цифровые товары", icon: "fas fa-file-code" },
        { id: "services", name: "Услуги", icon: "fas fa-handshake" },
        { id: "other", name: "Другое", icon: "fas fa-box" }
    ],
    products: [],
    users: [],
    chats: [],
    orders: []
};

// Инициализация приложения
function init() {
    loadData();
    setupEventListeners();
    checkAuthState();
    renderProducts();
    
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
            state.chats = data.chats || [];
            state.orders = data.orders || [];
        } catch (e) {
            console.error("Ошибка загрузки данных:", e);
            // Инициализация пустых данных при ошибке
            state.products = [];
            state.users = [];
            state.chats = [];
            state.orders = [];
        }
    }
}

// Сохранение данных в localStorage
function saveData() {
    const data = {
        products: state.products,
        users: state.users,
        chats: state.chats,
        orders: state.orders,
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
    document.querySelectorAll(".privacy-link").forEach(link => {
        link.addEventListener("click", () => showModal("privacy"));
    });
    
    // Кнопка авторизации
    document.getElementById("auth-btn").addEventListener("click", handleAuth);
    
    // Кнопка добавления товара
    document.getElementById("add-product-btn").addEventListener("click", handleAddProductClick);
    
    // Форма добавления товара
    document.getElementById("product-form").addEventListener("submit", handleProductSubmit);
    
    // Загрузка медиа
    const mediaUpload = document.getElementById("media-upload");
    const productMedia = document.getElementById("product-media");
    
    mediaUpload.addEventListener("click", () => productMedia.click());
    productMedia.addEventListener("change", handleMediaUpload);
    
    // Перетаскивание файлов
    mediaUpload.addEventListener("dragover", (e) => {
        e.preventDefault();
        mediaUpload.style.borderColor = MARKETPLACE_CONFIG.primary;
    });
    
    mediaUpload.addEventListener("dragleave", () => {
        mediaUpload.style.borderColor = "rgba(255, 255, 255, 0.2)";
    });
    
    mediaUpload.addEventListener("drop", (e) => {
        e.preventDefault();
        mediaUpload.style.borderColor = "rgba(255, 255, 255, 0.2)";
        
        if (e.dataTransfer.files.length > 0) {
            productMedia.files = e.dataTransfer.files;
            handleMediaUpload();
        }
    });
    
    // Поиск и фильтры
    document.getElementById("search-input").addEventListener("input", renderProducts);
    document.getElementById("category-filter").addEventListener("change", renderProducts);
    document.getElementById("sort-select").addEventListener("change", renderProducts);
    
    // Табы
    document.querySelectorAll(".marketplace-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const tabId = tab.getAttribute("data-tab");
            switchTab(tabId);
        });
    });
    
    // Категории
    document.querySelectorAll(".category-option").forEach(option => {
        option.addEventListener("click", () => {
            const category = option.getAttribute("data-category");
            filterByCategory(category);
        });
    });
    
    // Админ-панель
    document.getElementById("admin-link")?.addEventListener("click", showAdminPanel);
    
    // Чат
    document.getElementById("send-message-btn").addEventListener("click", sendMessage);
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });
    
    // Загрузка файлов в чате
    document.getElementById("chat-file-upload").addEventListener("click", () => {
        document.getElementById("chat-file-input").click();
    });
    
    document.getElementById("chat-file-input").addEventListener("change", handleChatFileUpload);
    
    // Копирование кода авторизации
    document.querySelector(".btn-copy").addEventListener("click", copyAuthCode);
    
    // Проверка авторизации
    document.getElementById("check-auth-btn").addEventListener("click", checkAuthStatus);
    
    // Админ-панель
    document.getElementById("admin-search").addEventListener("input", renderAdminProducts);
    document.getElementById("admin-status-filter").addEventListener("change", renderAdminProducts);
}

// Управление модальными окнами
function showModal(modalName) {
    closeAllModals();
    document.getElementById(`${modalName}-modal`).style.display = "flex";
    
    // Особые действия для определенных модальных окон
    if (modalName === "admin") {
        renderAdminProducts();
        updateAdminStats();
    }
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.style.display = "none";
    });
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
        // Генерация кода авторизации
        const authCode = generateAuthCode();
        document.getElementById("auth-code").textContent = authCode;
        showModal("telegram-auth");
    }
}

// Генерация кода авторизации
function generateAuthCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Копирование кода авторизации
function copyAuthCode() {
    const code = document.getElementById("auth-code").textContent;
    navigator.clipboard.writeText(`/login ${code}`);
    alert("Код скопирован! Отправьте его боту @SilkRoadAuthBot");
}

// Проверка статуса авторизации
function checkAuthStatus() {
    const savedUser = localStorage.getItem("marketplace_user");
    if (savedUser) {
        state.currentUser = savedUser;
        checkAuthState();
        closeAllModals();
        alert(`Добро пожаловать, ${savedUser}!`);
    } else {
        alert("Авторизация не подтверждена. Убедитесь, что вы отправили код боту.");
    }
}

// Проверка состояния авторизации
function checkAuthState() {
    const savedUser = localStorage.getItem("marketplace_user");
    if (savedUser) {
        state.currentUser = savedUser;
        document.getElementById("auth-text").textContent = savedUser;
        document.getElementById("add-product-btn").style.display = "block";
        
        // Проверка на админа
        if (savedUser.toLowerCase() === MARKETPLACE_CONFIG.adminUsername.toLowerCase()) {
            document.getElementById("admin-link").style.display = "block";
        } else {
            document.getElementById("admin-link").style.display = "none";
        }
        
        // Добавление пользователя, если его нет
        const existingUser = state.users.find(u => u.username === savedUser);
        if (!existingUser) {
            state.users.push({
                username: savedUser,
                joinDate: new Date().toISOString(),
                rating: 0,
                reviews: []
            });
            saveData();
        }
    } else {
        document.getElementById("auth-text").textContent = "Войти";
        document.getElementById("add-product-btn").style.display = "none";
        document.getElementById("admin-link").style.display = "none";
    }
}

// Переключение табов
function switchTab(tabId) {
    document.querySelectorAll(".marketplace-tab").forEach(tab => {
        tab.classList.remove("active");
    });
    
    document.querySelector(`.marketplace-tab[data-tab="${tabId}"]`).classList.add("active");
    
    if (tabId === "all") {
        document.getElementById("products-grid").style.display = "grid";
        document.getElementById("category-products").style.display = "none";
    } else {
        document.getElementById("products-grid").style.display = "none";
        document.getElementById("category-products").style.display = "block";
    }
}

// Фильтрация по категории
function filterByCategory(category) {
    const products = state.products.filter(p => p.category === category && !p.isBlocked);
    const grid = document.getElementById("category-products-grid");
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Товаров не найдено</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
    } else {
        grid.innerHTML = products.map(product => createProductCard(product)).join("");
    }
}

// Обработчик клика на добавление товара
function handleAddProductClick() {
    if (!state.currentUser) {
        alert("Сначала войдите в систему");
        return handleAuth();
    }
    
    state.mediaFiles = [];
    document.getElementById("media-preview").innerHTML = "";
    showModal("addProduct");
}

// Обработчик загрузки медиа
function handleMediaUpload() {
    const files = document.getElementById("product-media").files;
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
    
    document.getElementById("product-media").value = "";
}

// Рендер превью медиа
function renderMediaPreview() {
    const previewContainer = document.getElementById("media-preview");
    previewContainer.innerHTML = "";
    
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
        
        previewContainer.appendChild(previewItem);
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
    const productName = document.getElementById("product-name").value;
    const productDesc = document.getElementById("product-desc").value;
    const productCategory = document.getElementById("product-category").value;
    const productPrice = document.getElementById("product-price").value;
    const paymentLink = document.getElementById("payment-link").value;
    
    if (productName.length < 3) {
        alert("Название должно быть не короче 3 символов");
        return;
    }
    
    if (productDesc.length < 10) {
        alert("Описание должно быть не короче 10 символов");
        return;
    }
    
    if (!productCategory) {
        alert("Выберите категорию");
        return;
    }
    
    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
        alert("Укажите корректную цену");
        return;
    }
    
    if (!paymentLink || !paymentLink.includes("t.me")) {
        alert("Укажите корректную ссылку для оплаты (ваш @send)");
        return;
    }
    
    // Создание товара
    const newProduct = {
        id: Date.now().toString(),
        name: productName,
        description: productDesc,
        category: productCategory,
        price: price.toFixed(2),
        seller: state.currentUser,
        paymentLink: paymentLink,
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

// Создание карточки товара
function createProductCard(product) {
    return `
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
    `;
}

// Рендер товаров
function renderProducts() {
    let productsToDisplay = [...state.products];
    
    // Фильтрация заблокированных
    productsToDisplay = productsToDisplay.filter(p => !p.isBlocked);
    
    // Поиск
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    if (searchTerm) {
        productsToDisplay = productsToDisplay.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm) ||
            p.seller.toLowerCase().includes(searchTerm)
        );
    }
    
    // Фильтр по категории
    const categoryFilter = document.getElementById("category-filter").value;
    if (categoryFilter) {
        productsToDisplay = productsToDisplay.filter(p => p.category === categoryFilter);
    }
    
    // Сортировка
    switch (document.getElementById("sort-select").value) {
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
    const grid = document.getElementById("products-grid");
    if (productsToDisplay.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Товаров не найдено</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
    } else {
        grid.innerHTML = productsToDisplay.map(product => createProductCard(product)).join("");
    }
}

// Получение названия категории
function getCategoryName(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    return category ? category.name : "Другое";
}

// Получение иконки категории
function getCategoryIcon(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    return category ? category.icon : "fas fa-box";
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
        <div class="product-view-container">
            <div class="product-view-media">
                ${product.media.length > 0 ? product.media.map(media => 
                    media.type === "image" ? 
                        `<img src="${media.data}" alt="${product.name}">` :
                        `<video src="${media.data}" controls></video>`
                ).join("") : `
                    <div class="media-placeholder">
                        <i class="${getCategoryIcon(product.category)}"></i>
                    </div>
                `}
            </div>
            <div class="product-view-details">
                <div class="product-view-price">${product.price}${MARKETPLACE_CONFIG.currency}</div>
                <div class="product-view-category">
                    <i class="${getCategoryIcon(product.category)}"></i>
                    ${getCategoryName(product.category)}
                </div>
                <div class="product-view