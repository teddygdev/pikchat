

var sock = new SockJS('http://localhost:3000/chat');

var app = angular.module('pikchatApp', ['luegg.directives','dbaq.emoji','ngSanitize', 'filters','angular-loading-bar', 'ngAnimate'])
.controller('ChatCtrl', ['$scope', 'truncate', '$sce','$http', function($scope, truncate, $sce, $http, $timeout){
  $scope.valHeight="65vh";
  $scope.messages = [];
  var num=1;

  $scope.valBg='white';
  $scope.valBorder='black';
  $scope.valColor='black';





  ////


  $http.get('http://api.giphy.com/v1/gifs/search?q=funny+cat&api_key=dc6zaTOxFJmzC').
  success(function(data, status, headers, config) {
    // this callback will be called asynchronously
    // when the response is available
    //console.log(data);
  }).
  error(function(data, status, headers, config) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  });



  ///

  $scope.hoverIn = function(msg){
        //this.hoverGif = true;
        //console.log('hover-on');
        //console.log(msg);
        this.value=msg.gif;
    };

    $scope.hoverOut = function(msg){
        //this.hoverGif = false;
        this.value=msg.still;
        //console.log('hover-out');

    };

  $scope.textColor = function(hexcolor) {
    hexcolor = hexcolor.slice( 1 );
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  $scope.genColor = function(str) {
    return '#' + md5(str).slice(0, 6);

  };


  $scope.sendMessage = function() {
    if (($scope.messageText != undefined)&&($scope.messageText.trim() != "")) {
      sock.send($scope.messageText);
      $scope.messageText = "";
    }
    else {
      var msgColor = $scope.genColor(name);
      var txtColor = $scope.textColor(msgColor);
      $scope.messages.push({msgNum:0, sender:'System', text:'You cannot send empty messages. Please try again.', time:'', color:'#a45da9', txt: 'white'});
    }
    
  };

  $scope.incrHeight = function(incr) {
    var current = parseInt($scope.valHeight);
    if (incr===true) {
    current = current + 4;
    }
    else current = current - 4;
    $scope.valHeight=current + "vh";
  }

  sock.onmessage = function(e) {
    //console.log(e.data);

    e.data = e.data.replace(/\[90m|\[91m|\[92m|\[93m|\[94m|\[95m|\[96m|\[97m|\[39m/g, '');
    //e.data = e.data.replace(/\n/g, '<br>');
    num++;
    if ((e.data.match(/^\[.+\]/))==null) timeStamp="";
    else {
      var timeStamp = e.data.match(/^\[.+\]/);
      timeStamp = timeStamp[0];
      timeStamp = timeStamp.slice(1, timeStamp.length - 1);
    }

    if ((e.data.match(/>.+?</))==null) name="";
    else {
      var name = e.data.match(/>.+?</);
      name = name[0];
      name = name.slice(1, name.length - 1);
    }
    var msgText=e.data;
    if ((timeStamp!="")&&(name!="")) {
      var msgStart = e.data.indexOf('<') + 2;
      msgText=e.data.slice(msgStart, e.data.length);
    }
    else if ((timeStamp!="")&&(name=="")) {
      var msgStart = e.data.indexOf('>') + 2;
      msgText=e.data.slice(msgStart, e.data.length);
    }
    msgText = msgText.trim();
    msgText = $sce.trustAsHtml(truncate(msgText, ''));
    msgText = msgText.toString();
    msgText = msgText.trim();
    var msgColor = $scope.genColor(name);
    var txtColor = $scope.textColor(msgColor);

    if (msgText=="") {
      $scope.messages.push({msgNum:0, sender:'System', text:'You cannot send empty messages. Please try again.', time:'', color:'#a45da9', txt: 'white'});
    }
    else if (msgText.match(/^##/))
      {
        var msgGif='<img src="http://media4.giphy.com/media/DFiwMapItOTh6/200.gif" class="img-responsive"></img>';
        var msgStill='<img src="http://media4.giphy.com/media/DFiwMapItOTh6/200_s.gif" class="img-responsive-small img-thumbnail"></img>';
        $scope.messages.push({msgNum:num, sender:name, text:{gif:msgGif, still:msgStill}, time:timeStamp, color:msgColor, txt: txtColor, gif:true});
      }
    else {
      $scope.messages.push({msgNum:num, sender:name, text:msgText, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
    }
    
    $scope.$apply();
  };
}]);

app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });






app.directive('enterSubmit', function () {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
       
        elem.bind('keydown', function(event) {
          var code = event.keyCode || event.which;
                  
          if (code === 13) {
            if (!event.shiftKey) {
              event.preventDefault();
              scope.$apply(attrs.enterSubmit);
            }
          }
        });
      }
    }
  });

angular.module('filters', []).factory('truncate', function () {
    return function strip_tags(input, allowed) {
      allowed = (((allowed || '') + '')
        .toLowerCase()
        .match(/<[a-z][a-z0-9]*>/g) || [])
        .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
      var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
      return input.replace(commentsAndPhpTags, '')
        .replace(tags, function($0, $1) {
          return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
        });
    }
});