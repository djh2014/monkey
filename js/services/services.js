var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);


mainApp
.factory('openTok', function() {
  return {
	getSessionAndToken : function () {
    	var session = "2_MX4yMTU1MTAxMn4xMjcuMC4wLjF-V2VkIEp1biAxOSAwMTozNjo0NyBQRFQgMjAxM34wLjI4NDQ2MDZ-"
    	var tokens = ["T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1lYTZhMmJhYTUzZmI5NGExNWYxOGUxNTJhMmM2YWVmZGY1YjFkNzU5OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDI3Jm5vbmNlPTAuMjgzNjIxNDI0MTQ2MTgwOTcmZXhwaXJlX3RpbWU9MTM3NDIyMzAzMiZjb25uZWN0aW9uX2RhdGE9"]//,
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz02OTI5NmVkNDc4MWE3NjE5ZDNiZTNlZjU5ZDNlODhhZjM1MzZiZGZjOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDQ3Jm5vbmNlPTAuNDk3NTAxMDQ4Nzc1NTYxNjcmZXhwaXJlX3RpbWU9MTM3NDIyMzA1MiZjb25uZWN0aW9uX2RhdGE9",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz01MzkwM2E5NWE5Yjg5MTEyNzU5YzA4NGIxNThhMGQ1NTY5ODMyYTc3OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDYwJm5vbmNlPTAuMDI5MTI5MTc3MDYwNzAzODM3JmV4cGlyZV90aW1lPTEzNzQyMjMwNjUmY29ubmVjdGlvbl9kYXRhPQ==",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1lMzRjMTcwOTIzZmIxMzBhOTA2NzYzNWM5NTliYmI1YTNlMmJjODRlOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDcxJm5vbmNlPTAuMjEyMTI0NDE2NjM0NzExMjcmZXhwaXJlX3RpbWU9MTM3NDIyMzA3NSZjb25uZWN0aW9uX2RhdGE9",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz0wY2VmMTljYjE5NjM4MDI2MzAwNzA1Zjk0YzRjNWZiNWRlN2U0NmQyOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDgwJm5vbmNlPTAuMzY0NjIyNjA4NDM1NTgxNSZleHBpcmVfdGltZT0xMzc0MjIzMDg1JmNvbm5lY3Rpb25fZGF0YT0=",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz0xMGVkN2IyZjZlMzRiNjk4NjM1MmM2MTE4YThiNWIzMGIwOGM0MTg5OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDg3Jm5vbmNlPTAuNjE0OTI0MTIwNzI0MDQyOCZleHBpcmVfdGltZT0xMzc0MjIzMDkyJmNvbm5lY3Rpb25fZGF0YT0=",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz1hNzUyYzY4NzBjOTFmNDM3YzZiNzdiNzE1MTAyM2E2OWU0ODJiYjdmOnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMDk5Jm5vbmNlPTAuNDc1MTE4MzQxNDU0MTU1NjYmZXhwaXJlX3RpbWU9MTM3NDIyMzEwMyZjb25uZWN0aW9uX2RhdGE9",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz03MzE0OGI4MzAyMzBjNTliZjkzMzAxZjMyYTkxMjNiNGU3NzFkYTY4OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMTA3Jm5vbmNlPTAuNDAzMTk2MjkwOTcyOTYwMTcmZXhwaXJlX3RpbWU9MTM3NDIyMzExMSZjb25uZWN0aW9uX2RhdGE9",
    				  // "T1==cGFydG5lcl9pZD0yMTU1MTAxMiZzZGtfdmVyc2lvbj10YnJ1YnktdGJyYi12MC45MS4yMDExLTAyLTE3JnNpZz0zYTdlMTM4MDNmMTI5NmIwNjIxOTcwMzA3ZDI0ZTc4NWJjY2VmOGM3OnJvbGU9cHVibGlzaGVyJnNlc3Npb25faWQ9Ml9NWDR5TVRVMU1UQXhNbjR4TWpjdU1DNHdMakYtVjJWa0lFcDFiaUF4T1NBd01Ub3pOam8wTnlCUVJGUWdNakF4TTM0d0xqSTRORFEyTURaLSZjcmVhdGVfdGltZT0xMzcxNjMxMTE4Jm5vbmNlPTAuODIyODUzMTY2OTcyMzkzMiZleHBpcmVfdGltZT0xMzc0MjIzMTIyJmNvbm5lY3Rpb25fZGF0YT0="];
    	var token = tokens[Math.floor(Math.random()*tokens.length)];
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