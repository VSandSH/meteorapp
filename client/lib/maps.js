gmap = {	//define global variables
    map: null,
    markers: [],
    polygons: [],
    latlng: [],
    markerData: [],
    drawingManager: null,

    // adds polygons to map
    addPoly: function(polygon){
	var arr = [];
	polygon.polygonLoc.forEach(function(latlng){
	    var obj = {};
	    Object.keys(latlng).forEach(function(key){
		if(key == "H"){
		    obj["lat"]= latlng[key];
		}
		else {
		    obj["lng"]= latlng[key];
		}
	    });
	    arr.push(obj);
	});
	
	var gPolygon = new google.maps.Polygon({
	    strokeColor: '#FF0000',
    	    strokeOpacity: 0.8,
    	    strokeWeight: 2,
    	    fillColor: '#FF0000',
    	    fillOpacity: 0.35,
	    editable: true
	});

	var infowindow = new google.maps.InfoWindow({
	                content:
                            '<div id="content">'+
                            '<div id="siteNotice">'+
                            '<h1 id="firstHeading" class="firstHeading">Object:</h1>' +
                            '<div id="bodyContent">'+
                            '<p><b>Type: </b>'+ polygon.type + '</p>' +
                            '<p><b>Name: </b>'+ polygon.name + '</p>' +
                            '<p><b>Severity Level: </b>'+ polygon.slevel + '</p>' +
                            '<p><b>Description: </b>'+ polygon.description + '</p>' +
                            '</div>'+
                            '</div>'
	});

	gPolygon.addListener('click', function(event){
	    infowindow.open(this.map);
	    infowindow.setPosition(event.latLng);
	});


	gPolygon.setPath(arr);
	gPolygon.setMap(this.map);
	this.polygons[polygon._id] = gPolygon;
	return gPolygon;
    },

    // adds markers to map
    addMarker: function(marker){

	var iconBase = 'http://www.google.com/mapfiles/ms/micons/';
            var icons = {
                Transportation: {
                    icon: iconBase + 'blue-dot.png'
                },
                Person: {
                    icon: iconBase + 'red-dot.png'
                },
                Territory: {
                    icon: iconBase + 'green-dot.png'
                },
                Facility: {
                    icon: iconBase + 'yellow-dot.png'
                },
                Infrastructure: {
                    icon: iconBase + 'pink-dot.png'
                },
                Undefined: {
                    icon: iconBase + 'orange-dot.png'
                }
            };

	var coordinates = new google.maps.LatLng(marker.location.lat, marker.location.lng);
	var gMarker = new google.maps.Marker({
	    position: coordinates,
	    map: this.map,
	    icon: icons[marker.type].icon,
	    //animation: google.maps.Animation.DROP,
	    id: marker._id
	});

	this.markers[marker._id] = gMarker;

        // text template for infowindow of a marker
        var infowindow = new google.maps.InfoWindow({
                content:
                            '<div id="content">'+
                            '<div id="siteNotice">'+
                            '<h1 id="firstHeading" class="firstHeading">Object:</h1>' +
                            '<div id="bodyContent">'+
                            '<p><b>Type: </b>'+ marker.type + '</p>' +
                            '<p><b>Name: </b>'+ marker.name + '</p>' +
                            '<p><b>Severity Level: </b>'+ marker.slevel + '</p>' +
                            '<p><b>Description: </b>'+ marker.description + '</p>' +
                            '<p><b>Geolocation: </b></p>' +
                            '<p><b>Latitude: </b> '+ marker.location.lat + '</p>' +
                            '<p><b>Longitude: </b> '+ marker.location.lng + '</p>' +
                            //'<button class="markerButton">Edit object</button>'+
                            '</div>'+
                            '</div>'
        });

        // pop up infowindow upon click on marker
        google.maps.event.addListener(gMarker,'click', function(event){
            console.log("marker clicked");
                infowindow.open(this.map, gMarker);
        });

	return gMarker;
    },

    // initializes map and enables drawing polygons on map
    initialize: function(){
	console.log('[+] map initialization');
	var mapOptions = {
	    zoom: 8,
	    center: {lat: -37.8136, lng: 144.9631},
	    //mapTypeId: google.maps.MapTypeId.HYBRID
	};

	this.map = new google.maps.Map(
	    document.getElementById('map-canvas'),
	    mapOptions
	);

        this.drawingManager = new google.maps.drawing.DrawingManager({
    	    drawingMode: google.maps.drawing.OverlayType.MARKER,
    	    drawingControl: true,
    	    drawingControlOptions: {
      		position: google.maps.ControlPosition.TOP_CENTER,
      		drawingModes: [
        	    google.maps.drawing.OverlayType.MARKER,
        	    google.maps.drawing.OverlayType.POLYGON
      		]
    	    }
  	});
  	this.drawingManager.setMap(this.map);



	// popup a form upon click on the map in marker mode for inserting a new document into collection
   	google.maps.event.addListener(this.drawingManager, 'markercomplete', function(event) {
            Session.set('update_object', null);
            Session.set('update_object', {location:{lat:event.getPosition().lat(), lng: event.getPosition().lng() }});   // pass location of clicked o$
            Session.set('showGeoUpdateDialog', true);
            Session.set('createMarkerObject', true);
            event.setMap(null);
    	});

	//popup a form after polygon is drawn on the map in polygon mode for inserting a new document into collection
   	google.maps.event.addListener(this.drawingManager, 'polygoncomplete', function(event) {
            Session.set('update_object', null);
            Session.set('update_object', {polygonLoc: event.getPath().getArray()});   // pass coordinates of drawn polygon
            Session.set('showGeoUpdateDialog', true);
            Session.set('createPolygonObject', true);
            event.setMap(null);
    	});

	Session.set('map', true);
    }
}
