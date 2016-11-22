var prevStack = []; // Stores previous QAs
var nextStack = []; // Stores QAs that we need to restore
var questionBookmarked = {}; // Dictionary that maps the question to whether 
                        // or not it was bookmarked for when we see it again

var app = angular.module('triviaApp', ['ngAnimate']);
app.controller('triviaCtrl', function($scope, $http, $timeout) {
  $http.get('QA.json').then(function(response){
    $scope.triviaData = response.data;
    $scope.updateQA($scope.getRandomQA());
  });

  $scope.updateQA = function(QA) {
    $scope.startJumboAnim = true;
    $timeout(function(){
      $scope.QA = QA;
      $scope.currentQuestion = QA["question"];
      $scope.currentAnswer = QA["answer"]; 
      $scope.startFadeOut = false;
      $scope.answerShown = false;
      $scope.saved = questionBookmarked[$scope.currentQuestion];
      $scope.setStar($scope.saved); // Restore bookmarked state
    }, 300);
    $timeout(function(){
        $scope.startJumboAnim = false; 
      }, 600);
  }

  $scope.showPrevQuestion = function() {
    if (prevStack.length) {
      // Push current question/answer to nextStack to restore later
      nextStack.push($scope.QA);
      // Pop previous question/answer from prevStack and display it
      $scope.updateQA(prevStack.pop());
    }
  }

  $scope.showAnswer = function() {
    if(!$scope.answerShown) {
      $scope.startFadeOut = true;
      $timeout(function(){
        $scope.answerShown = true;
      }, 300);
    }
  }

  $scope.showNextQuestion = function() {
    // Push current question/answer onto prevStack
    prevStack.push($scope.QA);
    // Save info about whether or not the question was bookmarked
    questionBookmarked[$scope.currentQuestion] = $scope.saved;
    // Check to see if there's stuff in nextStack to restore
    if (nextStack.length) {
      // Pop question off nextStack
      $scope.updateQA(nextStack.pop());
    } else {
      $scope.updateQA($scope.getRandomQA());
    }
  }

  $scope.getRandomQA = function() {
    var index = Math.floor(Math.random() * $scope.triviaData.length);
    return $scope.triviaData[index];
  }

  $scope.toggleStar = function() {
    if ($scope.saved) {
      star.src = "images/emptystar.png";
      $scope.saved = false;
    } else {
      star.src = "images/filledstar.png";
      $scope.saved = true;
    }
  }


  $scope.setStar = function(filled) {
    var star = document.getElementById('star');
    if (filled) {
      star.src = "images/filledstar.png";
    } else {
      star.src = "images/emptystar.png";
    }
  }

  $scope.key = function($event){
      /* left 37, up 38, right 39, down 40*/
      if ($event.keyCode == 40 || $event.keyCode == 38) { // down/up
          $scope.showAnswer();
      } else if ($event.keyCode == 39) { // right
          $scope.showNextQuestion();    
      } else if ($event.keyCode == 37) { //left
          $scope.showPrevQuestion();
      } else if ($event.keyCode == 83) { //'s'
          $scope.toggleStar();
      }
  }

});

