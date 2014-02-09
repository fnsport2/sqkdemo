(function(){
    'use strict';

    var squakComponents = ['ngRoute','firebase','squak.filters','squak.services','squak.directives','squak.controllers'];

    // Declare app level module which depends on filters, and services
    angular.module('squak', squakComponents)

    // Routes set up

    .config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/welcome', {
			templateUrl: 'partials/landing.html', 
			controller: 'Landing'
		});
		$routeProvider.when('/join', {
			templateUrl: 'partials/join.html', 
			controller: 'Join'
		});
		$routeProvider.when('/member/:userID/', {
			templateUrl: 'partials/dashboard.html'//, 
			//controller: 'Dashboard',
			//authRequired: true
		});
		$routeProvider.when('/login', {
			templateUrl: 'partials/login.html', 
			controller: 'Auth'
		});
		$routeProvider.when('/view2', {
			templateUrl: 'partials/partial2.html', 
			controller: 'MyCtrl2'
		});
		$routeProvider.when('/newgame', {
			templateUrl: 'partials/newgame.html'
		});
		$routeProvider.when('/newgame/prompt/:opponent/', {
			templateUrl: 'partials/prompts.html'
		});
		$routeProvider.when('/game/:gameID/record', {
			templateUrl: 'partials/record.html', 
			//controller: 'Record'
		});
		$routeProvider.when('/game/:gameID/guess', {
			templateUrl: 'partials/guess.html', 
			authRequired: true
			//controller: 'Record'
		});
		$routeProvider.otherwise({
			redirectTo: '/welcome'
		});
	}])

      // establish authentication
      .run(['angularFireAuth', 'FBURL', '$rootScope', 
        function(angularFireAuth, FBURL, $rootScope) {
          angularFireAuth.initialize(new Firebase(FBURL), {scope: $rootScope, name: 'auth', path: '/login'});
          $rootScope.FBURL = FBURL;
        }])

      .constant('FBURL','https://squak-demo.firebaseio.com/')
	
})();
