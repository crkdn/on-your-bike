import requests

all_stations = requests.get("https://developer.jcdecaux.com/rest/vls/stations/Dublin.json").json()
for station in all_stations:
    print("#{0}: {1}. {2}, {3}".format(station["number"], station["name"], station["latitude"], station["longitude"]))