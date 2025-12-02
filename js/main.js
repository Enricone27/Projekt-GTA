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
    btn.textContent = "Beenden";
    btn.style.backgroundColor = 'red';
    // MECHANISMUS fÜR GPS AUFNEHMEN
    start_tracking();
  } else {
    //STOP
    tripActive = false;
    btn.textContent = "Start Trip";
    btn.style.backgroundColor = '#00bcff';
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
    track.start_time = new Date();
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
    track.end_time = new Date();
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
  const veloweg =
    document.querySelector('input[name="veloweg"]:checked')?.value || null;

  let abgetrennt = null;
  if (veloweg === "ja") {
    abgetrennt =
      document.querySelector('input[name="abgetrennt"]:checked')?.value || null;
  }

  const geschwindigkeit =
    document.querySelector('input[name="geschwindigkeit"]:checked')?.value ||
    null;
  const vieleAmpeln = document.getElementById("q5").value;

  const rating = {
    veloweg,
    abgetrennt,
    geschwindigkeit,
    vieleAmpeln,
  };

  console.log("Trip Rating:", rating);
  trackState.rating = rating;
  alert("Danke für deine Bewertung!");
  console.log(trackState);
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
// Weiter tracken
function continueTracking() {
  document.getElementById("popupTrip").style.display = "none";
  // Trip bleibt aktiv
  console.log("Tracking wird fortgesetzt.");
}

// Popup abbrechen (ohne Bewertung, ohne Tracking)
function cancelTripPopup() {
  document.getElementById("popupTrip").style.display = "none";
  console.log("Trip-Bewertung abgebrochen.");
}

// Funktion, um das Einleitungspopup ein- oder auszublenden
function toggleIntroPopup() {
  const popup = document.getElementById("introPopup");
  popup.style.display = popup.style.display === "flex" ? "none" : "flex";
}

// Funktion, um das Einleitungspopup zu schließen
function closeIntroPopup() {
  document.getElementById("introPopup").style.display = "none";
}
// Popup schließen UI Funktion
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}
