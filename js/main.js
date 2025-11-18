let map;
let appState = {
    markers: null,
    latLng: null,
    radius: null,
    heading: null
};

/**
 * Draws the markers on the map.
 */
function drawMarkers() {
    if (map && appState.markers && appState.latLng && appState.radius) {
        appState.markers.clearLayers();
        let circle = L.circle(appState.latLng, {
            radius: appState.radius
        });
        appState.markers.addLayer(circle);

        // Draw a line representing current heading    
    }
}

/**
 * Function to be called whenever a new position is available.
 * @param position The new position.
 */
function geoSuccess(position) {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    appState.latLng = L.latLng(lat, lng);
    appState.radius = position.coords.accuracy / 2;
    drawMarkers();

    if (map) {
        map.setView(appState.latLng);
    }
}

/**
 * Function to be called if there is an error raised by the Geolocation API.
 * @param error Describing the error in more detail.
 */
function geoError(error) {
    let errMsg = $("#error-messages");
    errMsg.text(errMsg.text() + "Fehler beim Abfragen der Position (" + error.code + "): " + error.message + " ");
    errMsg.show();
}

let geoOptions = {
    enableHighAccuracy: true,
    maximumAge: 15000,  // The maximum age of a cached location (15 seconds).
    timeout: 12000   // A maximum of 12 seconds before timeout.
};

/**
 * The onload function is called when the HTML has finished loading.
 */
function onload() {
    let errMsg = $("#error-messages");

    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
    } else {
        errMsg.text(errMsg.text() + "Geolocation is leider auf diesem Gerät nicht verfügbar. ");
        errMsg.show();
    }

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (eventData) {
            appState.heading = eventData.alpha * (Math.PI / 180);
            drawMarkers();
        }, false);
    } else {
        errMsg.text(errMsg.text() + "DeviceOrientation ist leider nicht verfügbar. ");
        errMsg.show();
    }

    map = L.map('map').setView([47.376750, 8.540721], 16);
    appState.markers = L.layerGroup();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.addLayer(appState.markers);
    fetch('data/velovorzugsrouten.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data).addTo(map);
        })
        .catch(error => {
            console.error("Fehler beim Laden der GeoJSON-Datei:", error);
        });
    map.addLayer(appState.markers);
    fetch('data/stzh.poi_volksschule_view.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data).addTo(map);
        })
        .catch(error => {
            console.error("Fehler beim Laden der GeoJSON-Datei:", error);
        });
}
let tripActive = false;

/* Start/End Trip Button Logik */
function toggleTrip() {
  const btn = document.getElementById("tripBtn");

  if (!tripActive) {
    tripActive = true;
    btn.textContent = "End Trip";
  } else {
    tripActive = false;
    btn.textContent = "Start Trip";
    document.getElementById("popupTrip").style.display = "flex";
  }
}

/* Rate School Button */
function openRatePopup() {
  document.getElementById("popupRate").style.display = "flex";
}

/* Popup schließen */
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

function updateValue(spanId, val) {
  document.getElementById(spanId).textContent = val;
}

function submitRating() {

  const veloparkplatz = document.querySelector('input[name="veloparkplatz"]:checked')?.value;
  const wettergeschuetzt = document.querySelector('input[name="Wettergeschuetzt"]:checked')?.value;
  const anschliessen = document.querySelector('input[name="anschliessen"]:checked')?.value;
  const durchfahren = document.querySelector('input[name="durchfahren"]:checked')?.value;

  const weitWeg = document.getElementById("q5").value;
  const vielePlaetze = document.getElementById("q6").value;

  const rating = {
    veloparkplatz,
    wettergeschuetzt,
    anschliessen,
    durchfahren,
    weitWeg,
    vielePlaetze
  };

  console.log("Rating:", rating);
  alert("Danke für deine Bewertung!");
  closePopup("popupRate");
}
// Toggle Zusatzfrage Veloweg
function toggleVelowegExtra(show) {
  const extra = document.getElementById("velowegExtra");
  if (show) {
    extra.style.display = "block";
  } else {
    extra.style.display = "none";
    // Auswahl zurücksetzen
    const radios = extra.querySelectorAll('input[name="abgetrennt"]');
    radios.forEach(r => r.checked = false);
  }
}

// Slider-Wert live aktualisieren
function updateValue(spanId, val) {
  document.getElementById(spanId).textContent = val;
}

// Popup schließen
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

// Absenden und Werte auslesen
function submitTripRating() {
  const veloweg = document.querySelector('input[name="veloweg"]:checked')?.value || null;
  
  let abgetrennt = null;
  if (veloweg === "ja") {
    abgetrennt = document.querySelector('input[name="abgetrennt"]:checked')?.value || null;
  }

  const geschwindigkeit = document.querySelector('input[name="geschwindigkeit"]:checked')?.value || null;
  const vieleAmpeln = document.getElementById("q5").value;

  const rating = {
    veloweg,
    abgetrennt,
    geschwindigkeit,
    vieleAmpeln
  };

  console.log("Trip Rating:", rating);
  alert("Danke für deine Bewertung!");

  closePopup("popupTrip");
}
