function initialise() {
    localStorage.removeItem("location");    // Delete saved location if user refreshes the page
    initMap();
    initAutocomplete();
}

function initMap() {
    console.log("Map init");
    var map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 13,
        center: {
            lat: 53.351,
            lng: -6.261
        }
    });

    var markerCluster = drawMarkers(map);
}

function calculate_distance(p1,p2){
    return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
}

//approach taken from https://stackoverflow.com/questions/7997627/google-maps-how-to-get-the-distance-between-two-point-in-metre/7997732#7997732
function getNearestMarkers(markers, lat_long){
    let distance = 0;
    let dist_map = {}
    var p1 = new google.maps.LatLng(lat_long[0],lat_long[1]);
    for(let i=0;i<markers.length;i++){
        var p2 = new google.maps.LatLng(markers[i].position.lat(),markers[i].position.lng());
        distance = calculate_distance(p1,p2);
        if(dist_map[distance] == undefined){
            dist_map[distance] = [markers[i]];
        }
        else{
            dist_map[distance].push(markers[i]);
        }
        
    }
    
    let dist_array = [];
    for (let key in dist_map){
        dist_array[dist_array.length] = key;
    }
    dist_array.sort();
    
    let nearest_dict = {}
    let nearest = dist_array.slice(0,3);
    console.log(nearest);
    for(let i=0;i<3;i++){
        nearest_dict[nearest[i]] = dist_map[nearest[i]];
    }
    
    
    return nearest_dict;
        

}

var marker_list = [];

function drawMarkers(map) {
    fetch("all-locations")
        .then(function (response){
            return response.json()
            })
        .then(function (stationJSON){
            console.log(stationJSON);
            return stationJSON.map(function (station) {
                
                var marker = new google.maps.Marker({
                    position: {lat: station["latitude"], lng: station["longitude"]},
                    label: station["number"].toString()
                    });
//                console.log(marker.position.lat());
               
                marker.addListener("click", function(){
                    document.getElementById("popup-container").innerHTML = "<i>Loading...</i>";
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
            console.log("Individulal");
            console.log(marker_list);
        
            /*
            Input : Array of markers and users station latlong
            Output: Dictionary of 3 nearest stations
                    {distance : array of Latlongvalue}
            */
        
            let user_click_lat_long = [53.349809,-6.2624431];
            let nearest_station = getNearestMarkers(marker_list, user_click_lat_long)
            console.log(nearest_station);
            
            return new MarkerClusterer(map, markers, {
                imagePath: "../static/scripts/MarkerClusterer/m"
            });
        
        });


    
}

function currentData(singleJson,marker_list){
    document.getElementById("popup-container").innerHTML = `<h4 class="text-center">${singleJson["address"]}</h4>
    <dl class="dl-horizontal">
        <dt>Status</dt>
        <dd><span class = "label label-success">${singleJson["status"]}</span></dd>
        <dt>Bikes Available</dt>
        <dd><span class = "label label-primary">${singleJson["available"]}</span></dd>
        <dt>Free stands</dt>
        <dd><span class = "label label-primary">${singleJson["bikes"]}</span></dd>
    </dl>
    <h6 class="text-center">Last updated time is ${new Date(singleJson["timestamp"])}</h6>`;
}

//Reference : https://canvasjs.com/
function twentyFourHourGraph(multiJson){    
    var valuesDictionary = [];
    var f_ar = [];
    multiJson.forEach(function(days){
    
        var time = days["timestamp"];
        var available = days["available"];

   
    time_conver = function(time){
        var data = new Date(time);
        return data;
    };

    
    
    var value_i = parseInt(time);
    var available_i = parseInt(available);
  
    b_obj = {}
    b_obj.x = time_conver(value_i);
    b_obj.y = available_i;
    f_ar.push(b_obj);
 

    });
    

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

// REPLACE THIS!
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