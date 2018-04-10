from flask import Flask, jsonify, abort
from flask.templating import render_template
from importlib import reload
import mysql

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


if __name__ == '__main__':
    app.run(debug=True)
