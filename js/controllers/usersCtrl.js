angular.module('mainApp', ['firebase'])
  .controller('UserCtrl', ['$scope', '$location', 'angularFireCollection',
    function($scope, $location, angularFireCollection) {
      
      var userId = $location.hash();
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
