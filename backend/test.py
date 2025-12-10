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

gdfs = sql.get_gdfs()
schule = gdfs["schule"]
trajektorien = gdfs["trajektorien"]
velovorzugslinien  = gdfs["velovorzugslinien"]
bewertung = gdfs["bewertung"]


print(rating_trip(trajektorien).head())


#sql.write(rated_schools, "schule")