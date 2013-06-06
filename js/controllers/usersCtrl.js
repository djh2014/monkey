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
      debugger;
      var fullUrl = 'https://monkey-23.firebaseio-demo.com/users2/' + userId;
      var messageListRef = new Firebase(fullUrl);
      messageListRef.on('value', function(snapshot) {
        $scope.$apply(function() {
            $scope.userToView = snapshot.val();
        });
      });

      var url = 'https://monkey-23.firebaseio-demo.com/users2/';
      $scope.users = angularFireCollection(new Firebase(url), function(users) {
        //debugger;
      });

      $scope.saveNewUser = function(newUser) {
        $scope.users.add(newUser);
        $scope.newUser = {'img':''};
      }
    }
  ])
