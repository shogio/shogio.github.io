angular.module('App', [])
.controller('ScoreBoardController', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
  
  $scope.ours = ["sergeymishin", "dashamish", "dimitrikrechetov", "mishtra"]
  $scope.items = [];
  $scope.loading = false;
  
  // owner_id = 3723768
  // page_url = http://specials.lookatme.ru/minibylego/media/24
  
  // https://graph.facebook.com/v2.2/?ids=http://specials.lookatme.ru/minibylego/media/24,http://specials.lookatme.ru/minibylego/media/22&fields=og_object{engagement}&access_token=530516770384019|OT-onwGmKNA_-uoBjBoZjQFj3rw
  
  $http.get('https://graph.facebook.com/v2.2/?ids=http://specials.lookatme.ru/minibylego/media/24,http://specials.lookatme.ru/minibylego/media/22&fields=og_object{engagement}&access_token=530516770384019|OT-onwGmKNA_-uoBjBoZjQFj3rw').success(function(data){
    console.log(data)
  });
  
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
