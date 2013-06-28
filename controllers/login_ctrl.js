
function LoginCtrl($rootScope, $scope, $location, utils, $cookies, $dialog, $route, notify) {
  if ($cookies.currentUser) {
    $rootScope.currentUser = JSON.parse($cookies.currentUser);
    $rootScope.$broadcast("currentUserInit");
  } else {
    $rootScope.currentUser = null;
  }

  var clickedLogin = false;
  $scope.authClient = new FirebaseAuthClient(fbRef, function(error, authUser) {
    // If login:
    if (authUser) {
      var id = utils.fbClean(authUser.username || authUser.id);

      var currentUserRef = fbRef.child("users").child(id);
      currentUserRef.on('value', function(FBUser) {
          
          $rootScope.currentUser = jQuery.extend($rootScope.currentUser, FBUser.val());
          $cookies.currentUser = JSON.stringify($rootScope.currentUser);
          $rootScope.$broadcast("currentUserInit");
          
          // Handle new user: 
          if (!$rootScope.currentUser.facebook && authUser.username) {
            currentUserRef.update({init:true,
              badgers:3, user: authUser.username || "", name: authUser.name || "", id: id, email: authUser.email || "", facebook: authUser || "",
              img: "http://graph.facebook.com/"+ authUser.id+"/picture?type=large" || ""});
            $scope.openDialog();
          } else if (!$rootScope.currentUser.init && !authUser.username) {
            currentUserRef.update({init:true,
              badgers:3, user: $rootScope.name || "", name: $rootScope.name || "", id: id, email: authUser.email || "",
              img: "http://profile.ak.fbcdn.net/static-ak/rsrc.php/v2/yL/r/HsTZSDw4avx.gif" || ""});
            $scope.openDialog();
          }

          utils.apply($scope);
          if (clickedLogin) {
            if ($location.path() == '/') {
              $location.path('stream/');
            }
            clickedLogin = false;
          }
      }); 
    // Not login:
    } else {
      $rootScope.currentUser = null;
      delete $cookies.currentUser
      $rootScope.$broadcast("currentUserInit");
      utils.apply($scope);;
    }
  });

  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    utils.log('change page');
    if ((next.templateUrl && next.templateUrl != 'home.html') &&
        (!$rootScope.currentUser || $rootScope.currentUser==null)) {
      $rootScope.openLoginDialog();
    }
  });  

  $scope.openDialog = function() {
    utils.log('started registration dialog');
    var d = $dialog.dialog({templateUrl:  '/skills-dialog.html',controller: 'SkillsDialogCtrl',
      backdrop: true, keyboard: false,backdropClick: false});
    d.open().then(function(result){});
    $location.path('stream/');
    utils.apply($scope);;
  }

  $rootScope.isLogin = function() {
    return $rootScope.currentUser && $rootScope.currentUser != null;
  }

  $rootScope.openLoginDialog = function(cantExit) {
    if (!$rootScope.isLogin()) {
      var d = $dialog.dialog({templateUrl: '/login-dialog.html',controller: 'LoginDialogCtrl',
        backdrop: true, keyboard: cantExit || true ,backdropClick: cantExit || true});
        d.open().then(function(result){});
    } else {
      notify.me("you are already login");
    }
  }

  $rootScope.openSignUpDialog(template, ctrl, cantExit) {
    var d = $dialog.dialog({templateUrl: '/signup-dialog.html',controller: 'SignupDialogCtrl',
    backdrop: true, keyboard: cantExit || true ,backdropClick: cantExit || true});
    d.open().then(function(result){});
  }

  $rootScope.openSignUpDialog = function(cantExit) {
    if (!$rootScope.isLogin()) {
      var d = $dialog.dialog({templateUrl: '/signup-dialog.html',controller: 'SignupDialogCtrl',
        backdrop: true, keyboard: cantExit || true ,backdropClick: cantExit || true});
        d.open().then(function(result){});
    } else {
      notify.me("you are already login");
    }
  }



  $rootScope.createEmailUser = function(user, dialog, scope) {
    $rootScope.name = user.name;
    utils.log('click email login');
    clickedLogin = true;
    $scope.authClient.createUser(user.email, user.password, function(error, user) {  
      if (!error) {
        dialog.close();
        notify.me("Cool, you can now login");
        $rootScope.openLoginDialog();
      } else {
        scope.errorMessage = error; 
      }
    });
  }

  $rootScope.emailLogin = function(user) {
    $rootScope.name = user.name;
    $scope.authClient.login('password', {
      email: user.email,
      password: user.password,
      rememberMe: true,
    });
  }

  $rootScope.facebookLogin = function() {
    utils.log('click facebook login');
    clickedLogin = true;
    $scope.authClient.login('facebook', {rememberMe: true});
  }

  $rootScope.logOut = function() {
    utils.log('click logout');
    $scope.authClient.logout();
    $location.path('/');
  }
}


function SignupDialogCtrl($rootScope, $scope, utils, dialog) {
  $scope.loginAndClose = function() {
    $rootScope.facebookLogin();
    dialog.close();
  }

  $scope.showSignUp = function() {
    $scope.signUp = true;
  }

  $rootScope.userLogin = {};
  $scope.emailSignup = function() {
    if (!$rootScope.userLogin.name) {
      $scope.errorMessage = "Please fill in your first and last name";
    }
    else if (!$rootScope.userLogin.email) {
      $scope.errorMessage = "Please fill in your email address";
    }
    else if (!$rootScope.userLogin.password) {
      $scope.errorMessage = "Please fill in password";
    } else {
      $rootScope.createEmailUser($rootScope.userLogin, dialog, $scope);
    }
  }
}


function LoginDialogCtrl($rootScope, $scope, utils, dialog) {
  $scope.loginAndClose = function() {
    $rootScope.facebookLogin();
    dialog.close();
  }

  $scope.showSignIn = function() {
    $scope.signIn = true;
  }

  $rootScope.userLogin = $rootScope.userLogin || {};
  $scope.handleEmailLogin = function() {
    if (!$rootScope.userLogin.email) {
      $scope.errorMessage = "Please fill in your email address";
    } else if (!$rootScope.userLogin.password) {
      $scope.errorMessage = "Please fill in password";
    } else {
      $rootScope.emailLogin($rootScope.userLogin);
      dialog.close();
    }
  }
}
