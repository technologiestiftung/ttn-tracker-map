/* eslint-disable no-undef */

require("babel-core/register");
require("babel-polyfill");
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

const main = async ()=>{


const serverUrl = 'https://bnjmn.uber.space';
mapboxgl.accessToken = 'pk.eyJ1IjoiYm5qbW5zYmwiLCJhIjoiY2luc3Qxajk4MDBsY3Zza2x1MWg1b2xzeCJ9.BK1MmHruCVZvMFnL_uTC1w';

//+++ MAP
//+++ general setting for map appearance +++
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [13.404954, 52.520008],
  zoom: 12,
  minZoom: 6,
  maxZoom: 18,
  pitch: 45, //angle from plane view
  trackResize: true,
  maxBounds: bounds
});

// Set bounds to Berlin
var bounds = [
  [52.470896, 13.290829], // Southwest coordinates
  [52.550666, 13.487605]  // Northeast coordinates
  ];

// initialize the map canvas to interact with later for routing
var canvas = map.getCanvasContainer();

// initalize a starting point for routing
var start = [52.52437, 13.41053];


//+++ FUNCTIONS


// +++ function to user location on the map (blue dot) +++
// +++  important: only works within save environment (https or localhost) +++
const geoLocate = new mapboxgl.GeolocateControl({
  positionOptions: {
      enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserLocation: true
})
map.addControl(geoLocate);

// +++ zoom in part
// +++ prperty center has to be nodeCoords
geoLocate.on('geolocate', function() {
  map.zoomIn({
    zoom: 20
  });
});

// +++ function to show metric scale in the bottom left
var scale = new mapboxgl.ScaleControl({
  maxWidth: 320,
  unit: 'metric'
});
map.addControl(scale);
scale.setUnit('metric');


//+++ function to get route from starting point (Node) to another point (User)
function getRoute(end) {
  // make a directions request using cycling profile
  // start will always be the GPSnode -- only the end or destination will change
  var start = [52.52437, 13.41053];
  console.log(start);

  var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;
  console.log(url);

  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', url, true);
    req.onload = function() {
      var data = req.response.routes[0];
      console.log(data);
      var route = data.geometry.coordinates;
      console.log(route);
      var geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      };
      // if the route already exists on the map, reset it using setData
      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      } else { // otherwise, make a new request
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: geojson
              }
            }
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
      // add turn instructions here at the end
    };
    req.send();
}

map.on('load', function() {
    // make an initial directions request that
    // starts and ends at the same location
    getRoute(start);
  
    // Add starting point to the map
    map.addLayer({
      id: 'start',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: start
            }
          }
          ]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#3887be'
      }
    });
    
    map.on('click', function(e) {
      var coordsObj = e.lngLat;
      console.log('destination:  ',coordsObj);
      canvas.style.cursor = '';
      var endCoords = Object.keys(coordsObj).map(function(key) {
        return coordsObj[key];
      });
      console.log('Koordinaten destina  tion: ', endCoords);
      var end = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: endCoords
          }
        }
        ]
      };
      if (map.getLayer('end')) {
        map.getSource('end').setData(end);
      } else {
        map.addLayer({
          id: 'end',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: endCoords
                }
              }]
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#f30'
          }
        });
      }
      getRoute(endCoords);
    });    
  });

// +++ function to add pulsing dot for tracker node
map.on('load', async function () {
    const nodeCoords = await getData();
    const labelLayerId = getlabelLayerId();
    const pulsingDot = getPulsingDot();

    add3dbuildingLayer(labelLayerId);
    addPulsingDot(pulsingDot, nodeCoords);
  

  // +++ jump to location of tracker node
    map.jumpTo({ 'center': nodeCoords});

    //   function updateMarker () {
          //if myCoords.timestamp.getData() > ....
    //   }

    // +++ function to set color of buildings by zooming in and out
    map.setPaintProperty('building', 'fill-color', [
      "interpolate",
      ["exponential", 0.5],
      ["zoom"],
      15,
      "rgba(49, 96, 227, 1)",
      22,
      "rgba(49, 96, 227, 0.5)"
      ]);
        
    map.setPaintProperty('building', 'fill-opacity', [
      "interpolate",
      ["exponential", 0.5],
      ["zoom"],
      15,
      0,
      22,
      1
      ]);

    // ++ function to zoom in by clicking on button
    document.getElementById("zoomBtn").addEventListener('click', async function(){
      var nodeCoords = await getData();
      map.flyTo({
        center: [nodeCoords[0], nodeCoords[1]],   
        zoom: 20
      });
    });
});


//+++ adds navigation control to zoom in and out
map.addControl(new mapboxgl.NavigationControl());

function getlabelLayerId() {

  // Insert the layer beneath any symbol layer.
  var layers = map.getStyle().layers;

  var labelLayerId;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      return labelLayerId;
    }
  }
}

function add3dbuildingLayer(labelLayerId) {
  map.addLayer(
    {
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': '#aaa',

        // use an 'interpolate' expression to add a smooth transition effect to the
        // buildings as the user zooms in
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );
}

//+++ add pulsing dot for the lora node (magenta dot)
function getPulsingDot() {
  const size = 120;

  const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd: function() {
      var canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },

    render: function() {
      var duration = 1500;
      var t = (performance.now() % duration) / duration;

      var radius = (size / 2) * 0.3;
      var outerRadius = (size / 2) * 0.7 * t + radius;
      var context = this.context;

      // draw outer circle
      context.clearRect(0, 0, this.width, this.height);
      context.beginPath();
      context.arc(
        this.width / 2,
        this.height / 2,
        outerRadius,
        0,
        Math.PI * 2
      );
      context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
      context.fill();

      // draw inner circle
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255, 100, 100, 1)';
      context.strokeStyle = 'white';
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();

      // update this image's data with data from the canvas
      this.data = context.getImageData(0, 0, this.width, this.height).data;

      // keep the map repainting
      map.triggerRepaint();

      // return `true` to let the map know that the image was updated
      return true;
    }
  };
  return pulsingDot;
}

function addPulsingDot(pulsingDot, coords) {
  map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

  map.addLayer({
    id: 'points',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',

              coordinates: coords
            }
          }
        ]
      }
    },
    layout: {
      'icon-image': 'pulsing-dot'
    }
  });

}

//here is where the ttn payload will be parsed as JSON
async function getData() {
  const response = await fetch(serverUrl + '/api/payloads/5da57802729dac6e5dc87c4c');
  const myJson = await response.json();
  // findLastValidCoords(myJson.reverse()); would return first data
  let validCoords = findLastValidCoords(myJson);
  return validCoords;
}

function getUserLoc() {
  if ("geolocation" in navigator) { 
    navigator.geolocation.getCurrentPosition(position => { 
        var lat = position.coords.latitude;
        var long = position.coords.longitude; 
        var result = [lat, long];
        return result;
    }); 
  } else { /* geolocation IS NOT available, handle it */
    popupBuild();
  }
}

function popupBuild(){
  var popup = new mapboxgl.Popup({closeOnClick: false})
  .setLngLat([-96, 37.8])
  .setHTML('<h1>Route wird erst angezeigt, wenn User Location aktiv ist</h1>')
  .addTo(map);
  }

function findLastValidCoords(arr) {
  let i = arr.length-1;
  for (i, i>=0; i--;) {
    if (hasPayload(arr[i])) {
      if (hasLatLong(arr[i])) {
        let result = [];
        result.push(arr[i].payload.longitude);
        result.push(arr[i].payload.latitude);
        return result;
      }
    }
  }

  function hasPayload(obj) {
    if (obj.payload) {
      return true;
    } else {
      return false;
    }
  }

  function hasLatLong(obj) {
    if (obj.payload.longitude && obj.payload.latitude) {
      return true;
    } else {
      return false;
    }
  }
}


}

main().catch(err =>{
  console.error(err);
})