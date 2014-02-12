'use strict';


/* Controllers */

angular.module('squak.controllers', ['firebase','squak.services'])

  .controller('Auth', ['$scope','$location','$log','authManager','Currentuser',function($scope,$location,$log,authManager,Currentuser) {

        $log.log("In the Auth controller");
       
       // If the user is logged in take them to dashboard.
       if (!!$scope.auth) {
              $log.log("User is logged in as id:"+ $scope.auth.id);
              $location.path('/member/'+$scope.auth.id);
              Currentuser.set($scope.auth.id);
            }


	$scope.$on('angularFireAuth:login',function(){
		$log.log("Success for login.");
                $log.log("User is logged in as id:"+ $scope.auth.id);
                $location.path('/member/'+$scope.auth.id);
              
	});

        $scope.email = null;
        $scope.pass = null;
        $scope.name = null;

        $scope.login = function(callback){
          $scope.err = null;
          authManager.login($scope.email,$scope.pass,'/',function(err,user){
            $scope.err = err || null;
            typeof(callback) === 'function' && callback(err,user);
          });
        };

	$scope.$on('angularFireAuth:error',function(error){
		$log.log("Problem for login.");
		$log.log(error);
	});
	$log.log($scope.user);
			
	//$scope.user={"firstName":"","lastName":"","email":"","password":"","friends":[3,4]}; 
  }])
  .controller('Join', ['$scope',function($scope) {
	$scope.user={"firstName":"","lastName":"","email":"","password":"","friends":[3,4]}; 
	$scope.join = function(user){};
  }])
  .controller('Dashboard', ['$scope','$log','$routeParams','angularFire','Users','Currentuser','Games',function($scope,$log,$routeParams,angularFire,Users,Currentuser,Games) {
	//var all_users = Users.collection();
        //$log.log(all_users.name);
        //var userID = Currentuser.get()
        $scope.userID = $routeParams.userID;
        $scope.getActiveGames = function(){
            $log.log("Inside getActiveGames");
            $scope.activegames = Games.collection();

            $log.log();
        }


        $log.log($routeParams.userID);
        Currentuser.set($routeParams.userID);
        
	//var all_users = FireRef.users;
	//$scope.user = Users.get($routeParams.userID);
	angularFire(Users.get($routeParams.userID),$scope,'user');
	//$scope.test = all_users;
	//$scope.join = function(user){};
  }])
  .controller('Prompts', ['$location','$log','$routeParams','Prompts','$scope','Games','Currentuser',function($location,$log,$routeParams,Prompts,$scope,Games,Currentuser) {
        var userID = Currentuser.get()
        var opponent = $routeParams.opponent;
        $scope.prompts = Prompts.items;
        $scope.promptID='';
        $scope.creategame = function(promptID,points){
          var gameID = Games.create(userID,opponent,promptID,points);
          $log.log("Done creating the game.");
          $location.path('/game/'+gameID+'/record');
        }
  }])
  .controller('NewGame', ['$location','$log','Users','$scope','Currentuser',function($location,$log,Users,$scope,Currentuser) {
        
        //$scope.friends = Users.collection();
        $scope.getFriends = function(){
          $scope.friends = Users.collection();
        }
        var cu = Currentuser.get();
        $log.log("Logging" + $scope.friends); 
        $log.log($scope.auth);
        $log.log("We got the current user ID:"+ cu);
  }])
  .controller('Record', ['$location','$window','$log','$scope','Games','Recordjs','$routeParams','$sce',function($location,$window,$log,$scope,Games,Recordjs,$routeParams,$sce) {
        //$scope.test = function(){
          //Games.create(1);
        //}
         $scope.sound=false;
         $scope.Recordjs= Recordjs;
         $scope.game_data = {'prompt':{'value':'Loading Please Wait'}};
         $scope.recording_link = "testing";

         var game = Games.get($routeParams.gameID);
         var data = game.on('value',function(snapshot){ $scope.game_data = snapshot.val();
            
            $log.log("Inside once:"+$scope.game_data);
            $scope.$apply( function(){
              $log.log("Updating scope");
              $scope.game_data});
            return $scope.game_data;
         }); 
        //$scope.game_data;
        var gameID = $routeParams.gameID;
        $scope.init = function(){
            $log.log("Inside of the init function");
            $log.log($scope.game_data);
            Recordjs.init();
            //$scope.recording_link = Recordjs.blob;
            //$scope.game_data = data;
        }
        $scope.startRecording = function(){ 
            $log.log("In startRecording");
            var test = Recordjs.startRecording();
            $log.log("Logging the return url startRecording"+test);
        }
        $log.log($scope.game_data);
        $scope.setrecording = function(){
          // TODO this fuction will add a reference to the wav file.
          $log.log("Saving File");
          Recordjs.saveFile(gameID);
          //$Record.js.blob="";
          $log.log("Exited setrecording function");
        }
  }])
  .controller('Guess', ['$sce','$scope','$location','$log','$routeParams','Games','Currentuser','Users','$rootScope',function($sce,$scope,$location,$log,$routeParams,Games,Currentuser,Users,$rootScope) {
      var gameID = $routeParams.gameID;
      var game = Games.get(gameID);
      $scope.userID= Currentuser.get();
      //var testUser= Users.get(2);//Users.get($scope.userID);
      $scope.answered = false;
      $scope.correct = false;
      /*game.on('value',function(snapshot){ $scope.game_data = snapshot.val();

            $log.log("Inside once:"+$scope.game_data);
            $scope.$apply( function(){
              $log.log("Updating scope");
              $scope.game_data});
            return $scope.game_data;
         });*/

      $scope.check = function(){
        $scope.answered=true;
        
        if($scope.attempt.toLowerCase()==$scope.game_data.prompt.value.toLowerCase()){
          $log.log("Matched");
          $scope.correct=true;
          $log.log("Updating score:"+$scope.game_data.prompt.points+$scope.tu.points); 
          Users.update($scope.tu.id,{points:parseInt($scope.game_data.prompt.points)+parseInt($scope.tu.points)});
          var next_turn = (($scope.game_data.player1.id==$scope.tu.id)?$scope.game_data.player2.id:$scope.game_data.player1.id);
          Games.update(gameID,{turn:next_turn});
        }  
        else{
          $log.log("Sorry Please Try Again");
          game.remove();
        }
        

      }

      $scope.init = function(){
          $log.log("Initializing Guess controller.");
          var testUser= Users.get($scope.auth.id);

          testUser.on('value',function(snapshot){ $scope.tu = snapshot.val();

            $log.log("Trying to update the user object.");
            $scope.$apply( function(){
              $log.log("Updating scope");
              $scope.tu;
         });
         });
          game.on('value',function(snapshot){ $scope.game_data = snapshot.val();

            $log.log("Inside once:"+$scope.game_data);
            $scope.$apply( function(){
              $log.log("Updating scope");
              $scope.game_data;
              var url = '/app/sounds/'+ $scope.game_data.prompt.file;
              $log.log("Logging path:"+ url);
              $scope.file_loc = $sce.trustAsResourceUrl(url); });
         });
      }

  }])
  .controller('Landing', ['$location','$log',function($location,$log) {

  }])
  .controller('MyCtrl2', [function() {

  }]);
