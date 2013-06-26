var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);

mainApp
.factory('notify', function(utils, $dialog) {
  utilsService = utils;
  dialogService = $dialog;
  this.$dialog = $dialog;
  return {
  	reminder : function(data) {
  		var meeting_time = moment(moment(data.date).format("YYYY-MM-DD") + " " + data.time, "YYYY-MM-DD HH:mm a"); 
	    var send_at_day_before = moment(meeting_time).subtract('day', 1).format("YYYY-MM-DD HH:mm:ss");
	    var send_at_hour_before = moment(meeting_time).subtract('hour', 1).format("YYYY-MM-DD HH:mm:ss");
	    
	    var notify = this;
	    [{send_at:send_at_day_before, string:'Tomorrow at this time'}, {send_at:send_at_hour_before, string:'In one hour.'}]
	        .forEach(function(time) {
	            notify.email({
	              user: data.user,
	              subject: 'Video Meeting reminder',
	              html: time.string + ', ' + data.message,
	              path: data.path,
	              send_at: time.send_at
	            });
	        });         
  	},


  	me : function(text) {
		utilsService.log('showed notification', text);
	    var msgbox = dialogService.messageBox(text, '', [{label:'Cool', result: 'yes'}]);
	    msgbox.open().then(function(result){});
  	},

  	send : function(input) {
  	  this.event(input);
  	  
  	  var emailInput = input;
  	  emailInput.html = "<p>"+input.text+"<br/><a href='http://getbadgers.com/#/"+input.path+"'>Click here to view meeting</a></p>";
  	  emailInput.subject = "You got a new message in GetBadgers!";
  	  return this.email(emailInput);

  	},
  	event : function(input) {
  	  fbRef.child('events').child(input.user.id).push(
      {text: input.text,
       path: input.path || null,
       notificationId: input.notificationId || null,
       alert: true});
  	},
	email : function (input) {
		debugger;
		if (input.user.email == null || input.user.email == '') {
			utilsService.log('missing email');
		}
		
		var data = {
		    key: "EegAh79J9OmLAfvQ66NqZA",
		    message: {
		      html: input.html,
		      subject: input.subject,
		      from_email: "danny@getbadgers.com",
		      from_name: "Danny (getbadgers.com)",
		      to: [{email: input.user.email, name: input.user.name}],
		      // bcc_address: 'dannyjhaber@gmail.com'
		       bcc_address: 'abgutman1@gmail.com'
		    },
		    send_at: (input.send_at || '')
		}

	   return $.ajax({
	      type: 'POST',
	      url: 'https://mandrillapp.com/api/1.0/messages/send.json',
	      crossDomain: true,
	      data: data,
	      dataType: 'json',
	      success: function(a, b, c) {
	      	utilsService.log('email_sent',c.responseText);
	      	debugger;
	      },
	      error: function(a,b,c) {
	      	utilsService.log('email_fail',c.responseText);
	      	debugger;
	      }
	    });
	}
  }
})
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
.factory('utils', function($rootScope, $location, $cookies) {
  rootScopeService = $rootScope;
  locationService = $location;
  cookiesService = $cookies;

  return {
  	apply : function(scope) {
  	  return scope.$$phase || scope.$apply();;
  	},


  	log : function(event, extra) {
  		try
		{
			extra = extra? extra : '';
			var ip = this.getIP(); 
	  		var page = locationService.path();
	  		if (cookiesService.currentUser) {
	  		  var user = JSON.parse(cookiesService.currentUser);
	  		} else {
	  		  var user = rootScopeService.currentUser;
	  		}
			var userKey = user ? user.id  : this.fbClean(ip);

		  	var logKey = this.fbClean(this.timeOnlyStamp('(user:'+userKey+') (event:'+event+')'));
		  	var logValue = this.fbClean('(page:'+page+') (extra:'+extra+')');
		  	var log = {};
		  	log[logKey] = logValue;

			fbRef.child('logs/byDayAndUser').child(this.dayStamp()).child(userKey).update(log);
			fbRef.child('logs/byDayAndEvent').child(this.dayStamp()).child(event).update(log);

			mixpanel.identify(userKey);
			if(user) {
				mixpanel.people.set({
				    "name": user.name,
				    "$email": user.email,
				    "ip":ip
				});
			} else {
				mixpanel.people.set({"ip": ip});
			}
			mixpanel.track(event, {user:user, page:page, extra:extra});
		}
		catch(err)
	    {
	    	var error = {}
	    	error[this.timeStamp] = err;
	  		fbRef.child('errors').update(this.fbClean(error));
	    }
  	},
  	getIP : function() {
  	  return (typeof globalIp === 'undefined') ? '-' : globalIp;
  	},

  	dayStamp : function(extra) {
  	  return moment().format("YY:MM:DD") + ' ' + (extra || '');
  	},

  	timeOnlyStamp : function(extra) {
  	  return moment().format("HH:mm:ss:ms") + ' ' + (extra || '');
  	},

  	timeStamp : function(extra) {
  	  return moment().format("YY:MM:DD_HH:mm:ss") + ' ' + (extra || '');
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
	  if (string1 < string2) {
	    return string1 + "_" + string2;
	  } else {
	    return string2 + "_" + string1;
	  }
	},

	fbClean : function(string) {
	  return string.replace(/\./g,' ').replace(/\//g,' ').replace(/\#/g,' ').replace(/\$/g,' ').replace(/\[/g,' ').replace(/\]/g,' ');
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