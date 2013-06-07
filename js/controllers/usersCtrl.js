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
      messageListRef.on('value', function(snapshot) {
        $scope.$apply(function() {
            // For details.html page:
            $scope.userToView = snapshot.val();
            // For index.html page:
            debugger;
            $scope.users = snapshot.val();
            var ids = Object.keys($scope.users);

            $scope.user1 = $scope.users[ids[0]];
            $scope.user1.id = ids[0];
        });
      });


      // TODO(This is a list that can also update, when change,
      // var url = 'https://monkey-23.firebaseio-demo.com/users2/';
      // $scope.users = angularFireCollection(new Firebase(url), function(users) {
      //   //debugger;
      // });

      $scope.saveNewUser = function(newUser) {
        $scope.users.add(newUser);
        $scope.newUser = {'img':''};
      }
    }
  ])
