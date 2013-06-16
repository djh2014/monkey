var fbUrl = 'https://getbadgers.firebaseio.com';
var fbRef = new Firebase(fbUrl);
var fbUsersRef = new Firebase(fbUrl + '/users');

mainApp = angular.module('mainApp', ['firebase', '$strap.directives'])
  .config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:HomeCtrl, templateUrl:'home.html'}).
      when('/stream', {controller:StreamCtrl, templateUrl:'stream.html'}).
      when('/users', {controller:UsersCtrl, templateUrl:'users.html'}).
      when('/meetings/:userId', {controller:MeetingsCtrl, templateUrl:'meetings.html'}).
      when('/meeting/:userId1/:userId2', {controller:MeetingCtrl, templateUrl:'meeting.html'}).
      when('/detail/:userId', {controller:DetailCtrl, templateUrl:'detail.html'}).
      when('/edit/:userId', {controller:EditProfileCtrl, templateUrl:'editProfile.html'}).
      otherwise({redirectTo:'/'});
  });

  function MeetingsCtrl ($rootScope, $routeParams, $scope, $location, utils, db) {
    db.get($scope, 'meetings', 'meetings', function() {
      $scope.meetings = utils.listValues($scope.meetings);
      $scope.meetings = $scope.meetings.filter(function(e, i) {
        return e.teacher.id == $routeParams.userId || e.student.id == $routeParams.userId;
      });
      $scope.$apply();
    });

    $scope.approve = function(meeting_id) {
      debugger;
      fbRef.child("meetings").child(meeting_id).update({status:"APPROVED"});
      $scope.$apply();
    }

    $scope.reject = function(meeting_id) {
      debugger;
      fbRef.child("meetings").child(meeting_id).update({status:"REJECT"});
      $scope.$apply();
    }
  }

  function DetailCtrl($scope, $rootScope, $location, $routeParams,db, utils) {      
    $scope.viewedUserRef = fbRef.child("users").child($routeParams.userId);

    $scope.viewedUserRef.on('value', function(viewedUser) { 
      $scope.user = viewedUser.val();
      $scope.user.id = $routeParams.userId;
      if($scope.user.requests) {
        $scope.user.requests = Object.keys($scope.user.requests);
      }
      $scope.$apply();
    });

    // TODO(guti): move this away.
    $scope.setRequest = function() {
      
      if($rootScope.currentUser) {
        var key = utils.genKey($scope.user.id, $rootScope.currentUser.id);
        var meeting = {};
        meeting[key] = {'teacher':$scope.user, 'student':$rootScope.currentUser, 'status':"NEW", 'id': key};
        fbRef.child('meetings').update(meeting);
        window.alert('meeting is pending for ' + $scope.user.name + 'approval');
        $location.path('meetings/' + $rootScope.currentUser.id);
      } else {
        window.alert("you need to sign in first");
      }
    }
  }

  function MeetingCtrl ($rootScope, $routeParams, $scope, $location, utils, db) {
    // Messages: TODO(guti): make a directive:
    var listKey = utils.genKey($routeParams.userId1, $routeParams.userId2);
    $scope.listRef = fbRef.child("meeting_messages").child(listKey);

    $scope.listRef.on("value", function(messages) {
      $scope.items  = utils.listValues(messages.val());
    });

    $scope.newItem = {};
    $scope.addNew = function() { 
      if ($rootScope.currentUser.id ==  $scope.user1.id || 
          $rootScope.currentUser.id ==  $scope.user2.id) {
        
        $scope.newItem.user = $rootScope.currentUser;
        $scope.listRef.push($scope.newItem);
        $scope.newItem = {};      
      } else {
        window.alert('sorry you are not a user');
      }
    }

    db.get($scope, 'users/' + $routeParams.userId1, 'user1');
    db.get($scope, 'users/' + $routeParams.userId2, 'user2');
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
              if (!$rootScope.currentUser.skills) {
                  window.alert('please let us know about your skills'); 
                  $scope.directToEditPage = false;
                  $location.path('edit/'+ $rootScope.currentUser.id+"/");   
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
        //window.alert("Changes Saved");
          $location.path('detail/'+$scope.user.id);
          $scope.$apply();
      }
  }

  function HomeCtrl($scope, $location, angularFireCollection, $rootScope) {
    var fullUrl = 'https://getbadgers.firebaseio.com/users/';
    var messageListRef = new Firebase(fullUrl);
    $scope.usersToView = [];
    
    // navigate to stream if login.
    // $rootScope.$on("currentUserInit", function() {
    //   if ($rootScope.currentUser) {
    //     $location.path('stream');
    //     $scope.$apply();
    //   }
    // });

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

  function UsersCtrl($scope, $location, $routeParams, angularFireCollection) {
      fbRef.child("users").on('value', function(users) {
        $scope.users = users.val();
        $scope.$apply();
      });

      $scope.newUser = {'img':''};
      $scope.saveNewUser = function(newUser) {
        $scope.users.add(newUser);
        $scope.newUser = {'img':''};
      }
  }


