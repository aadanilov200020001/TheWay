// --- КОНФИГУРАЦИЯ ---
const TOTAL_PAGES = 248;
const IMG_FOLDER = 'images/';
// Функция для генерации имени файла: Image1.jpg, Image2.jpg...
const getImageSrc = (num) => `${IMG_FOLDER}Image${num}.jpg`;

// --- СОСТОЯНИЕ ---
let currentPage = 1;
let isZoomed = false;
let touchStartX = 0;
let touchEndX = 0;

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

// 1. Переход с обложки
coverScreen.addEventListener('click', () => {
    coverScreen.classList.add('fade-out');
    // Ждем окончания анимации (1s в CSS)
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
    
    // Сбрасываем зум при смене страницы
    exitZoom();

    // Меняем источник
    pageImg.src = getImageSrc(currentPage);
    
    // Обновляем индикатор
    indicator.textContent = `${currentPage} / ${TOTAL_PAGES}`;

    // Предзагрузка соседних страниц (оптимизация)
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
    if (isZoomed) return; // Блокируем листание в зуме
    if (currentPage < TOTAL_PAGES) {
        loadPage(currentPage + 1);
    }
}

function prevPage() {
    if (isZoomed) return;
    if (currentPage > 1) {
        loadPage(currentPage - 1);
    }
}

// --- ЗУМ (ZOOM) ---

function toggleZoom() {
    isZoomed = !isZoomed;
    if (isZoomed) {
        readerScreen.classList.add('zoomed');
        // Здесь можно добавить логику масштабирования, если нужно больше 100%
        // Но пока просто переключаем класс, который убирает object-fit: contain
    } else {
        exitZoom();
    }
}

function exitZoom() {
    isZoomed = false;
    readerScreen.classList.remove('zoomed');
}

// Двойной клик по картинке
pageImg.addEventListener('dblclick', (e) => {
    e.stopPropagation(); // Чтобы не сработал клик по экрану
    toggleZoom();
});

// --- НАВИГАЦИЯ (КЛАВИАТУРА) ---

document.addEventListener('keydown', (e) => {
    // Если открыт инпут, игнорируем стрелки
    if (gotoContainer.style.display === 'block') return;

    if (e.key === 'ArrowRight' || e.key === ' ') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        prevPage();
    }
});

// --- НАВИГАЦИЯ (КЛИК ПО ЭКРАНУ) ---
// Разделяем экран на зоны. Левая часть - назад, правая - вперед.
// Но только если не зум и не клик по UI.

readerScreen.addEventListener('click', (e) => {
    if (isZoomed) return; // В зуме клики не листают
    if (e.target.closest('#ui-controls') || e.target.closest('#goto-input-container')) return;

    const width = window.innerWidth;
    const clickX = e.clientX;

    if (clickX < width / 2) {
        prevPage();
    } else {
        nextPage();
    }
});

// --- СВАЙПЫ (МОБИЛЬНЫЕ) ---

readerScreen.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

readerScreen.addEventListener('touchend', (e) => {
    if (isZoomed) return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const swipeThreshold = 50; // Минимальная длина свайпа
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Свайп влево -> Следующая страница
            nextPage();
        } else {
            // Свайп вправо -> Предыдущая
            prevPage();
        }
    }
}

// --- ПЕРЕХОД НА СТРАНИЦУ (#) ---

btnGoto.addEventListener('click', () => {
    gotoContainer.style.display = 'block';
    gotoInput.value = '';
    gotoInput.focus();
});

gotoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let val = parseInt(gotoInput.value);
        if (val >= 1 && val <= TOTAL_PAGES) {
            loadPage(val);
            gotoContainer.style.display = 'none';
        } else {
            alert(`Введите число от 1 до ${TOTAL_PAGES}`);
        }
    }
    if (e.key === 'Escape') {
        gotoContainer.style.display = 'none';
    }
});

// Закрытие инпута при клике вне его
document.addEventListener('click', (e) => {
    if (!gotoContainer.contains(e.target) && e.target !== btnGoto) {
        gotoContainer.style.display = 'none';
    }
});

// --- ПОЛНОЭКРАННЫЙ РЕЖИМ ---

btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Ошибка включения fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Отслеживание изменения режима fullscreen
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        document.body.classList.add('fullscreen-active');
    } else {
        document.body.classList.remove('fullscreen-active');
    }
});

// Сохранение прогресса (LocalStorage)
window.addEventListener('beforeunload', () => {
    localStorage.setItem('comicPage', currentPage);
});

window.addEventListener('load', () => {
    const savedPage = localStorage.getItem('comicPage');
    if (savedPage && coverScreen.style.display === 'none') {
        // Если мы уже в читалке (обновление страницы), грузим сохраненную
        loadPage(parseInt(savedPage));
    }
});