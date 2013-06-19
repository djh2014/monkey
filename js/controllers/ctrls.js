var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

//temp:
doneFlag = true;

mainApp = angular.module('mainApp', ['firebase', '$strap.directives', 'ui.calendar'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/meetings/:userId', {controller:MeetingsCtrl, templateUrl:'meetings.html'}).
      when('/meeting/:userId1/:userId2', {controller:MeetingCtrl, templateUrl:'meeting.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      when('/calendar/:userId', {controller:CalendarCtrl, templateUrl:'calendar.html'}).
      when('/test', {controller:TestCtrl, templateUrl:'test.html'}).
      otherwise({redirectTo:'/'});
  }).run(["$rootScope", "$location", "$modal", "$q",
     function ($rootScope, $location, $modal, $q) {
       $rootScope.global = {};
       var modalPromise = $modal({template: 'message.html', show: false, scope: $rootScope});
       $rootScope.showMessage = function(text) {
         $rootScope.mainModalMessage = text;
         $q.when(modalPromise).then(function(modalEl) {modalEl.modal('show');});
       }
     }
  ]);

  function CalendarCtrl ($rootScope, $routeParams, $scope, $location, utils, db, $modal, $q) {
    var DEFAULT_FREE_TIMES = ['Mondays', 'Tuesdays', 'wednesdays', 'thursdays', 'Fridays', 'Saturdays', 'Sundays']
    .map(function(day, index) {
      return {day:day, isAvailable:true ,start:'6:00 PM', end:'10:00 PM'};
    });
    $scope.calendarRef = fbRef.child('freeTimes').child($routeParams.userId);
    $scope.calendarRef.on('value', function(freeTimes) {
      if (freeTimes.val()) {
        $scope.freeTimes = freeTimes.val();
      } else {
        $scope.freeTimes = DEFAULT_FREE_TIMES;
      }
      
      $scope.$apply();
    });

    db.get($scope, 'users/' + $routeParams.userId, 'user');

    $scope.editMode = false;
    $scope.editFreeTimes = function() {
      $scope.editMode = true;
    }

    $scope.saveFreeTime = function() {
      $scope.calendarRef.update(utils.removeHashKey($scope.freeTimes));
      $scope.editMode = false;
    }
  }

  function TestCtrl ($rootScope, $routeParams, $scope, $location, utils, db, $modal, $q) {
    $scope.calendarConfig = {
        height: 450,
        editiable: true,
        dayClick: function(){
            $scope.$apply($scope.alertEventOnClick);
        }
    };

    ///
    $scope.calendarConfig = {
        height: 450,
        editiable: true,
        dayClick: function(){
            $scope.$apply($scope.alertEventOnClick);
        }
    };

    $scope.eventSources = [{
      events: function(start, end, cb) {
        $scope.calendarRef = fbRef.child("calendars").child($routeParams.userId);
        $scope.calendarRef.on('value', function(calendar) {
            cb( );
        })
      },
      //color: 'yellow',   // an option!
      //textColor: 'black' // an option!
    }];
    ///

    $scope.click = function() {
      $rootScope.showMessage("test?");
    };  
  }  

  function MeetingsCtrl ($rootScope, $routeParams, $scope, $location, utils, db) {
    db.get($scope, 'meetings', 'meetings', function() {
      $scope.meetings = utils.listValues($scope.meetings);
      $scope.meetings = $scope.meetings.filter(function(e, i) {
        return e.teacher.id == $routeParams.userId || e.student.id == $routeParams.userId;
      });
      $scope.$apply();
    });

    $scope.approve = function(meeting_id) {
      fbRef.child("meetings").child(meeting_id).update({status:"APPROVED"});
      $scope.$apply();
    }

    $scope.reject = function(meeting_id) {
      fbRef.child("meetings").child(meeting_id).update({status:"REJECT"});
      $scope.$apply();
    }
  }

  function DetailCtrl($scope, $rootScope, $location, $routeParams,db, utils) {      
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

    $scope.setRequest = function() {      
      if($rootScope.currentUser) {
        var key = utils.genKey($scope.user.id, $rootScope.currentUser.id);
        var meeting = {};
        meeting[key] = {'teacher':$scope.user, 'student':$rootScope.currentUser, 'status':"NEW", 'id': key};
        fbRef.child('meetings').update(meeting);
        var meetingPath = 'meeting/' + $rootScope.currentUser.id + '/' + $scope.user.id 
        
        // Send event
        fbRef.child('events').child($scope.user.id).push(
          {text: $rootScope.currentUser.name + ' want to start the video session with you',
           path:meetingPath,
           alert:true});

        $rootScope.showMessage('we notify ' + $scope.user.name + '. copy his email and click the red button');
        $location.path(meetingPath);
      } else {
        $rootScope.showMessage("you need to sign in first");
      }
    }
  }

  function VideoCtrl($rootScope, $routeParams, $scope, $location, utils, db, openTok) {
    var sessionAndToken = openTok.getSessionAndToken();
    
    //temp
    $scope.streams = []

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
            debugger;
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

  function MeetingCtrl($rootScope, $routeParams, $scope, $location, utils, db, openTok) {
    var listKey = utils.genKey($routeParams.userId1, $routeParams.userId2);
    
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
         // TODO: remove this, it's not nice to send message for others.
         // if ($scope.items.length == 0) {
         //    var item = {user:$scope.user2, text:'Hi, when can we start.'};  
         //    $scope.listRef.push(item);
         // }
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
        $rootScope.showMessage('sorry you are not a user');
      }
    }
  }

  function StreamCtrl($rootScope, $routeParams, $scope, $location) {
  }

  function SearchCtrl($rootScope, $routeParams, $scope, $location) {
    // TODO: see why not wroking.
    $scope.query  = {};
    $scope.$watch('query', function() {
    
    })
    $scope.search = function() {
      $scope.query.user = $rootScope.currentUser;
      fbRef.child("serches").push({query:$scope.query});
      $scope.query = {};
      $location.path('/');
      $scope.$apply();
    }
  }

  function LoginCtrl($rootScope, $scope, $location, utils) {
    // Events: 
    $rootScope.$on("currentUserInit", function() {
      if ($rootScope.currentUser) {
        $rootScope.myEventsRef = fbRef.child('events').child($rootScope.currentUser.id);

        $rootScope.myEventsRef.on('child_added', function(eventObject) {
          var newEvent = eventObject.val();
          newEvent.id = eventObject.name();
          if(newEvent.alert == true) {
            $rootScope.processEvent(newEvent);
          }
        });
        $scope.$apply();
      }
    });
    $rootScope.processEvent = function(newEvent) {
      $rootScope.myEventsRef.child(newEvent.id).update({alert:false});
      $rootScope.showMessage(newEvent.text);
      // TODO(guti).
      //$location.path('meetings');
       $location.path(newEvent.path);
      $scope.$apply();
    }
    ////

    $rootScope.checkRequireFields = function() {
      if (!$rootScope.currentUser.skills || !$rootScope.currentUser.email) {
        $rootScope.showMessage('please let us know about your skills.'); 
        $scope.directToEditPage = false;
        $location.path('edit/'+ $rootScope.currentUser.id+"/");   
      }
    }

    $scope.authClient = new FirebaseAuthClient(fbRef, function(error, facebookUser) { 
      if (facebookUser) {
        var id = utils.fbClean(facebookUser.username || facebookUser.id);

        var currentUserRef = fbRef.child("users").child(id);
        currentUserRef.on('value', function(FBUser) {
            $rootScope.currentUser = jQuery.extend($rootScope.currentUser, FBUser.val());;
            // new user: copy info from fb.
            if (!$rootScope.currentUser.facebook) {
              currentUserRef.update({
                user: facebookUser.username || "",
                name: facebookUser.name || "",
                id: id,
                email: facebookUser.email || "",
                facebook: facebookUser || "",
                img: "http://graph.facebook.com/"+ facebookUser.id+"/picture?type=large" || ""});
            }
            if ($location.path().indexOf('edit') == -1) {
              $rootScope.checkRequireFields();
            }
            $rootScope.$broadcast("currentUserInit");
            $scope.$apply();
        });
      } else {
        $rootScope.currentUser = null;
        $rootScope.$broadcast("currentUserInit");
        // not login user should go home.
        $location.path('/');
        $scope.$apply();
      }
    });

    $scope.facebookLogin = function() {
      $scope.directToEditPage = true;
      $scope.authClient.login('facebook', {rememberMe: true});
    }

    $scope.logOut = function() {
      $scope.authClient.logout();
      $location.path('/');
      $scope.$apply();
    }
  }

  function EditProfileCtrl($rootScope, $scope, $routeParams, $location){
      //TODO(guti): make it a service:
      var userId = $routeParams.userId;
      if (userId) {
        var userFBURL = 'https://getbadgers.firebaseio.com/users/' + userId;
        var userFBRef = new Firebase(userFBURL);

        userFBRef.on('value', function(FBUser) {
              $scope.user = FBUser.val();
              $scope.currentEmail = $scope.user.email;
              $scope.$apply();
        });
      }

      $scope.saveUser = function() {
        if (userId) {
          userFBRef.update($scope.user);
        } else {
          var listFBURL = 'https://getbadgers.firebaseio.com/users/';
          var listFBRef = new Firebase(listFBURL);
          var res = listFBRef.push($scope.user);
          $location.path('/');
        }
        $rootScope.checkRequireFields();
        $location.path('detail/'+$scope.user.id);
        $scope.$apply();
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection, $rootScope) {
    var fullUrl = 'https://getbadgers.firebaseio.com/users/';
    var messageListRef = new Firebase(fullUrl);
    $scope.usersToView = [];
    
    // navigate to users if login.
    $rootScope.$on("currentUserInit", function() {
      if ($rootScope.currentUser) {
        $location.path('users');
        $scope.$apply();
      }
    });

    // TODO(guti): probably remove this.
    messageListRef.on('value', function(snapshot) {
      // For index.html page:
      var BIG_IMG = [600, 450, 6], MEDIUM_IMG = [260, 200, 3], SMALL_IMG = [225, 200, 3];
      var IMG_SIZES = [[BIG_IMG, MEDIUM_IMG, MEDIUM_IMG], [MEDIUM_IMG, MEDIUM_IMG, BIG_IMG], [SMALL_IMG, SMALL_IMG, SMALL_IMG, SMALL_IMG]];
      var usersObject = snapshot.val();
      var ids = Object.keys(usersObject);
      var userGroups = []
      for (var i = 0; i < IMG_SIZES.length; i++) {
        var userGroup = []
        for (var j = 0; j < IMG_SIZES[i].length; j++) {
          if(ids.length <= 0){
            break;
          }
          var id = ids.pop();
          var user = usersObject[id];
          user.imgWidth = IMG_SIZES[i][j][0];
          user.imgHeight = IMG_SIZES[i][j][1];
          user.spanSize = IMG_SIZES[i][j][2];
          user.id = id;
          userGroup.push(user);
        };
        userGroups.push(userGroup);
      };
      $scope.userGroupsToView = userGroups;
      $scope.$apply();
    });
  }

  function UsersCtrl($scope, $location, $routeParams, angularFireCollection, utils) {
    fbRef.child("users").on('value', function(users) {
      $scope.users = utils.listValues(users.val());
      $scope.$apply();
    });

    $scope.newUser = {'img':''};
    $scope.saveNewUser = function(newUser) {
      $scope.users.add(newUser);
      $scope.newUser = {'img':''};
    }
  }


