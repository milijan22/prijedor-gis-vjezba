window.onload = init();

function init() {
  const map = new ol.Map({
    view: new ol.View({
      center: [1860845.2714325634, 5618311.5203367155],
      zoom: 12,
      maxZoom: 18,
      minZoom: 10,
    }),
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    target: "js-map",
    keyboardEventTarget: document,
  });

  const dragRotateInteraction = new ol.interaction.DragRotate({
    condition: ol.events.condition.altKeyOnly,
  });
  map.addInteraction(dragRotateInteraction);

  const naseljaStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: "rgba(162, 162, 241, 0.27)",
    }),
    stroke: new ol.style.Stroke({
      color: "grey",
      width: 2,
    }),
    text: new ol.style.Text({
      font: "bold 16px Arial",
      fill: new ol.style.Fill({ color: "rgba(24, 22, 22, 0)" }),
      stroke: new ol.style.Stroke({ color: "rgba(189, 185, 185, 0)", width: 3 }),
      overflow: true,
      opacity: 0
    }),
  });

  const naselja = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: "./naselja.geojson",
      format: new ol.format.GeoJSON(),
    }),
    style: function (feature) {
      const featureName = feature.get("name");
      naseljaStyle
        .getText()
        .setText(featureName);
      return [naseljaStyle];
    },
  });

  // naselja.
  map.addLayer(naselja);
  let highlightedFeature = null;

  function getHighlightStyle(feature) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(191, 196, 247, 0.53)",
      }),
      stroke: new ol.style.Stroke({
        color: "white",
        width: 1,
      }),
      zIndex: 1000,
      text: new ol.style.Text({
        text: feature.get("name") || "",
        font: "bold 16px Arial",
        fill: new ol.style.Fill({ color: "rgb(231, 18, 18)" }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 3 }),
        overflow: true,
      }),
    });
  }

  map.on("pointermove", function (evt) {
    let featureFound = false;

    map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      if (highlightedFeature !== feature) {
        if (highlightedFeature) {
          highlightedFeature.setStyle(null);
        }
        highlightedFeature = feature;
        highlightedFeature.setStyle(getHighlightStyle(feature));
      }
      featureFound = true;
      return true;
    });

    if (!featureFound && highlightedFeature) {
      highlightedFeature.setStyle(null);
      highlightedFeature = null;
    }
  });

  map.on("click", function (evt) {
    map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      const coordinates = feature.getGeometry().getCoordinates();
      const name = feature.get("name");
      const id = feature.id_;
      console.log("feature: " , feature);
      const message = `ID: ${id}, Name: ${name}`;
      const overlay = new ol.Overlay({
        element: document.getElementById("popup-coordinates"),
        positioning: "bottom-center",
        stopEvent: false,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
      });
      overlay.setPosition(coordinates);
      map.addOverlay(overlay);
      document.getElementById("popup-coordinates").innerHTML = message;
    });
  });
}
