var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

mainApp = angular.module('mainApp', ['ngCookies', 'firebase', '$strap.directives', 'ui.calendar', 'ui.bootstrap.dialog'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/meetings/:userId', {controller:MeetingsCtrl, templateUrl:'meetings.html'}).
      when('/messages/:userId', {controller: MessagesCtrl, templateUrl:'messages.html'}).
      when('/meeting/:userId1/:userId2', {controller:MeetingCtrl, templateUrl:'meeting.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/test', {templateUrl:'skills-dialog.html'}).
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

  function MessagesCtrl($rootScope, $routeParams, $scope, $location, utils, db, $modal, $q) {
    var messagesRef = fbRef.child("messages").child($routeParams.userId);
    messagesRef.on('value', function(messages) {
      $scope.messages = utils.listValues(messages.val());
      if ($scope.messages.length <= 0 ) {
        fbRef.child("users").child("bad-gerry").on('value', function(badgerryObject) {
          var badgerry = badgerryObject.val();
          messagesRef.push({'user': badgerry, 'text': 'Hi, welcome, in GetBadgers you can find talented people that will help you, and in return you sohuld help others in the community. find the help you need at Find People'});
        });
      }
    })
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

  function DetailCtrl($scope, $rootScope, $location, $routeParams, db, utils) {      
    $scope.userId = $routeParams.userId;

    $scope.editSkillsMode = false;
    if($routeParams.edit) {
      $scope.editSkillsMode = true;
    }
    $scope.editSkills = function() {
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
        fbRef.child("users").child($scope.user.id).update($scope.user);
        $rootScope.checkRequireFields();
        if ($scope.user.skills && $scope.user.skills != '') {
          $scope.editSkillsMode = false;
        } else {
          $rootScope.showMessage("For people to be able to ask for your advice let us know what are your skills.");
        }
      }

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

  function StreamCtrl($rootScope, $routeParams, $scope, $location, utils, db) {
    var LENGTH = 5;
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
      $scope.newItem.user = $rootScope.currentUser;
      itemsRef.push($scope.newItem);
      $scope.newItem = {}
    }
  }

function EventCtrl($rootScope, $scope, $location, utils, $cookies) {
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
  }

  // the dialog is injected in the specified controller
  function SkillsDialogCtrl($rootScope, $scope, dialog) {
    $scope.dilaogMode = 'skills';

    // calendar stuff:
    $scope.user = $rootScope.currentUser;
    $scope.userId = $rootScope.currentUser.id;
    $scope.onlyEditMode = true;

    $scope.saveSkills = function() {
      if ($rootScope.currentUser.skills && $rootScope.currentUser.skills != '') { 
        fbRef.child('users').child($rootScope.currentUser.id).update($rootScope.currentUser);
        $scope.dilaogMode = 'calendar';
        //dialog.close();
      } else {
        $scope.showError = true;
      }
    }

    $scope.$on("calendar_saved",function() {
      dialog.close();
      $rootScope.showMessage("Thanks, now, you can request help from others");
    });
  }

  function LoginCtrl($rootScope, $scope, $location, utils, $cookies, $dialog) {
    if ($cookies.currentUser) {
      $rootScope.currentUser = JSON.parse($cookies.currentUser);
      $rootScope.$broadcast("currentUserInit");
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
            }
            // Direct to edit page if don't have require skills:
            if ($location.path().indexOf('edit') == -1) {
              $rootScope.checkRequireFields();
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

    $rootScope.checkRequireFields = function() {
      if (!$rootScope.currentUser.skills) {
        // $rootScope.showMessage('please let us know about your skills.');
        // $location.path('detail/' + $rootScope.currentUser.id + '/'); 
        // $location.search('edit=true');
        var d = $dialog.dialog({templateUrl:  '/skills-dialog.html',controller: 'SkillsDialogCtrl',
        backdrop: true, keyboard: false,backdropClick: false});
        d.open().then(function(result){});
        $location.path('stream/');
        $scope.$apply(); 
      }
    }

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

  function HomeCtrl($scope, $location, angularFireCollection, $rootScope) {
    var fullUrl = 'https://getbadgers.firebaseio.com/users/';
    var messageListRef = new Firebase(fullUrl);
    $scope.usersToView = [];
    
    // navigate to users if login.
    $rootScope.$on("currentUserInit", function() {
      if ($rootScope.currentUser && $rootScope.currentUser.skills) {
        $location.path('stream');
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


