import numpy as np
import geopandas as gpd


def rating_school(school: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Berechnet einen Gesamtscore für Schulen
    return: GDF mit Spalte 'score'
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

    school['wetterschutz'] = school['wetterschutz'].astype(bool) *5
    school['schliessen'] = school['schliessen'].astype(bool) *5
    school["score"] = sum(school[k] * weights[k] for k in weights.keys())

    return school


def rating_trip(trip: gpd.GeoDataFrame) -> gpd.GeoDataFrame:

    trip = trip.copy()
    weights = {
        "hoechstgeschwindigkeit": 0.4,
        "ampeln": 0.2,
        "verkehrsaufkommen": 0.4
    }
    trip['hoechstgeschwindigkeit'] = trip['hoechstgeschwindigkeit'].astype(int)/ 10
    
    trip["score"] = 0 
    trip["score"] = np.sum(trip[k] * weights[k] for k in weights.keys())
    print(trip["score"])
    return trip