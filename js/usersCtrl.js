angular.module('mainApp', ['firebase'])
  .controller('UserCtrl', ['$scope', 'angularFireCollection',
    function($scope, angularFireCollection) {
      
      var url = 'https://monkey-23.firebaseio-demo.com/users2';
      $scope.users = angularFireCollection(new Firebase(url));
      
      $scope.saveNewUser = function(newUser) {
        $scope.users.add(newUser);
        $scope.newUser = {'img':''};
      }
    }
  ])
