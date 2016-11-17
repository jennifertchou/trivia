var app = angular.module('triviaApp', ['ngAnimate']);
app.controller('triviaCtrl', function($scope, $http, $timeout) {
  $http.get('QA.json').then(function(response){
    $scope.triviaData = response.data;
    $scope.showRandomQA();
  });

  $scope.showRandomQA = function() {
    var index = $scope.getRandomIndex($scope.triviaData.length);
    var QA = $scope.triviaData[index];
    console.log(QA);
    $scope.currentQuestion = QA["question"];
    $scope.currentAnswer = QA["answer"];  
  }

  $scope.getRandomIndex = function(length) {
    return Math.floor(Math.random() * length);
  }

  $scope.showAnswer = function() {
    if(!$scope.answerShown) {
      $scope.startFadeOut = true;
      $timeout(function(){
        $scope.answerShown = true;
      }, 500);
    }
  }

  $scope.showNextQuestion = function() {
    console.log("show next question?");
    if ($scope.answerShown) {
      console.log("showing");
      //$timeout(function(){
        $scope.showRandomQA();
        $scope.startFadeOut = false;
        $scope.answerShown = false;
      //}, 2000);
    }
  }

});

