var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);


mainApp
.factory('openTok', function() {
  return {
	getSessionAndToken : function () {
    	var session = "2_MX4yMTU1MTAxMn4xMjcuMC4wLjF-V2VkIEp1biAxOSAwMTozNjo0NyBQRFQgMjAxM34wLjI4NDQ2MDZ-"
    	var token = "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1lYTZhMmJhYTUzZmI5NGExNWYxOGUxNTJhMmM2YWVmZGY1YjFkNzU5OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDI3Jm5vbmNlPTAuMjgzNjIxNDI0MTQ2MTgwOTcmZXhwaXJlX3RpbWU9MTM3NDIyMzAzMiZjb25uZWN0aW9uX2RhdGE9";
    	// var token = tokens[Math.floor(Math.random()*tokens.length)];
    	return {token:token, session:session};
	}
  }
})
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
  	log : function(user, event, text) {
		var ip = globalIp;
	// 	if(user) {
	  	//   var logs = fbRef.child('logs/' +user.id);
	  	// } else {
	  	//   var logs = fbRef.child('logs/' +user.id);
	  	// }
  	},

  	timeStamp : function(extra) {
  	  return moment().format("YY:MM:DD_HH:mm:ss:ms") + '_' + extra;
  	},

  	random : function(size) {
  	  return Math.ceil(Math.random()*Math.pow(10,size));
  	},

  	convertTime : function(list, dateAttr) {
  	  return list.map(function(e, i) {
        if (e[dateAttr]) {
          e[dateAttr] = new Date(e[dateAttr]).getTime();
        }
        return e;
      })
  	},

  	removeHashKey : function(dic) {
  		var newDic = {}
  		for( key  in dic) {
  			newDic[key] =  dic[key];
  			delete newDic[key].$$hashKey;  
  		}
  		return newDic
  	},

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