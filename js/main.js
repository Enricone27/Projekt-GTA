/**
 * The onload function is called when the HTML has finished loading.
 */
function onload() {
  loadMap();
}
/**
 * loads the Map on the background
 */
function loadMap() {
  map = L.map("map").setView([47.37675, 8.540721], 16);
  markers = L.layerGroup();
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.addLayer(markers);
  fetch("data/velovorzugsrouten.json")
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data).addTo(map);
    })
    .catch((error) => {
      console.error("Fehler beim Laden der GeoJSON-Datei:", error);
    });
  map.addLayer(markers);
  fetch("data/stzh.poi_volksschule_view.json")
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data).addTo(map);
    })
    .catch((error) => {
      console.error("Fehler beim Laden der GeoJSON-Datei:", error);
    });
}

/**
 * Alles was für die GPS Track Aufzeichnung notwendig ist.
 * und anschliessend um den Track zu Bewerten und abschicken
 *
 */
let tripActive = false;
let watchID = null;
let track_cords = [];
let geoOptions = {
  enableHighAccuracy: true,
  /*
  maximumAge: 15000, // The maximum age of a cached location (15 seconds).
  timeout: 12000, // A maximum of 12 seconds before timeout.*/
};

let trackState = {
  track: null,
  rating: null,
};
let track = {
  coords: null,
  start_time: null,
  end_time: null,
};

/* Start/End Trip Button Logik */
function toggleTrip() {
  const btn = document.getElementById("tripBtn");

  if (!tripActive) {
    //START
    tripActive = true;
    btn.textContent = "End Trip";
    // MECHANISMUS fÜR GPS AUFNEHMEN
    start_tracking();
  } else {
    //STOP
    tripActive = false;
    btn.textContent = "Start Trip";
    // GPS STOPPEN
    stop_tracking();
    // Objekt beschreiben
    console.log(track_cords);
    track.coords = track_cords;
    trackState.track = track;
    // Bewertung einleiten
    document.getElementById("popupTrip").style.display = "flex";
  }
}

function start_tracking() {
  track_cords = [];
  if ("geolocation" in navigator) {
    track.start_time = new Date().toISOString();
    console.log(track.start_time);

    watchID = navigator.geolocation.watchPosition(
      gettingCords,
      geoError,
      geoOptions
    );
    console.log(watchID, tripActive);
  } else {
    console.error("Geolocation nicht verfügbar");
  }
}

function stop_tracking() {
  if (watchID !== null) {
    navigator.geolocation.clearWatch(watchID);

    track.end_time = new Date().toISOString();
    console.log(track.end_time);
    console.log("Tracking gestoppt:", watchID);
    watchID = null;
  }
}

/**
 * Function to be called whenever a new position is available.
 * @param position The new position.
 */
function gettingCords(position) {
  let lat = position.coords.latitude;
  let lng = position.coords.longitude;
  num_cords = [lat, lng];
  track_cords.push(num_cords);
}

/**
 * Function to be called if there is an error raised by the Geolocation API.
 * @param error Describing the error in more detail.
 */
function geoError(error) {
  console.log(
    "Fehler beim Abfragen der Position (" +
      error.code +
      "): " +
      error.message +
      " "
  );
}

/**
 * Bewertungen von Tracks und POIs
 */
function submitTripRating() {
  let veloweg =
    document.querySelector('input[name="veloweg"]:checked')?.value || null;

  let abgetrennt = 0;
  if (veloweg === "ja") {
    abgetrennt =
      document.querySelector('input[name="abgetrennt"]:checked')?.value || null;
  }

  let geschwindigkeit =
    document.querySelector('input[name="geschwindigkeit"]:checked')?.value ||
    null;
  let vieleAmpeln = document.getElementById("q5").value;
  let strassentyp = "Hauptstrasse";
  let verkehrsaufkommen = 1;

  const rating = {
    veloweg,
    abgetrennt,
    geschwindigkeit,
    vieleAmpeln,
    strassentyp,
    verkehrsaufkommen,
  };

  console.log("Trip Rating:", rating);
  trackState.rating = rating;
  alert("Danke für deine Bewertung!");
  console.log(trackState);
  insertPoint(); // hier gehts dann weiter mit auf die DB laden
  closePopup("popupTrip");
}

function submitRating() {
  const veloparkplatz = document.querySelector(
    'input[name="veloparkplatz"]:checked'
  )?.value;
  const wettergeschuetzt = document.querySelector(
    'input[name="Wettergeschuetzt"]:checked'
  )?.value;
  const anschliessen = document.querySelector(
    'input[name="anschliessen"]:checked'
  )?.value;
  const durchfahren = document.querySelector(
    'input[name="durchfahren"]:checked'
  )?.value;

  const weitWeg = document.getElementById("q5").value;
  const vielePlaetze = document.getElementById("q6").value;

  const rating = {
    veloparkplatz,
    wettergeschuetzt,
    anschliessen,
    durchfahren,
    weitWeg,
    vielePlaetze,
  };

  console.log("Rating:", rating);
  alert("Danke für deine Bewertung!");
  closePopup("popupRate");
}

/**
 * TODO:
 * EXPORT TO DB
 */
let wfs = "https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_project/wfs";

function insertPoint() {
  let coordString = trackState.track.coords
    .map((c) => c[1] + "," + c[0])
    .join(" ");
  console.log(coordString);
  let postData =
    "<wfs:Transaction\n" +
    '  service="WFS"\n' +
    '  version="1.0.0"\n' +
    '  xmlns="http://www.opengis.net/wfs"\n' +
    '  xmlns:wfs="http://www.opengis.net/wfs"\n' +
    '  xmlns:gml="http://www.opengis.net/gml"\n' +
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    '  xmlns:GTA25_project="https://www.gis.ethz.ch/GTA25_project"\n' +
    '  xsi:schemaLocation="https://www.gis.ethz.ch/GTA25_project\n' +
    "                      https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_project/wfs?service=WFS&amp;version=1.0.0&amp;request=DescribeFeatureType&amp;typeName=GTA25_project%3Atrajektorien99\n" +
    "                      http://www.opengis.net/wfs\n" +
    '                      https://baug-ikg-gis-01.ethz.ch:8443/geoserver/schemas/wfs/1.0.0/WFS-basic.xsd">\n' +
    "  <wfs:Insert>\n" +
    "    <GTA25_project:trajektorien99>\n" +
    "      <zeit_start>" +
    trackState.track.start_time +
    "</zeit_start>\n" +
    "      <zeit_ziel>" +
    trackState.track.end_time +
    "</zeit_ziel>\n" +
    "      <strassentyp>" +
    trackState.rating.strassentyp +
    "</strassentyp>\n" +
    "      <hoechstgeschwindigkeit>" +
    1 + //trackState.rating.geschwindigkeit +
    "</hoechstgeschwindigkeit>\n" +
    "      <ampeln>" +
    trackState.rating.vieleAmpeln +
    "</ampeln>\n" +
    "      <verkehrsaufkommen>" +
    trackState.rating.verkehrsaufkommen +
    "</verkehrsaufkommen>\n" +
    "      <gps>\n" +
    '        <gml:LineString srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">\n' +
    '          <gml:coordinates xmlns:gml="http://www.opengis.net/gml" decimal="." cs="," ts=" ">' +
    coordString +
    "</gml:coordinates>\n" +
    "        </gml:LineString>\n" +
    "      </gps>\n" +
    "    </GTA25_project:trajektorien99>\n" +
    "  </wfs:Insert>\n" +
    "</wfs:Transaction>";
  console.log("guguus");
  $.ajax({
    method: "POST",
    url: wfs,
    dataType: "xml",
    contentType: "text/xml",
    data: postData,
    success: function () {
      //Success feedback
      console.log("Success from AJAX, data sent to Geoserver");

      // Do something to notisfy user
      alert("Check if data is inserted into database");
    },
    error: function (xhr, errorThrown) {
      //Error handling
      console.log("Error from AJAX");
      console.log(xhr.status);
      console.log(errorThrown);
    },
  });
}
/**
 * UI Funktioen
 */

// Rate School Button  UI Funktion
function openRatePopup() {
  document.getElementById("popupRate").style.display = "flex";
}
// Toggle Zusatzfrage Veloweg UI Funktion
function toggleVelowegExtra(show) {
  const extra = document.getElementById("velowegExtra");
  if (show) {
    extra.style.display = "block";
  } else {
    extra.style.display = "none";
    // Auswahl zurücksetzen
    const radios = extra.querySelectorAll('input[name="abgetrennt"]');
    radios.forEach((r) => (r.checked = false));
  }
}
// Slider-Wert live aktualisieren UI Funktion
function updateValue(spanId, val) {
  document.getElementById(spanId).textContent = val;
}
// Popup schließen UI Funktion
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}
