(function(angular){
	'use strict';

	/* Services */

	var squakServices = angular.module('squak.services',['ngResource']);

	squakServices.factory('updateScope', ['$timeout', '$parse', function($timeout, $parse) {
      return function(scope, name, val, cb) {
         $timeout(function() {
            $parse(name).assign(scope, val);
            cb && cb();
         });
      }
   }]);

	squakServices.factory('authManager',['$rootScope','Firebase', 'angularFireAuth','$location','$log',function($rootScope,Firebase,angularFireAuth,$location,$log){

              return {
                        login: function(email, pass, redirect, callback){
                          var p = angularFireAuth.login('password',{
                            email: email,
                            password: pass,
                            remeberMe: true
                          });
                          p.then(function(user){
                            if(redirect) {
                              $location.path(redirect);
                            }
                            callback && callback(null, user);
                          }, callback);
                        },
                        logout: function(redirectPath){
                          angularFireAuth.logout();
                          if(redirectPath){
                            $location.path(redirectPath);
                          }
                        }
                    }

	}]);

	squakServices.factory('FireRef',['FBURL','Firebase',
		function(FBURL,Firebase){
			return {
                            users: function(){
                              //return new Firebase(FBURL+'users');
                              return new Firebase('https://squak-demo.firebaseio.com/users');
                            },
                            sounds: function(){
                              return new Firebase(FBURL);
                            },
                            games: function(){
                              return new Firebase('https://fnsport2.firebaseio.com/Sounds');
                            }
                        }	
		}]);
	squakServices.factory('Users',['$log', 'angularFireCollection','FireRef',
		function($log,angularFireCollection,FireRef){
                        $log.log("Made it to the service Users");
			return {
                          collection: function(cb){
                            return angularFireCollection(FireRef.users(),cb);
                          },
                          get: function(userID){
                            $log.log("userID is"+userID);
                            //return FireRef.users().child('/'+userID);
                            return FireRef.users().child('/'+userID);
                          },
                          update: function(path,object){
                            FireRef.users().child('/'+path).update(object);
                            $log.log("Updating user");
                          }
                      }	
		}]);
        squakServices.factory('Games',['Users','$log','FireRef','angularFireCollection',
                function(Users,$log,FireRef,angularFireCollection){
                    //$log.log();
                  return{
                    create: function(player,opponent,promptID,points){
       

                      var p1_name = Users.get(player).child("/name");
                      p1_name.once('value', function(dataSnapshot) {
                          // store dataSnapshot for use in below examples.
                          p1_name = dataSnapshot.val();
                      });
                      var p2_name = Users.get(opponent).child("/name");
                      p2_name.once('value', function(dataSnapshot) {
                          // store dataSnapshot for use in below examples.
                          p2_name = dataSnapshot.val();
                      });
 
                      $log.log("Player1 name:"+p1_name);
                      $log.log("Creating a game.");
                      /*var ngame = FireRef.games().push(
                                          {"player1":{id:player,
                                                      name:p1_name},
                                          "player2":{id:opponent,
                                                    name:p2_name},
                                          "turn":opponent,
                                          "prompt":{"value":promptID,
                                                    "points":points,
                                                    "file":""}})//.name();*/
                      var ngame = FireRef.games().push();
                      var gameID = ngame.set({"player1":{id:player,
                                                      name:p1_name},
                                          "player2":{id:opponent,
                                                    name:p2_name},
                                          "turn":opponent,
                                          "prompt":{"value":promptID,
                                                    "points":points,
                                                    "file":""}});//.name();
                      ngame.update({"id":ngame.name()});
                      $log.log("Created a game"+ ngame.name());
                      $log.log("http://localhost:8000/app/#/"+ ngame+"/record");

                      return ngame.name();
                    },
                    collection: function(cb){
                      $log.log("Getting the Sounds collection from firebase.");
                      var collection = angularFireCollection(FireRef.games(),cb); 
                      //return angularFireCollection(FireRef.games(),cb); 
                      return collection; 
                    },
                    get: function(gameID){
                      return FireRef.games().child('/'+gameID);
                    },
                    update: function(gameID,object){
                    FireRef.games().child('/'+gameID).update(object);
                    $log.log("Updating game");

                    },
                    advance: function(gameID,userID){
                    // move player to the next game
                    }
                      
                  }

                }]);
        /**
        * Prompts Service
        *
        * This is the service to handle the prompts AKA : the recordings.
        * For now the sounds are hardcoded, but ideally would be coming 
        * from a server, perhaps a simple json file.
        *
        * Methods:  
        *
        */
        squakServices.factory('Prompts',['$log',
                function(){
                  var PROMPTS = {};

                  PROMPTS.items = [ 
                    {"sound":"static", "points":100},
                    {"sound":"poodle", "points":200},
                    {"sound":"explosion", "points":150},
                    {"sound":"cow", "points":75}];

                  return PROMPTS;
                }]);
        /**
        * Currentuser Service
        * 
        * Keeps track of the logged in user. The auth cookie does not
        * keep track of the userID that, but uses an encrypted session.
        *
        * Methods:
        *
        *   set -- set the logged in user's id. (done after signing in)
        *   get -- returns the logged in user's id.
        *
        */
        squakServices.factory('Currentuser',
                function(){
                  var authUser = '';
                  var currentUser = {};

                  currentUser.set = function(id){
                    authUser = id;
                  };
                  currentUser.get = function(){
                    return authUser;
                  };
                return currentUser;
                });
        /**
        * Record js service
        *
        * Has methods to handle recording sounds and creating
        * wav files.
        *   
        * Methods:
        *
        *
        *
        */
        squakServices.factory('Recordjs',['$location','$window','$log','Games','$timeout','$rootScope','$sce','$http',function($location,$window,$log,Games,$timeout,$rootScope,$sce,$http){
            var audio_context;
            var recorder;
            var audio_input;
            var url;
            var _blob;

            var recordjs = {};
            function startUserMedia(stream) {
                    audio_input = audio_context.createMediaStreamSource(stream);
                    $log.log('Media stream created.');
      
                    audio_input.connect(audio_context.destination);
                    $log.log('Input connected to audio context destination.');
      
                    recorder = new $window.Recorder(audio_input,{workerPath:'lib/recorderjs/recorderWorker.js'});
                    $log.log('Recorder initialised.');
            }
            function _updateBlob(blob){

                  $rootScope.$apply(function(){
                  recordjs.blob=$sce.trustAsResourceUrl(blob);
                  });
            }

            recordjs.get_url = function(){
                return recordjs.blob;
            }

            recordjs.startRecording = function(button){
                $log.log("In start recording");
                audio_input.connect(audio_context.destination);
                recorder && recorder.record();
                var link;
                $timeout(function(link){
                  $log.log("Start waiting");
                  recorder && recorder.stop();
                  recorder && recorder.exportWAV(function(blob) {
                  _blob = blob;
                  url = $window.URL.createObjectURL(blob);
                  link = url;
                  _updateBlob(url);
                  $log.log('Recording url'+ url);
                  $log.log('Blob is'+ blob);
                  $log.log('Link is'+ link);
                  });
                  //link = createDownloadLink();
                  recorder.clear();
                  audio_input.disconnect(); 
                  $log.log("Done waiting"); 
                  
                  return link;
                  },4500);
                  
                  
                //button.disabled = true;
                //button.nextElementSibling.disabled = false;
                $log.log('Recording'+ link);
                return link;
            };


            function createDownloadLink() {
                recorder && recorder.exportWAV(function(blob) {
                  url = $window.URL.createObjectURL(blob);
                  $log.log('Recording url'+ url);
                  //var li = document.createElement('li');
                  //var au = document.createElement('audio');
                  //test_reader.readAsDataURL(blob);     
                  
                  //test_reader.onloadend = function(){
                  //newPushRef.set({data:test_reader.result});
                  //};
                  //ounds.set({sound2:for_upload});
                  //au.controls = true;
                  //au.src = url;
                  //au.src = test_reader.result;
                  return url;
                });
              }

            recordjs.stopRecording = function(button) {
                recorder && recorder.stop();
                button.disabled = true;
                button.previousElementSibling.disabled = false;
                $log.log('Stopped recording.');
    
                // create WAV download link using audio data blob
                //createDownloadLink();
    
                recorder.clear();
            };

            recordjs.saveFile = function(gameID){
                  var test_name = "squak";
                  var resText;


                  function _updateFileLoc(loc){
                      
                      $rootScope.$apply(function(){
                      recordjs.fileLoc=loc;
                      $log.log("Updating file location:"+ recordjs.fileLoc);

                      Games.update(gameID+"/prompt",{file:loc});
                      });
                  }
                  var xhr=new $window.XMLHttpRequest();
                  xhr.onload=function(e) {
                      if(this.readyState === 4) {
                          console.log("Server returned: ",e.target.responseText);
                          _updateFileLoc(e.target.responseText);
                          _updateBlob(null);
                          return resText = e.target.responseText;
                      }

                    //return resText;
                  };

                  var fd=new $window.FormData();
                  fd.append(test_name,_blob);
                  
                  xhr.open("POST","/savefile/squak",true);
                  xhr.send(fd);
                  $log.log(xhr.responseText);
                 /*$http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded"; 
                  $http({method: "POST", data: fd, url:"/savefile/squak", headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                    success(function(data, status){
                        $log.log("Success");
                        $log.log(data);
                        
                    }).
                    error(function(data, status){

                        $log.log("Fail");
                        $log.log(data);
                    });*/
                  

            };

            recordjs.init = function(){

                  // webkit shim
                  $window.AudioContext = $window.AudioContext || $window.webkitAudioContext;
                  $window.navigator.getUserMedia = $window.navigator.getUserMedia || $window.navigator.webkitGetUserMedia;
                  $window.URL = $window.URL || $window.webkitURL;

                  audio_context = new $window.AudioContext;

                  //

                  $window.navigator.getUserMedia({audio:true},startUserMedia,function(e){
                      $log.log("No live audio input:"+e);
                  });

                  // Note: The file system has been prefixed as of Google Chrome 12:
                  window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

            };

          

            return recordjs;

        }]);
	//squakServices.factory('Users',['$scope', 'angularFireCollection',
	//	function($scope,angularFireCollection){
	//		return angularFireCollection(new FireBase('https://squak-demo.firebaseio.com/users'));	
	//	}]);
/*
// Demonstrate how to register services
// In this case it is a simple value service.
/*angular.module('squak.services', ['ngResource']).
  value('version', '0.1')
  .factory('Users',['$resource',
	function($resource){
		return $resource('https://squak-demo.firebaseio.com/users/:userID.json',{},{
		query:{method:'GET',isArray:true}
		});
	}]);
*/
})(angular);
