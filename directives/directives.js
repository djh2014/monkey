mainApp.directive('profileImg', function() {
    return {
      template: '<img class="img-rounded" src="https://i.embed.ly/1/display/resize?key=dc65793b3f1249bdb9952a491874d27e&url={{user.img}}&width={{width}}&height={{height}}&grow=true" title="{{user.name}}">',
      replace: true,
      restrict: 'E',
      scope: { user: '=', currentUser: '='}, 
      link:  function(scope, iElement, iAttrs, controller) {
        scope.width = iAttrs.width || 50;
        scope.height = iAttrs.height || 50;
      }
    };
})
.directive('profile', function() {
    return {
      template: '<a href="/#/profile/{{user.id}}"><img class="img-rounded" src="https://i.embed.ly/1/display/resize?key=dc65793b3f1249bdb9952a491874d27e&url={{user.img}}&width={{width}}&height={{height}}&grow=true" title="{{user.name}}"></a>',
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
      templateUrl: 'calendar.html',
      replace: true,
      restrict: 'E',
      scope: false,
      controller: 
        function CalendarCtrl ($rootScope, $element, $attrs, $routeParams, $scope, $location, utils, db, $modal, $q) {    
          // Create the default times:
          var DEFAULT_FREE_TIMES = ['Mondays', 'Tuesdays', 'wednesdays', 'thursdays', 'Fridays', 'Saturdays', 'Sundays']
            .map(function(day, index) {
              var times = {day:day, isAvailable:false , start:'06:00 PM', end:'10:00 PM'};
              if (day == 'Sundays') {
                times.isAvailable = true;
              }
              return times;
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

function watch(watch_id, cb) {
  // TEMP:
  $(document).ready(function() {
    var watchRef = fbRef.child('watch').child(watch_id);
    var init = false;
    watchRef.child('time').on('value', function(time) {
      time = time.val();
      if (!init) {
        init = true;
        if (time) {
          $('#watch').stopwatch({startTime: time});
        } else {
          $('#watch').stopwatch();
          watchRef.update({state:'start'});
        }
        watchRef.child('state').on('value', function(state) {
        var state =state.val();
        if (state) {
          if (state == "start") {
            $('#watch').stopwatch('start');
          }
          if (state == "stop") {
            $('#watch').stopwatch('stop');
          }
          if (state == "reset") {
            $('#watch').stopwatch('destroy');
            $('#watch').stopwatch();
            watchRef.update({state:'start', time:0});
          }
        }
        });

        $('#watch').bind('tick.stopwatch', function(e, elapsed) {
        if ((elapsed % 1000) == 0) {
            if(cb) {
              cb(elapsed);
            }
            var time = $('#watch').stopwatch('getTime');
            watchRef.update({time:time})
          }
        });

        $('#start').click(function() {
          watchRef.update({state:'start'});
        });
        $('#stop').click(function() {
          watchRef.update({state:'stop'});
        });
        $('#reset').click(function() {
          watchRef.update({state:'reset'});
        });
      }
    });
  });
}