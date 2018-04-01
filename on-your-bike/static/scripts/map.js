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
                            return `<h3>${dynamicDataJSON["address"]}</h3>
<b>Status:</b> ${dynamicDataJSON["status"]}<br>
<b>Bikes Available:</b> ${dynamicDataJSON["bikes"]}<br>
<b>Free Stands:</b> ${dynamicDataJSON["available"]}<br>
<small>Last updated: ${new Date(dynamicDataJSON["timestamp"])}</small>`
                        }).then(function(popupContent){
                            document.getElementById("popup-container").innerHTML = popupContent;
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