"""
This module is run every 30 minutes to poll OpenWeatherMap's API for the current weather in Dublin.
The data is then saved into our database, and will be used to train a prediction model.
"""
import requests
import db_connection as db
import os

# cron runs in "/" by default. Change working directory to not break relative locations:
working_dir = os.path.dirname(os.path.abspath(__file__))

# Get OWM API key (do not place credentials under VCS)
with open(os.path.join(working_dir, "credentials/WeatherMapAPIKey.txt")) as file:
    api_key = file.readline().strip()

# id is the key, value is the key for Dublin
parameters = {"id": 2964574, "APPID": api_key}

# response is the name of my dictionary
response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=parameters).json()

# get the right data, returning null if element not found
WeatherDescription = response["weather"][0]["main"]
Icon = response["weather"][0]["icon"]
Temperature = (response.get("main") or {}).get("temp")
WindSpeed = (response.get("wind") or {}).get("speed")
Clouds = (response.get("clouds") or {}).get("all")
Rain = (response.get("rain") or {}).get("3h")
Snow = (response.get("snow") or {}).get("3h")
TimeStamp = response.get("dt")
Sunrise = (response.get("sys") or {}).get("sunrise")
Sunset = (response.get("sys") or {}).get("sunset")


# write data to database
query = "INSERT INTO WeatherData VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
db.cursor.execute(query, (WeatherDescription, Icon, Temperature, WindSpeed, Clouds, Rain, Snow, TimeStamp, Sunrise, Sunset))

db.commit()
db.close()






