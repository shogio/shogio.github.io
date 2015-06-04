angular.module('App', [])
.controller('ScoreBoardController', ['$scope', '$http', function($scope, $http) {
  
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
  
}]);
