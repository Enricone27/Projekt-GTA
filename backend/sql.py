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



#This is the example
#sql_string_with_placeholders = "INSERT INTO test (num, data) VALUES (%s, %s)"
#cur.mogrify(sql_string_with_placeholders, (100, "abc'def"))

#chat!
def get_gdfs():
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()

    queries = {
        "schule": ["SELECT * FROM gta25_g3.schule;", "geometrie"],
        "trajektorien": ["SELECT * FROM gta25_g3.trajektorien;", "gps"],
        "velovorzugslinien":  ["SELECT * FROM gta25_g3.glattalnetz;", "geom"],
        "bewertung": ["SELECT * FROM gta25_g3.bewertung_schule ORDER BY id DESC LIMIT 1;", "GPS"]
    }

    result = {}

    for name, query in queries.items():
        
        gdf = gpd.read_postgis(query[0], conn, geom_col=query[1], crs="EPSG:2056")
        result[name] = gdf

    conn.close()
    return result

#chat!
def write(gdf: gpd.GeoDataFrame, table: str):
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()

    write_schools = f"UPDATE gta25_g3.schule SET score = {gdf['score']};"
    write_trips = "UPDATE gta25_g3.trajektorien;"

    if table == "schule":
        cur.execute(write_schools)
    elif table == "trajektorien":
        cur.execute(write_trips)
    else:
        raise ValueError("Unknown table")
    conn.commit()
    conn.close()
