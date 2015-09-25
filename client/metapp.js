// create a collection for the objects
Objects = new Meteor.Collection('objects');


// client side
if (Meteor.isClient) {
    Meteor.startup(function(){
    });

    Template.map.helpers({  
    });

    // Define default sessions
    Session.setDefault('showObjectUpdateDialog', false);
    Session.setDefault('showProjectDialog', false);
    Session.setDefault('update_object',null);
    Session.setDefault('showGeoUpdateDialog',false);
    //Session.setDefault('marker', null);
    Session.setDefault('createPolygonObject', false);
    Session.setDefault('createMarkerObject', false);
    Session.setDefault('fieldIsTerritory', false);
    Session.setDefault('map', false);

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


    Template.updatingForm.helpers({
        // returning selected doc's ID to selectedDoc attribute in 'quickForm'
        selectedDoc: function(){
	    //return Objects.findOne({_id: Session.get('update_object')});
	    return Session.get('update_object');
        },

        // depending on the type of selected document display in pop-up update-form relevant geo-fields
	typeIsTerritory: function(){
	    var doc =  Session.get('update_object');
	    //console.log(doc.type);
	    if(doc != null){
	    if(doc.type == 'Territory')
		Session.set('fieldIsTerritory', true);
	    else
		Session.set('fieldIsTerritory', false);}
	    return Session.get('fieldIsTerritory');
	},

	//  Confirmation for deleting a doc
        beforeRemove: function(){
	    return function(collection, id){
	        var doc = collection.findOne(id);
	        if(confirm('Really delete this "' + doc.type + '" named "' + doc.name + '"?')) {
		    this.remove();
	        }
	    }
        }
    });

    Template.editingForm.helpers({
        // return location's coordinates to selectedDoc attribute in 'quickForm'
        selectedDoc: function(){
            return Session.get('update_object');
        },

	// if a new object is created (not on map), set modifiable fields for geo-coordinates, otherwise (if on map) set non-modifiable fields for geo-coordinates
	addingNewObject: function(){
	    return Session.get('createNewObject');
	},

	// depending on where the object is created, set correct values for drop-down select "type" field
        optionsList: function(){
	    if(Session.get('createPolygonObject')){
                    return [{label:"Territory", value: "Territory"}];
            }
	    if(Session.get('createMarkerObject')){
		return [{label:"Facility", value: "Facility"},{label: "Transportation", value: "Transportation"},{label: "Infrastructure", value:"Infrastructure"},{label:"Person", value: "Person"},{label:"Undefined", value:"Undefined"}];
	    }
            if(Session.get('createNewObject')){
                return [{label:"Facility", value: "Facility"},{label: "Transportation", value: "Transportation"},{label:"Territory", value: "Territory"},{label: "Infrastructure", value:"Infrastructure"},{label:"Person", value: "Person"},{label:"Undefined", value:"Undefined"}];
            }
	}
    });


    // show popup form on pressing a button and show a form for editing a doc
    Template.objects.events({
        'click .addObject': function(evt,tmpl){
	    Session.set('showProjectDialog', true);
	    Session.set('createNewObject', true);
        },
        'dblclick .reactive-table tbody tr': function(evt,tmpl){
	    Session.set('update_object', Objects.findOne({_id: this._id}));  // pass dblclicked document's ID to updatingForm
	    Session.set('showObjectUpdateDialog', true);
	    //Session.set('createNewObject', true);
        }
    });

    // hides pop up forms if a doc is successfully inserted
    AutoForm.addHooks(['insertObjectForm','updateObjectForm'], {
	onSuccess: function() {
	    Session.set('showGeoUpdateDialog', false);
	    Session.set('showObjectUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
	    //Session.set('showGeoUpdateDialog', false);
	    Session.set('createPolygonObject', false);
            Session.set('createMarkerObject', false);
            Session.set('createNewObject', false);
	}
    });

    // hide editing form
    Template.editingForm.events({
        'click .cancel': function(evt, tmpl){
            Session.set('showGeoUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
	    Session.set('createPolygonObject', false);
	    Session.set('createMarkerObject', false);
	    Session.set('createNewObject', false);
        },
        'click .close': function(evt, tmpl){
            Session.set('showGeoUpdateDialog', false);
	    Session.set('showProjectDialog', false);
	    Session.set('update_object', null);
	    Session.set('createPolygonObject', false);
            Session.set('createMarkerObject', false);
            Session.set('createNewObject', false);
        },
	'click .submButton': function(evt, tmpl){
	    evt.preventDefault();
	    if(AutoForm.validateField("insertObjectForm", "type") && 
		AutoForm.validateField("insertObjectForm", "name") && 
		AutoForm.validateField("insertObjectForm", "slevel") && 
		AutoForm.validateField("insertObjectForm", "description") && 
		AutoForm.validateField("insertObjectForm", "location")){
	    console.log(AutoForm.validateField("insertObjectForm","name"));
	    var formValues = AutoForm.getFormValues("insertObjectForm").insertDoc;
	    Objects.insert(formValues);				// save form to database
	    Session.set('showProjectDialog', false);}
	    //else {console.log(AutoForm.validateField("insertObjectForm","type"))} 
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
	    type: String
        },
        name: {
	    type: String,
	    optional: false,
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
	},
	polygonLoc: {
	    type: Array
	},
	'polygonLoc.$': {
	    type: Object
	},
	'polygonLoc.$.H': {
	    type: Number,
	    decimal: true,
	    label: "Latitude"
	},
        'polygonLoc.$.L': { 
            type: Number,
            decimal: true,
	    label: "Longitude" 
        }
    });

    /*// show pop up form for editing a doc
    Template.map.helpers({
        showGeoUpdateDialog: function(){
            return Session.get('showGeoUpdateDialog');
        }
    });*/

    // show pop up form for editing a doc
    Template.gMap.helpers({
        showGeoUpdateDialog: function(){
            return Session.get('showGeoUpdateDialog');
        }
    });


    Objects.allow({
        insert: function () {
            return true;
        },
        remove: function () {
            return true;
        }
    });

    if (Meteor.isServer){
        Meteor.publish(null, function () {
            return Objects.find();
        });
    }

}
