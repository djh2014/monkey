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
	}

  }
});