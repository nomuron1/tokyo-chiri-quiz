import { state } from "./state.js";
import { map, defaultStreetStyle, placeBaseStyle} from "./map.js";

export async function loadInitialData() {
  const [streetResponse, crossResponse, placeResponse] = await Promise.all([
    fetch("street_ver2.geojson"),
    fetch("intersection_pro.geojson"),
    fetch("S_name.geojson"),
  ]);

  if (!streetResponse.ok) {
    throw new Error(`street_ver2.geojson の読み込みに失敗しました: ${streetResponse.status}`);
  }

  if (!crossResponse.ok) {
    throw new Error(
      `intersection_pro.geojson の読み込みに失敗しました: ${crossResponse.status}`
    );
  }

  if (!placeResponse.ok) {
    throw new Error(
      `S_name.geojson の読み込みに失敗しました: ${placeResponse.status}`
    );
  }

  const streetData = await streetResponse.json();
  const crossData = await crossResponse.json();
  const placeData = await placeResponse.json();
  
  state.geojsonLayer = L.geoJSON(streetData, {
    style: defaultStreetStyle,
    onEachFeature: (feature, layer) => {
      if (
        feature.properties?.rank &&
        [1, 2, 3, 4].includes(Number(feature.properties.rank))
      ) {
        state.streetQuestions.push(feature);
      }

      if (feature.properties?.name) {
        layer.bindPopup(feature.properties.name);
      }
    },
  }).addTo(map);

  state.crossQuestions = (crossData.features ?? []).filter(
    (feature) =>
      feature.properties &&
      feature.properties["交差点名"] &&
      feature.properties.rank
  );

  /*
        =========================
        地名クイズの問題を作成
        =========================
    */
  state.placeQuestions =(placeData.features ?? []).filter(
    feature => {
      const props =
        feature.properties || {};
      const rank =
        Number(props.rank);
        /* rank 1〜3のみrank 4は使用しない*/
      return (
        props.S_name2 && props.CITY_NAME && [1, 2, 3].includes(rank)
            );

      });

    /*=========================
      地名ポリゴン
      =========================*/

  state.placeLayer = L.geoJSON(
    placeData,{
      style:placeBaseStyle, interactive: false
    }
  ).addTo(map);

    /*最初は地名を背面へ*/
  state.placeLayer.bringToBack();
    console.log("通り:",
      state.streetQuestions.length
    );

    console.log("交差点:",
      state.crossQuestions.length
    );

    console.log("地名:",
      state.placeQuestions.length
    );

}
