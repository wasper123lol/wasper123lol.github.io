// Данные пользователей и товаров (в реальном проекте нужно использовать БД)
let products = [];
let currentUser = null;
const ADMIN_EMAILS = ["admin@example.com"]; // Сюда добавить админские почты

// DOM-элементы
const accountList = document.getElementById("account-list");
const addProductBtn = document.getElementById("add-product-btn");
const addProductModal = document.getElementById("add-product-modal");
const privacyModal = document.getElementById("privacy-modal");
const adminPanel = document.getElementById("admin-panel");
const adminLink = document.getElementById("admin-link");
const closeButtons = document.querySelectorAll(".close-modal");
const acceptPrivacyBtn = document.getElementById("accept-privacy");
const privacyLinks = document.querySelectorAll(".privacy-link");

// Показать политику при первом входе
if (!localStorage.getItem("privacyAccepted")) {
    privacyModal.style.display = "flex";
}

// Закрытие модальных окон
closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        addProductModal.style.display = "none";
        privacyModal.style.display = "none";
        adminPanel.style.display = "none";
    });
});

// Принятие политики
acceptPrivacyBtn.addEventListener("click", () => {
    localStorage.setItem("privacyAccepted", "true");
    privacyModal.style.display = "none";
});

// Открытие политики по ссылке
privacyLinks.forEach(link => {
    link.addEventListener("click", () => {
        privacyModal.style.display = "flex";
    });
});

// Регистрация через Telegram
function registerUser() {
    const tgUsername = prompt("Введите ваш Telegram (@username):");
    if (!tgUsername) return alert("Укажите юзернейм!");
    currentUser = tgUsername;
    alert(`🔐 Ваш юзернейм: ${tgUsername}\nУбедитесь, что он правильный!`);
}

// Добавление товара
addProductBtn.addEventListener("click", () => {
    if (!currentUser) return registerUser();
    addProductModal.style.display = "flex";
});

document.getElementById("product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const [name, desc, price, seller] = e.target.elements;
    
    products.push({
        id: Date.now(),
        name: name.value,
        desc: desc.value,
        price: price.value,
        seller: seller.value,
        isBlocked: false
    });

    renderProducts();
    addProductModal.style.display = "none";
    e.target.reset();
});

// Рендер товаров
function renderProducts() {
    accountList.innerHTML = products
        .filter(product => !product.isBlocked)
        .map(product => `
            <div class="account-card">
                <h3>${product.name}</h3>
                <p>${product.desc}</p>
                <p class="price">💰 ${product.price}$</p>
                <p class="seller">👤 Продавец: <a href="https://t.me/${product.seller}" target="_blank">@${product.seller}</a></p>
                <button class="btn" onclick="alert('Свяжитесь с @${product.seller} для покупки.')">Купить</button>
            </div>
        `).join("");
}

// Проверка админа (можно добавить вход через почту)
function checkAdmin() {
    const email = prompt("Введите админскую почту:");
    if (ADMIN_EMAILS.includes(email)) {
        adminLink.style.display = "block";
        alert("Доступ к админ-панели разрешен!");
    }
}

// Админ-панель
adminLink.addEventListener("click", (e) => {
    e.preventDefault();
    adminPanel.style.display = "flex";
    document.getElementById("admin-products-list").innerHTML = products
        .map(product => `
            <div style="margin: 10px 0; padding: 10px; background: ${product.isBlocked ? "#ff000022" : "#00ff0022"}">
                <h4>${product.name} (${product.price}$)</h4>
                <p>${product.desc}</p>
                <button onclick="blockProduct(${product.id})">${product.isBlocked ? "Разблокировать" : "Заблокировать"}</button>
            </div>
        `).join("");
});

// Блокировка товара
window.blockProduct = (id) => {
    products = products.map(p => p.id === id ? {...p, isBlocked: !p.isBlocked} : p);
    renderProducts();
    document.getElementById("admin-products-list").innerHTML = ""; // Обновляем админ-панель
    adminLink.click(); // Переоткрываем
};

// Инициализация
renderProducts();