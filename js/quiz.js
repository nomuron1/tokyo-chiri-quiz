import { state } from "./state.js";
import { ui, setHidden } from "./ui.js";
import {
    map,
    useDefaultTileLayer,
    usePlaceTileLayer,
    defaultStreetStyle,
    streetQuizBaseStyle,
    placeBaseStyle,
    clearQuizMarkers,
    resetCurrentHighlight,
    setStreetLayerStyle,
    setPlaceLayerStyle,
    highlightPlace,
    resetPlaceHighlight
} from "./map.js";
import {
    getStreetName,
    getCrossName,
    getPlaceName,
    getCityName,
    generateOptions,
    generatePlaceCityOptions,
    generatePlaceNameOptions,
    shuffleArray
} from "./quizUtils.js";
import { clearSearchVisuals } from "./search.js";
import { showResultsSummary, displayResult } from "./results.js";

/* =========================
   状態リセット
========================= */
export function resetQuizState() {
    state.score = 0;
    state.totalQuestions = 0;
    state.wrongAnswers = [];
    state.answerHistory = [];
    state.currentQuestions = [];
    state.currentQuizType = null;
    state.currentDifficulty = null;
    state.currentQuestion = null;
    state.selectedQuizInitialData = null;
    state.filteredQuestionsByDiff = [];

    if (ui.currentScoreSpan) ui.currentScoreSpan.textContent = "0";
    if (ui.totalQuestionsSpan) ui.totalQuestionsSpan.textContent = "0";
    if (ui.resultDisplay) ui.resultDisplay.textContent = "";
    if (ui.feedback) ui.feedback.textContent = "";
    if (ui.question) ui.question.textContent = "";

    if (ui.answer) {
        ui.answer.innerHTML = '<option value="">選択してください</option>';
        ui.answer.classList.remove("hidden");
    }

    if (ui.submitBtn) {
        ui.submitBtn.classList.remove("hidden");
        ui.submitBtn.disabled = true;
    }

    if (ui.reviewBtn) {
        ui.reviewBtn.classList.remove("hidden");
        ui.reviewBtn.disabled = true;
    }

    ui.currentScoreSpan?.parentElement?.classList.remove("hidden");
    resetPlaceHighlight();
    clearSearchVisuals();
}

/* =========================
   メイン画面
========================= */
export function showMainSelection() {
  useDefaultTileLayer();  
  resetQuizState();

  ui.quizSelectionDiv?.classList.remove("hidden");
  ui.mainSelectionDiv?.classList.remove("hidden");
  ui.subSelectionDiv?.classList.add("hidden");
  ui.placeSelectionDiv?.classList.add("hidden");
  ui.difficultySelectionDiv?.classList.add("hidden");
  ui.countSelectionDiv?.classList.add("hidden");

  if (ui.searchInput) ui.searchInput.value = "";

  if (ui.searchResultsList) {
      ui.searchResultsList.innerHTML = "";
      ui.searchResultsList.classList.add("hidden");
  }

  ui.resultsModal?.classList.add("hidden");

  setHidden(ui.header, false); // ヘッダーを表示
  document.body.classList.remove("header-hidden");
}

/* =========================
   交差点選択
========================= */
export function showSubSelection() {
  hideHeader();
  ui.mainSelectionDiv?.classList.add("hidden");
  ui.placeSelectionDiv?.classList.add("hidden");
  ui.subSelectionDiv?.classList.remove("hidden");
  ui.difficultySelectionDiv?.classList.add("hidden");
  ui.countSelectionDiv?.classList.add("hidden");
}

/* =========================
   地名選択
========================= */
export function showPlaceSelection() {
  hideHeader();
  ui.mainSelectionDiv?.classList.add("hidden");
  ui.subSelectionDiv?.classList.add("hidden");
  ui.placeSelectionDiv?.classList.remove("hidden");
  ui.difficultySelectionDiv?.classList.add("hidden");
  ui.countSelectionDiv?.classList.add("hidden");
}

/* =========================
   問題数選択
========================= */
export function showCountSelectionMenu(initialData) {
    state.selectedQuizInitialData = initialData;

    hideHeader();
    ui.mainSelectionDiv?.classList.add("hidden");
    ui.subSelectionDiv?.classList.add("hidden");
    ui.placeSelectionDiv?.classList.add("hidden");
    ui.difficultySelectionDiv?.classList.add("hidden");
    ui.countSelectionDiv?.classList.remove("hidden");

    const count = initialData.length;

    if (ui.selectCount3) ui.selectCount3.disabled = count < 3;
    if (ui.selectCount5) ui.selectCount5.disabled = count < 5;
    if (ui.selectCount10) ui.selectCount10.disabled = count < 10;
    if (ui.selectCount15) ui.selectCount15.disabled = count < 15;
    if (ui.selectCount20) ui.selectCount20.disabled = count < 20;
    if (ui.selectCount30) ui.selectCount30.disabled = count < 30;
}

/* =========================
   問題数決定
========================= */
export function handleCountSelection(count) {
    state.selectedQuestionCount = count;
    ui.countSelectionDiv?.classList.add("hidden");
    ui.difficultySelectionDiv?.classList.remove("hidden");
}

/* =========================
   難易度
========================= */
export function applyDifficultyFilterAndStart(difficulty) {
    state.currentDifficulty = difficulty;
    let allowedRanks = [];

    /* 地名クイズ */
    if (state.currentQuizType === "place_city" || state.currentQuizType === "place_name") {
        if (difficulty === "beginner") allowedRanks = [1];
        else if (difficulty === "intermediate") allowedRanks = [2];
        else if (difficulty === "advanced") allowedRanks = [3];
    }

    /* 交差点 */
    else if (state.currentQuizType === "cross_name") {
        if (difficulty === "beginner") allowedRanks = [1, 7];
        else if (difficulty === "intermediate") allowedRanks = [1, 2, 5, 7];
        else if (difficulty === "advanced") allowedRanks = [2, 3, 6, 8];
    }

    else if (state.currentQuizType === "cross_street") {
        if (difficulty === "beginner") allowedRanks = [1];
        else if (difficulty === "intermediate") allowedRanks = [2];
        else if (difficulty === "advanced") allowedRanks = [3, 4];
    }

    /* 通り */
    else {
        if (difficulty === "beginner") allowedRanks = [1];
        else if (difficulty === "intermediate") allowedRanks = [1, 2];
        else if (difficulty === "advanced") allowedRanks = [2, 3];
    }

    state.filteredQuestionsByDiff = state.selectedQuizInitialData.filter(feature => {
        if (!feature.properties) return false;

        let targetRank = feature.properties.rank;

        /* 交差点→通り */
        if (
            state.currentQuizType === "cross_street" &&
            feature.properties.rank_street !== undefined
        ) {
            targetRank = feature.properties.rank_street;
        }

        if (targetRank === undefined || targetRank === null) return false;
        return allowedRanks.includes(Number(targetRank));
    });

    if (state.filteredQuestionsByDiff.length === 0) {
        alert("該当する難易度の問題が見つかりませんでした。");
        return;
    }

    let finalCount = state.selectedQuestionCount;

    if (state.filteredQuestionsByDiff.length < state.selectedQuestionCount) {
        alert(
            `選択された難易度の問題が ${state.filteredQuestionsByDiff.length} 問しかないため、出題数を自動調整して開始します。`
        );
        finalCount = state.filteredQuestionsByDiff.length;
    }

    ui.difficultySelectionDiv?.classList.add("hidden");
    startQuiz(state.filteredQuestionsByDiff, finalCount);
}

if (
    state.currentQuizType === "place_city" ||
    state.currentQuizType === "place_name"
) {
    usePlaceTileLayer();
} else {
    useDefaultTileLayer();
}

/* =========================
   クイズ開始
========================= */
export function startQuiz(questionsToUse, count) {
    clearSearchVisuals();
    resetPlaceHighlight();

    /* 通りクイズ */
    if (state.currentQuizType === "street") {
        setStreetLayerStyle(streetQuizBaseStyle);
    } else {
        setStreetLayerStyle(defaultStreetStyle);
    }

    /* 地名レイヤー */
    if (
        state.currentQuizType === "place_city" ||
        state.currentQuizType === "place_name"
    ) {
        usePlaceTileLayer();
    } else {
        useDefaultTileLayer();
    }

    state.score = 0;
    state.wrongAnswers = [];

    const questionCount = count === "all" ? questionsToUse.length : count;
    state.totalQuestions = questionCount;

    const shuffled = [...questionsToUse];
    shuffleArray(shuffled);
    state.currentQuestions = shuffled.slice(0, questionCount);

    ui.quizSelectionDiv?.classList.add("hidden");

    if (ui.currentScoreSpan) ui.currentScoreSpan.textContent = "0";
    if (ui.totalQuestionsSpan) ui.totalQuestionsSpan.textContent = String(state.totalQuestions);
    if (ui.resultDisplay) ui.resultDisplay.textContent = "";
    if (ui.feedback) ui.feedback.textContent = "";

    if (ui.answer) ui.answer.classList.remove("hidden");

    if (ui.submitBtn) {
        ui.submitBtn.classList.remove("hidden");
        ui.submitBtn.disabled = false;
    }

    if (ui.reviewBtn) {
        ui.reviewBtn.classList.remove("hidden");
        ui.reviewBtn.disabled = true;
    }

    displayResult();
    nextQuestion();
}

function hideHeader() {
    setHidden(ui.header, true); // ヘッダーを非表示
    document.body.classList.add("header-hidden");
}

/* =========================
   次の問題
========================= */
export function nextQuestion() {
    resetCurrentHighlight();
    resetPlaceHighlight();
    clearQuizMarkers();

    if (!state.currentQuestions.length) {
        if (ui.question) ui.question.textContent = "クイズ終了！";
        displayResult();
        showResultsSummary();
        return;
    }

    if (ui.submitBtn) ui.submitBtn.disabled = false;

    state.currentQuestion = state.currentQuestions.pop();

    const questionNumber =
        state.totalQuestions - state.currentQuestions.length;

    let questionText = `第${questionNumber}問：`;

    /* =========================
       通り
    ========================= */
    if (state.currentQuizType === "street") {
        questionText += "この通りはどこ？";

        state.geojsonLayer?.eachLayer(layer => {
            if (layer.feature === state.currentQuestion) {
                state.currentHighlightedLayer = layer;

                layer.setStyle({
                    color: "red",
                    weight: 6,
                    interactive: false
                });

                map.fitBounds(layer.getBounds(), {
                    maxZoom: 16
                });
            }
        });
    }

    /* =========================
       交差点 → 名前
    ========================= */
    else if (state.currentQuizType === "cross_name") {
        questionText += "この交差点はどこ？";

        const coordinates = state.currentQuestion.geometry.coordinates;

        L.marker(
            [coordinates[1], coordinates[0]],
            { isQuizMarker: true }
        ).addTo(map);

        map.setView(
            [coordinates[1], coordinates[0]],
            16
        );
    }

    /* =========================
       交差点 → 通りから名前
    ========================= */
    else if (state.currentQuizType === "cross_street") {
        const props = state.currentQuestion.properties || {};

        const rawStreets = [
            props.Street1 || props.street1,
            props.Street2 || props.street2,
            props.Street3 || props.street3
        ];

        const streets = rawStreets.filter(
            street => street && String(street).trim() !== ""
        );

        if (streets.length > 0) {
            questionText += `「${streets.join("」と「")}」の交差点名は？`;
        } else {
            questionText += "この交差点名は？";
        }

        const coordinates = state.currentQuestion.geometry.coordinates;
        map.setView(
            [coordinates[1], coordinates[0]],
            16
        );
    }

    /* =========================
       地名 → 区・市
    ========================= */
    else if (state.currentQuizType === "place_city") {
        const name = getPlaceName(state.currentQuestion);
        questionText += `「${name}」は何区・市？`;
        highlightPlace(state.currentQuestion);
    }

    /* =========================
       場所 → 地名
    ========================= */
    else if (state.currentQuizType === "place_name") {
        questionText += "この場所の地名は？";
        highlightPlace(state.currentQuestion);
    }

    if (ui.question) {
        ui.question.textContent = questionText;
    }

    /* =========================
       選択肢
    ========================= */
    let options = [];

    if (state.currentQuizType === "street") {
        options = generateOptions(
            state.currentQuestion,
            state.streetQuestions,
            "street"
        );
    }

    else if (
        state.currentQuizType === "cross_name" ||
        state.currentQuizType === "cross_street"
    ) {
        options = generateOptions(
            state.currentQuestion,
            state.crossQuestions,
            "cross"
        );
    }

    else if (state.currentQuizType === "place_city") {
        options = generatePlaceCityOptions(
            state.currentQuestion,
            state.placeQuestions
        );
    }

    else if (state.currentQuizType === "place_name") {
        options = generatePlaceNameOptions(
            state.currentQuestion,
            state.placeQuestions
        );
    }

    if (ui.answer) {
        ui.answer.innerHTML = '<option value="">選択してください</option>';

        options.forEach(optionText => {
            const option = document.createElement("option");
            option.value = optionText;
            option.textContent = optionText;
            ui.answer.appendChild(option);
        });
    }
}

/* =========================
   回答
========================= */
export function submitCurrentAnswer() {
    if (!ui.answer || !ui.answer.value || !state.currentQuestion) {
        return;
    }

    if (ui.submitBtn) ui.submitBtn.disabled = true;

    const answer = ui.answer.value;
    let correct;

    /* 正解を取得 */
    if (state.currentQuizType === "street") {
        correct = getStreetName(state.currentQuestion);
    }

    else if (state.currentQuizType === "place_city") {
        correct = getCityName(state.currentQuestion);
    }

    else if (state.currentQuizType === "place_name") {
        correct = getPlaceName(state.currentQuestion);
    }

    else {
        correct = getCrossName(state.currentQuestion);
    }

    const isCorrect = answer === correct;

    const record = {
        feature: state.currentQuestion,
        type: state.currentQuizType,
        userAnswer: answer,
        correctAnswer: correct,
        isCorrect
    };

    state.answerHistory.push(record);

    if (isCorrect) {
        state.score++;

        if (ui.quizResultText) {
            ui.quizResultText.textContent = "〇 正解！";
            ui.quizResultText.style.color = "red";
        }

        if (ui.quizCorrectAnswer) {
            ui.quizCorrectAnswer.textContent = "";
        }
    }

    else {
        state.wrongAnswers.push(record);

        if (ui.quizResultText) {
            ui.quizResultText.textContent = "× 不正解…";
            ui.quizResultText.style.color = "blue";
        }

        if (ui.quizCorrectAnswer) {
            ui.quizCorrectAnswer.textContent = `正解: ${correct}`;
        }
    }

    ui.quizResultOverlay?.classList.remove("hidden");

    if (ui.currentScoreSpan) {
        ui.currentScoreSpan.textContent = String(state.score);
    }

    setTimeout(() => {
        ui.quizResultOverlay?.classList.add("hidden");
        nextQuestion();
    }, 1500);
}

/* =========================
   間違い復習
========================= */
export function startWrongAnswerReview() {
    if (!state.wrongAnswers.length) return;

    const reviewSet = state.wrongAnswers.map(record => record.feature);
    const type = state.wrongAnswers[0]?.type;

    state.currentQuizType = type;

    if (
        ui.quizTitle &&
        !ui.quizTitle.textContent.includes("(復習)")
    ) {
        ui.quizTitle.textContent += " (復習)";
    }

    startQuiz(reviewSet, "all");
}