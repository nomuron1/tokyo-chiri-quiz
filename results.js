import { state } from "./state.js";
import {
    map,
    defaultStreetStyle,
    streetQuizBaseStyle,
    setStreetLayerStyle,
    highlightPlace,
    setPlaceLayerStyle
} from "./map.js";
import { ui } from "./ui.js";
import {
    showIntersectionsOnStreet,
    clearSearchVisuals
} from "./search.js";

export function displayResult() {
    const percentage = state.totalQuestions > 0
        ? ((state.score / state.totalQuestions) * 100).toFixed(1)
        : 0;

    if (ui.resultDisplay) {
        ui.resultDisplay.textContent = `正答率: ${percentage}%`;
    }

    if (ui.submitBtn) {
        ui.submitBtn.disabled = true;
    }

    if (ui.reviewBtn) {
        ui.reviewBtn.disabled = state.wrongAnswers.length === 0;
    }
}

export function showResultsSummary() {
    if (!ui.resultsModal || !ui.resultsList) {
        return;
    }

    ui.resultsList.innerHTML = `
    
        <div class="survey-link">
        今後もっといいものにしていきたいので是非<a href="https://forms.gle/erpBoN5AV5N3tBS97" target="_blank" rel="noopener noreferrer">アンケート</a>へのご協力をお願いします！
        </div>

        <h2 class="results-header">
            結果発表: ${state.score} / ${state.totalQuestions} 問正解
        </h2>
    `;

    state.answerHistory.forEach((record, index) => {
        const item = document.createElement("div");
        item.className = "result-item";

        const leftDiv = document.createElement("div");

        if (record.isCorrect) {
            leftDiv.innerHTML = `
                <div class="result-correct-title">
                    〇 第${index + 1}問
                </div>
                <div class="result-correct-text">
                    正解: <b>${escapeHtml(record.correctAnswer)}</b>
                </div>
            `;
        } else {
            leftDiv.innerHTML = `
                <div class="result-wrong-title">
                    × 第${index + 1}問
                </div>
                <div class="result-wrong-answer">
                    あなたの回答:
                    ${escapeHtml(record.userAnswer)}
                </div>
                <div class="result-wrong-correct">
                    正解:
                    ${escapeHtml(record.correctAnswer)}
                </div>
            `;
        }

        item.appendChild(leftDiv);

        if (!record.isCorrect) {
            const rightDiv = document.createElement("div");
            const reviewMapBtn = document.createElement("button");

            reviewMapBtn.textContent = "地図で確認";
            reviewMapBtn.className = "review-map-btn";

            reviewMapBtn.addEventListener("click", () =>
                reviewSpecificQuestion(index)
            );

            rightDiv.appendChild(reviewMapBtn);
            item.appendChild(rightDiv);
        }

        ui.resultsList.appendChild(item);
    });

    ui.resultsModal.classList.remove("hidden");
}

export function reviewSpecificQuestion(index) {
    const record = state.answerHistory[index];

    if (!record) return;

    ui.resultsModal?.classList.add("hidden");

    clearSearchVisuals();

    /* =========================
       通り
    ========================= */
    if (record.type === "street") {
        setStreetLayerStyle(streetQuizBaseStyle);

        state.geojsonLayer?.eachLayer(layer => {
            if (layer.feature === record.feature) {
                state.searchHighlightedLayer = layer;

                layer.setStyle({
                    color: "orange",
                    weight: 6,
                    interactive: true
                });

                map.fitBounds(layer.getBounds(), {
                    maxZoom: 16
                });

                layer.bindPopup(
                    escapeHtml(record.correctAnswer)
                ).openPopup();

                showIntersectionsOnStreet(record.correctAnswer);
            }
        });
    }

    /* =========================
       地名
    ========================= */
    else if (
        record.type === "place_city" ||
        record.type === "place_name"
    ) {
        setStreetLayerStyle(defaultStreetStyle);

        setPlaceLayerStyle({
            color: "#777",
            weight: 1,
            opacity: 0.35,
            fillColor: "#cccccc",
            fillOpacity: 0.08,
            interactive: false
        });

        highlightPlace(record.feature);
    }

    /* =========================
       交差点
    ========================= */
    else {
        setStreetLayerStyle(defaultStreetStyle);

        const coordinates =
            record.feature?.geometry?.coordinates;

        if (!Array.isArray(coordinates)) {
            return;
        }

        const props = record.feature.properties || {};

        const s1 =
            props.Street1 ||
            props.street1 ||
            "不明";

        const s2 =
            props.Street2 ||
            props.street2 ||
            "不明";

        const marker = L.marker([
            coordinates[1],
            coordinates[0]
        ])
            .addTo(map)
            .bindPopup(`
                <b>${escapeHtml(record.correctAnswer)}</b>
                <br>
                <small>
                    交差:
                    ${escapeHtml(String(s1))}
                    ×
                    ${escapeHtml(String(s2))}
                </small>
            `)
            .openPopup();

        state.searchMarkers.push(marker);

        map.setView(
            [coordinates[1], coordinates[0]],
            16
        );
    }

    if (ui.question) {
        ui.question.innerHTML = `
            <div class="review-mode-user">
                あなたの回答:
                ${escapeHtml(record.userAnswer)}
            </div>
            <div class="review-mode-correct">
                <b>
                    正解:
                    ${escapeHtml(record.correctAnswer)}
                </b>
            </div>
        `;
    }

    ui.answer?.classList.add("hidden");
    ui.submitBtn?.classList.add("hidden");

    let backBtn = document.getElementById(
        "back-to-results-btn"
    );

    if (!backBtn) {
        backBtn = document.createElement("button");

        backBtn.id = "back-to-results-btn";
        backBtn.textContent = "結果一覧に戻る";
        backBtn.className = "back-to-results-btn";

        backBtn.addEventListener("click", () => {
            ui.resultsModal?.classList.remove("hidden");
            backBtn.style.display = "none";
        });

        ui.question?.parentElement?.appendChild(backBtn);
    }

    backBtn.style.display = "inline-block";
}

export function closeResultsModal() {
    ui.resultsModal?.classList.add("hidden");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}