"""
This is a helper module written as a minor abstraction to simplify DB calls in other modules
"""
import mysql.connector
import os

# cron runs in "/" by default. Change working directory to not break relative locations:
working_dir = os.path.dirname(os.path.abspath(__file__))

# Keep keys outside of VCS
with open(os.path.join(working_dir, "credentials/dbinfo.txt")) as dbinfo:
    db_creds = dbinfo.read().splitlines()
    db_hostname = db_creds[0]
    db_user = db_creds[1]
    db_pass = db_creds[2]

cnx = mysql.connector.connect(host=db_hostname, user=db_user, password=db_pass, database="OnYourBikeDB")
cursor = cnx.cursor(buffered=True)


def commit():
    cnx.commit()


def close():
    cursor.close()
    cnx.close()
