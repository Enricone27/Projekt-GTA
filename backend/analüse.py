import numpy as np
import scipy as sp
import geopandas as gpd

def zeugs():
   return


def rating_school(school: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Berechnet einen Gesamtscore für Schulen basierend auf:
    ['velo_ppq', 'kapazitaet_pp', 'zugaenglichkeit_schule',
     'zugaenglichkeit_pp', 'wetterschutz', 'schliessen']
    
    Rückgabe: GDF mit Spalte 'score'
    """

    school = school.copy()

    # Hilfsfunktion zur MinMax-Normalisierung
    def normalize(series):
        if series.max() == series.min():
            return 1  # verhindert Division durch 0
        return (series - series.min()) / (series.max() - series.min())

    # Liste der Bewertungsfelder
    fields = [
        "velo_ppq",
        "kapazitaet_pp",
        "zugaenglichkeit_schule",
        "zugaenglichkeit_pp",
        "wetterschutz",
        "schliessen"
    ]

    # Normalisierte Werte sammeln
    norm = {}
    for f in fields:
        if f in school.columns:
            norm[f] = normalize(school[f])
        else:
            norm[f] = 0

    # Gewichte (kannst du jederzeit anpassen)
    weights = {
        "velo_ppq": 0.2,
        "kapazitaet_pp": 0.2,
        "zugaenglichkeit_schule": 0.2,
        "zugaenglichkeit_pp": 0.15,
        "wetterschutz": 0.2,
        "schliessen": 0.05
    }

    # Score = gewichtete Summe der normalisierten Felder
    school["score"] = sum(norm[f] * weights[f] for f in fields)

    return school


def rating_trip(trip: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    trip["score"] = None
    return trip