const cursor = document.getElementById("cursor");

const menuScreen = document.getElementById("menuScreen");
const quizScreen = document.getElementById("quizScreen");

const themeButtons = document.querySelectorAll(".theme-btn");
const listenBtn = document.getElementById("listenBtn");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const themeLabel = document.getElementById("themeLabel");
const questionText = document.getElementById("questionText");
const statusText = document.getElementById("statusText");
const spokenText = document.getElementById("spokenText");
const resultText = document.getElementById("resultText");

const questions = {
    geographie: [
        { question: "Quelle est la capitale de la France ?", answers: ["paris"] },
        { question: "Quel est le plus grand océan du monde ?", answers: ["pacifique", "ocean pacifique"] }
    ],
    histoire: [
        { question: "En quelle année a eu lieu la Révolution française ?", answers: ["1789"] },
        { question: "Qui était Napoléon ?", answers: ["empereur", "un empereur", "empereur des francais"] }
    ],
    sports: [
        { question: "Combien y a-t-il de joueurs dans une équipe de football ?", answers: ["11", "onze"] },
        { question: "Dans quel sport utilise-t-on un ballon ovale ?", answers: ["rugby"] }
    ]
};

let currentTheme = null;
let currentQuestion = null;
let isListening = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        statusText.textContent = "J'écoute...";
        spokenText.textContent = "";
        resultText.textContent = "";
    };

    recognition.onend = () => {
        isListening = false;
        if (statusText.textContent === "J'écoute...") {
            statusText.textContent = "Écoute terminée.";
        }
    };

    recognition.onerror = (e) => {
        isListening = false;
        statusText.textContent = `Erreur vocale : ${e.error}`;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        spokenText.textContent = `Réponse entendue : "${transcript}"`;

        const heard = normalize(transcript);
        const ok = currentQuestion.answers.some(a => normalize(a) === heard);

        if (ok) {
            resultText.textContent = "Bonne réponse";
            resultText.style.color = "limegreen";
        } else {
            resultText.textContent = `Mauvaise réponse. Attendu : ${currentQuestion.answers[0]}`;
            resultText.style.color = "tomato";
        }
    };
}

function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function randomQuestion(theme) {
    const arr = questions[theme];
    return arr[Math.floor(Math.random() * arr.length)];
}

function showQuiz(theme) {
    currentTheme = theme;
    currentQuestion = randomQuestion(theme);

    menuScreen.style.display = "none";
    quizScreen.style.display = "flex";

    themeLabel.textContent = `Thème : ${theme}`;
    questionText.textContent = currentQuestion.question;
    statusText.textContent = "Clique sur le bouton pour répondre à l'oral.";
    spokenText.textContent = "";
    resultText.textContent = "";
}

function showMenu() {
    menuScreen.style.display = "flex";
    quizScreen.style.display = "none";
}

function nextQuestion() {
    if (!currentTheme) return;
    currentQuestion = randomQuestion(currentTheme);
    questionText.textContent = currentQuestion.question;
    statusText.textContent = "Nouvelle question.";
    spokenText.textContent = "";
    resultText.textContent = "";
}

function startListening() {
    if (!recognition || isListening) return;
    recognition.start();
}

themeButtons.forEach(btn => {
    btn.addEventListener("click", () => showQuiz(btn.dataset.theme));
});

listenBtn.addEventListener("click", startListening);
nextBtn.addEventListener("click", nextQuestion);
backBtn.addEventListener("click", showMenu);

let posX = window.innerWidth / 2;
let posY = window.innerHeight / 2;
let lastPinch = false;
let lastClickTime = 0;

window.onHandUpdate(({ x, y, isPinching }) => {
    const targetX = (1 - x) * window.innerWidth;
    const targetY = y * window.innerHeight;

    posX += (targetX - posX) * 0.35;
    posY += (targetY - posY) * 0.35;

    cursor.style.left = `${posX}px`;
    cursor.style.top = `${posY}px`;

    cursor.classList.toggle("pinching", isPinching);

    document.querySelectorAll("button.hovered").forEach(b => b.classList.remove("hovered"));

    const el = document.elementFromPoint(posX, posY);
    if (el && el.tagName === "BUTTON") {
        el.classList.add("hovered");
    }

    const now = Date.now();
    if (isPinching && !lastPinch && now - lastClickTime > 800) {
        if (el && el.tagName === "BUTTON") {
            el.click();
            lastClickTime = now;
        }
    }

    lastPinch = isPinching;
});