"""
Takes the result of a SQL query on our database which matches station data to weather data
and converts it to a Pandas dataframe for analysis
"""
import db_connection as db
import pandas
import datetime


def get():
    """Gets the join of station dynamic data and weather data where
    the two pieces of data are taken within 30 minutes of each other"""

    query = """SELECT *
	FROM OnYourBikeDB.WeatherData as W, OnYourBikeDB.BikeStationDynamicData as S
	WHERE ABS(S.TimeStamp - W.Timestamp*1000) < 900000
	ORDER BY S.Number, S.Timestamp DESC"""

    df = pandas.read_sql(query, db.cnx)
    hours_of_day = []
    days_of_week = []
    for row in df["Timestamp"]:
        hours_of_day.append(round(datetime.datetime.fromtimestamp(row / 1000).time().hour + (datetime.datetime.fromtimestamp(row / 1000).time().minute / 60), 2))
        days_of_week.append(round(datetime.datetime.fromtimestamp(row / 1000).weekday()))

    pandas_hours = pandas.Series(hours_of_day)
    pandas_days = pandas.Series(days_of_week)

    df["hourOfDay"] = pandas_hours
    df["dayOfWeek"] = pandas_days
    return df
