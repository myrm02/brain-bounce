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
        {
            question: "Quelle est la capitale de la France ?",
            exact: ["paris"]
        },
        {
            question: "Quel est le plus grand océan du monde ?",
            exact: ["ocean pacifique", "pacifique", "océan pacifique"],
            containsAll: [["pacifique"]]
        },
        {
            question: "Dans quel continent se trouve le Brésil ?",
            exact: ["amerique du sud", "amérique du sud"],
            containsAll: [["amerique", "sud"], ["amérique", "sud"]]
        }
    ],
    histoire: [
        {
            question: "Qui est Napoléon ?",
            exact: [
                "empereur",
            ],
            containsAll: [
                ["empereur", "france"],
                ["empereur", "francais"],
                ["empereur", "français"]
            ],
        },
        {
            question: "En quelle année a eu lieu la Révolution française ?",
            exact: ["1789", "mille sept cent quatre vingt neuf"]
        },
        {
            question: "Qui a découvert l'Amérique en 1492 ?",
            exact: ["christophe colomb", "colomb"]
        }
    ],
    sports: [
        {
            question: "Combien y a-t-il de joueurs dans une équipe de football ?",
            exact: ["11", "onze"]
        },
        {
            question: "Dans quel sport utilise-t-on un ballon ovale ?",
            exact: ["rugby"]
        }
    ]
};

let currentTheme = null;
let currentQuestion = null;
let isListening = false;

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

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

        const evaluation = evaluateAnswer(transcript, currentQuestion);

        if (evaluation.correct) {
            resultText.textContent = "✅ Bonne réponse";
            resultText.style.color = "limegreen";
            statusText.textContent = evaluation.reason;
        } else {
            resultText.textContent = "❌ Mauvaise réponse";
            resultText.style.color = "tomato";
            statusText.textContent = evaluation.reason || "Essaie encore.";
        }
    };
}

function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, " ")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function words(text) {
    return normalize(text).split(" ").filter(Boolean);
}

function levenshtein(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function similarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);

    if (!na || !nb) return 0;

    const distance = levenshtein(na, nb);
    const maxLen = Math.max(na.length, nb.length);

    return 1 - distance / maxLen;
}

function evaluateAnswer(userAnswer, rule) {
    const input = normalize(userAnswer);

    if (!input) {
        return {
            correct: false,
            reason: "Je n'ai rien compris."
        };
    }

    if (rule.exact && rule.exact.length) {
        for (const candidate of rule.exact) {
            if (normalize(candidate) === input) {
                return {
                    correct: true,
                    reason: "Réponse exacte reconnue."
                };
            }
        }
    }

    if (rule.exact && rule.exact.length) {
        for (const candidate of rule.exact) {
            const nc = normalize(candidate);
            if (input.includes(nc)) {
                return {
                    correct: true,
                    reason: "Bonne réponse détectée dans la phrase."
                };
            }
        }
    }

    if (rule.containsAll && rule.containsAll.length) {
        for (const group of rule.containsAll) {
            const ok = group.every(word => input.includes(normalize(word)));
            if (ok) {
                return {
                    correct: true,
                    reason: "Les mots-clés importants sont présents."
                };
            }
        }
    }

    if (rule.containsAny && rule.containsAny.length) {
        for (const keyword of rule.containsAny) {
            if (input.includes(normalize(keyword))) {
                return {
                    correct: true,
                    reason: "Mot-clé reconnu."
                };
            }
        }
    }

    if (rule.exact && rule.exact.length) {
        for (const candidate of rule.exact) {
            const score = similarity(input, candidate);

            if (score >= 0.82) {
                return {
                    correct: true,
                    reason: "Réponse acceptée malgré une petite erreur."
                };
            }
        }
    }

    return {
        correct: false,
        reason: "Réponse non reconnue."
    };
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

    themeLabel.textContent = `Thème : ${capitalize(theme)}`;
    questionText.textContent = currentQuestion.question;
    statusText.textContent = "Clique sur le bouton pour répondre à l'oral.";
    spokenText.textContent = "";
    resultText.textContent = "";
}

function showMenu() {
    menuScreen.style.display = "flex";
    quizScreen.style.display = "none";
    currentTheme = null;
    currentQuestion = null;
}

function nextQuestion() {
    if (!currentTheme) return;

    currentQuestion = randomQuestion(currentTheme);
    questionText.textContent = currentQuestion.question;
    statusText.textContent = "Nouvelle question.";
    spokenText.textContent = "";
    resultText.textContent = "";
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function startListening() {
    if (!recognition) {
        statusText.textContent = "La reconnaissance vocale n'est pas supportée sur ce navigateur.";
        return;
    }

    if (isListening) return;

    try {
        recognition.start();
    } catch (err) {
        statusText.textContent = "Impossible de démarrer la reconnaissance vocale.";
        console.error(err);
    }
}

themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        showQuiz(btn.dataset.theme);
    });
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

    document.querySelectorAll("button.hovered").forEach(btn => {
        btn.classList.remove("hovered");
    });

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
