import { state } from "./state.js";
import { ui, initFontSizeSelector } from "./ui.js";
import { loadInitialData } from "./data.js";
import {
    showMainSelection,
    showSubSelection,
    showPlaceSelection,
    showCountSelectionMenu,
    handleCountSelection,
    applyDifficultyFilterAndStart,
    submitCurrentAnswer,
    startWrongAnswerReview
} from "./quiz.js";
import { closeResultsModal } from "./results.js";
import { performSearch } from "./search.js";

/* =========================
   イベント
========================= */
function setupEventListeners() {
    /* 地名クイズ */
    ui.selectPlaceBtn?.addEventListener("click", showPlaceSelection);

    /* 地名 → 区・市 */
    ui.selectPlaceCityBtn?.addEventListener("click", () => {
        state.currentQuizType = "place_city";

        if (ui.quizTitle) {
            ui.quizTitle.textContent = "地名クイズ（地名 → 区・市）";
        }

        showCountSelectionMenu(state.placeQuestions);
    });

    /* 場所 → 地名 */
    ui.selectPlaceNameBtn?.addEventListener("click", () => {
        state.currentQuizType = "place_name";

        if (ui.quizTitle) {
            ui.quizTitle.textContent = "地名クイズ（場所 → 地名）";
        }

        showCountSelectionMenu(state.placeQuestions);
    });

    /* 地名 → メイン */
    ui.backToMainFromPlaceBtn?.addEventListener(
        "click",
        showMainSelection
    );

    /* =========================
       通り
    ========================= */
    ui.selectStreetBtn?.addEventListener("click", () => {
        state.currentQuizType = "street";

        if (ui.quizTitle) {
            ui.quizTitle.textContent = "通り名クイズ";
        }

        showCountSelectionMenu(state.streetQuestions);
    });

    /* =========================
       交差点
    ========================= */
    ui.selectCrossBtn?.addEventListener("click", showSubSelection);

    ui.selectCrossNameBtn?.addEventListener("click", () => {
        state.currentQuizType = "cross_name";

        if (ui.quizTitle) {
            ui.quizTitle.textContent = "交差点クイズ (位置から名称)";
        }

        showCountSelectionMenu(state.crossQuestions);
    });

    ui.selectCrossStreetBtn?.addEventListener("click", () => {
        state.currentQuizType = "cross_street";

        if (ui.quizTitle) {
            ui.quizTitle.textContent =
                "交差点クイズ (交差する通りから名称)";
        }

        showCountSelectionMenu(state.crossQuestions);
    });

    /* =========================
       難易度
    ========================= */
    ui.selectDiffBeginner?.addEventListener("click", () =>
        applyDifficultyFilterAndStart("beginner")
    );

    ui.selectDiffIntermediate?.addEventListener("click", () =>
        applyDifficultyFilterAndStart("intermediate")
    );

    ui.selectDiffAdvanced?.addEventListener("click", () =>
        applyDifficultyFilterAndStart("advanced")
    );

    /* =========================
       問題数画面から戻る
    ========================= */
    ui.backToSubFromCountBtn?.addEventListener("click", () => {
        if (state.currentQuizType === "street") {
            showMainSelection();
        } else if (
            state.currentQuizType === "place_city" ||
            state.currentQuizType === "place_name"
        ) {
            showPlaceSelection();
        } else {
            showSubSelection();
        }
    });

    /* =========================
       難易度から戻る
    ========================= */
    ui.backToPrevFromDiffBtn?.addEventListener("click", () => {
        ui.difficultySelectionDiv?.classList.add("hidden");
        ui.countSelectionDiv?.classList.remove("hidden");
    });

    /* =========================
       メインへ
    ========================= */
    ui.backToMainFromSubBtn?.addEventListener(
        "click",
        showMainSelection
    );

    ui.backToMainFromQuizBtn?.addEventListener(
        "click",
        showMainSelection
    );

    /* =========================
       問題数
    ========================= */
    ui.selectCount3?.addEventListener("click", () =>
        handleCountSelection(3)
    );

    ui.selectCount5?.addEventListener("click", () =>
        handleCountSelection(5)
    );

    ui.selectCount10?.addEventListener("click", () =>
        handleCountSelection(10)
    );

    ui.selectCount15?.addEventListener("click", () =>
        handleCountSelection(15)
    );

    ui.selectCount20?.addEventListener("click", () =>
        handleCountSelection(20)
    );

    ui.selectCount30?.addEventListener("click", () =>
        handleCountSelection(30)
    );

    /* =========================
       回答
    ========================= */
    ui.submitBtn?.addEventListener(
        "click",
        submitCurrentAnswer
    );

    ui.reviewBtn?.addEventListener(
        "click",
        startWrongAnswerReview
    );

    /* =========================
       検索
    ========================= */
    ui.searchSubmitBtn?.addEventListener(
        "click",
        performSearch
    );

    ui.searchInput?.addEventListener("keypress", event => {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    /* =========================
       結果モーダル
    ========================= */
    const closeResultsBtn = document.getElementById(
        "close-results-modal"
    );

    closeResultsBtn?.addEventListener("click", () => {
        closeResultsModal();
        showMainSelection();
    });
}

/* =========================
   初期化
========================= */
async function initializeApp() {
    try {
        initFontSizeSelector();
        setupEventListeners();

        await loadInitialData();

        console.log("東京地理クイズの初期化完了");
        console.log(
            "地名問題:",
            state.placeQuestions.length
        );
    } catch (error) {
        console.error(
            "アプリの初期化に失敗しました:",
            error
        );

        alert(
            "地図データの読み込みに失敗しました。ファイルパスとサーバー環境を確認してください。"
        );
    }
}

initializeApp();