from flask import Flask, jsonify, abort, request
from flask.templating import render_template
from importlib import reload
import mysql
import pickle
import pandas as pd
import sklearn
import datetime
import model_conversion as mc
import os
import requests

error_msg = False
try:
    import db_connection as db
except Exception as err:
    error_msg = "Import of custom module 'db_connection' failed. Fix error and restart flask application. Error - {}".format(err)

app = Flask(__name__)


@app.route('/')
def index():
    if error_msg:
        return error_msg
    return render_template("index.html")


@app.route('/all-locations')
def get_station_static_data():
    
    try:
        if not db.cnx.is_connected():
            reload(db)
        db.cursor.execute("SELECT * FROM BikeStationStaticData")
    except:
        abort(503)
    
    locations = []
    for row in db.cursor:
        locations.append({"number": row[0], "latitude": row[3], "longitude": row[4]})
    return jsonify(locations)


@app.route("/live-data/<station_id>")
def get_live_data(station_id):
    
    try:
        if not db.cnx.is_connected():
            reload(db)
        db.cursor.execute("SELECT Address, Timestamp, Status, BikeStands, AvailableStands FROM OnYourBikeDB.BikeStationStaticData, OnYourBikeDB.BikeStationDynamicData WHERE BikeStationStaticData.Number = BikeStationDynamicData.Number AND BikeStationStaticData.Number = %s AND timestamp > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 HOUR))*1000 ORDER BY Timestamp DESC", (station_id, ))
    except:
        abort(503)
        
    twenty_four_hours_data = []
    for (address, timestamp, status, bike_stands, available_stands) in db.cursor:
        twenty_four_hours_data.append({
            "address": address,
            "timestamp": timestamp,
            "status": status,
            "bikes": bike_stands - available_stands,
            "available": available_stands
        })
    return jsonify(twenty_four_hours_data)


@app.route("/station_prediction", methods=['GET', 'POST'])
def get_station_prediction():  
    
    # get parameters for model and convert unix timestamp to datetime
    params = request.get_json()
    params["timestamp"] = pd.to_datetime(params["timestamp"], unit='ms')
    params["sunrise"] = pd.to_datetime(params["sunrise"], unit='s')
    params["sunset"] = pd.to_datetime(params["sunset"], unit='s')
    
    # import the model that matches station id
    try:
        model = pickle.load(open("models/model_station_{}.sav".format(params["number"]), 'rb'))
    except:
        abort(503)
    
    # convert the input features into features that the model can work with   
    hourOfDay = "{0:0>2}:{1:0>2}".format(params["timestamp"].hour, params["timestamp"].minute)
    dayOfWeek = params["timestamp"].weekday()
    sunrise = "{0:0>2}:{1:0>2}".format(params["sunrise"].hour, params["sunrise"].minute)
    sunset = "{0:0>2}:{1:0>2}".format(params["sunset"].hour, params["sunset"].minute)
    workday = dayOfWeek in range(0, 5)
    rushHour = "07:00" <= hourOfDay <= "09:00" or "16:00" <= hourOfDay <= "19:00"
    lunchHour = "12:00" <= hourOfDay <= "14:00"
    daylight = sunrise <= hourOfDay <= sunset
    windspeed = params["windspeed"]
    clouds = params["clouds"]
    
    #bikeStandsPerc = mc.classify_bikeStands()
    tempClass = mc.classify_temp(params["temperature"])
    daytime = mc.classify_daytime(hourOfDay, sunrise, sunset)
    
    # package converted features into dataframe so that model can read it
    X_new = pd.DataFrame({"tempClass": [tempClass], "WindSpeed": [windspeed], "Clouds": [clouds], "workday": [workday],
                           "rushHour": [rushHour] , "daylight": [daylight], "lunchHour": [lunchHour], 
                           "daytime_darkEvening": [daytime=="darkEvening"], "daytime_evening": [daytime=="evening"], 
                           "daytime_morning": [daytime=="morning"], "daytime_night": [daytime=="night"]})

    # run model
    bike_stand_availability = model.predict(X_new)[0]
    bike_availability = mc.bikeStandAvailability_to_bikeAvailability(bike_stand_availability)
    
    return jsonify({"bike_stand_availability": bike_stand_availability, "bike_availability": bike_availability })


@app.route("/all-weather")
def all_weather():
    working_dir = os.path.dirname(os.path.abspath(__file__))
    # Get OWM API key (do not place credentials under VCS)
    with open(os.path.join(working_dir, "credentials/WeatherMapAPIKey.txt")) as file:
        api_key = file.readline().strip()

    # id is the key, value is the key for Dublin
    parameters = {"id": 2964574, "APPID": api_key}

    # response is the name of my dictionary
    response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=parameters).json()

    # get the right data
    weather_description = response["weather"][0]["main"]
    icon = response["weather"][0]["icon"]
    temperature = (response.get("main") or {}).get("temp")
    wind_speed = (response.get("wind") or {}).get("speed")
    clouds = (response.get("clouds") or {}).get("all")
    rain = (response.get("rain") or {}).get("3h")
    snow = (response.get("snow") or {}).get("3h")
    timestamp = response.get("dt")
    sunrise = (response.get("sys") or {}).get("sunrise")
    sunset = (response.get("sys") or {}).get("sunset")

    weather_data = {"description": weather_description,
                    "icon": icon,
                    "temperature": temperature,
                    "wind": wind_speed,
                    "cloud": clouds,
                    "rain": rain,
                    "snow": snow,
                    "timestamp": timestamp,
                    "sunrise": sunrise,
                    "sunset": sunset}
    return jsonify(weather_data)


@app.route("/realtime-weather")
def realtime_weather():
    working_dir = os.path.dirname(os.path.abspath(__file__))
    # Get OWM API key (do not place credentials under VCS)
    with open(os.path.join(working_dir, "credentials/WeatherMapAPIKey.txt")) as file:
        api_key = file.readline().strip()

    # id is the key, value is the key for Dublin
    parameters = {"id": 2964574, "APPID": api_key}

    # response is the name of my dictionary
    response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=parameters).json()

    # get the right data
    weather_description = response["weather"][0]["main"]
    icon = response["weather"][0]["icon"]
    temperature = (response.get("main") or {}).get("temp")

    weather_data = {"description": weather_description, "icon": icon, "temperature": temperature}
    return jsonify(weather_data)


if __name__ == '__main__':
    app.run(debug=True)

