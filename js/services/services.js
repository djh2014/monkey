var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);

mainApp
.factory('db', function() {
  return {
	get : function (scope, dbAddress, scopeName, cb) {
    	fbRef.child(dbAddress).on('value', function(item) {
	    	scope[scopeName] = item.val();
	        if(cb) {
	        	cb();
	        }
	        scope.$apply();
	  	});
	}
  }
})
.factory('utils', function() {
  return {
	listValues : function(listObject) {
	  var res = []
	  for(key in listObject) {
	  	var object = listObject[key];
	  	object.id = key; 
	    res.unshift(object);
	  }
	  return res;
	},

	genKey : function(string1, string2) {
	  if(string1 < string2){
	    return string1 + "_" + string2;
	  } else {
	    return string2 + "_" + string1;
	  }
	},

	fbClean : function(string) {
	  return string.replace(/\./g,' ').replace(/\#/g,' ').replace(/\$/g,' ').replace(/\[/g,' ').replace(/\]/g,' ');
	},

    range: function(start, stop, step){
	    if (typeof stop=='undefined'){
	        // one param defined
	        stop = start;
	        start = 0;
	    };
	    if (typeof step=='undefined'){
	        step = 1;
	    };
	    if ((step>0 && start>=stop) || (step<0 && start<=stop)){
	        return [];
	    };
	    var result = [];
	    for (var i=start; step>0 ? i<stop : i>stop; i+=step){
	        result.push(i);
	    };
	    return result;
	}
  }
});