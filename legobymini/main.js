
angular.module('App', ['ngStorage'])
.controller('ScoreBoardController', ['$scope', '$http', '$interval', '$localStorage', function($scope, $http, $interval, $localStorage) {
  
  $scope.orderby = $localStorage.orderby || 'place'
  
  $scope.ours = $localStorage.ours || [];
  $scope.items = [];
  $scope.loading = false;
  
  $scope.medias = [];
  $scope.user_medias = {};
  $scope.realtime_medias = {fb:{},vk:{},dogs:{},offset:{}};
  
  
  $scope.$watch('orderby', function(a,b){
    $localStorage.orderby = a
  })
  
  
  $scope.load = function(){
    if($scope.loading)
      return;
    $scope.loading = true;
    $scope.ours = $localStorage.ours || [];
    $http.get('http://pfood.noop.pw/rat/').success(function(data){
      $scope.items = data
      _.each($scope.items, function(item){
        item.ours = ($scope.ours.indexOf(item.username) >= 0)
      });
      $scope.loading = false;
      
      $scope.loadCurrentStats();
    });
  }
  
  var stopVK;
  var stopFB;
  
  $scope.loadCurrentStats = function(){
    
    var users = _.pluck($scope.items, "username");
    
    
    $interval.cancel(stopFB);
    stopVK = undefined;
    $interval.cancel(stopVK);
    stopFB = undefined;
    
    $http.get('http://pfood.noop.pw/rat/'+users.join(',')).success(function(data){
      $scope.user_medias = data
      var medias = _.flatten(_.map($scope.user_medias))
      
      $scope.medias = _.object(_.pluck(medias, "url"), medias)
      
      loadFBlikes();
      loadVKlikes();
      
      stopVK = $interval(loadVKlikes, 3*60*1000);
      stopFB = $interval(loadFBlikes, 1*60*1000);
    });
  }
  
  
  
  
  var loadFBlikes = function(){
    // console.log("loadFBlikes")
    
    var urls = _.map(_.pluck($scope.medias, "url"), function(v){return encodeURIComponent(v)})
    var n = 50;
    var urls_lists = _.chain(urls).groupBy(function(element, index){
      return Math.floor(index/n);
    }).toArray()
    .value();
    
    _.each(urls_lists, function(urls){
      $http.get('https://graph.facebook.com/v2.2/?ids='+urls.join(",")+'&fields=og_object{engagement}&access_token=530516770384019|OT-onwGmKNA_-uoBjBoZjQFj3rw').success(function(data){
        // console.log(data)
        _.each(data, function(media_fb_likes,url){
          if(typeof(media_fb_likes.og_object) == "undefined")
            return;
          
          // console.log(url, media_fb_likes.og_object.engagement.count)
          $scope.realtime_medias.fb[url] = media_fb_likes.og_object.engagement.count
        })
      });
    });
    
  }
  
  
  var loadVKlikes = function(){
    // console.log("loadVKlikes")
    
    var urls = _.pluck($scope.medias, "url")
    _.each(urls, function(url){
      $http.jsonp('https://api.vk.com/method/likes.getList?owner_id=3723768&type=sitepage&extended=1&count=1000&callback=JSON_CALLBACK&page_url='+encodeURIComponent(url)).success(function(data){
        if(!data.response || typeof(data.response) == 'undefined')
          return;
        
        $scope.realtime_medias.vk[url] = data.response.count
        $scope.realtime_medias.dogs[url] = _.filter(data.response.items, function(item){return item["deactivated"] == "banned" || item["deactivated"] == 'deleted'}).length
        
        // console.log($scope.medias[url].username, data.response.count, data.response.items.length, $scope.realtime_medias.dogs[url])
        
        // "deactivated":"banned"
        // Decrease banned users
        if(data.response.count > 1000){
          var n = Math.ceil(data.response.count/1000)
          for (var i = 1; i < n; i++) {
            $http.jsonp('https://api.vk.com/method/likes.getList?offset='+(i*1000)+'&owner_id=3723768&type=sitepage&extended=1&count=1000&callback=JSON_CALLBACK&page_url='+encodeURIComponent(url)).success(function(data){
              if(!data.response || typeof(data.response) == 'undefined')
                return;
              $scope.realtime_medias.dogs[url] = ($scope.realtime_medias.dogs[url] || 0) + _.filter(data.response.items, function(item){return item["deactivated"] == "banned" || item["deactivated"] == 'deleted'}).length
            });
          }
        }
        
      });
    });
  }
  
  /*
  $scope.countRealtimeVK = function(url){
    return $scope.realtime_medias.vk[url] - $scope.medias[url].likes.vk;
  };
  
  $scope.countRealtimeFB = function(url){
    return $scope.realtime_medias.fb[url] - $scope.medias[url].likes.fb;
  };
  */
  
  $scope.getOffset = function(url){
    return ($scope.medias[url].likes.total - ($scope.medias[url].likes.vk + $scope.medias[url].likes.fb)) || 0
  }
  
  $scope.countTotalRealtimeLikes = function(item){
    // console.log(item)
    var value = 0
    _.each(_.pluck($scope.user_medias[item.username], "url"), function(url){
      value += $scope.getOffset(url) + ($scope.realtime_medias.fb[url] || 0) + ($scope.realtime_medias.vk[url]|| 0) - ($scope.realtime_medias.dogs[url] || 0)
    });
    // item.totalRealtimeLikes = value;
    return value;
  }
  
  
  $scope.countTotalRealtimeFB = function(item){
    var value = 0
    _.each(_.pluck($scope.user_medias[item.username], "url"), function(url){
      value += ($scope.realtime_medias.fb[url] || 0)
    });
    
    return value;
  }
  
  
  $scope.countTotalRealtimeVK = function(item){
    var value = 0
    _.each(_.pluck($scope.user_medias[item.username], "url"), function(url){
      value += ($scope.realtime_medias.vk[url] || 0)
    });
    
    return value; 
  }
  $scope.countTotalRealtimeVKDifference = function(item){
    var value = 0
    _.each(_.pluck($scope.user_medias[item.username], "url"), function(url){
      value += ($scope.realtime_medias.vk[url] || 0) - $scope.medias[url].likes.vk - ($scope.realtime_medias.dogs[url] || 0)
    });
    
    // temporary
    item.totalRealtimeLikes = item.likes + value;
    return value; 
  }
  
  
  
  $scope.countTotalRealtimeDogs = function(item){
    var value = 0
    _.each(_.pluck($scope.user_medias[item.username], "url"), function(url){
      value += ($scope.realtime_medias.dogs[url] || 0)
    });
    
    return value; 
  }
  
  $scope.realtimeLikesDifference = function(item){
    return $scope.countTotalRealtimeLikes(item) - item.likes
  }
  
  $scope.toggleOurs = function(item){
    item.ours = !item.ours
    $localStorage.ours = $localStorage.ours || [];
    
    if(item.ours)
      $localStorage.ours.push(item.username)
    else{
      console.log($localStorage.ours.indexOf(item.username))
      $localStorage.ours.splice( $localStorage.ours.indexOf(item.username),1 )
    }
  }
  
  $scope.load();
  
  $interval($scope.load, 2100000)
  
}]);










function serializeData( data ) { 
    // If this is not an object, defer to native stringification.
    if ( ! angular.isObject( data ) ) { 
        return( ( data == null ) ? "" : data.toString() ); 
    }

    var buffer = [];

    // Serialize each key in the object.
    for ( var name in data ) { 
        if ( ! data.hasOwnProperty( name ) ) { 
            continue; 
        }

        var value = data[ name ];

        buffer.push(
            encodeURIComponent( name ) + "=" + encodeURIComponent( ( value == null ) ? "" : value )
        ); 
    }

    // Serialize the buffer and clean it up for transportation.
    var source = buffer.join( "&" ).replace( /%20/g, "+" ); 
    return( source ); 
}
