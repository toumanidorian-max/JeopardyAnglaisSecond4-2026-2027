/* ==========================================================
   COMMONWEALTH JEOPARDY
   ----------------------------------------------------------
   POUR MODIFIER UNE QUESTION : change simplement "question"
   et "answer" dans l'objet "questions" ci-dessous.
   (Une case dont la question ou la réponse est vide est
   automatiquement désactivée et n'est pas comptée.)
   ========================================================== */

// Ordre des catégories sur le plateau
const CATEGORIES = ["HISTORY", "CULTURE", "GEOGRAPHY"];

// Valeurs en points, de la plus facile (50) à la plus difficile (500)
const POINT_VALUES = [50, 100, 200, 300, 500];

const questions = {
    HISTORY: {
        50: {
            question: "When was the modern Commonwealth created?",
            answer: "1949"
        },
        100: {
            question: "When did India become independent?",
            answer: "1947"
        },
        200: {
            question: "When was Tuvalu created?",
            answer: "1 October 1978"
        },
        300: {
            question: "When did Ireland enter the Commonwealth?",
            answer: "1922"
        },
        500: {
            question: "When was the official Commonwealth logo adopted?",
            answer: "2012"
        }
    },

    CULTURE: {
        50: {
            question: "What is the most spoken language in the Commonwealth?",
            answer: "English"
        },
        100: {
            question: "Who was the most famous person in Great Britain?",
            answer: "Queen Elizabeth II"
        },
        200: {
            question: "What is the most emblematic food of Samoa?",
            answer: "Palusami"
        },
        300: {
            question: "Who leads the Commonwealth?",
            answer: "King Charles III"
        },
        500: {
            question: "What is the slogan of the Commonwealth?",
            answer: "Opportunities together, for a prosperous Commonwealth"
        }
    },

    GEOGRAPHY: {
        50: {
            question: "How many states are in the Commonwealth?",
            answer: "56"
        },
        100: {
            question: "On how many continents is the Commonwealth located?",
            answer: "5 continents"
        },
        200: {
            question: "How many people are in the Commonwealth?",
            answer: "2.7 billion people"
        },
        300: {
            question: "What is the name of the Prime Minister of Samoa?",
            answer: "La'auli Leuatea Schmidt"
        },
        500: {
            question: "What is the smallest country in the Commonwealth by area?",
            answer: "Nauru"
        }
    }
};

/* ==========================================================
   ÉTAT DU JEU
   ========================================================== */
let score = 0;
let used = {};          // ex : used["HISTORY-100"] = true
let current = null;     // question en cours : { category, points }

/* ==========================================================
   OUTILS
   ========================================================== */
const $ = (id) => document.getElementById(id);

const screens = {
    start: $("start-screen"),
    board: $("board-screen"),
    question: $("question-screen"),
    gameover: $("gameover-screen")
};

function key(category, points) {
    return category + "-" + points;
}

// Une case est jouable seulement si la question ET la réponse sont remplies
function isAvailable(category, points) {
    const q = questions[category] && questions[category][points];
    return !!(q && q.question.trim() !== "" && q.answer.trim() !== "");
}

function totalQuestions() {
    let n = 0;
    CATEGORIES.forEach((c) => POINT_VALUES.forEach((p) => {
        if (isAvailable(c, p)) n++;
    }));
    return n;
}

function questionsLeft() {
    let n = 0;
    CATEGORIES.forEach((c) => POINT_VALUES.forEach((p) => {
        if (isAvailable(c, p) && !used[key(c, p)]) n++;
    }));
    return n;
}

function showScreen(name) {
    Object.keys(screens).forEach((k) => {
        screens[k].classList.toggle("active", k === name);
    });
    window.scrollTo(0, 0);
}

function updateHud() {
    const scoreEl = $("score");
    scoreEl.textContent = score;
    scoreEl.classList.toggle("negative", score < 0);
    $("questions-left").textContent = questionsLeft();
}

/* ==========================================================
   PLATEAU
   ========================================================== */
function buildBoard() {
    const board = $("board");
    board.innerHTML = "";

    // En-têtes de catégories
    CATEGORIES.forEach((cat) => {
        const h = document.createElement("div");
        h.className = "cat-header";
        h.textContent = cat;
        board.appendChild(h);
    });

    // Cases (ligne par ligne : 50, 100, 200, 300, 500)
    POINT_VALUES.forEach((points) => {
        CATEGORIES.forEach((cat) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cell";
            btn.dataset.category = cat;
            btn.dataset.points = points;

            if (!isAvailable(cat, points)) {
                // Case vide : pas encore de question
                btn.classList.add("empty");
                btn.disabled = true;
                btn.textContent = "—";
                btn.setAttribute("aria-label", cat + " " + points + " (no question yet)");
            } else if (used[key(cat, points)]) {
                btn.classList.add("used");
                btn.disabled = true;
                btn.textContent = points;
                btn.setAttribute("aria-label", cat + " " + points + " (already used)");
            } else {
                btn.textContent = points;
                btn.setAttribute("aria-label", cat + " " + points + " points");
                btn.addEventListener("click", () => openQuestion(cat, points, btn));
            }
            board.appendChild(btn);
        });
    });

    updateHud();
}

/* ==========================================================
   QUESTION
   ========================================================== */
function openQuestion(category, points, btn) {
    if (!isAvailable(category, points) || used[key(category, points)]) return;

    current = { category, points };
    const q = questions[category][points];

    $("q-category").textContent = category;
    $("q-points").textContent = points + " POINTS";
    // La RÉPONSE est montrée en premier : les joueurs doivent trouver la QUESTION
    $("clue-text").textContent = q.answer;
    $("question-text").textContent = q.question;

    $("question-box").classList.add("hidden");
    $("judge-buttons").classList.add("hidden");
    $("show-question-btn").classList.remove("hidden");

    // Petite animation de clic avant la transition
    if (btn) btn.classList.add("clicked");
    setTimeout(() => showScreen("question"), 180);
}

function showQuestion() {
    if (!current) return;
    $("show-question-btn").classList.add("hidden");
    $("question-box").classList.remove("hidden");
    $("judge-buttons").classList.remove("hidden");
}

function judge(isCorrect) {
    if (!current) return;

    const { category, points } = current;
    if (used[key(category, points)]) return; // sécurité anti double-clic

    score += isCorrect ? points : -points;
    used[key(category, points)] = true;
    current = null;

    buildBoard();

    if (questionsLeft() === 0) {
        endGame();
    } else {
        showScreen("board");
    }
}

/* ==========================================================
   FIN DE PARTIE / NOUVELLE PARTIE
   ========================================================== */
function endGame() {
    $("final-score").textContent = score;
    showScreen("gameover");
}

function resetGame() {
    score = 0;
    used = {};
    current = null;
    buildBoard();
}

function startGame() {
    resetGame();
    showScreen("board");
}

/* ==========================================================
   FENÊTRE HOW TO PLAY
   ========================================================== */
function openHowTo() {
    $("howto-modal").classList.add("open");
    $("howto-close").focus();
}

function closeHowTo() {
    $("howto-modal").classList.remove("open");
}

/* ==========================================================
   ÉVÉNEMENTS
   ========================================================== */
$("play-btn").addEventListener("click", startGame);
$("howto-btn").addEventListener("click", openHowTo);
$("howto-close").addEventListener("click", closeHowTo);
$("howto-modal").addEventListener("click", (e) => {
    if (e.target === $("howto-modal")) closeHowTo();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeHowTo();
});

$("show-question-btn").addEventListener("click", showQuestion);
$("correct-btn").addEventListener("click", () => judge(true));
$("wrong-btn").addEventListener("click", () => judge(false));
$("play-again-btn").addEventListener("click", startGame);

// Plateau prêt dès le chargement
buildBoard();
