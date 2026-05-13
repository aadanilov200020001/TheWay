// --- КОНФИГУРАЦИЯ ---
const TOTAL_IMAGES = 247; // Количество реальных страниц с картинками
const TOTAL_PAGES = 248;  // Отображаемое в интерфейсе (включая финальный экран)
const IMG_FOLDER = 'images/';
const getImageSrc = (num) => `${IMG_FOLDER}Image${num}.jpg`;

// --- СОСТОЯНИЕ ---
let currentPage = 1;

// --- ЭЛЕМЕНТЫ DOM ---
const coverScreen = document.getElementById('cover-screen');
const readerScreen = document.getElementById('reader-screen');
const feedbackScreen = document.getElementById('feedback-screen');
const pageImg = document.getElementById('page-img');
const indicator = document.getElementById('page-indicator');
const btnGoto = document.getElementById('btn-goto');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnRestart = document.getElementById('btn-restart');
const btnCloseFeedback = document.getElementById('btn-close-feedback');
const gotoContainer = document.getElementById('goto-input-container');
const gotoInput = document.getElementById('goto-input');

// --- ИНИЦИАЛИЗАЦИЯ ---
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
    if (num > TOTAL_IMAGES) num = TOTAL_IMAGES;
    
    currentPage = num;
    pageImg.src = getImageSrc(currentPage);
    indicator.textContent = `${currentPage} / ${TOTAL_PAGES}`;
    
    preloadImage(currentPage + 1);
    preloadImage(currentPage - 1);
}

function preloadImage(num) {
    if (num > 0 && num <= TOTAL_IMAGES) {
        const img = new Image();
        img.src = getImageSrc(num);
    }
}

function nextPage() {
    if (feedbackScreen.style.display === 'flex') return;
    
    if (currentPage < TOTAL_IMAGES) {
        loadPage(currentPage + 1);
    } else {
        showFeedbackScreen(); // Срабатывает при попытке уйти с 247-й
    }
}

function prevPage() {
    if (feedbackScreen.style.display === 'flex') return;
    if (currentPage > 1) loadPage(currentPage - 1);
}

function showFeedbackScreen() {
    readerScreen.style.display = 'none';
    feedbackScreen.style.display = 'flex';
    localStorage.setItem('comicPage', TOTAL_IMAGES);
}

// --- НАВИГАЦИЯ (КЛАВИАТУРА) ---
document.addEventListener('keydown', (e) => {
    if (feedbackScreen.style.display === 'flex' || gotoContainer.style.display === 'block') return;
    
    if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
    else if (e.key === 'ArrowLeft') prevPage();
});

// --- НАВИГАЦИЯ (КЛИК) ---
readerScreen.addEventListener('click', (e) => {
    if (feedbackScreen.style.display === 'flex') return;
    if (e.target.closest('#ui-controls') || e.target.closest('#goto-input-container')) return;
    
    const width = window.innerWidth;
    const clickX = e.clientX;
    
    if (clickX < width / 2) prevPage();
    else nextPage();
});

// --- СВАЙПЫ ---
let touchStartX = 0;
let touchEndX = 0;

readerScreen.addEventListener('touchstart', (e) => {
    if (feedbackScreen.style.display === 'flex') return;
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

readerScreen.addEventListener('touchend', (e) => {
    if (feedbackScreen.style.display === 'flex') return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const threshold = 50;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > threshold) {
        if (diff > 0) nextPage();
        else prevPage();
    }
}

// --- ПЕРЕХОД НА СТРАНИЦУ ---
btnGoto.addEventListener('click', () => {
    if (feedbackScreen.style.display === 'flex') return;
    gotoContainer.style.display = 'block';
    gotoInput.value = currentPage;
    gotoInput.focus();
    gotoInput.select();
});

gotoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let val = parseInt(gotoInput.value);
        if (val >= 1 && val <= TOTAL_IMAGES) {
            loadPage(val);
            gotoContainer.style.display = 'none';
        }
    }
    if (e.key === 'Escape') gotoContainer.style.display = 'none';
});

document.addEventListener('click', (e) => {
    if (!gotoContainer.contains(e.target) && e.target !== btnGoto) {
        gotoContainer.style.display = 'none';
    }
});

// --- ПОЛНОЭКРАННЫЙ РЕЖИМ ---
btnFullscreen.addEventListener('click', () => {
    if (feedbackScreen.style.display === 'flex') return;
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(`Ошибка: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) document.body.classList.add('fullscreen-active');
    else document.body.classList.remove('fullscreen-active');
});

// --- КНОПКИ ФИНАЛЬНОГО ЭКРАНА ---
btnRestart.addEventListener('click', () => {
    feedbackScreen.style.display = 'none';
    coverScreen.classList.remove('fade-out');
    coverScreen.style.display = 'flex';
    readerScreen.style.display = 'none';
});

btnCloseFeedback.addEventListener('click', () => {
    feedbackScreen.style.display = 'none';
    readerScreen.style.display = 'flex';
    loadPage(TOTAL_IMAGES);
});

feedbackScreen.addEventListener('click', (e) => {
    if (e.target === feedbackScreen) btnCloseFeedback.click();
});

// --- СОХРАНЕНИЕ ПРОГРЕССА ---
window.addEventListener('beforeunload', () => {
    if (feedbackScreen.style.display !== 'flex') {
        localStorage.setItem('comicPage', currentPage);
    }
});

// Загрузка при старте
if (readerScreen.style.display === 'flex') {
    const savedPage = localStorage.getItem('comicPage');
    if (savedPage) loadPage(parseInt(savedPage));
}
