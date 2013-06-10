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
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      when('/sessions/:userId', {controller:SessionsCtrl, templateUrl:'sessions.html'}).
      otherwise({redirectTo:'/'});
  });
  


  function SessionsCtrl($rootScope, $routeParams, $scope, $location) {
      var userId = $routeParams.userId;
      if (userId) {
        fbRef.child("users").child(userId).on('value', function(user) {
              $scope.viewedUser = user.val();
              $scope.newSession = {}

              fbRef.child("sessions").on("value", function(sessions) {
                $scope.sessions = sessions.val();
                // TODO: replace with nice angular filter:
                filterSessions = []; 
                for(var key in $scope.sessions) {
                  var session = $scope.sessions[key];
                  if (session.teacher.username == $scope.viewedUser.username) {
                    filterSessions.push(session);
                  }
                }
                debugger;
                $scope.sessions = filterSessions;
                $scope.$apply();
              });
              $scope.$apply();
        });
      }


      $scope.addNewSession = function() {
        $scope.newSession.student = $rootScope.currentUser;
        $scope.newSession.teacher = $scope.viewedUser;
        var sessionRef = fbRef.child("sessions").push($scope.newSession);
        $scope.newSession = {}
      }
      
  }




  function LoginCtrl($rootScope, $scope, $location) {
        $scope.authClient = authClient = new FirebaseAuthClient(fbRef, function(error, facebookUser) { 
        if (facebookUser) {
          var id = facebookUser.username || facebookUser.id;
          id = id.replace(/\./g,' ').replace(/\#/g,' ').replace(/\$/g,' ').replace(/\[/g,' ').replace(/\]/g,' ');

          var currentUserRef = fbRef.child("users").child(id);
          currentUserRef.set({id:""});
          currentUserRef.on('value', function(FBUser) {
              $rootScope.currentUser = FBUser.val();
              // new user: copy info from fb.
              if ($rootScope.currentUser.id == "") {
                currentUserRef.update({
                  user: facebookUser.username || "",
                  name: facebookUser.name || "",
                  id: id,
                  email: facebookUser.email || "",
                  facebook: facebookUser || "",
                  img: "http://graph.facebook.com/"+ facebookUser.id+"/picture" || ""});
                if ($scope.directToEditPage) {
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

    $scope.facebookLogin = function() {
      $scope.directToEditPage = true;
      authClient.login('facebook', {rememberMe: true});
    }

    $scope.logOut = function() {
      authClient.logout();
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
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection) {
      var fullUrl = 'https://getbadgers.firebaseio.com/users/';
      var messageListRef = new Firebase(fullUrl);
      $scope.usersToView = [];


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
      var userId = $routeParams.userId;
      var fullUrl = 'https://getbadgers.firebaseio.com/users/' + userId;
      $scope.viewedUserRef = new Firebase(fullUrl);

      $scope.viewedUserRef.on('value', function(viewedUser) {
            $scope.userToView = viewedUser.val();
            $scope.userToView.id = userId;
            if($scope.userToView.requests) {
              $scope.userToView.requests = Object.keys($scope.userToView.requests);
            }
            $scope.$apply();
      });

      $scope.setRequest = function() {
        if($rootScope.currentUser) {
          $scope.viewedUserRef.child("requests").child($rootScope.currentUser.name).set("request");
          window.alert("request was added, will come back to you soon.");
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
        debugger;
        $scope.usersToEdit.add(newUser);
        $scope.newUser = {'img':''};
      }
}


