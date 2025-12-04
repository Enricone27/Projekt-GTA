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
def get(table: str):
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()
    get_schools = f"SELECT * FROM gta25_g3.schule;"
    get_trips = "SELECT * FROM gta25_g3.trajektorien;"
    get_routes = "SELECT * FROM gta25_g3.velovorzugslinien;"

    if table == "schools":
        cur.execute(get_schools)
    elif table == "trips":
        cur.execute(get_trips)
    elif table == "routes":
        cur.execute(get_routes)
    else:
        raise ValueError("Unknown table")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    gdf = gpd.GeoDataFrame(rows, columns=cols)
    conn.commit()
    conn.close()
    return gdf

#chat!
def write(table: gpd.GeoDataFrame):
    conn = psycopg2.connect(**get_db_credentials())
    cur = conn.cursor()
    write_schools = "UPDATE gta25_g3.schule SET score = %s WHERE id = %s;"
    write_trips = "UPDATE gta25_g3.trajektorien;"

    if table == "schools":
        cur.execute(write_schools)
    elif table == "trips":
        cur.execute(write_trips)
    else:
        raise ValueError("Unknown table")
    conn.commit()
    conn.close()

