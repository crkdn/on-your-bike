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
        var data = new Date(time)
        return data;
    }

    
   
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
