import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import os
import json
from sqlalchemy import create_engine
import psycopg2

# import pyproj
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin

#import sonstiges
from analüse import rating_school

app = Flask(__name__)
CORS(app, origins=["*", "null"])  # allowing any origin as well as localhost (null)

# SOLUTION TASK 4
@app.route("/compute", methods=["GET"])
def compute():
    # retrieve column name from the request arguments
    col_name = str(request.args.get("column_name", "value"))

    # call backend
    result = get_mean_value_from_table(col_name)
    


    # save results in a suitable format to output
    result = jsonify({"mean": result})
    return result


if __name__ == "__main__":
    # run
    app.run(debug=True, host="localhost", port=8989)


DBLOGIN_FILE = os.path.join("db_login.json")

def match_trip(trips: gpd.GeoDataFrame, schools: gpd.GeoDataFrame, routes: gpd.GeoDataFrame):

    # Start- und Endpunkt erzeugen (falls trips LineStrings sind)
    trips = trips.copy()
    trips["start"] = trips.geometry.apply(lambda geom: Point(geom.coords[0]))
    trips["end"]   = trips.geometry.apply(lambda geom: Point(geom.coords[-1]))

    # GeoDataFrames für Start/Endpunkt erzeugen
    start_gdf = gpd.GeoDataFrame(trips.drop(columns="geometry"), geometry="start", crs=trips.crs)
    end_gdf = gpd.GeoDataFrame(trips.drop(columns="geometry"), geometry="end", crs=trips.crs)

    # Schulen an Endpunkt matchen
    trips_with_school = gpd.sjoin_nearest(end_gdf, schools,how="left",distance_col="dist_to_school")

    # Routen an Startpunkt matchen
    trips_with_route = gpd.sjoin_nearest(start_gdf, routes,how="left", distance_col="dist_to_route")

    # Beide Ergebnisse wieder mergen (über Index)
    result = trips.copy()
    result = result.join(trips_with_school.filter(like="_right"), rsuffix="_school")
    result = result.join(trips_with_route.filter(like="_right"), rsuffix="_route")

    return result

# SOLUTION TASK 4
def get_mean_value_from_table(col_name):
    """Compute mean_value of column <col_name>"""

    # we laoad the dblogin from the json file
    with open("db_login.json", "r") as f:
        dblogin = json.load(f)

    # initialize database connection
    def get_con():
        return psycopg2.connect(**dblogin)

    # create engine
    engine = create_engine("postgresql+psycopg2://", creator=get_con)

    print(dblogin)

    # Read column from database
    table_one_column = pd.read_sql(f"SELECT {col_name} FROM gta25_g3.trajektorien", engine)
    table_schulen = pd.read_sql(f"SELECT {col_name} FROM gta25_g3.schule", engine)
    table_routen = pd.read_sql(f"SELECT {col_name} FROM gta25_g3.velovorzugslinien", engine)
    # compute mean
    table_one_column = gpd.GeoDataFrame(table_one_column)
    table_schulen = gpd.GeoDataFrame(table_schulen)
    table_routen = gpd.GeoDataFrame(table_routen)
    trip = match_trip(table_one_column, table_schulen, table_routen)

    # write new data in db
    return trip


