import numpy as np
import scipy as sp
import geopandas as gpd

def zeugs():
   return

# Hilfsfunktion zur MinMax-Normalisierung


def rating_school(school: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Berechnet einen Gesamtscore für Schulen basierend auf:
    ['velo_ppq', 'kapazitaet_pp', 'zugaenglichkeit_schule',
     'zugaenglichkeit_pp', 'wetterschutz', 'schliessen']
    
    Rückgabe: GDF mit Spalte 'score'
    """

    school = school.copy()
    weights = {
        "velo_ppq": 0.2,
        "kapazitaet_pp": 0.2,
        "zugaenglichkeit_schule": 0.2,
        "zugaenglichkeit_pp": 0.15,
        "wetterschutz": 0.2,
        "schliessen": 0.05
    }

    school['wetterschutz'] = school['wetterschutz'].astype(bool)
    school['schliessen'] = school['schliessen'].astype(bool)
    school["score"] = sum(school[k] * weights[k] for k in weights.keys())

    return school


def rating_trip(trip: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    trip = trip.copy()
    weights = {
        "hoechstgeschwindigkeit": 0.2,
        "velostreifen": 0.3,
        "ampeln": 0.2,
        "verkehrsaufkommen": 0.3
    }
    trip['hoechstgeschwindigkeit'] = trip['hoechstgeschwindigkeit'].astype(bool)

    trip["score"] = sum(trip[k] * weights[k] for k in weights.keys())
    return trip