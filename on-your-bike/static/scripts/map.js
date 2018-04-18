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
        var data = new Date(time)
        return data;
    }

    
    
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
