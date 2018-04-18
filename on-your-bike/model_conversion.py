# Create classifier functions that can be used to convert numeric features into classes.
def classify_bikeStands(bikeStandsPerc):
    availability = "LOL"
    if bikeStandsPerc <= 0.33:
        availability = "little"
    elif bikeStandsPerc <= 0.66:
        availability = "moderate"
    else:
        availability = "abundant"
    return availability

def bikeStandAvailability_to_bikeAvailability(availability):
    mapping = {"little": "abundant", "moderate": "moderate", "abundant": "little"}
    return mapping.get(availability)

def classify_temp(temp):
    temp_class = None
    if temp <= 278.15:   #cold
        temp_class = 0 
    elif temp <= 283.15: #tolerable
        temp_class = 1
    elif temp <= 288.15: #moderate
        temp_class = 2
    elif temp <= 293.15: #warm
        temp_class = 3
    else:                #hot
        temp_class = 4
    return temp_class

def classify_daytime(time, sunrise, sunset):
    daytime_class = None
    if sunrise <= time <= sunset:
        if time < "12:00":
            daytime_class = "morning"
        elif time < "17:00":
            daytime_class = "afternoon"
        else:
            daytime_class = "evening"
    else:
        if sunset < time < "24:00":
            daytime_class = "darkEvening"
        else:
            daytime_class = "night"
    return daytime_class