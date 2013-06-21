mainApp.directive('profile', function() {
    return {
      template: '<a href="/#/detail/{{user.id}}"><img src="https://i.embed.ly/1/display/resize?key=dc65793b3f1249bdb9952a491874d27e&url={{user.img}}&width={{width}}&height={{height}}&grow=true" title="{{user.name}}"/></a>',
      replace: true,
      restrict: 'E',
      scope: { user: '=', currentUser: '='}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.width = iAttrs.width || 50;
        scope.height = iAttrs.height || 50;
      }
    };
})
.directive('calendar', function() {
  return {
      //template: 'hi',
       templateUrl: 'calendar.html',
      replace: true,
      restrict: 'E',
      scope: false,
      controller: 
        function CalendarCtrl ($rootScope, $element, $attrs, $routeParams, $scope, $location, utils, db, $modal, $q) {
          debugger;
          
          var DEFAULT_FREE_TIMES = ['Mondays', 'Tuesdays', 'wednesdays', 'thursdays', 'Fridays', 'Saturdays', 'Sundays']
          .map(function(day, index) {
            return {day:day, isAvailable:true ,start:'06:00 PM', end:'10:00 PM'};
          });

          $scope.calendarRef = fbRef.child('freeTimes').child($scope.userId);
          $scope.calendarRef.on('value', function(freeTimes) {
            if (freeTimes.val()) {
              $scope.freeTimes = freeTimes.val();
            } else {
              $scope.freeTimes = DEFAULT_FREE_TIMES;
            }
            
            $scope.$apply();
          });

          if ($scope.onlyEditMode) {
            $scope.editMode = true;
          } else {
            $scope.editMode = false;
            $scope.editFreeTimes = function() {
              $scope.editMode = true;
            }
          }

          $scope.saveFreeTime = function() {
              $scope.calendarRef.update(utils.removeHashKey($scope.freeTimes));
              $scope.editMode = false;
              $scope.$broadcast("calendar_saved");
          }
        },
      link: function(scope, iElement, iAttrs, controller) {
      }
    };
});
console.log('hello world');