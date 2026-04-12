// --- КОНФИГУРАЦИЯ ---
const TOTAL_PAGES = 248;
const IMG_FOLDER = 'images/';
const getImageSrc = (num) => `${IMG_FOLDER}Image${num}.jpg`;

// --- СОСТОЯНИЕ ---
let currentPage = 1;

// --- ЭЛЕМЕНТЫ DOM ---
const coverScreen = document.getElementById('cover-screen');
const readerScreen = document.getElementById('reader-screen');
const pageImg = document.getElementById('page-img');
const indicator = document.getElementById('page-indicator');
const btnGoto = document.getElementById('btn-goto');
const btnFullscreen = document.getElementById('btn-fullscreen');
const gotoContainer = document.getElementById('goto-input-container');
const gotoInput = document.getElementById('goto-input');

// --- ИНИЦИАЛИЗАЦИЯ ---

// Переход с обложки
coverScreen.addEventListener('click', () => {
    coverScreen.classList.add('fade-out');
    setTimeout(() => {
        coverScreen.style.display = 'none';
        readerScreen.style.display = 'flex';
        loadPage(1);
    }, 1000);
});

// --- ОСНОВНЫЕ ФУНКЦИИ ---

function loadPage(num) {
    if (num < 1) num = 1;
    if (num > TOTAL_PAGES) num = TOTAL_PAGES;
    
    currentPage = num;
    pageImg.src = getImageSrc(currentPage);
    indicator.textContent = `${currentPage} / ${TOTAL_PAGES}`;
    
    // Предзагрузка
    preloadImage(currentPage + 1);
    preloadImage(currentPage - 1);
}

function preloadImage(num) {
    if (num > 0 && num <= TOTAL_PAGES) {
        const img = new Image();
        img.src = getImageSrc(num);
    }
}

function nextPage() {
    if (currentPage < TOTAL_PAGES) {
        loadPage(currentPage + 1);
    }
}

function prevPage() {
    if (currentPage > 1) {
        loadPage(currentPage - 1);
    }
}

// --- НАВИГАЦИЯ (КЛАВИАТУРА) ---
document.addEventListener('keydown', (e) => {
    if (gotoContainer.style.display === 'block') return;
    
    if (e.key === 'ArrowRight' || e.key === ' ') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        prevPage();
    }
});

// --- НАВИГАЦИЯ (КЛИК) ---
readerScreen.addEventListener('click', (e) => {
    if (e.target.closest('#ui-controls') || e.target.closest('#goto-input-container')) return;
    
    const width = window.innerWidth;
    const clickX = e.clientX;
    
    if (clickX < width / 2) {
        prevPage();
    } else {
        nextPage();
    }
});

// --- СВАЙПЫ ---
let touchStartX = 0;
let touchEndX = 0;

readerScreen.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

readerScreen.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextPage();
        } else {
            prevPage();
        }
    }
}

// --- ПЕРЕХОД НА СТРАНИЦУ ---
btnGoto.addEventListener('click', () => {
    gotoContainer.style.display = 'block';
    gotoInput.value = currentPage;
    gotoInput.focus();
    gotoInput.select();
});

gotoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let val = parseInt(gotoInput.value);
        if (val >= 1 && val <= TOTAL_PAGES) {
            loadPage(val);
            gotoContainer.style.display = 'none';
        }
    }
    if (e.key === 'Escape') {
        gotoContainer.style.display = 'none';
    }
});

// Закрытие инпута при клике вне
document.addEventListener('click', (e) => {
    if (!gotoContainer.contains(e.target) && e.target !== btnGoto) {
        gotoContainer.style.display = 'none';
    }
});

// --- ПОЛНОЭКРАННЫЙ РЕЖИМ ---
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Ошибка: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.body.classList.add('fullscreen-active');
    } else {
        document.body.classList.remove('fullscreen-active');
    }
});

// --- СОХРАНЕНИЕ ПРОГРЕССА ---
window.addEventListener('beforeunload', () => {
    localStorage.setItem('comicPage', currentPage);
});

// Загрузка сохраненной страницы при обновлении
if (readerScreen.style.display === 'flex') {
    const savedPage = localStorage.getItem('comicPage');
    if (savedPage) {
        loadPage(parseInt(savedPage));
    }
}