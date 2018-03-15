import mysql.connector

# Keep keys outside of VCS
with open("credentials/dbinfo.txt") as dbinfo:
    db_creds = dbinfo.read().splitlines()
    db_hostname = db_creds[0]
    db_user = db_creds[1]
    db_pass = db_creds[2]

cnx = mysql.connector.connect(host=db_hostname, user=db_user, password=db_pass, database="OnYourBikeDB")
cursor = cnx.cursor(buffered=True)


def commit_and_close():
    cnx.commit()
    cursor.close()
    cnx.close()
