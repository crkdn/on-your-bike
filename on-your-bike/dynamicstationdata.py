import logging
import requests 
import json
import db_connection as db

# Set up logger (do not place logs under VCS)
logging.basicConfig(filename="logs/dynamicstationdata_log.txt", level=logging.INFO, format='%(asctime)s %(message)s',datefmt='%m-%d %H:%M')

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
    
    for station in all_stations:
        number = station["number"]
        banking = station["banking"]
        status = station["status"]
        bike_stands = station["bike_stands"]
        available__bike_stands = station["available_bike_stands"]
        timestamp = station["last_update"]
else:
    logging.info("Request failed. Error: {}".format(response.status_code))
    
    
