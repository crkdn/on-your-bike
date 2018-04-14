import db_connection as db
import pandas

query = """SELECT *
FROM OnYourBikeDB.WeatherData as W, OnYourBikeDB.BikeStationDynamicData as S
WHERE ABS(S.TimeStamp - W.Timestamp*1000) < 900000
ORDER BY S.Number, S.Timestamp DESC"""

df = pandas.read_sql(query, db.cnx)

print()

