function initialise() {
    localStorage.removeItem("location");    // Delete saved location if user refreshes the page
    initMap();
    initAutocomplete();
}

let map;
function initMap() {
    console.log("Map init");
    map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 13,
        center: {
            lat: 53.351,
            lng: -6.261
        }
    });

    let markerCluster = drawMarkers(map);
}

function initAutocomplete() {
    const dublinBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(53.326093, -6.315996),
        new google.maps.LatLng(53.383076, -6.205615)
    );

    const options = {
        bounds: dublinBounds,
        strictBounds: true
    };

    let fromInput = document.getElementById("from-location");
    fromAutocomplete = new google.maps.places.Autocomplete(fromInput, options); // This needs to NOT be explicitly declared as a variable or it fails.

    let toInput = document.getElementById("to-location");
    toAutocomplete = new google.maps.places.Autocomplete(toInput, options);     // No idea why - ask Google!
}

const marker_list = [];
function drawMarkers(map) {
    fetch("all-locations")
        .then(function (response){
            return response.json()
            })
        .then(function (stationJSON){
            console.log(stationJSON);
            return stationJSON.map(function (station) {
                let marker = new google.maps.Marker({
                    position: {lat: station["latitude"], lng: station["longitude"]},
                    label: station["number"].toString()
                    });

                marker.addListener("click", function(){
                    document.getElementById("current-data").innerHTML = "<i>Loading...</i>";
                    fetch(`live-data/${this.label}`).then(function(response){
                                return response.json();
                    }).then(function(dynamicDataJSON){
                            currentData(dynamicDataJSON[0],marker_list);
                            twentyFourHourGraph(dynamicDataJSON);
                        });
                });

                marker_list.push(marker);
                return marker;
            });
        })
        .then(function (markers){
            return new MarkerClusterer(map, markers, {
                imagePath: "../static/scripts/MarkerClusterer/m"
            });
        });
}

// Approach taken from
// https://stackoverflow.com/questions/7997627/google-maps-how-to-get-the-distance-between-two-point-in-metre/7997732#7997732
function getNearestMarkers(markers, lat_long){
    let distance = 0;
    let dist_map = {};
    let p1 = new google.maps.LatLng(lat_long[0],lat_long[1]);

    for(let i = 0; i < markers.length; i++){
        let p2 = new google.maps.LatLng(markers[i].position.lat(), markers[i].position.lng());
        distance = calculate_distance(p1,p2);

        if(dist_map[distance] === undefined){
            dist_map[distance] = [markers[i]];
        } else{
            dist_map[distance].push(markers[i]);
        }
    }
    
    let dist_array = [];
    for (let key in dist_map){
        dist_array[dist_array.length] = key;
    }
    dist_array.sort();
    
    let nearest_dict = {};
    let nearest = dist_array.slice(0,3);

    for(let i = 0;i < 3;i++){
        nearest_dict[nearest[i]] = dist_map[nearest[i]];
    }
    console.log(nearest_dict);
    return nearest_dict;
}

function calculate_distance(p1,p2){
    return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
}

function currentData(singleJson){
    document.getElementById("current-data").innerHTML = `<h4 class="text-center">${singleJson["address"]}</h4>
    <hr>
    <div class="row">
        <span class="col-8">Status</span>
        <span class="col-4">${singleJson["status"]}</span>
    </div>
    <div class="row">
        <span class="col-8">Available Bikes</span>
        <span class="col-4">${singleJson["bikes"]}</span>
    </div>
    <div class="row">
        <span class="col-8">Available Stands</span>
        <span class="col-4">${singleJson["available"]}</span>
    </div>
    <br>
    <div class="row text-center">
    	<small class="col-12">Last Updated</small>
        <small class="col-12">${new Date(singleJson["timestamp"])}</small>
    </div>
    <hr>`;
}

// Reference : https://canvasjs.com/
function twentyFourHourGraph(multiJson){
    const f_ar = [];
    multiJson.forEach(function(days){
    
        let time = days["timestamp"];
        let available = days["available"];

        time_conver = function(time){
            return new Date(time);
        };

        let value_i = parseInt(time);
        let available_i = parseInt(available);

        b_obj = {};
        b_obj.x = time_conver(value_i);
        b_obj.y = available_i;
        f_ar.push(b_obj);
 

    });

    let chart = new CanvasJS.Chart("graph-container",
        {
        backgroundColor: "#3C5F73",
          title: {
          },
          axisX: {
            title: "Time",
            valueFormatString: "HH:mm",
            labelAngle: -20,
            labelFontColor: "white",
            titleFontColor: "white",
            lineColor: "white", 
            tickColor: "white",
            gridColor: "#3e7ea3",
          },
          axisY:{
            title: "Bike Stand Availability",
            labelFontColor: "white",
            titleFontColor: "white",
            lineColor: "white",
            tickColor: "white", 
            gridColor: "#3e7ea3",
          },
          data: [
              {
              	  color: "#E8C775",
                  type: "splineArea",
                  dataPoints: f_ar
              }]
        });

    chart.render();
}

function startToEnd() {
    let fromLat;
    let fromLng;
    let toLat;
    let toLng;

    if (document.getElementById("from-location").disabled){
        let fromCoord = document.getElementById("from-location").value.split(", ");
        fromLat = parseFloat(fromCoord[0]);
        fromLng = parseFloat(fromCoord[1]);
    } else{
        fromLat = fromAutocomplete.getPlace().geometry.location.lat();
        fromLng = fromAutocomplete.getPlace().geometry.location.lng();
    }

    if (document.getElementById("to-location").disabled) {
        let toCoord = document.getElementById("to-location").value.split(", ");
        toLat = parseFloat(toCoord[0]);
        toLng = parseFloat(toCoord[1]);
    } else {
        toLat = toAutocomplete.getPlace().geometry.location.lat();
        toLng = toAutocomplete.getPlace().geometry.location.lng();
    }

    document.getElementById("availability-header").innerHTML = "Plan Your Journey";
    threePredictions(fromLat, fromLng, "from-prediction");
    threePredictions(toLat, toLng, "to-prediction");
}

function threePredictions(latitude, longitude, elementId){
    console.log("MarkerList:");
    console.log(marker_list);
    let nearby = getNearestMarkers(marker_list, [latitude, longitude]);
    let predictionHTML = [];
    let startOrEnd = elementId === "from-prediction" ? "starting" : "end";
    for (let marker in nearby){
        console.log(nearby[marker][0]["label"]);
        fetch("all-weather")
            .then(function(weatherResponse){
                return weatherResponse.json();
            })
            .then(function(weatherJSON){
                fetch("station_prediction", {
                    method: "post",
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        number: nearby[marker][0]["label"],
                        timestamp: new Date().getTime() + 3600000,
                        sunrise: weatherJSON["sunrise"],
                        sunset: weatherJSON["sunset"],
                        clouds: weatherJSON["cloud"],
                        temperature: weatherJSON["temperature"],
                        windspeed: weatherJSON["wind"]
                    })
                })
                    .then(function(predictionResponse){
                        return predictionResponse.json();
                    })
                    .then(function(predictionJSON){
                        let stationNumber = nearby[marker][0]["label"];
                        predictionHTML.push(`<span class="station-zoom" onclick="zoomToMarker(${stationNumber})"><img src="https://maps.google.com/mapfiles/ms/icons/red.png" alt="marker-icon"><b>Station ${stationNumber}:</b></span><br>
<i>Available bikes:</i> ${predictionJSON["bike_availability"]}<br>
<i>Available stands:</i> ${predictionJSON["bike_stand_availability"]}`);
                    })
                    .then(function(){
                        if (predictionHTML.length === Object.keys(nearby).length){
                            document.getElementById(elementId).innerHTML = `Stations near your ${startOrEnd} point for the next hour (click to see on the map): <br>` + predictionHTML.join("<br>\n") + "<br><br>";
                        }
                    });
            });
    }
}

function zoomToMarker(markerNumber){
    for (let marker in marker_list){
        if(markerNumber.toString() === marker_list[marker]["label"]){
            map.setZoom(18);
            map.panTo(marker_list[marker].position);
        }
    }
}

function getLocation(inputBoxId) {
    if (navigator.appVersion.includes("Chrome")){
        window.alert("Chrome requires HTTPS for this feature to work. If you wish to use this feature, please use another browser.");
    } else {
        let inputBoxElement = document.getElementById(inputBoxId);

        // getCurrentPosition() can only take one value, so quick-and-dirty
        // solution to ensure correct textbox is populated is to hard-code the
        // values into two near-identical if clauses
        // Not pretty or efficient, but it works.
        if (inputBoxId === "from-location"){
            if (!document.getElementById("from-checkbox").checked){
                inputBoxElement.removeAttribute("disabled");
                inputBoxElement.value = "";
            } else {
                let storedLocation = localStorage.getItem("location");
                if (storedLocation){
                    let locationJSON = JSON.parse(storedLocation);
                    inputBoxElement.value = locationJSON["lat"] + ", " + locationJSON["lng"]
                    inputBoxElement.disabled = "true";
                } else if (navigator.geolocation){
                    navigator.geolocation.getCurrentPosition(function (position) {
                        let inputBoxElement = document.getElementById("from-location");
                        inputBoxElement.value = position.coords.latitude + ", " + position.coords.longitude;
                        inputBoxElement.disabled = "true";
                        localStorage.setItem("location", JSON.stringify({lat: position.coords.latitude, lng: position.coords.longitude}));
                    });
                }
            }
        } else if (inputBoxId === "to-location"){
            if (!document.getElementById("to-checkbox").checked){
                inputBoxElement.removeAttribute("disabled");
                inputBoxElement.value = "";
            } else {
                let storedLocation = localStorage.getItem("location");
                if (storedLocation){
                    let locationJSON = JSON.parse(storedLocation);
                    inputBoxElement.value = locationJSON["lat"] + ", " + locationJSON["lng"]
                    inputBoxElement.disabled = "true";
                } else if (navigator.geolocation){
                    navigator.geolocation.getCurrentPosition(function (position) {
                        let inputBoxElement = document.getElementById("to-location");
                        inputBoxElement.value = position.coords.latitude + ", " + position.coords.longitude;
                        inputBoxElement.disabled = "true";
                        localStorage.setItem("location", JSON.stringify({lat: position.coords.latitude, lng: position.coords.longitude}));
                    });
                }
            }
        }
    }
}

// Load current weather data immediately upon page load
!function(){
	fetch("realtime-weather")
		.then(function(response){
			if (response.ok){
				return response.json();
			}
		})
		.then(function(JSONWeather){
			// {"description": WeatherDescription, "icon": 04d, "temperature": Temperature}
			return `<b>Current weather in Dublin:</b> ${Math.floor(JSONWeather["temperature"] - 273.15)}&deg;C - ${JSONWeather["description"]} <img src="http://openweathermap.org/img/w/${JSONWeather["icon"]}.png">`;
		})
		.then(function(HTMLString){
			document.getElementById("inner-weather").innerHTML = HTMLString;
		});
}();