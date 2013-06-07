// TODO(gutman): move to utils:
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

angular.module('mainApp', ['firebase'])
  .controller('UserCtrl', ['$scope', '$location','$routeParams', 'angularFireCollection',
    function($scope, $location, $routeParams, angularFireCollection) {
      
      var userId = getParameterByName('user');
      var fullUrl = 'https://monkey-23.firebaseio-demo.com/users2/' + userId;
      var messageListRef = new Firebase(fullUrl);
      $scope.usersToView = [];

      messageListRef.on('value', function(snapshot) {
        $scope.$apply(function() {
            // For details.html page:
            $scope.userToView = snapshot.val();
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
        });
      });


      $scope.apply = function() {
        if ($scope.email) {
          // TODO: save at mix-panel, and firebase.
          $scope.email = "";
          window.alert("Thanks we will get back to you soon");
        } else {
          $scope.email = "Mm.. apply with your email";          
        } 
      }

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
  ])
