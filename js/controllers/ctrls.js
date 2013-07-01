var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

mainApp = angular.module('mainApp', ['ngCookies', 'firebase', '$strap.directives', 'ui.calendar', 'ui.bootstrap.dialog'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      when('/newsfeed', {templateUrl:'newsfeed.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/messages/:userId', {controller:MeetingsCtrl, templateUrl:'meetings.html'}).
      when('/meeting/:userId1/:userId2', {controller:MeetingCtrl, templateUrl:'meeting.html'}).
      when('/profile/:userId', {controller:ProfileCtrl, templateUrl:'profile.html'}).
      when('/test', {controller:TestCtrl, templateUrl:'test.html'}).
      when('/sign-in', {templateUrl:'sign-in.html'}).
      when('/sign-up', {templateUrl:'sign-up.html'}).
      otherwise({redirectTo:'/'});
  }).run(["$rootScope", "$location", "$modal", "$q", "$dialog","utils", "$cookies", "notify",
     function ($rootScope, $location, $modal, $q, $dialog, utils, $cookies, notify) {
      $rootScope.global = {};

      utils.log('load_website');
     }
  ]);

function TestCtrl($rootScope, $scope, $location, utils, $cookies, $dialog) {
  watch('test');
}

function LoginCtrl($rootScope, $scope, $location, utils, $cookies, $dialog, $route, notify) {
  if ($cookies.currentUser) {
    $rootScope.currentUser = JSON.parse($cookies.currentUser);
    $rootScope.$broadcast("currentUserInit");
  } else {
    $rootScope.currentUser = null;
  }

  var clickedLogin = false;
  $scope.authClient = new FirebaseAuthClient(fbRef, function(error, authUser) {
    debugger;
    // If login:
    if (authUser) {
      var id = utils.fbClean(authUser.username || authUser.id);

      var currentUserRef = fbRef.child("users").child(id);
      currentUserRef.on('value', function(FBUser) {
          debugger;    
          $rootScope.currentUser = jQuery.extend($rootScope.currentUser, FBUser.val());
          $cookies.currentUser = JSON.stringify($rootScope.currentUser);
          $rootScope.$broadcast("currentUserInit");
          
          // Handle new user: 
          if (!$rootScope.currentUser.facebook && authUser.username) {
            currentUserRef.update({init:true,
              badgers:3, user: authUser.username || "", name: authUser.name || "", id: id, email: authUser.email || "", facebook: authUser || "",
              img: "http://graph.facebook.com/"+ authUser.id+"/picture?type=large" || ""});
            $scope.openDialog();
          } 
          // else if (!$rootScope.currentUser.init && !authUser.username){
          //   currentUserRef.update({init:true,
          //     badgers:3, user: $rootScope.name || "", name: $rootScope.name || "", id: id, email: authUser.email || "",
          //     img: "http://profile.ak.fbcdn.net/static-ak/rsrc.php/v2/yL/r/HsTZSDw4avx.gif" || ""});
          //   $scope.openDialog();
          // }

          if (clickedLogin) {
            //if ($location.path() == '/') {
              $location.path('stream/');
            //}
            clickedLogin = false;
          }
          utils.apply($scope);
      }); 
    // Not login:
    } else {
      $rootScope.currentUser = null;
      delete $cookies.currentUser
      $rootScope.$broadcast("currentUserInit");
      utils.apply($scope);;
    }
  });

  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    utils.log('change page');
    if (next.templateUrl) {
      
      if (next.templateUrl == 'home.html') {
        $rootScope.mainPage = true;
      } else {
        $rootScope.mainPage = false;
      }

      if(($.inArray(next.templateUrl,['home.html', 'sign-up.html', 'sign-in.html']) == -1) && 
         (!$rootScope.currentUser || $rootScope.currentUser==null)) {
        //notify.me('please sign up first');
        $location.path('sign-up');
        //$rootScope.openLoginDialog();
      }
      
    }
  });  

  $scope.openDialog = function() {
    utils.log('started registration dialog');
    var d = $dialog.dialog({templateUrl:  '/skills-dialog.html',controller: 'SkillsDialogCtrl',
      backdrop: true, keyboard: false,backdropClick: false});
    d.open().then(function(result){});
    $location.path('stream/');
    utils.apply($scope);;
  }

  $rootScope.isLogin = function() {
    return $rootScope.currentUser && $rootScope.currentUser != null;
  }

  $rootScope.openLoginDialog = function(cantExit) {
    if (!$rootScope.isLogin()) {
      var d = $dialog.dialog({templateUrl: '/login-dialog.html',controller: 'LoginDialogCtrl',
        backdrop: true, keyboard: cantExit || true ,backdropClick: cantExit || true});
        d.open().then(function(result){});
    } else {
      notify.me("you are already login");
    }
  }

  $rootScope.openSignUpDialog = function(cantExit) {
    if (!$rootScope.isLogin()) {
      var d = $dialog.dialog({templateUrl: '/signup-dialog.html',controller: 'SignupDialogCtrl',
        backdrop: true, keyboard: cantExit || true ,backdropClick: cantExit || true});
        d.open().then(function(result){});
    } else {
      notify.me("you are already login");
    }
  }

  $rootScope.facebookLogin = function() {
    utils.log('click facebook login');
    clickedLogin = true;
    $scope.authClient.login('facebook', {rememberMe: true});
  }

  $rootScope.createEmailUser = function(user, dialog, scope) {
    $rootScope.name = user.name;
    utils.log('click email login');
    clickedLogin = true;
    $scope.authClient.createUser(user.email, user.password, function(error, user) {  
      if (!error) {
        dialog.close();
        notify.me("Cool, you can now login");
        $rootScope.openLoginDialog();
      } else {
        scope.errorMessage = error; 
      }
    });
  }

  $rootScope.emailLogin = function(user) {
    $rootScope.name = user.name;
    $scope.authClient.login('password', {
      email: user.email,
      password: user.password,
      rememberMe: true,
    });
  }

  $rootScope.logOut = function() {
    utils.log('click logout');
    $scope.authClient.logout();
    $location.path('/');
  }
}

function SignupDialogCtrl($rootScope, $scope, utils, dialog) {
  $scope.loginAndClose = function() {
    $rootScope.facebookLogin();
    dialog.close();
  }

  $scope.showSignUp = function() {
    $scope.signUp = true;
  }

  $rootScope.userLogin = {};
  $scope.emailSignup = function() {
    if (!$rootScope.userLogin.name) {
      $scope.errorMessage = "Please fill in your first and last name";
    }
    else if (!$rootScope.userLogin.email) {
      $scope.errorMessage = "Please fill in your email address";
    }
    else if (!$rootScope.userLogin.password) {
      $scope.errorMessage = "Please fill in password";
    } else {
      $rootScope.createEmailUser($rootScope.userLogin, dialog, $scope);
    }
  }
}

function LoginDialogCtrl($rootScope, $scope, utils, dialog) {
  $scope.loginAndClose = function() {
    $rootScope.facebookLogin();
    dialog.close();
  }

  $scope.showSignIn = function() {
    $scope.signIn = true;
  }

  $rootScope.userLogin = $rootScope.userLogin || {};
  $scope.handleEmailLogin = function() {
    debugger;
    if (!$rootScope.userLogin.email) {
      $scope.errorMessage = "Please fill in your email address";
    } else if (!$rootScope.userLogin.password) {
      $scope.errorMessage = "Please fill in password";
    } else {
      $rootScope.emailLogin($rootScope.userLogin);
      dialog.close();
    }
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
      utils.apply($scope);;
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
    utils.apply($scope);;
  }
}

function MeetingsCtrl ($rootScope, $routeParams, $scope, $location, utils, db, notify) {
  fbRef.child('meetings').on('value', function(meetingsObj) {
    var meetings = utils.listValues(meetingsObj.val());
    meetings = meetings.filter(function(e, i) {
      return e.teacher.id == $routeParams.userId || e.student.id == $routeParams.userId;
    });
    meetings = utils.convertTime(meetings, 'day');
    $scope.meetings = meetings;
    // empty active notification:
    $scope.activeNotification = []
    utils.apply($scope);;
  });

  $scope.activeFirst = function(meeting) {
    return (meeting.activeForUserId == $rootScope.currentUser.id)? 'a':'b';
  }

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
        message: 'you have a video meeting, we' + meeting.teacher.name + ' get pumped!'
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
    utils.apply($scope);;
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
          //utils.apply($scope);;
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
  var LENGTH = 50;
  var itemsRef = fbRef.child("requests");
  $scope.items = []
  $scope.hiddenItems = []

  itemsRef.once('value', function(items) {
     $scope.items = [];
     var allItems = utils.listValues(items.val())
     utils.randomizeArray(allItems);

     allItems.forEach(function(item, i) {
        if ($scope.items.length <= LENGTH) {
          $scope.items.unshift(item);
        } else {
          $scope.hiddenItems.unshift(item);
        }
     })
     
     utils.apply($scope);;
  });

  itemsRef.on('child_added', function(item) {
     $scope.items.unshift(item.val());
     $scope.hiddenItems.unshift($scope.items.pop());
  });

  $scope.min = 0;

  var timer = setInterval(function() {
    $scope.items.unshift($scope.hiddenItems.pop());
    $scope.hiddenItems.unshift($scope.items.pop());
    utils.apply($scope);;
  }, 15000);

  $scope.accept = function(item) {
    $location.path('video/' + item.user.id + "/" + $rootScope.currentUser.id);
    utils.apply($scope);;
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
  if ($rootScope.currentUser) {
    //$location.path('stream');
    //utils.apply($scope);;
  }
}

function UsersCtrl($scope, $location, $routeParams, angularFireCollection, utils) {
  fbRef.child("users").on('value', function(users) {
    $scope.users = utils.listValues(users.val());
    utils.apply($scope);;
  });
}
