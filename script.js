// Переменные состояния
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let lives = 3;
let timer = null;
const TIME_LIMIT = 10; // 10 секунд на вопрос
let bestScore = localStorage.getItem('bestScore') || 0; // Загружаем лучший результат из памяти

// Элементы
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const optionsContainer = document.getElementById('options-container');
const questionText = document.getElementById('question-text');
const questionCounter = document.getElementById('question-counter');
const livesContainer = document.getElementById('lives-container');
const timerBar = document.getElementById('timer-bar');
const streakIndicator = document.getElementById('streak-indicator');
const progressBar = document.getElementById('progress-bar');
const btnNext = document.getElementById('btn-next');
const btnMarathon = document.getElementById('btn-marathon');
const btnSprint = document.getElementById('btn-sprint');
const finalScore = document.getElementById('final-score');
const maxStreakElement = document.getElementById('max-streak');

// Создаем контейнер для объяснений динамически (чтобы не менять HTML)
const explanationContainer = document.createElement('div');
explanationContainer.id = 'explanation-container';
explanationContainer.classList.add('hidden', 'explanation-block');
quizScreen.querySelector('.quiz-body').appendChild(explanationContainer);

// 1. Загрузка данных
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        btnMarathon.addEventListener('click', () => startQuiz('marathon'));
        btnSprint.addEventListener('click', () => startQuiz('sprint'));
    } catch (error) {
        questionText.innerText = "Ошибка загрузки базы вопросов :(";
    }
}

// 2. Алгоритм Фишера-Йетса
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 3. Старт
function startQuiz(mode) {
    let shuffled = shuffle([...allQuestions]);
    quizQuestions = (mode === 'sprint') ? shuffled.slice(0, 25) : shuffled;

    currentIndex = 0;
    score = 0;
    streak = 0;
    maxStreak = 0;
    lives = 3;
    renderLives();

    welcomeScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');

    updateMeta();
    showQuestion();
    startTimer();
}

// Вспомогательная функция для отрисовки сердечек
function renderLives() {
    const heartSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="heart-icon"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    if (livesContainer) {
        livesContainer.innerHTML = heartSvg.repeat(lives);
    } else {
        console.error("Не найден элемент lives-container!");
    }
}

// 4. Показ вопроса
function showQuestion() {
    btnNext.classList.add('hidden');
    explanationContainer.classList.add('hidden');
    optionsContainer.innerHTML = '';
    clearInterval(timer);

    const q = quizQuestions[currentIndex];
    questionText.innerText = q.question;

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function startTimer() {
    let timeLeft = TIME_LIMIT;
    timerBar.style.width = '100%';

    timer = setInterval(() => {
        timeLeft--;
        timerBar.style.width = `${(timeLeft / TIME_LIMIT) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    loseLife();
    showExplanation(null);
}

function loseLife() {
    const hearts = livesContainer ? livesContainer.querySelectorAll('.heart-icon') : [];
    if (hearts.length > 0) {
        const lastHeart = hearts[hearts.length - 1];
        lastHeart.classList.add('lost-life');
        lastHeart.addEventListener('animationend', () => {
            lives--;
            renderLives();
            if (lives <= 0) {
                endGame('Игра окончена!');
            }
        }, { once: true });
    } else {
        lives--;
        renderLives();
        if (lives <= 0) {
            endGame('Игра окончена!');
        }
    }
}

function updateStreak(isCorrect) {
    if (isCorrect) {
        streak++;
        if (streak >= 5) streakIndicator.classList.add('streak-hot');
        if (streak > maxStreak) maxStreak = streak;
    } else {
        streak = 0;
        streakIndicator.classList.remove('streak-hot');
    }
    streakIndicator.innerText = `Комбо: ${streak}`;
}

function handleAnswer(index, btn) {
    clearInterval(timer);
    const q = quizQuestions[currentIndex];
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    
    allBtns.forEach(b => b.disabled = true);

    if (index === q.correct) {
        btn.classList.add('correct');
        score++;
        updateStreak(true);
    } else {
        btn.classList.add('wrong');
        allBtns[q.correct].classList.add('correct');
        loseLife();
        updateStreak(false);
    }
    showExplanation(q);
}

function showExplanation(q) {
    explanationContainer.innerHTML = q ? `<strong>Разбор:</strong> ${q.explanation}` : '<strong>Время вышло!</strong>';
    explanationContainer.classList.remove('hidden');
    btnNext.classList.remove('hidden');
}

function endGame(message) {
    clearInterval(timer);
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    resultsScreen.querySelector('.result-title').innerText = message;

    const percentage = Math.round((score / quizQuestions.length) * 100);
    finalScore.innerText = `${score} из ${quizQuestions.length} (${percentage}%)`;
    maxStreakElement.innerText = maxStreak;

    if (percentage > bestScore) {
        bestScore = percentage;
        localStorage.setItem('bestScore', bestScore);
    }
}

// 6. Обновление интерфейса
function updateMeta() {
    questionCounter.innerText = `Вопрос: ${currentIndex + 1} / ${quizQuestions.length}`;
    streakIndicator.innerText = `Комбо: ${streak}`;
    progressBar.style.width = `${((currentIndex + 1) / quizQuestions.length) * 100}%`;
}

// 7. Следующий вопрос
btnNext.onclick = () => {
    currentIndex++;
    if (currentIndex < quizQuestions.length) {
        showQuestion();
        startTimer();
    } else {
        showResults();
    }
};

// 8. Финал
function showResults() {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    const percentage = Math.round((score / quizQuestions.length) * 100);
    finalScore.innerText = `${score} из ${quizQuestions.length} (${percentage}%)`;
    maxStreakElement.innerText = maxStreak;

    // Сохраняем лучший результат
    if (percentage > bestScore) {
        bestScore = percentage;
        localStorage.setItem('bestScore', bestScore);
    }
}

// Рестарт
document.getElementById('btn-restart').onclick = () => {
    resultsScreen.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
};

loadQuestions();