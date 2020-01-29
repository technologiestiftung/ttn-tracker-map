export function getRoute(end) {
  // make a directions request using cycling profile
  // start will always be the GPSnode -- only the end or destination will change
  const start = [13.385947, 52.485053];
  console.log('Starting point: ', start);

  // very depressing Mapbox GL API --> not working!
  // var url =
  //   'https://api.mapbox.com/directions/v5/mapbox/cycling/' +
  //   start[0] +
  //   ',' +
  //   start[1] +
  //   ';' +
  //   end[1] +
  //   ',' +
  //   end[0] +
  //   '?steps=true&geometries=geojson&access_token=' +
  //   mapboxgl.accessToken;

  let url2 =
    'http://osrm-docker-bikesharing-dev2.eu-central-1.elasticbeanstalk.com/route/v1/bicycle/' +
    start[0] +
    ',' +
    start[1] +
    ';' +
    end[0] +
    ',' +
    end[1] +
    '?geometries=geojson';

  console.log('API Url: ', url2);

  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  let req = new XMLHttpRequest();
  req.responseType = 'json';
  req.open('GET', url2, true);
  req.onload = function() {
    let data = req.response.routes[0];
    console.log('data aka. Request.response.routes[0]: ', data);
    var route = data.geometry.coordinates;
    var geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route,
      },
    };
    console.log('here i am: ', geojson);
    // if the route already exists on the map, reset it using setData
    // if (map.getSource('route')) {
    //   map.getSource('route').setData(geojson);
    // } else {
    //   // otherwise, make a new request
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
            coordinates: geojson,
          },
        },
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#11119f',
        'line-width': 5,
        'line-opacity': 0.65,
      },
    });

    // add turn instructions here at the end
  };
  req.send();
}
