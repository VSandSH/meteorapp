// create a collection for the objects
Objects = new Meteor.Collection('objects');


// client side
if (Meteor.isClient) {
    Meteor.startup(function(){
	GoogleMaps.load();
    });

    
    Template.map.helpers({  
        mapOptions: function() {
            if (GoogleMaps.loaded()) {
                return {
                    center: new google.maps.LatLng(-37.8136, 144.9631),
        	    zoom: 8
                };
            }
        }
    });

    // Define default sessions
    Session.setDefault('showObjectUpdateDialog', false);
    Session.setDefault('showProjectDialog', false);
    Session.setDefault('update_object',null);
    Session.setDefault('showGeoUpdateDialog',false);


    // On objects page fetch only 4 fields out of 5; define popup forms
    Template.objects.helpers({
        settings: function () {
            return {
                collection: Objects,
                rowsPerPage: 15,
                showFilter: true,
                fields: [
		    {key:'type', label: 'Type'}, 
		    {key:'name', label:'Name'},
		    {key:'slevel',label:'Severity Level'},
		    {key:'description',label:'Description'}]
            };
        },

        showProjectDialog: function(){
	    return Session.get('showProjectDialog');
        },

        showObjectUpdateDialog: function(){
	    return Session.get('showObjectUpdateDialog');
        },

        objects: function(){
            return Objects.find().fetch();
        }
    });


    // Confirmation for deleting a doc and returning selected doc's ID to selectedDoc attribute in 'quickForm'
    Template.updatingForm.helpers({
        selectedDoc: function(){
	    //return Objects.findOne({_id: Session.get('update_object')});
	    return Session.get('update_object');
        },

        beforeRemove: function(){
	    return function(collection, id){
	        var doc = collection.findOne(id);
	        if(confirm('Really delete this "' + doc.type + '" named "' + doc.name + '"?')) {
		    this.remove();
	        }
	    }
        }
    });

    // return location's coordinates to selectedDoc attribute in 'quickForm'
    Template.editingForm.helpers({
        selectedDoc: function(){
            return Session.get('update_object');
        }
    });

    // show popup form on pressing a button and show a form for editing a doc
    Template.objects.events({
        'click .addObject': function(evt,tmpl){
	    Session.set('showProjectDialog', true);
        },
        'dblclick .reactive-table tbody tr': function(evt,tmpl){
	    Session.set('update_object', Objects.findOne({_id: this._id}));  // pass dblclicked document's ID to updatingForm
	    Session.set('showObjectUpdateDialog', true);
        }
    });

    // hides pop up forms if a doc is successfully inserted
    AutoForm.addHooks(['insertObjectForm','updateObjectForm'], {
	onSuccess: function() {
	    Session.set('showGeoUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
	}
    });

    // hide editing form
    Template.editingForm.events({
        'click .cancel': function(evt, tmpl){
            Session.set('showGeoUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
        },
        'click .close': function(evt, tmpl){
            Session.set('showGeoUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
        }
    });

    // hide updading form
    Template.updatingForm.events({
        'click .cancel': function(evt, tmpl){
            Session.set('showObjectUpdateDialog', false);
	    Session.set('update_object', null);
        },
        'click .close': function(evt, tmpl){
            Session.set('showObjectUpdateDialog', false);
	    Session.set('update_object', null);
        },
        'click .btn-danger': function(evt, tmpl){
	    Session.set('update_object', null);
	    Session.set('showObjectUpdateDialog', false);
        }
    });


    // Define shema for adding and updating forms
    Schemas = {};
    Template.registerHelper("Schemas", Schemas);
    Schemas.Obj = new SimpleSchema({

        type: {
	    type: String,
	    allowedValues: [
	        "Facility",
	        "Transportation",
	        "Territory",
	        "Infrastructure",
	        "Person",
	        "Undefined"
	    ]
        },
        name: {
	    type: String,
	    max: 100
        },
        slevel: {
	    type: Number,
            allowedValues: [
	        1,
	        2,
	        3,
	        4,
	        5,
	        6,
	        7,
	        8,
	        9,
	        10
	    ],
            defaultValue: "(Select One)",
            label: "Severity Level"
        },
        description: {
	    type: String,
	    max: 100
        },
        location: {
	    type: Object
        },
        'location.lat': {
	    type: Number,
	    decimal: true,
	    label: "Latitude" 
	},
        'location.lng': {
	    type: Number,
	    decimal: true,
	    label: "Longitude"
	}
    });

    // show pop up form for editing a doc
    Template.map.helpers({
        showGeoUpdateDialog: function(){
            return Session.get('showGeoUpdateDialog');
        }
    });


    Template.geoportal.onCreated(function(){  
        // declare markers array
	var markers = {};

        // when map is loaded  markers and its filters are initialized
        GoogleMaps.ready('map', function(map) {

	    // popup a form upon click on the map for inserting a new document into collection
	    google.maps.event.addListener(map.instance, 'click', function(event) {
	        Session.set('update_object', null);
	        Session.set('update_object', {location:{lat:event.latLng.lat(), lng: event.latLng.lng() }});   // pass location of clicked on a map point to updating form
	        Session.set('showGeoUpdateDialog', true);
	    });

	    // load icons for different types of entries
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
	
	    // array of selected values for filtering
	    var selectedFilters = new Array(); 

	    // get the array of elements of type "check box" except "fast selects"
    	    var x = document.getElementsByClassName('chBox');

	    // get the array of elements of type "check box" only for "select all" and "deselect all"
	    var y = document.getElementsByClassName('chBoxFast');

	    // process check boxes if "select all" or "deselect all" is checked
	    for (var i=0;i<y.length;i++){
	        y[i].addEventListener('click', function(){
	            if (this.checked && this.value == 'SelectAll') {
		        for (var j = 0; j < x.length; j++) {
            	            if (x[j].type == 'checkbox') {
                	        x[j].checked = true;
			        selectedFilters = ['Infrastructure','Person','Facility','Territory','Undefined','Transportation']; 
			        y[0].checked = false;
             	            }
         	        }
	            } else {
	                if (this.checked && this.value == 'DeselectAll'){
	                    for (var i = 0; i < x.length; i++) {
            	                if (x[i].type == 'checkbox') {
                                    x[i].checked = false;
			            y[1].checked = false;
			            selectedFilters = [];
			            //console.log(selectedFilters)
             	                }
         	            }
     	                }
		    }

		    // fetch markers/data of selected categories
		    setMarkers(selectedFilters);
	        });
	    }

	    // process check boxes if different categories are selected for filtering displayed data/markers
	    for(var i=0;i<x.length;i++){
	        x[i].addEventListener('click', function(){ 
		    if(this.checked){
		        selectedFilters.push(this.value);
	                console.log(this.value); 
		    } else {
		        var index = selectedFilters.indexOf(this.value);
                        if(index > -1){
                            selectedFilters.splice(index, 1);
                        }
		    }
		    // reset "select all" and "deselect all"
		    y[0].checked = false;
		    y[1].checked = false;

		    // fetch markers/data of selected categories
		    setMarkers(selectedFilters);
	        });
	    }

	    // initialized markers on the map
	    var setMarkers = function(selectedFilters){
	        // cleares all markers from the map
	        var keys = Object.keys(markers);
	        //console.log(keys);
	        for (var i = 0; i < keys.length; i++) {
    		    markers[keys[i]].setMap(null);
	        }
	        markers = [];

	        Objects.find({type:{ $in: selectedFilters}}).observe({
    	            added: function(document) {
        	        // Create a marker for this document
        	        var marker = new google.maps.Marker({
            	            //draggable: true,
            	            animation: google.maps.Animation.DROP,
            	            position: new google.maps.LatLng(document.location.lat, document.location.lng),
            	            map: map.instance,
	    	            icon: icons[document.type].icon,
            	            // We store the document _id on the marker in order 
             	            // to update the document within the 'dragend' event below.
            	            id: document._id
        	        });

		        // text template for infowindow of a marker
		        var infowindow = new google.maps.InfoWindow({
	    	            content:
			        '<div id="content">'+
			        '<div id="siteNotice">'+
			        '<h1 id="firstHeading" class="firstHeading">Object:</h1>'+
			        '<div id="bodyContent">'+
			        '<p><b>Type: </b>'+ document.type + '</p>' +
			        '<p><b>Name: </b>'+ document.name + '</p>' +
			        '<p><b>Severity Level: </b>'+ document.slevel + '</p>' +
			        '<p><b>Description: </b>'+ document.description + '</p>' +
			        '<p><b>Geolocation: </b></p>' + 
			        '<p><b>Latitude: </b> '+ document.location.lat + '</p>' +
			        '<p><b>Longitude: </b> '+ document.location.lng + '</p>' +
			        //'<button class="markerButton">Edit object</button>'+
			        '</div>'+
			        '</div>'
		        });

		        // pop up infowindow upon click on marker
		        google.maps.event.addListener(marker,'click', function(event){
	    	            console.log("marker clicked");
	    	            infowindow.open(map.instance, marker);
		        });

			/* irrelevant for now
        	        // This listener lets us drag markers on the map and update their corresponding document.
        	        google.maps.event.addListener(marker, 'dragend', function(event) {
            	            alert(event.latLng.lat() + " " + event.latLng.lng() + " (types: " + (typeof event.latLng.lat()) + ", " + (typeof event.latLng.lng()) + ")");
                            Objects.update(marker.id, { $set: { location: {lat: parseFloat(event.latLng.lat()), lng: parseFloat(event.latLng.lng()) }}});
        	        }); */

        	        // Store this marker instance within the markers object.
        	        markers[document._id] = marker;
		        //console.log(document._id);
	            }
  	        });
            }
        });
    /*	   
    var menu = document.querySelector('.nav');
    console.log(menu);
    var anchors = menu.getElementsByTagName('li');
    console.log(anchors.length);
    for (var i = 0; i < anchors.length; i += 1) {
        anchors[i].addEventListener('click', function() { clickHandler(anchors[i]) }, false);
    }

    function clickHandler(anchor) {
        var hasClass = anchor.getAttribute('class');
        if (hasClass !== 'active') {
            anchor.setAttribute('class', 'active');
        }
    } */

        if (Meteor.isServer){
            Meteor.publish(null, function () {
                return Objects.find();
            });
        }
    });
}
