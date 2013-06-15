var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

function listValues(listObject) {
  var res = []
  for(key in listObject.val()) {
    res.unshift(listObject.val()[key]);
  }
  return res;
}

function genKey(string1, string2) {
  if(string1 < string2){
    return string1 + "_" + string2;
  } else {
    return string2 + "_" + string1;
  }
}


angular.module('mainApp', ['firebase', '$strap.directives'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/login', {controller:LoginCtrl, templateUrl:'login.html'}).
      when('/video/:userId/:secondUserId', {controller:VideoCtrl, templateUrl:'video.html'}).
      when('/requests/:userId', {templateUrl:'request.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      when('/sessions/:userId', {controller:SessionsCtrl, templateUrl:'sessions.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      otherwise({redirectTo:'/'});
  })
  .directive('profile', function() {
    return {
      template: '<img src="https://i.embed.ly/1/display/resize?key=dc65793b3f1249bdb9952a491874d27e&url={{user.img}}&width={{width}}&height={{height}}&grow=true" title="{{user.name}}"/>',
      replace: true,
      restrict: 'E',
      scope: { user: '=', currentUser: '='}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.width = iAttrs.width || 50;
        scope.height = iAttrs.height || 50;
      }
    };
  })
  .directive('stream', function() {
    return {
      templateUrl: 'streamTemplate.html',
      replace: true,
      restrict: 'E',
      controller: function($rootScope, $element, $attrs, $transclude, $scope, $location) {
        var LENGTH = 5;
        var itemsRef = fbRef.child($attrs.list)
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
          $scope.currentUser = $rootScope.currentUser;
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
      },
      scope: { list: '@', currentUser: '@'}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.list = iAttrs.list;
      }
    };
  });

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

  function VideoCtrl($rootScope, $routeParams, $scope, $location) {
    
    $scope.newItem = {};
    var listKey = genKey($routeParams.userId, $routeParams.secondUserId);
    $scope.listRef = fbRef.child("videoMessages").child(listKey);

    $scope.addNew = function() { 
      $scope.newItem.user = $rootScope.currentUser;
      $scope.listRef.push($scope.newItem);
      $scope.newItem = {};      
    }

    $scope.listRef.on("value", function(messages) {
      $scope.items  = listValues(messages);
    });


    $scope.viewedUserRef = fbRef.child("users").child($routeParams.userId);
    $scope.viewedUserRef.on('value', function(viewedUser) {
      $scope.userToView = viewedUser.val();
      $scope.userToView.id = $routeParams.userId;
      if($scope.userToView.requests) {
        $scope.userToView.requests = Object.keys($scope.userToView.requests);
      }
      $scope.$apply();
      $scope.userToView
    });
  }
  
  function SessionsCtrl($rootScope, $routeParams, $scope, $location) {
      var userId = $routeParams.userId;
      var APPROVED = "APPROVED", REJECT= "REJECT", NEW ="NEW", DONE = "DONE";

      if (userId) {
        fbRef.child("users").child(userId).on('value', function(user) {
              $scope.viewedUser = user.val();
              $scope.newSession = {}

              fbRef.child("sessions").on("value", function(sessions) {
                var allSessions = sessions.val();
                // TODO: replace with nice angular filter:
                filterSessions = []; 
                for(var key in allSessions) {
                  var session = allSessions[key];
                  if (session.teacher.id != null && session.teacher.id == $scope.viewedUser.id) {
                    filterSessions.push(session);
                  }
                }
                $scope.sessions = filterSessions;
                $scope.$apply();
              });
              $scope.$apply();
        });
      }

      $scope.approve = function(session) {
        fbRef.child("sessions").child(session.id).update({status:APPROVED});
        $scope.$apply();
      }

      $scope.reject = function(session) {
        fbRef.child("sessions").child(session.id).update({status:REJECT});
        $scope.$apply();
      }

      $scope.addNewSession = function() {
        if ($rootScope.currentUser) {
          var sessionRef = fbRef.child("sessions").push()
          $scope.newSession.student = $rootScope.currentUser;
          $scope.newSession.teacher = $scope.viewedUser;
          $scope.newSession.status = NEW;
          $scope.newSession.id = sessionRef.name();
          sessionRef.update($scope.newSession);
          $scope.newSession = {}
        } else {
          window.alert("You need to login first, in order to send a request.");
        }

      }
  }

  function LoginCtrl($rootScope, $scope, $location) {
        $scope.authClient = new FirebaseAuthClient(fbRef, function(error, facebookUser) { 
        if (facebookUser) {
          var id = facebookUser.username || facebookUser.id;
          id = id.replace(/\./g,' ').replace(/\#/g,' ').replace(/\$/g,' ').replace(/\[/g,' ').replace(/\]/g,' ');

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
                if ($scope.directToEditPage && !$rootScope.currentUser.skills) {
                  $scope.directToEditPage = false;
                  $location.path('edit/'+ $rootScope.currentUser.id+"/");   
                }
              }
              $rootScope.$broadcast("currentUserInit");
              $scope.$apply();
          });
        } else {
          $rootScope.currentUser = null;
          $rootScope.$broadcast("currentUserInit");
        }
    });

    $rootScope.getFacebookUser = function(cb) {
      new FirebaseAuthClient(fbRef, function(error, facebookUser) { 
        cb(facebookUser);
      });
    }

    $scope.facebookLogin = function() {
      $scope.directToEditPage = true;
      $scope.authClient.login('facebook', {rememberMe: true});
    }

    $scope.logOut = function() {
      $scope.authClient.logout();
    }
  }

  function EditProfileCtrl($scope, $routeParams, $location){
      //TODO(guti): make it a service:
      var userId = $routeParams.userId;
      if (userId) {
        var userFBURL = 'https://getbadgers.firebaseio.com/users/' + userId;
        var userFBRef = new Firebase(userFBURL);

        userFBRef.on('value', function(FBUser) {
              $scope.user = FBUser.val();
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
        window.alert("Changes Saved");
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection, $rootScope) {
      var fullUrl = 'https://getbadgers.firebaseio.com/users/';
      var messageListRef = new Firebase(fullUrl);
      $scope.usersToView = [];
      
      $rootScope.$on("currentUserInit", function() {
        if ($rootScope.currentUser) {
          $location.path('stream');
          $scope.$apply();
        }
      });

      $scope.applicant = {}
      $scope.apply = function() {
        fbRef.child("applicants").push($scope.applicant);
        $scope.applicant = {}
        window.alert("Thanks we will get back to you shortly.");
        $scope.$apply()
      }

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
  function DetailCtrl($scope, $rootScope, $location, $routeParams, angularFireCollection) {      
      $scope.viewedUserRef = fbRef.child("users").child($routeParams.userId);

      $scope.viewedUserRef.on('value', function(viewedUser) { 
            $scope.userToView = viewedUser.val();
            $scope.userToView.id = $routeParams.userId;
            if($scope.userToView.requests) {
              $scope.userToView.requests = Object.keys($scope.userToView.requests);
            }
            $scope.$apply();
      });

      $scope.setRequest = function() {
        if($rootScope.currentUser) {
          $scope.viewedUserRef.child("requests").child($rootScope.currentUser.name).set("request");
          $location.path('sessions/' + $routeParams.userId);
          //window.alert("request was added, will come back to you soon.");
        } else {
          window.alert("you need to sign in first");
          $location.path('login/');
        }
      }
  }

  function UsersCtrl($scope, $location, $routeParams, angularFireCollection) {
      // TODO(This is a list that can also update, when change).
      var url = 'https://getbadgers.firebaseio.com/users/';
      $scope.usersToEdit = angularFireCollection(new Firebase(url), function(usersToEdit) {
        
      });

      $scope.saveNewUser = function(newUser) {
        $scope.usersToEdit.add(newUser);
        $scope.newUser = {'img':''};
      }
}


