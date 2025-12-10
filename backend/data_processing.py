import geopandas as gpd
from shapely.geometry import Point
import numpy as np
from scipy import constants

def match_school(rating: gpd.GeoDataFrame, schools: gpd.GeoDataFrame):
    ''' input:rating, schule: gpd.GeoDataFrame
        matched bewertung der schule zur schule
        return: gematchte bewertung
    '''
    # Schulen an Punkte matchen
   
    matched = gpd.sjoin_nearest(rating, schools, how="left", distance_col="dist_to_school")
    return matched

def match_trip(trips: gpd.GeoDataFrame, schools: gpd.GeoDataFrame, routes: gpd.GeoDataFrame):
    ''' input: trips, schule, routen: gpd.GeoDataFrame
        matched startpunkt zu route und endpunkt zu schule
        return: gematchter trip
    '''
    # Start- und Endpunkt erzeugen (falls trips LineStrings sind)
   

    trips = trips.copy()
    trips["start"] = trips.geometry.apply(lambda geom: Point(geom.coords[0]))
    trips["end"]   = trips.geometry.apply(lambda geom: Point(geom.coords[-1]))

    # GeoDataFrames für Start/Endpunkt erzeugen
    start_gdf = gpd.GeoDataFrame(trips.drop(columns="gps"), geometry="start", crs=trips.crs)
    end_gdf = gpd.GeoDataFrame(trips.drop(columns="gps"), geometry="end", crs=trips.crs)

    # Schulen an Endpunkt matchen
    trips_with_school = gpd.sjoin_nearest(end_gdf, schools, how="left")

    # Routen an Startpunkt matchen
    trips_with_route = gpd.sjoin_nearest(start_gdf, routes, how="left")

    # Beide Ergebnisse wieder mergen (über Index)
    result = trips.copy()
    result = result.join(trips_with_school.filter(like="_right"))
    result = result.join(trips_with_route.filter(like="_right"), rsuffix="_route")
    result = result.drop(columns=["start", "end", "index_right", "index_right_route", 'score_right'])
    result = result.rename(columns={"id_right": "id_schule"})
    result = result.rename(columns={"id_right_route": "id_route"})

    # durchschnittsgeschwindigkeit berechnen
    dt = (result['zeit_ziel'] - result['zeit_start']).dt.total_seconds()
    result['landegeschwindigkeit'] = np.where(dt != 0, result.geometry.length / dt, constants.c)

    return result