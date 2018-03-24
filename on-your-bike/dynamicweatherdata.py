import requests
import json

# Get JCDecaux API key (do not place credentials under VCS)
with open("credentials/WeatherMapAPIKey.txt") as file:
    api_key = file.readline().strip()


#id is the key, value is the key for Dublin
parameters = {"id": 2964574, "APPID": api_key}


# response is the name of my dictionary
response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=parameters).json()
print(response)

WeatherDescription= response["weather"][0]["main"]
Icon = response["weather"][0]["icon"]
Temperature= response["main"]["temp"]
WindSpeed = response["wind"]["speed"]
Clouds = response["clouds"]["all"]
#Rain = response["rain"][0][""]
#Snow = response["weather"]["icon"]
TimeStamp= response["dt"]
Sunrise = response["sys"]["sunrise"]
Sunset = response["sys"]["sunset"]


