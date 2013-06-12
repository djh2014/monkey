var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

angular.module('mainApp', ['firebase', '$strap.directives'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/login', {controller:LoginCtrl, templateUrl:'login.html'}).
      when('/video/:userId', {controller:VideoCtrl, templateUrl:'video.html'}).
      when('/requests/:userId', {templateUrl:'request.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      when('/sessions/:userId', {controller:SessionsCtrl, templateUrl:'sessions.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      otherwise({redirectTo:'/'});
  });

  function StreamCtrl($rootScope, $routeParams, $scope, $location) {
    var LENGTH = 5;

    var requestsRef = fbRef.child('requests')
    $scope.requests = []
    $scope.otherRequests = []
    requestsRef.once('value', function(requests) {
       $scope.requests = []
       for(var key in requests.val()) {
          var request = requests.val()[key];
          if ($scope.requests.length <= LENGTH) {
            $scope.requests.unshift(request);
          } else {
            $scope.otherRequests.unshift(request);
          }
       };
       $scope.$apply();
    });

    requestsRef.on('child_added', function(request) {
       $scope.requests.unshift(request.val());
       $scope.otherRequests.unshift($scope.requests.pop());
    });

    $scope.min = 0;

    var timer = setInterval(function() {
      $scope.requests.unshift($scope.otherRequests.pop());
      $scope.otherRequests.unshift($scope.requests.pop());


      $scope.$apply();
    }, 3000);

    $scope.newRequest = {}
    $scope.addNewRequest = function() {
      $scope.newRequest.user = $rootScope.currentUser;
      requestsRef.push($scope.newRequest);
      $scope.newRequest = {}
    }
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
      $rootScope.getFacebookUser(function(facebookUser) {
        if (!facebookUser) {
          window.alert("you need to sign in first");
          $location.path('login/'); 
        }
      }); 
      

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
              $scope.$apply();
          });
        } else {
          $rootScope.currentUser = null;
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

  function HomeCtrl($scope, $location, angularFireCollection) {
      var fullUrl = 'https://getbadgers.firebaseio.com/users/';
      var messageListRef = new Firebase(fullUrl);
      $scope.usersToView = [];

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


