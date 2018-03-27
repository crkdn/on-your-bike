import logging
import requests
import db_connection as db
import mysql
import os

working_dir = os.path.dirname(os.path.abspath(__file__))

# Set up logger (do not place logs under VCS)
logging.basicConfig(filename=os.path.join(working_dir, "logs/dynamicstationdata_log.txt"), level=logging.INFO, format='%(asctime)s %(message)s',datefmt='%m-%d %H:%M')

# Get JCDecaux API key (do not place credentials under VCS)
with open("credentials/JCDecauxAPIKey.txt") as file:
    api_key = file.readline().strip()

# Make request
parameters = {"contract": "Dublin", "apiKey": api_key}
try:
    response = requests.get("https://api.jcdecaux.com/vls/v1/stations", params=parameters)
except requests.exceptions.RequestException as e:  
    response = requests.Response()
    logging.info("Request failed. Connection/Timeout Error: {}".format(e))
 
# Process response 
if response.status_code == 200:
    
    all_stations = response.json()
    query = "INSERT INTO BikeStationDynamicData VALUES (%s, %s, %s, %s, %s, %s)"
    
    # Extract information
    for station in all_stations:
        number = station.get("number")
        timestamp = station.get("last_update")
        banking = station.get("banking")
        status = station.get("status")
        bike_stands = station.get("bike_stands")
        available__bike_stands = station.get("available_bike_stands")
        
        # Write to database
        try:
            db.cursor.execute(query, (number, timestamp, banking, status, bike_stands, available__bike_stands))
        except mysql.connector.Error as e:
            logging.info("Database write failed. Error {}".format(e))
else:
    logging.info("Request failed. Error: {}".format(response.status_code))
 
db.commit()
db.close()
    
