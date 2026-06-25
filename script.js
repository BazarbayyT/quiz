// Переменные состояния
let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let bestScore = localStorage.getItem('bestScore') || 0; // Загружаем лучший результат из памяти
let isGameOver = false;

// Элементы
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const optionsContainer = document.getElementById('options-container');
const questionText = document.getElementById('question-text');
const questionCounter = document.getElementById('question-counter');
// lives container removed from HTML; keep variable removed
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
    isGameOver = false; // <--- ДОБАВЛЕНО

    welcomeScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');

    updateMeta();
    showQuestion();
}

// Вспомогательная функция для отрисовки сердечек

// 4. Показ вопроса
function showQuestion() {
    btnNext.classList.add('hidden');
    explanationContainer.classList.add('hidden');
    optionsContainer.innerHTML = '';

    const q = quizQuestions[currentIndex];
    questionText.innerText = q.question;

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });

    updateMeta();
}

// lives/loseLife removed — game no longer uses life mechanic

function updateStreak(isCorrect) {
    if (isCorrect) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        
        let streakMessage = `Комбо: ${streak}`;
        if (streak === 3) streakMessage = "Хороший старт! ✨";
        if (streak === 5) streakMessage = "Идеально! ☕";
        if (streak === 10) streakMessage = "Ты просто гений! 🤎";
        if (streak >= 15) streakMessage = "Легендарно! 🕊️";
        
        streakIndicator.innerText = streakMessage;
        streakIndicator.style.color = "var(--primary)";
        streakIndicator.classList.add('streak-bounce');
        
        setTimeout(() => streakIndicator.classList.remove('streak-bounce'), 300);
    } else {
        streak = 0;
        streakIndicator.innerText = `Комбо: 0`;
        streakIndicator.style.color = "var(--text-muted)";
    }
}

function handleAnswer(index, btn) {
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
        updateStreak(false); // Просто сбрасываем винстрик, без потери жизни
    }
    showExplanation(q);
}

function showExplanation(q) {
    if (q) {
        const raw = q.explanation || '';
        const cleaned = raw.replace(/\s*(\[(?:cite|ref)\s*:?\s*\d+\]|\[\d+\])\s*$/i, '');
        explanationContainer.innerHTML = `<strong>Разбор:</strong> ${cleaned}`;
    } else {
        explanationContainer.innerHTML = '<strong>Время вышло!</strong>';
    }
    explanationContainer.classList.remove('hidden');
    btnNext.classList.remove('hidden');
}

function endGame(message) {
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
    // Если игра окончена из-за потери жизней
    if (isGameOver) {
        endGame('Игра окончена!');
        return;
    }

    currentIndex++;
    if (currentIndex < quizQuestions.length) {
        showQuestion();
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