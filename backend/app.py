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
from analüse import rating_school, rating_trip
from data_processing import match_trip, match_school
import sql

app = Flask(__name__)
CORS(app, origins=["*", "null"])  # allowing any origin as well as localhost (null)


@app.route("/trip", methods=["GET"])
def trip():
    '''
    matchted die trajektorien zu den velovorzugslinien und schulen, bewertet sie und schreibt die bewertung in die db
    return: json mit bestaetigung
    '''

    # gdfs laden
    gdfs = sql.get_gdfs()
    schule = gdfs["schule"]
    trajektorien = gdfs["trajektorien"]
    velovorzugslinien  = gdfs["velovorzugslinien"]
    
    #data processing und analyse
    matched_trips = match_trip(trajektorien, schule, velovorzugslinien)
    rated_trips = rating_trip(matched_trips)

    #gdf in die db schreiben
    sql.write(rated_trips, "trajektorien")
    

    result = jsonify({"wir hoffen du hattest einen guten trip"})
    return result

@app.route("/school", methods=["GET"])
def school():
    '''
    matchted die bewertung zu den schulen, bewertet sie und schreibt die bewertung in die db
    return: json mit bestaetigung
    '''
    #gdfs laden
    gdfs = sql.get_gdfs()
    schule = gdfs["schule"]
    bewertung = gdfs["bewertung"]

    #data processing und analyse
    matched_schools = match_school(bewertung, schule)
    rated_schools = rating_school(matched_schools)

    #gdf in die db schreiben
    sql.write(rated_schools, "schule")
    

    result = jsonify({"viel spass in der schule"})
    return result


if __name__ == "__main__":
    # run
    app.run(debug=True, host="localhost", port=8989)






