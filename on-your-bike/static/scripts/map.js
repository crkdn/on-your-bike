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
            return response.json()})
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
                            return response.json();
                        })
                        .then(function(dynamicDataJSON){
                            currentData(dynamicDataJSON[0]);
                            twentyFourHourGraph(dynamicDataJSON);
                        });
                });
                return marker;
            });
        })
        .then(function (markers){
            return new MarkerClusterer(map, markers, {
                imagePath: "../static/scripts/MarkerClusterer/m"
            });
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
    // Do something
}