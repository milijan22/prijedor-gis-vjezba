window.onload = init();
//-------------- OL map --------------
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
// ------------ Naseljena Mjesta Layer ------------
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

  const naseljaLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: "/naselja.geojson",
    format: new ol.format.GeoJSON(),
  }),
  style: function (feature) {
    const featureName = feature.get("name");
    naseljaStyle.getText().setText(featureName);
    return [naseljaStyle];
  },
});
map.addLayer(naseljaLayer);

const naseljaCheckbox = document.getElementById('naselja-layer');
if (naseljaCheckbox) {
  naseljaCheckbox.addEventListener('change', function () {
    naseljaLayer.setVisible(this.checked);
  });
}

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
        fill: new ol.style.Fill({ color: "rgb(206, 62, 62)" }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 3 }),
        overflow: true,
      }),
    });
  }
//------------ Hover effect ------------
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
  const drawSource = new ol.source.Vector();
  const drawLayer = new ol.layer.Vector({
    source: drawSource,
  });
  map.addLayer(drawLayer);

  let drawInteraction = null;

// ------------ Polygon drawing  ------------
  const drawBtn = document.getElementById('draw-polygon-btn');
  if (drawBtn) {
    drawBtn.addEventListener('click', function () {
      if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
        drawBtn.textContent = 'Nacrtaj poligon';
        return;
      }
      drawInteraction = new ol.interaction.Draw({
        source: drawSource,
        type: 'Polygon',
      });
      map.addInteraction(drawInteraction);
      drawBtn.textContent = 'Prekini crtanje';

      drawInteraction.once('drawend', function (event) {
  const feature = event.feature;
  const polygon = feature.getGeometry();
  const area = ol.sphere.getArea(polygon);

  function handleChoice() {
  const action = window.prompt(
    `Šta želite uraditi sa poligonom?
    1 - Izračunaj površinu
    2 - Sačuvaj poligon kao GeoJSON
    3 - Pokušaj ponovo
    Unesite broj opcije (1, 2 ili 3):`
  );

  if (action === "1") {
    alert('Površina poligona: ' + area.toFixed(2) + ' m²');
    const keep = window.confirm("Želite li dati ime poligonu i sačuvati ga na mapi?\nOdaberite 'OK' za sačuvaj ili 'Cancel' za ukloni.");
    if (keep) {
      let name = "";
      while (!name) {
        name = window.prompt("Unesite ime za poligon:", "");
        if (name === null) break;
        if (!name) alert("Morate unijeti ime!");
      }
      if (name) {
        feature.setProperties({ name: name });
        alert("Poligon je sačuvan na mapi sa imenom: " + name);
      } else {
        drawSource.removeFeature(feature);
        alert("Poligon je uklonjen.");
      }
    } else {
      drawSource.removeFeature(feature);
      alert("Poligon je uklonjen.");
    }
  } else if (action === "2") {
    let name = "";
    while (!name) {
      name = window.prompt("Unesite ime za poligon:", "");
      if (name === null) break;
      if (!name) alert("Morate unijeti ime!");
    }
    if (name) {
      feature.setProperties({ name: name });
      const geojson = new ol.format.GeoJSON().writeFeature(feature, {
        featureProjection: map.getView().getProjection()
      });
      const blob = new Blob([geojson], { type: "application/vnd.geo+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ".geojson";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("Poligon je sačuvan kao GeoJSON.");
    } else {
      drawSource.removeFeature(feature);
      alert("Poligon je uklonjen.");
    }
  } else if (action === "3") {
    drawSource.removeFeature(feature);
    alert("Pokušajte ponovo! Nacrtajte novi poligon.");
  } else if (action !== null) {
    alert("Nepoznata opcija. Pokušajte ponovo.");
    handleChoice();
    return;
  }
  const resetBtn = document.getElementById('reset-polygons-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', function () {
    drawSource.clear();
  });
}
  map.removeInteraction(drawInteraction);
  drawInteraction = null;
  drawBtn.textContent = 'Nacrtaj poligon';
}
handleChoice();

      });
    });
  }

  
}
