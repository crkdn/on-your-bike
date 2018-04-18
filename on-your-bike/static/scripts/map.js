function initialise() {
    localStorage.removeItem("location");    // Delete saved location if user refreshes the page
    initMap();
    initAutocomplete();
}

function initMap() {
    var map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 13,
        center: {
            lat: 53.351,
            lng: -6.261
        }
    });

    var markerCluster = drawMarkers(map);
}

function drawMarkers(map) {
    fetch("all-locations")
        .then(function (response){
            if (response.ok){
                return response.json();
            }
            throw new Error("Sorry, this Service is currently unavailable");
        })
        .then(function (stationJSON){
            return stationJSON.map(function (station) {
                var marker = new google.maps.Marker({
                    position: {lat: station["latitude"], lng: station["longitude"]},
                    label: station["number"].toString()
                });
                marker.addListener("click", function(){
                    document.getElementById("popup-container").innerHTML = "<i>Loading...</i>";
                    fetch(`live-data/${this.label}`)
                        .then(function(response){
                            if (response.ok){
                                return response.json();
                            }
                            throw new Error("Sorry, this Service is currently unavailable");
                        })
                        .then(function(dynamicDataJSON){
                            currentData(dynamicDataJSON[0]);
                            twentyFourHourGraph(dynamicDataJSON);
                        })
                        .catch(function(error){
                            document.getElementById("popup-container").innerHTML = error.message;
                        });
                    });
                return marker;
            });
        })
        .then(function (markers){
            return new MarkerClusterer(map, markers, {
                imagePath: "../static/scripts/MarkerClusterer/m"
            });
        })
        .catch(function(error){
            document.getElementById("popup-container").innerHTML = error.message;
        });
}

function currentData(singleJson){
    document.getElementById("popup-container").innerHTML = `<h3>${singleJson["address"]}</h3>
<b>Status:</b> ${singleJson["status"]}<br>
<b>Bikes Available:</b> ${singleJson["bikes"]}<br>
<b>Free Stands:</b> ${singleJson["available"]}<br>
<small>Last updated: ${new Date(singleJson["timestamp"])}</small>`;
}

function twentyFourHourGraph(multiJson){    
    var valuesDictionary = [];
    var f_ar = [];
    multiJson.forEach(function(days){
    
        var time = days["timestamp"];
        var available = days["available"];
        console.log(time);
        console.log(typeof(time[0]));
   
    time_conver = function(time){
//        var date = new Date(time*1000);
//        var custom_format = ('0' + date.getHours()).slice(-2) + '.' + ('0' + date.getMinutes()).slice(-2);
//        console.log(custom_format)
        // return custom_format;
        var data = new Date(time);
        return data;
    };

    
   
    var value_i = parseInt(time);
    var availabl_i = parseInt(available);
    b_obj = {}
    b_obj.x = time_conver(value_i);
    b_obj.y = availabl_i;
    f_ar.push(b_obj);

});
    


//Plotly.newPlot('popup-container', data);

//console.log(valuesDictionary);/
    var chart = new CanvasJS.Chart("graph-container",
    {
      title:{
        text: "Bike Data"
      },

      axisX:{
        title: "Time",
        gridThickness: 2,
        valueFormatString: "HH:mm",
        // intervalType: "hour",        
        labelAngle: -20
      },
      axisY:{
        title: "Availability"
      },
      data: [
      {        
        type: "line",
        dataPoints: f_ar
      }
      ]
    });
    
    chart.render();
    
}

function initAutocomplete() {
    var dublinBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(53.326093, -6.315996),
        new google.maps.LatLng(53.383076, -6.205615)
    );

    var options = {
        bounds: dublinBounds,
        strictBounds: true
    }

    var fromInput = document.getElementById("from-location");
    fromAutocomplete = new google.maps.places.Autocomplete(fromInput, options); // This needs to NOT be a "var"

    var toInput = document.getElementById("to-location");
    toAutocomplete = new google.maps.places.Autocomplete(toInput, options);     // No idea why - ask Google!
}

function startToEnd() {
    let fromLat;
    let fromLng;
    let toLat;
    let toLng;

    if (document.getElementById("from-location").disabled){
        var fromCoord = document.getElementById("from-location").value.split(", ");
        fromLat = parseFloat(fromCoord[0]);
        fromLng = parseFloat(fromCoord[1]);
    } else{
        fromLat = fromAutocomplete.getPlace().geometry.location.lat();
        fromLng = fromAutocomplete.getPlace().geometry.location.lng();
    }

    if (document.getElementById("to-location").disabled) {
        var toCoord = document.getElementById("to-location").value.split(", ");
        toLat = parseFloat(toCoord[0]);
        toLng = parseFloat(toCoord[1]);
    } else {
        toLat = toAutocomplete.getPlace().geometry.location.lat();
        toLng = toAutocomplete.getPlace().geometry.location.lng();
    }

    replaceWithJonnysFunction(fromLat, fromLng, toLat, toLng);
}

function replaceWithJonnysFunction(lat1, lng1, lat2, lng2){
    console.log(lat1, lng1, lat2, lng2);
}

function getLocation(inputBoxId) {
    // if (navigator.appVersion.includes("Chrome")){
    //     window.alert("Chrome requires HTTPS for this feature to work. If you wish to use this feature, please use another browser.");
    // } else {
    //     // Put code here
    // }
    let inputBoxElement = document.getElementById(inputBoxId);

    // getCurrentPosition() can only take one value, so quick-and-dirty solution is to hard-code the values into two near-identical if clauses
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