export const ui = {
    // Main / quiz selection
    header: document.querySelector("header"), // ヘッダーを追加
    quizSelectionDiv: document.getElementById("quiz-selection"),
    mainSelectionDiv: document.getElementById("main-selection"),
    subSelectionDiv: document.getElementById("sub-quiz-selection"),
    difficultySelectionDiv: document.getElementById("difficulty-selection"),
    countSelectionDiv: document.getElementById("question-count-selection"),
    totalQuestionsDisplay: document.getElementById("total-questions-display"),
    placeSelectionDiv: document.getElementById("place-quiz-selection"),

    selectStreetBtn: document.getElementById("select-street"),
    selectCrossBtn: document.getElementById("select-cross"),
    selectCrossNameBtn: document.getElementById("select-cross-name"),
    selectCrossStreetBtn: document.getElementById("select-cross-street"),
    selectPlaceNameBtn: document.getElementById("select-place-name"),
    selectPlaceCityBtn: document.getElementById("select-place-city"),
    selectPlaceBtn: document.getElementById("select-place"),

    // Difficulty
    selectDiffBeginner: document.getElementById("select-diff-beginner"),
    selectDiffIntermediate: document.getElementById("select-diff-intermediate"),
    selectDiffAdvanced: document.getElementById("select-diff-advanced"),

    // Back buttons
    backToMainFromSubBtn: document.getElementById("back-to-main-from-sub"),
    backToMainFromQuizBtn: document.getElementById("back-to-main-from-quiz"),
    backToPrevFromDiffBtn: document.getElementById("back-to-prev-from-diff"),
    backToSubFromCountBtn: document.getElementById("back-to-sub-from-count"),
    backToMainFromPlaceBtn: document.getElementById("back-to-main-from-place"),

    // Question count
    selectCount3: document.getElementById("select-count-3"),
    selectCount5: document.getElementById("select-count-5"),
    selectCount10: document.getElementById("select-count-10"),
    selectCount15: document.getElementById("select-count-15"),
    selectCount20: document.getElementById("select-count-20"),
    selectCount30: document.getElementById("select-count-30"),

    // Quiz UI
    quizTitle: document.getElementById("quiz-title"),
    currentScoreSpan: document.getElementById("current-score"),
    totalQuestionsSpan: document.getElementById("total-questions"),
    resultDisplay: document.getElementById("result-display"),
    submitBtn: document.getElementById("submit"),
    reviewBtn: document.getElementById("review"),
    question: document.getElementById("question"),
    answer: document.getElementById("answer"),
    feedback: document.getElementById("feedback"),

    // Result overlay / modal
    quizResultOverlay: document.getElementById("quiz-result-overlay"),
    quizResultText: document.getElementById("quiz-result-text"),
    quizCorrectAnswer: document.getElementById("quiz-correct-answer"),
    resultsModal: document.getElementById("results-modal"),
    resultsList: document.getElementById("results-list"),

    // Search
    searchInput: document.getElementById("search-input"),
    searchSubmitBtn: document.getElementById("search-submit-btn"),
    searchResultsList: document.getElementById("search-results-list"),
};

export function setHidden(element, hidden) {
    if (!element) return;
    element.classList.toggle("hidden", hidden);
}

// 文字サイズ選択機能の初期化
export function initFontSizeSelector() {
    const fontBtns = document.querySelectorAll(".font-btn");

    // 保存済みのサイズを取得（初期値は medium）
    const savedSize = localStorage.getItem("user_font_size") || "medium";
    applyFontSize(savedSize);

    fontBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const size = btn.getAttribute("data-size");
            applyFontSize(size);
            localStorage.setItem("user_font_size", size);
        });
    });
}

function applyFontSize(size) {
    document.documentElement.classList.remove(
        "font-small",
        "font-medium",
        "font-large"
    );

    document.documentElement.classList.add(`font-${size}`);

    // ボタンの見た目（アクティブ状態）を更新
    const fontBtns = document.querySelectorAll(".font-btn");

    fontBtns.forEach(btn => {
        if (btn.getAttribute("data-size") === size) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}