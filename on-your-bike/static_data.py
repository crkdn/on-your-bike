import requests
import mysql.connector

# Keep keys outside of VCS
with open("credentials/dbinfo.txt") as dbinfo:
    db_creds = dbinfo.read().splitlines()
    db_hostname = db_creds[0]
    db_user = db_creds[1]
    db_pass = db_creds[2]

cnx = mysql.connector.connect(host=db_hostname, user=db_user, password=db_pass, database="OnYourBikeDB")
cursor = cnx.cursor(buffered=True)
query = "INSERT INTO BikeStationStaticData VALUES (%s, %s, %s, %s, %s)"

all_stations = requests.get("https://developer.jcdecaux.com/rest/vls/stations/Dublin.json").json()
for station in all_stations:
    number = station["number"]
    name = station["name"]
    address = station["address"]
    latitude = station["latitude"]
    longitude = station["longitude"]

    cursor.execute(query, (number, name, address, latitude, longitude))

cnx.commit()

print()
