var chatRef = new Firebase('https://monkey-23.firebaseio-demo.com');
debugger;
var authClient = new FirebaseAuthClient(chatRef, function(error, user) {
  if (error) {
    debugger;
    console.log(error);
  } else if (user) {
    debugger;
    console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
  } else {
    debugger;
    //authClient.login('facebook');
  }
});

debugger;
authClient.login('facebook', {
  rememberMe: true,
  scope: 'email,user_likes'
});





angular.module('mainApp', ['firebase']).
  config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      otherwise({redirectTo:'/'});
  })

  function EditProfileCtrl($scope, $routeParams, $location){
      //TODO(guti): make it a service:
      var userId = $routeParams.userId;
      if (userId) {
        var userFBURL = 'https://monkey-23.firebaseio-demo.com/users2/' + userId;
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
          var listFBURL = 'https://monkey-23.firebaseio-demo.com/users2/';
          var listFBRef = new Firebase(listFBURL);
          var res = listFBRef.push($scope.user);
          $location.path('/');
        }
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection) {
      var fullUrl = 'https://monkey-23.firebaseio-demo.com/users2/';
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
  function DetailCtrl($scope, $location, $routeParams, angularFireCollection) {
      var userId = $routeParams.userId;
      var fullUrl = 'https://monkey-23.firebaseio-demo.com/users2/' + userId;
      var messageListRef = new Firebase(fullUrl);

      messageListRef.on('value', function(snapshot) {
            $scope.userToView = snapshot.val();
            $scope.userToView.id = userId;
            $scope.$apply();
      });

      $scope.email = '';
      // Should be shared by both.
      $scope.saveEmail = function() {
        if ($scope.email) {
          //Push to fire base:
          var listRef = new Firebase('https://monkey-23.firebaseio-demo.com/apply');
          var newPushRef = listRef.push();
          newPushRef.set({email: $scope.email});
          // TODO: save at mix-panel.
          $scope.email = "";
          window.alert("Thanks we will get back to you soon");
        } else {
          $scope.email = "Mm.. apply with your email";          
        } 
      }

  }


  function UsersCtrl($scope, $location, $routeParams, angularFireCollection) {
      // TODO(This is a list that can also update, when change,
      var url = 'https://monkey-23.firebaseio-demo.com/users2/';
      $scope.usersToEdit = angularFireCollection(new Firebase(url), function(usersToEdit) {
        
      });

      $scope.saveNewUser = function(newUser) {
        debugger;
        $scope.usersToEdit.add(newUser);
        $scope.newUser = {'img':''};
      }
}


