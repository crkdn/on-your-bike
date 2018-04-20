"""
This module was run once to gather static data about all of DublinBikes' stations.
It connects to the JCDecaux API and saves the data we need into our database.

It will also be run once per week to update the database, in case new stations are added.
"""
import requests
import db_connection as db

query = "INSERT INTO BikeStationStaticData VALUES (%s, %s, %s, %s, %s)"

all_stations = requests.get("https://developer.jcdecaux.com/rest/vls/stations/Dublin.json").json()
for station in all_stations:
    number = station["number"]
    name = station["name"]
    address = station["address"]
    latitude = station["latitude"]
    longitude = station["longitude"]

    db.cursor.execute(query, (number, name, address, latitude, longitude))

db.commit()
db.close()

print()
