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
    col_name = str(request.args.get("column_name", "value"))#stimmt nicht ganz
    

    # call backend
    table_trajektorien, table_schulen, table_routen = sql.get(col_name)#stimmt nicht ganz
    matched_trips = match_trip(table_trajektorien, table_schulen, table_routen)

    #stimmt nicht ganz muss noch schreiben
    
    # save results in a suitable format to output
    result = jsonify({"wir hoffen du hattest einen guten trip"})
    return result

@app.route("/school", methods=["GET"])
def school():
    # retrieve column name from the request arguments
    col_name = str(request.args.get("column_name", "value"))
    
    # call backend
    rated_schools = sql.get(col_name)#stimmt nicht ganz
    matched_schools = match_school(rated_schools, rated_schools)
    rated_schools = rating_school(matched_schools)


    #stimmt nicht ganz muss noch schreiben
    sql.write(rated_schools)
    # save results in a suitable format to output
    result = jsonify({"viel spass in der schule"})
    return result


if __name__ == "__main__":
    # run
    app.run(debug=True, host="localhost", port=8989)






