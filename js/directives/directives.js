mainApp.directive('profile', function() {
    return {
      template: '<img src="https://i.embed.ly/1/display/resize?key=dc65793b3f1249bdb9952a491874d27e&url={{user.img}}&width={{width}}&height={{height}}&grow=true" title="{{user.name}}"/>',
      replace: true,
      restrict: 'E',
      scope: { user: '=', currentUser: '='}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.width = iAttrs.width || 50;
        scope.height = iAttrs.height || 50;
      }
    };
  })
  .directive('stream', function() {
    return {
      templateUrl: 'streamTemplate.html',
      replace: true,
      restrict: 'E',
      controller: function($rootScope, $element, $attrs, $transclude, $scope, $location) {
        var LENGTH = 5;
        var itemsRef = fbRef.child($attrs.list)
        $scope.items = []
        $scope.hiddenItems = []

        itemsRef.once('value', function(items) {
           $scope.items = []
           for(var key in items.val()) {
              var item = items.val()[key];
              if ($scope.items.length <= LENGTH) {
                $scope.items.unshift(item);
              } else {
                $scope.hiddenItems.unshift(item);
              }
           };
           $scope.$apply();
        });

        itemsRef.on('child_added', function(item) {
           $scope.items.unshift(item.val());
           $scope.hiddenItems.unshift($scope.items.pop());
        });

        $scope.min = 0;

        var timer = setInterval(function() {
          $scope.currentUser = $rootScope.currentUser;
          $scope.items.unshift($scope.hiddenItems.pop());
          $scope.hiddenItems.unshift($scope.items.pop());
          $scope.$apply();
        }, 5000);

        $scope.accept = function(item) {
          $location.path('video/' + item.user.id + "/" + $rootScope.currentUser.id);
          $scope.$apply();
        }

        $scope.newItem = {}
        $scope.addNew = function() {
          $scope.newItem.user = $rootScope.currentUser;
          itemsRef.push($scope.newItem);
          $scope.newItem = {}
        }
      },
      scope: { list: '@', currentUser: '@'}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.list = iAttrs.list;
      }
    };
  });
console.log('hello world');