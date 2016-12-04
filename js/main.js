var prevStack = []; // Stores previous QAs
var nextStack = []; // Stores QAs that we need to restore
var questionStarred = {}; // Dictionary that maps the question to whether 
                        // or not it was starred for when we load it again
var starredQAs = new Set(); // Set of QAs that are starred
var selectedDifficulties = new Set([100,200,400,600,800,1000]); // Set of difficulties selected
var updateRequested = false; // Flag to prevent concurrency issues with updating difficulties
var showingStarred = false;
// Used to save the state when going out of random mode
var oldPrevStack;
var oldNextStack;
var oldQA;

var app = angular.module('triviaApp', ['ngAnimate']);
app.controller('triviaCtrl', function($scope, $http, $timeout) {
  $scope.ready = false;
  // Load 1 random question first so it shows up immediately
  $http.get('http://jservice.io/api/random').then(function(response){
    $scope.triviaData = response.data;
    updateQA(getRandomQA());
    // Give time for GUI to update
    $timeout(function(){
      $scope.ready = true;
    }, 300);
  });
  // Then get more questions
  $http.get('http://jservice.io/api/random?count=100').then(function(response){
    $scope.triviaData = $scope.triviaData.concat(response.data);
  });

  /* Go into random mode */
  $scope.showRandomMode = function() {
    document.getElementById("random").className = "active";
    document.getElementById("starred").className = "";

  // Don't do anything if you're already in random mode.
    if (!showingStarred) return;

    prevStack = oldPrevStack;
    nextStack = oldNextStack;
    updateQA(oldQA);
    showingStarred = false;
    $scope.noStarredQuestions = false;
  }

  /* Go in starred mode */
  $scope.showStarredMode = function() {
    document.getElementById("random").className = "";
    document.getElementById("starred").className = "active";
    // Don't do anything if you're already in starred mode.
    if (showingStarred) return;
    showingStarred = true;
    // Save prevStack and nextStack to restore in random mode
    oldPrevStack = prevStack;
    oldNextStack = nextStack;
    oldQA = $scope.QA;

    prevStack = [];
    nextStack = Array.from(starredQAs);
    if (nextStack.length) {
      // Show first starred question
      updateQA(nextStack.pop()); 
    } else {
      // Hide jumbotron and show "nothing is starred" message
      $scope.noStarredQuestions = true; 
    }
  }

  /* Updates the GUI and $scope variables */
  var updateQA = function(QA) {
    // Don't do animation at the very beginning of loading the page
    if (prevStack.length + nextStack.length != 0) {
      $scope.startJumboAnim = true;
    }
    $scope.QA = QA;
    // Timeout so the question changes after the jumbotron fades out
    $timeout(function(){
      $scope.currentQuestion = QA["question"];
      $scope.currentAnswer = QA["answer"]; 
      $scope.currentCategory = QA["category"]["title"];
      $scope.startFadeOut = false;
      $scope.answerShown = false;
      $scope.saved = false;
      if ($scope.currentQuestion in questionStarred) {
        $scope.saved = questionStarred[$scope.currentQuestion];
      }
      $scope.setStar($scope.saved); // Restore starred state
      // Make prev arrow transparent if it's the first thing
      $scope.showPrevArrow = prevStack.length;
      // Make next arrow transparent if you're in starred mode and 
      // nothing is left, else allow show next arrow in random mode
      $scope.hideNextArrow = showingStarred ? !nextStack.length : false;
    }, 300);

    // The animation is over in 600 ms
    $timeout(function(){
      $scope.startJumboAnim = false; 
    }, 600);
  }

  $scope.showPrevQuestion = function() {
    if (prevStack.length) {
      // Push current question/answer to nextStack to restore later
      nextStack.push($scope.QA);
      // Pop previous question/answer from prevStack and display it
      updateQA(prevStack.pop());
    }
  }

  $scope.showAnswer = function() {
    if(!$scope.answerShown) {
      $scope.startFadeOut = true;
      $timeout(function(){
        $scope.answerShown = true;
        // Start animating next arrow
      }, 300);
    }
  }

  $scope.showNextQuestion = function() {
    // Don't do anything if in starred mode and nothing's left
    if (showingStarred && !nextStack.length) return;
    // Push current question/answer onto prevStack
    prevStack.push($scope.QA);
    // Check to see if there's stuff in nextStack to restore
    if (nextStack.length) {
      // Pop question off nextStack
      updateQA(nextStack.pop());
    } else {
      // Get new random question (if not in the mode where we're
      // only showing starred questions);
      if (!showingStarred) {
        updateQA(getRandomQA());
      }
    }
  }

  var getRandomQA = function() {
    var index = Math.floor(Math.random() * $scope.triviaData.length);
    var randomQA = $scope.triviaData[index];
    // For some reason, some questions are "" in the jService API
    while (randomQA["question"] == "") {
      index = Math.floor(Math.random() * $scope.triviaData.length);
      randomQA = $scope.triviaData[index];
    }
    // Some answers are "<i> answer </i>" in the jService API
    randomQA["answer"] = 
      randomQA["answer"].split("<i>").join("").split("</i>").join("");
    return randomQA;
  }

  $scope.toggleStar = function() {
    $scope.saved = !$scope.saved;
    $scope.setStar($scope.saved);
  }

  $scope.setStar = function(starred) {
    var star = document.getElementById('star');
    if (starred) {
      star.src = "images/filledstar.png";
      star.alt = "filledstar";
      star.setAttribute("aria-label","filledstar");
      starredQAs.add($scope.QA);
    } else {
      star.src = "images/emptystar.png";
      star.alt = "emptystar";
      star.setAttribute("aria-label","emptystar");
      starredQAs.delete($scope.QA);
    }
    // Save info about whether or not the question was starred
    questionStarred[$scope.currentQuestion] = starred;
  }

  $scope.toggleDifficulty = function($event, value) {
    if (selectedDifficulties.has(value)) {
      selectedDifficulties.delete(value);
      $event.currentTarget.className = "label label-default";
      $event.currentTarget.setAttribute("aria-label", 
        $event.currentTarget.innerHTML + " not selected");
    } else {
      selectedDifficulties.add(value);
      $event.currentTarget.className = "label label-success";
      $event.currentTarget.setAttribute("aria-label", 
        $event.currentTarget.innerHTML + " selected");
    }
    // Update trivia data for future questions
    if (!updateRequested) {
      $timeout(function(){
          updateTriviaData();
          updateRequested = false;
        }, 1000);
    }
    updateRequested = true;
    
      
  }

  var updateTriviaData = function() {
    // Just keep a random question so triviaData isn't empty 
    // before the API call finishes and the user clicks next.
    $scope.triviaData = [$scope.triviaData[0]];

    if (selectedDifficulties.size == 0) {
      // Just get random questions
      $http.get('http://jservice.io/api/random?count=100').then(function(response){
        $scope.triviaData = response.data;
      });
    }

    for (let value of selectedDifficulties) {
      var randomOffset = Math.floor(Math.random() * 10000);
      var url = "http://jservice.io/api/clues?offset=" + randomOffset 
                    + "&value=" + value;
      $http.get(url).then(function(response){
        $scope.triviaData = $scope.triviaData.concat(response.data);
      });
    }
  }

  $scope.key = function($event){
      /* left 37, up 38, right 39, down 40*/
      if ($event.keyCode == 38) { // up
          $scope.showAnswer();
      } else if ($event.keyCode == 39) { // right
          $scope.showNextQuestion();    
      } else if ($event.keyCode == 37) { //left
          $scope.showPrevQuestion();
      } else if ($event.keyCode == 83) { //'s'
          $scope.toggleStar();
      } else if ($event.keyCode == 219) { //'['
          $scope.showRandomMode();
      } else if ($event.keyCode == 221) { //']'
          $scope.showStarredMode();
      }
  }
});

$(document).ready(function(){
    $('#helpMenu').hide();
    $('#settingsMenu').hide();
    $("#help").click(function(){
        if ($('#helpMenu').is(":visible")) {
          $("#helpMenu").slideUp();
        } else {
          $("#helpMenu").slideDown();
          $("#helpMenu").focus();
        }
    });
    $("#settings").click(function(){
        if ($('#settingsMenu').is(":visible")) {
          $("#settingsMenu").slideUp();
        } else {
          $("#settingsMenu").slideDown();
          $("#settingsMenu").focus();
        }
    });
    $("#closeHelp").click(function(){
        $("#helpMenu").slideUp();
    });
    $("#closeSettings").click(function(){
        $("#settingsMenu").slideUp();
    });
});


