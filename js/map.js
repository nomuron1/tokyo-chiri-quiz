import { state } from "./state.js";

export const map = L.map("map").setView([35.68, 139.76], 13);

export const defaultTileLayer = L.tileLayer(
  "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',}
);

export const placeTileLayer = L.tileLayer(
    "https://tile.mierune.co.jp/mierune/{z}/{x}/{y}.png",
    {
        attribution:
        '<a href="https://mierune.co.jp">MIERUNE Inc.</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'    
    }
);

defaultTileLayer.addTo(map);

export function useDefaultTileLayer() {
    // MIERUNEタイルを削除
    if (map.hasLayer(placeTileLayer)) {
        map.removeLayer(placeTileLayer);
    }

    // 地理院タイルを追加
    if (!map.hasLayer(defaultTileLayer)) {
        defaultTileLayer.addTo(map);
    }
}

export function usePlaceTileLayer() {

    if (map.hasLayer(defaultTileLayer)) {
        map.removeLayer(defaultTileLayer);
    }

    if (!map.hasLayer(placeTileLayer)) {
        placeTileLayer.addTo(map);
    }

}

export const defaultStreetStyle = {
  color: "#6ed5b1",
  weight: 2,
  opacity: 0.8,
  interactive: true,
};

export const streetQuizBaseStyle = {
  color: "#58b5eb",
  weight: 2,
  opacity: 1,
  interactive: false,
};

/*地名ファイルの処理*/ 

export const placeBaseStyle = {
  color: "#777",
  weight: 1,
  opacity: 0.35,
  fillColor: "#cccccc",
  fillOpacity: 0.08,
  interactive: false
};

export const placeQuizStyle = {
  color: "#d32f2f",
  weight: 4,
  opacity: 1,
  fillColor: "#ff9800",
  fillOpacity: 0.35,
  interactive: false
};

/*通りレイヤーの処理*/
export function setStreetLayerStyle(style) {
  if (!state.geojsonLayer) return;

  state.geojsonLayer.eachLayer((layer) => {
    layer.setStyle(style);
    layer.options.interactive = style.interactive;
  });

  state.geojsonLayer.bringToBack();
}

/* 地名レイヤー*/
export function setPlaceLayerStyle(style) {
  if (!state.placeLayer) return;
  state.placeLayer.eachLayer(
    layer => {
    layer.setStyle(style);
    layer.options.interactive = style.interactive;});

}

/*問題の地名を強調*/
export function highlightPlace(feature) {resetPlaceHighlight();
  if (!state.placeLayer) return;
    state.placeLayer.eachLayer(layer => {
  if (layer.feature === feature) {
    state.currentPlaceLayer =layer;
      layer.setStyle(placeQuizStyle);
        const bounds = layer.getBounds();
          if (bounds.isValid()
            ) {
              map.fitBounds(bounds, {maxZoom: 15, padding: [30, 30]});
              }
    }

  });
}

/*地名強調解除*/
export function resetPlaceHighlight() {
  if (!state.currentPlaceLayer) {return;}
    state.currentPlaceLayer.setStyle(placeBaseStyle);
    state.currentPlaceLayer = null;
}

export function clearQuizMarkers() {
  map.eachLayer((layer) => {
    if (layer.options && layer.options.isQuizMarker) {
      map.removeLayer(layer);
    }
  });
}

export function resetCurrentHighlight() {
  if (!state.currentHighlightedLayer || !state.geojsonLayer) return;

  state.geojsonLayer.resetStyle(state.currentHighlightedLayer);
  state.currentHighlightedLayer = null;
}
