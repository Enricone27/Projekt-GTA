import psycopg2
from psycopg2.extensions import AsIs
import pandas as pd
import geopandas as gpd

def get_db_credentials():
    db_credentials = {
        "user": "gta25_g3",
        "password": "wbNw8q9T",
        "host": "ikgpgis.ethz.ch",
        "port": "5432",
        "dbname": "gta"
    }
    return db_credentials


def get_gdfs():
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()

    queries = {
        "schule": ["SELECT * FROM gta25_g3.schule;", "geometrie", 2056],
        "trajektorien": ["SELECT * FROM gta25_g3.trajektorien;", "gps", 4326],
        "velovorzugslinien":  ["SELECT * FROM gta25_g3.glattalnetz;", "geom", 2056],
        "bewertung": ["SELECT * FROM gta25_g3.bewertung_schule ORDER BY id DESC LIMIT 1;", "GPS", 4326]
    }

    result = {}

    for name, query in queries.items():
        
        gdf = gpd.read_postgis(query[0], conn, geom_col=query[1], crs=f"EPSG:{query[2]}")
        result[name] = gdf

    conn.close()
    return result

#chat!
def write(gdf: gpd.GeoDataFrame, table: str):
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()

    
    write_schools = "UPDATE gta25_g3.schule SET score = %s WHERE id = %s;"
    write_trips = "UPDATE gta25_g3.trajektorien SET landegeschwindigkeit = %s, score = %s, id_schule = %s, id_route = %s WHERE id = %s ;"

    if table == "schule":
        score = float(gdf['score'].iloc[0])
        id = int(gdf['id_right'].iloc[0])
        cur.execute(write_schools, (score, id))

    elif table == "trajektorien":
        landegeschwindigkeit = float(gdf['landegeschwindigkeit'].iloc[0])
        score = float(gdf['score'].iloc[0])
        id_schule = int(gdf['id_schule'].iloc[0])
        id_route = int(gdf['id_route'].iloc[0])
        id = int(gdf['id'].iloc[0])
        cur.execute(write_trips, (landegeschwindigkeit, score, id_schule, id_route, id))
    else:
        raise ValueError("Unknown table")
    conn.commit()
    conn.close()
