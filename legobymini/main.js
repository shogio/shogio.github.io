angular.module('App', [])
.controller('ScoreBoardController', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
  
  $scope.ours = ["sergeymishin", "dashamish", "dimitrikrechetov", "mishtra"]
  $scope.items = [];
  $scope.loading = false;
  
  $scope.load = function(){
    if($scope.loading)
      return;  
    $scope.loading = true;
    $http.get('http://pfood.noop.pw/rat/').success(function(data){
      $scope.items = data
      $scope.loading = false;
    });
  }
  
  $scope.load();
  
  $interval($scope.load, 2100000)
  
}]);
