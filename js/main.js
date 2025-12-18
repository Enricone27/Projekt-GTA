let wfs = "https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_project/wfs";
let wms = "https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_project/wms";
let f_wms = "https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_lab13/wms";

/**
 * The onload function is called when the HTML has finished loading.
 * and then loads the map on the background
 */
function onload() {
  loadMap();
}

/**
 * Everything thats necessary to track gps and then to rate.
 */
let tripActive = false;
let watchID = null;
let liveMarker = null;
let trackPolyline = null;
let track_cords = [];
let track_cords_save = [];
let geoOptions = {
  enableHighAccuracy: true,

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
let schoolState = {
  pos: null,
  rating: null,
};
let SchoolPos = {
  coords: null,
  rate_time: null,
};

/* Start/End Trip Button Logic */
function toggleTrip() {
  const btn = document.getElementById("tripBtn");

  if (!tripActive) {
    tripActive = true;
    btn.textContent = "Beenden";
    btn.style.backgroundColor = "red";
    start_tracking();
  } else {
    tripActive = false;
    btn.textContent = "Aufzeichnen";
    btn.style.backgroundColor = "#00bcff";
    stop_tracking();
    console.log(track_cords);
    if (track_cords.length == 1) {
      alert("Die Aufzeichnung war zu kurz. Versuche es nochmals länger!");
      return;
    }
    track.coords = track_cords;
    trackState.track = track;
    document.getElementById("popupTrip").style.display = "flex";
  }
}

function start_tracking() {
  track_cords = [];
  track_cords.push(...track_cords_save);
  track_cords_save = [];

  stopLivePos();
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
    if (track_cords.length < 2) {
      track_cords.push(track_cords[0]);
    }
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
  let latlng = [lat, lng];

  track_cords.push(latlng);
  startLivePos(latlng);
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
 * Rating of tracks and POIs
 */
function submitTripRating() {
  let geschwindigkeit =
    document.querySelector('input[name="geschwindigkeit"]:checked')?.value ||
    null;
  let strassentyp =
    document.querySelector('input[name="strassetyp"]:checked')?.value || null;

  let vieleAmpeln = document.getElementById("ampel").value;

  let verkehrsaufkommen = document.getElementById("aufkommen").value;

  let veloweg = document.getElementById("aufkommen").value;

  const rating = {
    veloweg,
    geschwindigkeit,
    vieleAmpeln,
    strassentyp,
    verkehrsaufkommen,
  };

  console.log("Trip Rating:", rating);
  trackState.rating = rating;
  console.log(trackState);
  insertPoint(); // here it continues with loading into the db
  stopLivePos();
  closePopup("popupTrip");
}


function startRating() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      gettingSchoolRating,
      geoError,
      geoOptions
    );
  } else {
    console.error("Geolocation nicht verfügbar");
  }
}

function gettingSchoolRating(position) {
  let rating = {
    anschliessen: null,
    wettergeschuetzt: null,
    qualitaet: null,
    anzahl: null,
    PPerreichbar: null,
    Schuleerreichbar: null,
  };
  let lat = position.coords.latitude;
  let lng = position.coords.longitude;
  let coords = [lng, lat];
  let veloparkplatz = document.querySelector(
    'input[name="veloparkplatz"]:checked'
  )?.value;
  if (veloparkplatz === "True") {
    rating.anschliessen =
      document.querySelector('input[name="anschliessen"]:checked')?.value ===
      "True";
    rating.wettergeschuetzt =
      document.querySelector('input[name="Wettergeschuetzt"]:checked')
        ?.value === "True";
    rating.qualitaet = document.getElementById("qualitaet").value;
    rating.anzahl = document.getElementById("anzahl").value;
    rating.PPerreichbar = document.getElementById("ErreichbarStra").value;
    rating.Schuleerreichbar = document.getElementById("ErreichbarSchu").value;
  }
  let rate_time = new Date().toISOString();

  console.log("Rating:", rating, coords);
  SchoolPos.coords = coords;
  SchoolPos.rate_time = rate_time;
  schoolState.pos = SchoolPos;
  schoolState.rating = rating;
  alert("Danke für deine Bewertung!");
  console.log(schoolState);
  closePopup("popupRate");
  insertRating();
}

/**
 * export point to db
 */

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
    trackState.rating.geschwindigkeit +
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
  fetch("/trip");
}

/**
 * export rating to db
 */

function insertRating() {
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
    "                      https://baug-ikg-gis-01.ethz.ch:8443/geoserver/GTA25_project/wfs?service=WFS&amp;version=1.0.0&amp;request=DescribeFeatureType&amp;typeName=GTA25_project%3Abewertung_schule\n" +
    "                      http://www.opengis.net/wfs\n" +
    '                      https://baug-ikg-gis-01.ethz.ch:8443/geoserver/schemas/wfs/1.0.0/WFS-basic.xsd">\n' +
    "  <wfs:Insert>\n" +
    "    <GTA25_project:bewertung_schule>\n" +
    "      <bewertungsdatum>" +
    schoolState.pos.rate_time +
    "</bewertungsdatum>\n" +
    "      <velo_ppq>" +
    schoolState.rating.qualitaet +
    "</velo_ppq>\n" +
    "      <kapazitaet_pp>" +
    schoolState.rating.anzahl +
    "</kapazitaet_pp>\n" +
    "      <zugaenglichkeit_schule>" +
    schoolState.rating.Schuleerreichbar +
    "</zugaenglichkeit_schule>\n" +
    "      <zugaenglichkeit_pp>" +
    schoolState.rating.PPerreichbar +
    "</zugaenglichkeit_pp>\n" +
    "      <wetterschutz>" +
    schoolState.rating.wettergeschuetzt +
    "</wetterschutz>\n" +
    "      <schliessen>" +
    schoolState.rating.anschliessen +
    "</schliessen>\n" +
    "      <GPS>\n" +
    '        <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">\n' +
    '          <gml:coordinates xmlns:gml="http://www.opengis.net/gml" decimal="." cs="," ts=" ">' +
    schoolState.pos.coords[0] +
    "," +
    schoolState.pos.coords[1] +
    "</gml:coordinates>\n" +
    "        </gml:Point>\n" +
    "      </GPS>\n" +
    "    </GTA25_project:bewertung_schule>\n" +
    "  </wfs:Insert>\n" +
    "</wfs:Transaction>";
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
  fetch("/school");
}
/**
 * UI functions
 */

// Rate School Button  UI Funktion
function openRatePopup() {
  document.getElementById("popupRate").style.display = "flex";
}
// Toggle exra question Veloweg UI Function
function toggleVeloPP(show) {
  const extra = document.getElementById("parkplatz");
  if (show) {
    extra.style.display = "block";
  } else {
    extra.style.display = "none";
    const radios = extra.querySelectorAll('input[name="abgetrennt"]');
    radios.forEach((r) => (r.checked = false));
  }
}
// Slider-Wert live reload UI Function
function updateValue(spanId, val) {
  document.getElementById(spanId).textContent = val;
}
// continue
function continueTracking() {
  document.getElementById("popupTrip").style.display = "none";
  console.log("continue");
  console.log(track_cords);
  track_cords_save = track_cords;
  toggleTrip();
  console.log("Tracking wird fortgesetzt.");
}

// Cancel popup
function cancelTripPopup() {
  document.getElementById("popupTrip").style.display = "none";
  stopLivePos();
  track_cords = [];
  console.log("Trip-Bewertung abgebrochen.");
}

// Function to change intro popup
function toggleIntroPopup() {
  const popup = document.getElementById("introPopup");
  popup.style.display = popup.style.display === "flex" ? "none" : "flex";
}

// Function to close intro popup
function closeIntroPopup() {
  document.getElementById("introPopup").style.display = "none";
}
// Close popup
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

// live trajectory and location function
function startLivePos(latlng) {
  if (!trackPolyline) {
    trackPolyline = L.polyline(track_cords, {
      color: "#6123d3",
      weight: 5,
    }).addTo(map);
    console.log(track_cords);
  } else {
    trackPolyline.setLatLngs(track_cords);
    console.log(track_cords);
  }

  if (!liveMarker) {
    liveMarker = L.circleMarker(latlng, {
      radius: 5, // Größe des Kreises
      color: "#9b2929", // Randfarbe
      fillColor: "#9b2929", // Füllfarbe
      fillOpacity: 0.4, // Transparenz
    }).addTo(map);

    map.setView(latlng, 17); // optional: Karte zentrieren
    console.log(latlng);
  } else {
    liveMarker.setLatLng(latlng);
    console.log(latlng);
  }
}
// stop showing postion and trajectory
function stopLivePos() {
  if (trackPolyline) {
    map.removeLayer(trackPolyline);
    trackPolyline = null;
  }
  if (liveMarker) {
    map.removeLayer(liveMarker);
    liveMarker = null;
  }
}

//load map, school and bike path data
function loadMap() {
  map = L.map("map", {
    attributionControl: false
  }).setView([47.37675, 8.540721], 16);


  markers = L.layerGroup();
  let osm_map = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);

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

  let waterFountain = L.tileLayer.wms(f_wms, {
    layers: "GTA25_lab13:water_fountain",
    format: "image/png",
    transparent: true,
  });
  let scools = L.tileLayer.wms(wms, {
    layers: "GTA25_project:schule",
    format: "image/png",
    transparent: true,
    styles: "schulenG3",
  });
  let glattalnetz = L.tileLayer.wms(wms, {
    layers: "GTA25_project:glattalnetz",
    format: "image/png",
    transparent: true,
  });
  let trajektorien = L.tileLayer.wms(wms, {
    layers: "GTA25_project:trajektorien99",
    format: "image/png",
    transparent: true,
    styles: "trajektorieG3",
  });

  let overlays = {
    "Bewertung der Schulen": scools,
    "Bewertete Trajektorien": trajektorien,
  };
  const layerControl = L.control.layers(null, overlays);

  layerControl.addTo(map);
}
