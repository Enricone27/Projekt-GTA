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
from data_processing import match_trip, match_school
import sql

app = Flask(__name__)
CORS(app, origins=["*", "null"])  # allowing any origin as well as localhost (null)

# SOLUTION TASK 4
@app.route("/trip", methods=["GET"])
def trip():
    # retrieve column name from the request arguments  

    # call backend
    gdfs = sql.get_gdfs()
    schule = gdfs["schule"]
    trajektorien = gdfs["trajektorien"]
    velovorzugslinien  = gdfs["velovorzugslinien"]
    #bewertung = gdfs["bewertung"]

    matched_trips = match_trip(trajektorien, schule, velovorzugslinien)

    #stimmt nicht ganz muss noch schreiben
    sql.write(matched_trips, "trajektorien")
    # save results in a suitable format to output
    result = jsonify({"wir hoffen du hattest einen guten trip"})
    return result

@app.route("/school", methods=["GET"])
def school():
    #gdfs laden
    gdfs = sql.get_gdfs()
    schule = gdfs["schule"]
    #trajektorien = gdfs["trajektorien"]
    #velovorzugslinien  = gdfs["velovorzugslinien"]
    bewertung = gdfs["bewertung"]

    matched_schools = match_school(bewertung, schule)
    rated_schools = rating_school(matched_schools)


    #stimmt nicht ganz muss noch schreiben
    sql.write(rated_schools, "schule")
    # save results in a suitable format to output
    result = jsonify({"viel spass in der schule"})
    return result


if __name__ == "__main__":
    # run
    app.run(debug=True, host="localhost", port=8989)






