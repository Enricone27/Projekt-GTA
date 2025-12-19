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
    if rating.crs != schools.crs:
        rating = rating.to_crs(schools.crs)
    matched = gpd.sjoin_nearest(rating, schools, how="left", distance_col="dist_to_school")
    return matched



def match_trip1(trips: gpd.GeoDataFrame, schools: gpd.GeoDataFrame, routes: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    trips:
        ['id', 'gps', 'zeit_start', 'zeit_ziel', 'strassentyp',
         'hoechstgeschwindigkeit', 'velostreifen', 'ampeln',
         'verkehrsaufkommen', 'score', 'geometry']

    schools:
        ['id', 'name', 'geometrie', 'score']

    routes:
        ['id', 'geometry', ...]
    """

    trips = trips.copy()

    #CRS angleichen falls noetig
    if trips.crs != schools.crs:
        trips = trips.to_crs(schools.crs)
    if trips.crs != routes.crs:
        routes = routes.to_crs(schools.crs)

    #Start / Ende
    trips["start"] = trips.geometry.apply(lambda g: Point(g.coords[0]))
    trips["end"]   = trips.geometry.apply(lambda g: Point(g.coords[-1]))

    # Startpunkt  zu Route
    start_gdf = gpd.GeoDataFrame(trips, geometry="start", crs=trips.crs)
    start_match = gpd.sjoin_nearest(start_gdf, routes[["id", "geom"]],how="left", distance_col="dist_start_route").rename(columns={"id_right": "id_route_match"})
    
    # Endpunkt zu Schule
    end_gdf = gpd.GeoDataFrame(trips, geometry="end", crs=trips.crs)
    schools_gdf = schools.rename_geometry("geometry")

    end_match = gpd.sjoin_nearest(end_gdf, schools_gdf[["id", "geometry"]], how="left", distance_col="dist_end_school").rename(columns={"id_right": "id_schule_match"})
    
    # Join    
    result = trips.copy()    
    result['id_route'] = start_match["id_route_match"].values
    result['id_schule'] = end_match["id_schule_match"].values


    # Geschwindigkeit
    dt = (result["zeit_ziel"] - result["zeit_start"]).dt.total_seconds()
    result["landegeschwindigkeit"] = np.where(dt > 0, result.geometry.length / dt, np.nan)

    # Aufräumen
    result = result.drop(columns=["start", "end"])

    return result
