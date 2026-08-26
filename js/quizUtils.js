export function getStreetName(feature) {
    return feature?.properties?.name;
}

export function getCrossName(feature) {
    return feature?.properties?.["交差点名"];
}

/* =========================
   地名
========================= */

export function getPlaceName(feature) {
    return feature?.properties?.S_name2;
}

export function getCityName(feature) {
    return feature?.properties?.CITY_NAME;
}

/* =========================
   代表地点
========================= */

export function getFeaturePoint(feature) {
    const coordinates = feature?.geometry?.coordinates;

    if (!Array.isArray(coordinates)) {
        return null;
    }

    if (feature.geometry.type === "Point") {
        return [coordinates[1], coordinates[0]];
    }

    if (
        (feature.geometry.type === "LineString" ||
        feature.geometry.type === "MultiPoint") &&
        Array.isArray(coordinates[0])
    ) {
        return [coordinates[0][1], coordinates[0][0]];
    }

    /* Polygon / MultiPolygon の場合は座標の平均から代表点を作る */
    const flat = flattenCoordinates(coordinates);

    if (flat.length === 0) {
        return null;
    }

    let lon = 0;
    let lat = 0;

    flat.forEach(coordinate => {
        lon += Number(coordinate[0]);
        lat += Number(coordinate[1]);
    });

    return [
        lat / flat.length,
        lon / flat.length
    ];
}

function flattenCoordinates(coordinates) {
    if (!Array.isArray(coordinates)) {
        return [];
    }

    if (
        coordinates.length >= 2 &&
        typeof coordinates[0] === "number"
    ) {
        return [coordinates];
    }

    return coordinates.flatMap(flattenCoordinates);
}

export function getFeatureRepresentativePoint(feature) {
    return getFeaturePoint(feature);
}

/* =========================
   距離
========================= */

export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(deltaPhi / 2) ** 2 +
        Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
}

/* =========================
   シャッフル
========================= */

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

/* =========================
   通り・交差点の選択肢
========================= */

export function generateOptions(
    correctFeature,
    allFeatures,
    type
) {
    const getName =
        type === "street"
            ? getStreetName
            : getCrossName;

    const correctName = getName(correctFeature);

    if (!correctName) {
        return [];
    }

    const correctPoint =
        getFeatureRepresentativePoint(correctFeature);

    if (!correctPoint) {
        return fallbackOptions(
            correctName,
            allFeatures,
            getName
        );
    }

    const [cLat, cLon] = correctPoint;

    const featuresWithDist = allFeatures
        .map(feature => {
            const point =
                getFeatureRepresentativePoint(feature);

            if (!point) {
                return null;
            }

            const [lat, lon] = point;

            return {
                name: getName(feature),
                dist: getDistance(
                    cLat,
                    cLon,
                    lat,
                    lon
                )
            };
        })
        .filter(Boolean)
        .filter(item =>
            item.name &&
            item.name !== correctName
        )
        .sort((a, b) => a.dist - b.dist);

    const candidates = featuresWithDist.slice(0, 7);
    const names = [correctName];

    while (
        names.length < 4 &&
        candidates.length > 0
    ) {
        const randomIndex = Math.floor(
            Math.random() * candidates.length
        );

        const selected =
            candidates.splice(randomIndex, 1)[0];

        if (
            selected?.name &&
            !names.includes(selected.name)
        ) {
            names.push(selected.name);
        }
    }

    if (names.length < 4) {
        for (const feature of allFeatures) {
            const name = getName(feature);

            if (name && !names.includes(name)) {
                names.push(name);
            }

            if (names.length >= 4) {
                break;
            }
        }
    }

    return shuffleArray(names);
}

/* =========================
   地名 → 区・市
   距離は使用しない。
   区・市をランダムに選択。
========================= */

export function generatePlaceCityOptions(
    correctFeature,
    allFeatures
) {
    const correctCity = getCityName(correctFeature);

    if (!correctCity) {
        return [];
    }

    /* 区・市を重複なしで取得 */
    const cities = [
        ...new Set(
            allFeatures
                .map(feature => getCityName(feature))
                .filter(Boolean)
        )
    ];

    const wrongCities = cities.filter(
        city => city !== correctCity
    );

    shuffleArray(wrongCities);

    const options = [
        correctCity,
        ...wrongCities.slice(0, 3)
    ];

    return shuffleArray(options);
}

/* =========================
   場所 → 地名
   地理的に近い地名を3つ選択。
========================= */

export function generatePlaceNameOptions(
    correctFeature,
    allFeatures
) {
    const correctName = getPlaceName(correctFeature);
    const correctPoint =
        getFeatureRepresentativePoint(correctFeature);

    if (!correctName || !correctPoint) {
        return [];
    }

    const [cLat, cLon] = correctPoint;

    const candidates = allFeatures
        .filter(feature => {
            const name = getPlaceName(feature);

            return (
                name &&
                name !== correctName
            );
        })
        .map(feature => {
            const point =
                getFeatureRepresentativePoint(feature);

            if (!point) {
                return null;
            }

            const [lat, lon] = point;

            return {
                feature,
                name: getPlaceName(feature),
                distance: getDistance(
                    cLat,
                    cLon,
                    lat,
                    lon
                )
            };
        })
        .filter(Boolean)
        .sort((a, b) =>
            a.distance - b.distance
        );

    /* 同じ地名を重複させない */
    const usedNames = new Set([correctName]);
    const wrongNames = [];

    for (const candidate of candidates) {
        if (usedNames.has(candidate.name)) {
            continue;
        }

        usedNames.add(candidate.name);
        wrongNames.push(candidate.name);

        if (wrongNames.length >= 3) {
            break;
        }
    }

    /* 近い地名だけで4択を作れない場合の補完 */
    if (wrongNames.length < 3) {
        const allNames = [
            ...new Set(
                allFeatures
                    .map(feature =>
                        getPlaceName(feature)
                    )
                    .filter(Boolean)
            )
        ];

        shuffleArray(allNames);

        for (const name of allNames) {
            if (!usedNames.has(name)) {
                usedNames.add(name);
                wrongNames.push(name);
            }

            if (wrongNames.length >= 3) {
                break;
            }
        }
    }

    return shuffleArray([
        correctName,
        ...wrongNames
    ]);
}

function fallbackOptions(
    correctName,
    allFeatures,
    getName
) {
    const names = [correctName];

    const candidates = allFeatures
        .map(getName)
        .filter(
            name =>
                name &&
                name !== correctName
        );

    shuffleArray(candidates);

    for (const name of candidates) {
        if (!names.includes(name)) {
            names.push(name);
        }

        if (names.length >= 4) {
            break;
        }
    }

    return shuffleArray(names);
}