from flask import Flask, jsonify
from flask.templating import render_template
import db_connection as db

app = Flask(__name__)


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/all-locations')
def get_station_static_data():
    locations = []
    db.cursor.execute("SELECT * FROM BikeStationStaticData")
    for row in db.cursor:
        locations.append({"number": row[0], "latitude": row[3], "longitude": row[4]})
    return jsonify(locations)


@app.route("/live-data/<station_id>")
def get_live_data(station_id):
    db.cursor.execute("SELECT Address, Timestamp, Status, BikeStands, AvailableStands FROM OnYourBikeDB.BikeStationStaticData, OnYourBikeDB.BikeStationDynamicData WHERE BikeStationStaticData.Number = BikeStationDynamicData.Number AND BikeStationStaticData.Number = %s ORDER BY Timestamp DESC LIMIT 1", (station_id, ))
    for (address, timestamp, status, bike_stands, available_stands) in db.cursor:
        return jsonify(
            {"address": address,
             "timestamp": timestamp,
             "status": status,
             "bikes": bike_stands - available_stands,
             "available": available_stands})


if __name__ == '__main__':
    app.run(debug=True)
