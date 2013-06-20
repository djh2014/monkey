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
  });
console.log('hello world');