Template.gMap.onRendered(function(){
    console.log('[+] gmap rendered');
    if(!Session.get('map')){
	gmap.initialize();  // initialize map once gMap template is rendered
    }

    var self = this;

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

    var setMarkers = function(selectedFilters){
        self.autorun(function(){
            // cleares all markers from the map
            var keys = Object.keys(gmap.markers);
            for (var i = 0; i < keys.length; i++) {
                gmap.markers[keys[i]].setMap(null);
                //google.maps.event.clearInstanceListeners(markers[keys[i]]);
                //delete markers[keys[i]];
            }
            gmap.markers = [];

	    // cleares all polygons from the map
	    var pKeys = Object.keys(gmap.polygons);
	    for (var j = 0; j < pKeys.length; j++){
	       gmap.polygons[pKeys[j]].setMap(null);
	    }
	    gmap.polygons = [];

            var docs = Objects.find({type:{ $in: selectedFilters}}).fetch();
			
	    // depending on filters type, draws either markers or polygons
	    docs.forEach(function(doc){
		if(doc.type == "Territory"){
		    gmap.addPoly(doc);
		}
		else {
		    gmap.addMarker(doc);
		}
	    });
        });
    };
});

Template.gMap.onDestroyed(function(){
    Session.set('map', false);
});
