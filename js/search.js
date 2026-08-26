import { state } from "./state.js";
import {
    map,
    defaultStreetStyle,
    streetQuizBaseStyle,
    placeBaseStyle,
    setStreetLayerStyle,
    highlightPlace,
    setPlaceLayerStyle
} from "./map.js";
import { ui } from "./ui.js";
import {
    getStreetName,
    getCrossName,
    getPlaceName,
    getCityName
} from "./quizUtils.js";

function getStreet1(props) {
    return String(props?.Street1 || props?.street1 || "");
}

function getStreet2(props) {
    return String(props?.Street2 || props?.street2 || "");
}

/* =========================
   検索
========================= */
export function performSearch() {
    const query = ui.searchInput?.value.trim() ?? "";

    if (ui.searchResultsList) {
        ui.searchResultsList.innerHTML = "";
    }

    if (!query) {
        ui.searchResultsList?.classList.add("hidden");
        return;
    }

    const results = [];

    /* =========================
       通り
    ========================= */
    state.streetQuestions.forEach(feature => {
        const name = getStreetName(feature);

        if (name && name.includes(query)) {
            const relatedCross = state.crossQuestions
                .filter(cross => {
                    const props = cross.properties || {};
                    const s1 = getStreet1(props);
                    const s2 = getStreet2(props);

                    return s1.includes(name) || s2.includes(name);
                })
                .map(cross => getCrossName(cross))
                .filter(Boolean)
                .slice(0, 3);

            results.push({
                type: "street",
                name,
                feature,
                crossings: relatedCross
            });
        }
    });

    /* =========================
       交差点
    ========================= */
    state.crossQuestions.forEach(feature => {
        const name = getCrossName(feature);

        if (name && name.includes(query)) {
            results.push({
                type: "cross",
                name,
                feature
            });
        }
    });

    /* =========================
       地名
    ========================= */
    state.placeQuestions.forEach(feature => {
        const name = getPlaceName(feature);
        const city = getCityName(feature);

        if (
            (name && name.includes(query)) ||
            (city && city.includes(query))
        ) {
            /*
                同じ地名が複数のポリゴンに
                分かれていても、
                検索結果は重複させない。
            */
            const alreadyExists = results.some(
                result =>
                    result.type === "place" &&
                    result.name === name
            );

            if (!alreadyExists) {
                results.push({
                    type: "place",
                    name,
                    city,
                    feature
                });
            }
        }
    });

    /* =========================
       該当なし
    ========================= */
    if (results.length === 0) {
        if (ui.searchResultsList) {
            ui.searchResultsList.innerHTML =
                '<div class="search-item" style="color:#888;cursor:default;">該当なし</div>';

            ui.searchResultsList.classList.remove("hidden");
        }

        return;
    }

    /* =========================
       結果表示
    ========================= */
    results.forEach(result => {
        const div = document.createElement("div");
        div.className = "search-item";

        let label;

        if (result.type === "street") {
            label = "道路";
        } else if (result.type === "cross") {
            label = "交差点";
        } else {
            label = "地名";
        }

        let html =
            `<div>[${label}] <b>${escapeHtml(result.name)}</b></div>`;

        /* 通り */
        if (result.crossings && result.crossings.length) {
            html += `
                <div style="font-size:0.8em;color:#555;">
                    主要交差点:
                    ${result.crossings.map(escapeHtml).join(", ")}
                </div>`;
        }

        /* 地名 */
        if (result.type === "place") {
            html += `
                <div style="font-size:0.8em;color:#555;">
                    ${escapeHtml(result.city || "")}
                </div>`;
        }

        div.innerHTML = html;

        div.addEventListener("click", event =>
            showSearchResultOnMap(result, event)
        );

        ui.searchResultsList?.appendChild(div);
    });

    ui.searchResultsList?.classList.remove("hidden");
}

/* =========================
   通りの交差点表示
========================= */
export function showIntersectionsOnStreet(streetName) {
    clearSearchMarkers();

    const foundIntersections = state.crossQuestions.filter(cross => {
        const props = cross.properties || {};
        const s1 = getStreet1(props);
        const s2 = getStreet2(props);

        return (
            s1.includes(streetName) ||
            s2.includes(streetName)
        );
    });

    foundIntersections.forEach(cross => {
        const coordinates = cross.geometry?.coordinates;

        if (!Array.isArray(coordinates)) {
            return;
        }

        const props = cross.properties || {};
        const s1 =
            props.Street1 ||
            props.street1 ||
            "不明";

        const s2 =
            props.Street2 ||
            props.street2 ||
            "不明";

        const marker = L.marker(
            [coordinates[1], coordinates[0]],
            {
                icon: L.divIcon({
                    className: "cross-icon",
                    html: '<div style="font-size:20px;">📌</div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 20]
                })
            }
        )
            .addTo(map)
            .bindPopup(`
                <h2>
                    ${escapeHtml(
                        getCrossName(cross) || "交差点"
                    )}
                </h2>
                <br>
                交差道路:
                ${escapeHtml(String(s1))}
                ×
                ${escapeHtml(String(s2))}
            `);

        state.searchMarkers.push(marker);
    });
}

/* =========================
   検索結果を地図表示
========================= */
export function showSearchResultOnMap(result, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    ui.quizSelectionDiv?.classList.add("hidden");
    ui.searchResultsList?.classList.add("hidden");

    clearSearchVisuals();

    if (ui.quizTitle) {
        ui.quizTitle.textContent = result.name;
    }

    ui.answer?.classList.add("hidden");
    ui.submitBtn?.classList.add("hidden");
    ui.reviewBtn?.classList.add("hidden");

    ui.currentScoreSpan?.parentElement?.classList.add("hidden");

    /* =========================
       通り
    ========================= */
    if (result.type === "street") {
        if (ui.question) {
            const relatedCross = state.crossQuestions
                .filter(cross => {
                    const props = cross.properties || {};
                    const s1 = getStreet1(props);
                    const s2 = getStreet2(props);

                    return (
                        s1.includes(result.name) ||
                        s2.includes(result.name)
                    );
                })
                .map(cross => getCrossName(cross))
                .filter(Boolean);

            const crossText = relatedCross.length
                ? `<br><small>
                    主要交差点:
                    ${relatedCross
                        .slice(0, 5)
                        .map(escapeHtml)
                        .join(", ")}
                   </small>`
                : "";

            ui.question.innerHTML = `
                <b>${escapeHtml(result.name)}</b>
                の情報です。
                ${crossText}`;
        }

        setStreetLayerStyle(streetQuizBaseStyle);

        state.geojsonLayer?.eachLayer(layer => {
            if (layer.feature === result.feature) {
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
                    escapeHtml(result.name)
                ).openPopup();

                showIntersectionsOnStreet(result.name);
            }
        });
    }

    /* =========================
       交差点
    ========================= */
    else if (result.type === "cross") {
        setStreetLayerStyle(defaultStreetStyle);

        const coordinates =
            result.feature?.geometry?.coordinates;

        if (Array.isArray(coordinates)) {
            const props =
                result.feature.properties || {};

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
                    <b>${escapeHtml(result.name)}</b>
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
    }

    /* =========================
       地名
    ========================= */
    else if (result.type === "place") {
        setStreetLayerStyle(defaultStreetStyle);
        setPlaceLayerStyle(placeBaseStyle);

        highlightPlace(result.feature);

        if (ui.question) {
            ui.question.innerHTML = `
                <b>${escapeHtml(result.name)}</b>
                <br>
                <small>
                    ${escapeHtml(result.city || "")}
                </small>`;
        }
    }
}

/* =========================
   検索表示をクリア
========================= */
export function clearSearchVisuals() {
    if (
        state.searchHighlightedLayer &&
        state.geojsonLayer
    ) {
        state.geojsonLayer.resetStyle(
            state.searchHighlightedLayer
        );

        state.searchHighlightedLayer = null;
    }

    clearSearchMarkers();
}

/* マーカー削除 */
function clearSearchMarkers() {
    state.searchMarkers.forEach(marker =>
        map.removeLayer(marker)
    );

    state.searchMarkers = [];
}

/* HTMLエスケープ */
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}