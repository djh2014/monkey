var fbUrl = 'https://monkey-23.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');


angular.module('mainApp', ['firebase']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/login', {controller:LoginCtrl, templateUrl:'login.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      otherwise({redirectTo:'/'});
  })

  function LoginCtrl($rootScope, $scope, $location) {
    $scope.authClient = authClient = new FirebaseAuthClient(fbRef, function(error, user) { 
        debugger;
        $rootScope.currentUser = null;
        if (user) {
          $rootScope.currentUser = user;
          if ($scope.directToEditPage) {
            $scope.directToEditPage = false;
            var user = fbRef.child("users").child($rootScope.currentUser.username)
            user.child("user").set($rootScope.currentUser.username);
            user.child("name").set($rootScope.currentUser.name);
            user.child("email").set($rootScope.currentUser.email);
            user.child("facebook").set($rootScope.currentUser);
            user.child("img").set("http://graph.facebook.com/"+ $rootScope.currentUser.id+"/picture");
            $location.path('edit/'+ $rootScope.currentUser.username+"/");
          }
        } 
    });

    $scope.facebookLogin = function() {
      $scope.directToEditPage = true;
      authClient.login('facebook');
    }

    $scope.logOut = function() {
      authClient.logout();
    }

    $scope.user = {};
    $scope.signin = function() {
      authClient.login('password', {
        email: $scope.user.email,
        password: $scope.user.password,
        rememberMe: true
      });
    }

    $scope.signup = function() { 
      authClient.createUser($scope.user.email, $scope.user.password, function(error, user) {
        if (!error) {
          $rootScope.currentUser = user;
          rootScope = $rootScope;
          window.alert("thanks for sign-up");
          location.replace('/');
        }
      }); 
    }    
  }

  function EditProfileCtrl($scope, $routeParams, $location){
      //TODO(guti): make it a service:
      var userId = $routeParams.userId;
      if (userId) {
        var userFBURL = 'https://monkey-23.firebaseio.com/users/' + userId;
        var userFBRef = new Firebase(userFBURL);

        userFBRef.on('value', function(FBUser) {
              $scope.user = FBUser.val();
              $scope.$apply();
        });
      }

      $scope.saveUser = function() {
        debugger;
        if (userId) {
          userFBRef.update($scope.user);
        } else {
          var listFBURL = 'https://monkey-23.firebaseio.com/users/';
          var listFBRef = new Firebase(listFBURL);
          var res = listFBRef.push($scope.user);
          $location.path('/');
        }
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection) {
      var fullUrl = 'https://monkey-23.firebaseio.com/users/';
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
      var fullUrl = 'https://monkey-23.firebaseio.com/users/' + userId;
      var messageListRef = new Firebase(fullUrl);

      messageListRef.on('value', function(snapshot) {
            $scope.userToView = snapshot.val();
            $scope.userToView.id = userId;
            $scope.$apply();
      });
      $scope.setRequest = function() {
        debugger;
        if($rootScope.currentUser) {
          //TODO.
        } else {
          window.alert("you need to sign in first");
          $location.path('login/');
        }
      }

      $scope.email = '';
      // Should be shared by both.
      // TODO(guti): remove:
      // $scope.saveEmail = function() {
      //   if ($scope.email) {
      //     //Push to fire base:
      //     var listRef = new Firebase('https://monkey-23.firebaseio.com/apply');
      //     var newPushRef = listRef.push();
      //     newPushRef.set({email: $scope.email});
      //     // TODO: save at mix-panel.
      //     $scope.email = "";
      //     window.alert("Thanks we will get back to you soon");
      //   } else {
      //     $scope.email = "Mm.. apply with your email";          
      //   } 
      // }

  }

  function UsersCtrl($scope, $location, $routeParams, angularFireCollection) {
      // TODO(This is a list that can also update, when change).
      var url = 'https://monkey-23.firebaseio.com/users/';
      $scope.usersToEdit = angularFireCollection(new Firebase(url), function(usersToEdit) {
        
      });

      $scope.saveNewUser = function(newUser) {
        debugger;
        $scope.usersToEdit.add(newUser);
        $scope.newUser = {'img':''};
      }
}


