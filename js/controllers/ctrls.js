var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

mainApp = angular.module('mainApp', ['ngCookies', 'firebase', '$strap.directives', 'ui.calendar', 'ui.bootstrap.dialog'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/messages/:userId', {controller:MeetingsCtrl, templateUrl:'meetings.html'}).
      when('/meeting/:userId1/:userId2', {controller:MeetingCtrl, templateUrl:'meeting.html'}).
      when('/profile/:userId', {controller:ProfileCtrl, templateUrl:'profile.html'}).
      when('/test', {controller:TestCtrl, templateUrl:'test.html'}).
      otherwise({redirectTo:'/'});
  }).run(["$rootScope", "$location", "$modal", "$q", "$dialog","utils", "$cookies", "notify",
     function ($rootScope, $location, $modal, $q, $dialog, utils, $cookies, notify) {
      $rootScope.global = {};
      $rootScope.$on("$routeChangeStart", function(event, next, current) {
        utils.log('change page');        
      });
     }
  ]);

function TestCtrl($rootScope, $scope, $location, utils, $cookies, $dialog) {
  watch('test');
}

function watch(watch_id, cb) {
  // TEMP:
  $(document).ready(function() {
    var watchRef = fbRef.child('watch').child(watch_id);
    var init = false;
    watchRef.child('time').on('value', function(time) {
      time = time.val();
      if (!init) {
        init = true;
        if (time) {
          $('#watch').stopwatch({startTime: time});
        } else {
          $('#watch').stopwatch();
          watchRef.update({state:'start'});
        }
        watchRef.child('state').on('value', function(state) {
        var state =state.val();
        if (state) {
          if (state == "start") {
            $('#watch').stopwatch('start');
          }
          if (state == "stop") {
            $('#watch').stopwatch('stop');
          }
          if (state == "reset") {
            $('#watch').stopwatch('destroy');
            $('#watch').stopwatch();
            watchRef.update({state:'start', time:0});
          }
        }
        });

        $('#watch').bind('tick.stopwatch', function(e, elapsed) {
        if ((elapsed % 1000) == 0) {
            if(cb) {
              cb(elapsed);
            }
            var time = $('#watch').stopwatch('getTime');
            watchRef.update({time:time})
          }
        });

        $('#start').click(function() {
          watchRef.update({state:'start'});
        });
        $('#stop').click(function() {
          watchRef.update({state:'stop'});
        });
        $('#reset').click(function() {
          watchRef.update({state:'reset'});
        });
      }
    });
  });
}


function LoginCtrl($rootScope, $scope, $location, utils, $cookies, $dialog) {
  utils.log('load_website');
  if ($cookies.currentUser) {
    $rootScope.currentUser = JSON.parse($cookies.currentUser);
    $rootScope.$broadcast("currentUserInit");
  } else {
    $rootScope.currentUser = null;
  }

  $scope.authClient = new FirebaseAuthClient(fbRef, function(error, facebookUser) {
    // If login:
    if (facebookUser) {
      var id = utils.fbClean(facebookUser.username || facebookUser.id);

      var currentUserRef = fbRef.child("users").child(id);
      currentUserRef.on('value', function(FBUser) {
          
          $rootScope.currentUser = jQuery.extend($rootScope.currentUser, FBUser.val());
          $cookies.currentUser = JSON.stringify($rootScope.currentUser);
          $rootScope.$broadcast("currentUserInit");
          
          // Handle new user: 
          if (!$rootScope.currentUser.facebook) {
            currentUserRef.update({
              user: facebookUser.username || "", name: facebookUser.name || "", id: id, email: facebookUser.email || "", facebook: facebookUser || "",
              img: "http://graph.facebook.com/"+ facebookUser.id+"/picture?type=large" || ""});
            $scope.openDialog();
          }

          $scope.$apply();
      }); 
    // Not login:
    } else {
      $rootScope.currentUser = null;
      delete $cookies.currentUser
      $rootScope.$broadcast("currentUserInit");
      // not login user should go home.
      $location.path('/');
      $scope.$apply();
    }
  });

  $scope.openDialog = function() {
    utils.log('started registration dialog');
    var d = $dialog.dialog({templateUrl:  '/skills-dialog.html',controller: 'SkillsDialogCtrl',
    backdrop: true, keyboard: false,backdropClick: false});
    d.open().then(function(result){});
    $location.path('stream/');
    $scope.$apply();
  }

  $scope.facebookLogin = function() {
    utils.log('click facebook login');
    $scope.authClient.login('facebook', {rememberMe: true});
  }

  $scope.logOut = function() {
    utils.log('click logout');
    $scope.authClient.logout();
    $location.path('/');
  }
}

function EventCtrl($rootScope, $scope, $location, utils, $cookies, $dialog, notify) {
  $rootScope.activeNotification = [];
  $scope.eventAlreadyNotified = [];

  $rootScope.$on("currentUserInit", function() {
    if($rootScope.currentUser) {
      $rootScope.myEventsRef = fbRef.child('events').child($rootScope.currentUser.id);
      $rootScope.myEventsRef.on('child_added', function(eventObject) {
        var newEvent = eventObject.val();
        newEvent.id = eventObject.name();

        if ((newEvent.alert == true) &&
            ($.inArray(newEvent.id, $scope.eventAlreadyNotified) == -1)) {
          $rootScope.processEvent(newEvent);
        }
      });
      $scope.$apply();
    }
  });

  $rootScope.resetActiveNotifications = function() {
    $rootScope.activeNotification = [];
  }

  $rootScope.processEvent = function(newEvent) {
    $scope.eventAlreadyNotified.push(newEvent.id);
    $rootScope.activeNotification.push(newEvent.notificationId);
    $rootScope.myEventsRef.child(newEvent.id).update({alert:false});
    notify.me(newEvent.text);
    $location.path(newEvent.path);
    $scope.$apply();
  }
}

function MeetingsCtrl ($rootScope, $routeParams, $scope, $location, utils, db, notify) {
  db.get($scope, 'meetings', 'meetings', function() {
    $scope.meetings = utils.listValues($scope.meetings);
    $scope.meetings = $scope.meetings.filter(function(e, i) {
      return e.teacher.id == $routeParams.userId || e.student.id == $routeParams.userId;
    });
    $scope.meetings = utils.convertTime($scope.meetings, 'day');
    // Show active notification: (can be delete)
    $scope.meetings = $scope.meetings.map(function(m ,i) {
    if (m.id in $scope.activeNotification) {
      m.active = true;
    }
    return m;
  });
  // empty active notification:
  $scope.activeNotification = []

  $scope.$apply();
});

  $scope.approve = function(meeting) {
    utils.log('approve meeting', meeting.id);
    fbRef.child("meetings").child(meeting.id).update(
      {status:"APPROVED", activeForUserId:meeting.student.id});

    notify.send({
      user: meeting.student,
      text: 'Your meeting request with ' + $rootScope.currentUser.name + ' was approved, we will send you both an email reminder one hour, and one day before your video meeting',
      path: 'messages/' + meeting.student.id,
      notificationId: meeting.id,
    });

    notify.me('Cool! we will send you both an email reminder one hour, and one day before the video meeting');
    // Send reminders:
    var data = 
      {
        date: meeting.day,
        time: meeting.time,
        user: meeting.student,
        path: 'meeting/' + meeting.student.id +'/' + meeting.teacher.id,
        message: 'you have a video meeting, we hope you are pump, and ready.'
      };
    notify.reminder(data);
    data.user = meeting.teacher;
    notify.reminder(data);
  }

  $scope.reject = function(meeting, status) {
    utils.log('rejact meeting', meeting.id);
    fbRef.child("meetings").child(meeting.id).update(
      {status:"REJECT", activeForUserId:meeting.student.id});
    
    notify.send({
      user: meeting.student,
      text: 'Your meeting request with ' + $rootScope.currentUser.name + " was rejected, no worries, I'm sure another user would be able to help you",
      path: 'messages/' + meeting.student.id,
      notificationId: meeting.id,
    });

    notify.me('Oh well, next time.');
  }
}

function ProfileCtrl($scope, $rootScope, $location, $routeParams, db, utils, $dialog, notify) {
  $scope.userId = $routeParams.userId;

  $scope.editSkillsMode = false;
  if($routeParams.edit) {
    $scope.editSkillsMode = true;
  }
  $scope.editSkills = function() {
    utils.log('start edit skill in profile page');
    $scope.editSkillsMode = true; 
  }

  $scope.viewedUserRef = fbRef.child("users").child($routeParams.userId);

  $scope.viewedUserRef.on('value', function(viewedUser) { 
    $scope.user = viewedUser.val();
    $scope.user.id = $routeParams.userId;
    $scope.user.badgersArray = utils.range($scope.user.badgers);
    if($scope.user.requests) {
      $scope.user.requests = Object.keys($scope.user.requests);
    }
    $scope.$apply();
  });

  $scope.saveSkills = function() {
      utils.log('save skills in profile page');

      fbRef.child("users").child($scope.user.id).update($scope.user);
      if ($scope.user.skills && $scope.user.skills != '') {
        $scope.editSkillsMode = false;
      } else {
        notify.me("For people to be able to ask for your advice let us know what are your skills.");
      }
    }

  $scope.setRequest = function() {
    utils.log('open dialog meeting request', $scope.user.id);
    if($rootScope.currentUser) {
      var d = $dialog.dialog({templateUrl: '/request-dialog.html',controller: 'MeetingRequestDialogCtrl',
      resolve: {user: function(){ return $scope.user;}} });
      d.open().then(function(result){
        if (result == 'ok') {
            utils.log('send meeting request', $scope.user.id);
            // Send event(notifacation).
        } else {
          utils.log('close meeting request', $scope.user.id);
        }
      });
    } else {
      notify.me("you need to sign in first");
    }
  }
}

// the dialog is injected in the specified controller
function MeetingRequestDialogCtrl($rootScope, $location, $scope, utils, dialog, user, notify) {
  $scope.date = (new Date());
  $scope.message = "Hey let's have a video meeting.";
  $scope.time = "6:00 PM";
  $scope.sendMessage = function() {
    var meeting = {}
    var meetingKey = utils.genKey(user.id, $rootScope.currentUser.id);
    $scope.date = $scope.date ? $scope.date.toString() : '';
    meeting[meetingKey] = {
      'active':true,
      'teacher': user, 'student': $rootScope.currentUser,
      'status': "NEW", 'id': meetingKey, 'day':$scope.date.toString(), 'time':$scope.time,
      'text': $scope.message, 'speaker': $rootScope.currentUser, 'activeForUserId':user.id};
    fbRef.child('meetings').update(meeting);
    notify.send({
       user: user,
       text: $rootScope.currentUser.name + ' wants to have a video session with you',
       path:'messages/' + user.id,
       notificationId: meetingKey,
    });
    notify.me('We notify ' + user.name + ". And we'll notify you via email once he approve.");
    $location.path('messages/' + $rootScope.currentUser.id);

    dialog.close('ok');
  }
} 

function VideoCtrl($rootScope, $routeParams, $scope, $location, utils, db, openTok) {
  var sessionAndToken = openTok.getSessionAndToken();
  
  //temp
  $scope.streams = [];

  TB.addEventListener("exception", exceptionHandler);
  var session = TB.initSession(sessionAndToken.session);
  session.addEventListener("sessionConnected", sessionConnectedHandler);
  session.addEventListener("streamCreated", streamCreatedHandler);
  session.connect(21551012, sessionAndToken.token);

  function sessionConnectedHandler(event) {
     subscribeToStreams(event.streams);

    // var divProps = {width: 400, height:300, name:"your stream"};
    var publisher = TB.initPublisher(21551012, 'publisher');//, divProps);
     session.publish(publisher);
  }
  
  function streamCreatedHandler(event) {
    subscribeToStreams(event.streams);
  }
  
  function subscribeToStreams(streams) {
    for (var i = 0; i < streams.length; i++) {
      var stream = streams[i];
      if (stream.connection.connectionId != session.connection.connectionId) {
        if ($.inArray(stream.id, $scope.streams) == -1) {
          $scope.streams.push(stream.id);
          session.subscribe(stream, 'stream')
          //$scope.$apply();
        }
      }
    }
  }      
  function exceptionHandler(event) {
    //alert(event.message);
  }
}

function MeetingCtrl($rootScope, $routeParams, $scope, $location, utils, db, openTok, notify) {
  var listKey = utils.genKey($routeParams.userId1, $routeParams.userId2);
  
  // Badgers stuff:
  watch(listKey, function(milliseconds) {
    $scope.$apply(function() {
      var badgers = Math.round( milliseconds / (1000*60*15) + 0.5 );
      $scope.badgers = utils.range(badgers);
    });
  });

  $scope.badgersToPay = 0;
  $scope.$watch('badgersToPay', function() {
    $scope.badgersToPayArray = utils.range($scope.badgersToPay);
  })

  $scope.giveBadgers = function() {
    
    if($rootScope.currentUser.id == $routeParams.userId1) {
      $scopeOtherUserId = $routeParams.userId2;
    } else {
      $scopeOtherUserId = $routeParams.userId1;
    }
    var badgersToPay = $scope.badgersToPay;
    $scope.badgersToPay = 0; 
    var otherUserRef = fbRef.child("users").child($scopeOtherUserId);
    otherUserRef.once('value', function(user){
      user = user.val();
      var hisBadgers = (user.badgers || 0) + badgersToPay;
      otherUserRef.update({badgers:hisBadgers});
      debugger;
      notify.event({
        user: user,
        text: "Cool you got" + badgersToPay + " brand new badgers"
      });
      notify.me("Cool we sent  " + badgersToPay + " badgers");
    });

    var mybadgers = ($rootScope.currentUser.badgers || 0) - badgersToPay;
    fbRef.child("users").child($rootScope.currentUser.id).update({badgers:mybadgers});
  }

  if (BrowserDetect.browser == "Chrome" && Number(BrowserDetect.version) >= 23) {
    $scope.supportWebRTC = true;
  } else {
    $scope.supportWebRTC = false;
  }

  $scope.showVideo = false;
  $scope.showVideoSection = function() {
    $scope.showVideo = true;
  }

  // Messages: TODO(guti): make a directive:
  $scope.listRef = fbRef.child("meeting_messages").child(listKey);

  $scope.listRef.on("value", function(messages) {
    $scope.items  = utils.listValues(messages.val());
    // TODO(guti): I put it here just to sync, wonder how you sync correctly.
    db.get($scope, 'users/' + $routeParams.userId1, 'user1');
    db.get($scope, 'users/' + $routeParams.userId2, 'user2', function() {
    });  
  });

  $scope.newItem = {};
  $scope.addNew = function() { 
    if ($rootScope.currentUser.id ==  $scope.user1.id || 
        $rootScope.currentUser.id ==  $scope.user2.id) {
      
      $scope.newItem.user = $rootScope.currentUser;
      $scope.listRef.push($scope.newItem);
      $scope.newItem = {};      
    } else {
      notify.me('sorry you are not a user');
    }
  }
}

function StreamCtrl($rootScope, $routeParams, $scope, $location, utils, db) {
  var LENGTH = 20;
  var itemsRef = fbRef.child("requests");
  $scope.items = []
  $scope.hiddenItems = []

  itemsRef.once('value', function(items) {
     $scope.items = []
     for(var key in items.val()) {
        var item = items.val()[key];
        if ($scope.items.length <= LENGTH) {
          $scope.items.unshift(item);
        } else {
          $scope.hiddenItems.unshift(item);
        }
     };
     $scope.$apply();
  });

  itemsRef.on('child_added', function(item) {
     $scope.items.unshift(item.val());
     $scope.hiddenItems.unshift($scope.items.pop());
  });

  $scope.min = 0;

  var timer = setInterval(function() {
    $scope.items.unshift($scope.hiddenItems.pop());
    $scope.hiddenItems.unshift($scope.items.pop());
    $scope.$apply();
  }, 5000);

  $scope.accept = function(item) {
    $location.path('video/' + item.user.id + "/" + $rootScope.currentUser.id);
    $scope.$apply();
  }

  $scope.newItem = {}
  $scope.addNew = function() {
    utils.log('added new request');
    $scope.newItem.user = $rootScope.currentUser;
    itemsRef.push($scope.newItem);
    $scope.newItem = {}
  }
}

// the dialog is injected in the specified controller
function SkillsDialogCtrl($rootScope, $scope, utils, dialog, notify) {
  $scope.dialogMode = 'skills';

  // calendar stuff:
  $scope.user = $rootScope.currentUser;
  $scope.userId = $rootScope.currentUser.id;
  $scope.onlyEditMode = true;

  // Step 1: Skills
  $scope.saveSkills = function() {
    if ($rootScope.currentUser.skills && $rootScope.currentUser.skills != '') { 
      utils.log('save skills in registration dialog');
      fbRef.child('users').child($rootScope.currentUser.id).update($rootScope.currentUser);
      $scope.dialogMode = 'requests';
    } else {
      utils.log('try to save empty skills');
      $scope.showError = true;
    }
  }

  // Step 2: Requests
  $scope.saveRequests = function() {
    if ($scope.requestText && $scope.requestText != '') {
      utils.log('save request in registration dialog');
      var requestValue = {text: $scope.requestText, user: $rootScope.currentUser};
      var requestKey = utils.timeStamp($rootScope.currentUser.id);
      var request = {};
      request[requestKey] = requestValue;
      fbRef.child('requests').update(request);

      if ($rootScope.currentUser.email && $rootScope.currentUser.email != '') {
        $scope.dialogMode = 'calendar';
      } else {
        $scope.dialogMode = 'email';
      }
    } else {
      utils.log('try to save empty request');
      $scope.showRequestError = true;
    }
  }

  // Step 3: Email
  $scope.saveEmail = function() {
    if ($rootScope.currentUser.email && $rootScope.currentUser.email != '') { 
      utils.log('save email in registration dialog');
      fbRef.child('users').child($rootScope.currentUser.id).update($rootScope.currentUser);
      $scope.dialogMode = 'calendar';
    } else {
      utils.log('try to save empty email');
      $scope.showEmailError = true;
    }
  }
  // Step 4: Calendar
  $scope.$on("calendar_saved",function() {
    utils.log('save available times in registration dialog');
    dialog.close();
    notify.me("Thanks, now, you can request help from others");
  });
}

function HomeCtrl($scope, $location, angularFireCollection, $rootScope) {
  // navigate to users if login.
  $rootScope.$on("currentUserInit", function() {
    if ($rootScope.currentUser && $rootScope.currentUser.skills) {
      $location.path('stream');
      $scope.$apply();
    }
  });
}

function UsersCtrl($scope, $location, $routeParams, angularFireCollection, utils) {
  fbRef.child("users").on('value', function(users) {
    $scope.users = utils.listValues(users.val());
    $scope.$apply();
  });
}
