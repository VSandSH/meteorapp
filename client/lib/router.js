//FlowRouter.route('/',{
    //action: function(){
        //BlazeLayout.render("main", {content:"homepage"});
        //console.log("Hello");
    //}
//});
FlowRouter.route('/geoportal',{
    action: function(){
	BlazeLayout.render("main", {content:"geoportal"});
    }
});

FlowRouter.route('/',{
    action: function(){
	BlazeLayout.render("main", {content:"objects"});
    }
});
