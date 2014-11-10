

var sock = new SockJS('http://localhost:3000/chat');

var app = angular.module('pikchatApp', ['luegg.directives','dbaq.emoji','ngSanitize', 'filters','angular-loading-bar', 'ngAnimate', 'ui.bootstrap'])
.controller('ChatCtrl', ['$scope', 'truncate', '$sce','$http', function($scope, truncate, $sce, $http, $timeout){
  $scope.valHeight="65vh";
  $scope.messages = [];
  var num=1;
  var ignored=[];
  $scope.msgLimit= 150;
  $scope.limitEnabled = true;

  $scope.isOptionsCollapsed = true;
  $scope.isNavbarCollapsed = true;
  $scope.isHelpCollapsed = true;

  $scope.valBg='white';
  $scope.valBorder='black';
  $scope.valColor='black';

  $scope.lowQualityGif = false;
  $scope.expandGif = false;

  $scope.hideGif = false;
  $scope.hideBroadcast = false;
  $scope.hideWhisper = false;
  $scope.hideYou = false;

  $scope.placeHolderText="Enter text here";
  $scope.sessionName='';




  var apiKey='dc6zaTOxFJmzC';

  $scope.hoverIn = function(msg){
      this.value=msg.gif;
  };

  $scope.hoverOut = function(msg){
      this.value=msg.still;
  };

  $scope.ignore = function(sender){
    if (this.text=='Ignore') {
      ignored.push(sender);
      this.text='Undo Ignore';
      $scope.messages.push({msgNum:0, sender:'System', text:'You are now ignoring user: '+sender, time:'', color:'#a45da9', txt: 'white', gif:false});
    }
    else {
      for(var i = ignored.length - 1; i >= 0; i--) {
        if(ignored[i] == sender) {
          ignored.splice(i, 1);
        }
      }
      this.text='Ignore';
      $scope.messages.push({msgNum:0, sender:'System', text:'You are no longer ignoring user: '+sender, time:'', color:'#a45da9', txt: 'white', gif:false});
    }
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

  $scope.clearMsgs = function(){
      while ($scope.messages.length) { $scope.messages.pop(); }
  };

  $scope.resetIgnore = function(){
      while ($scope.ignored.length) { $scope.ignored.pop(); }
      $scope.messages.push({msgNum:0, sender:'System', text:'You are no longer ignoring anyone.', time:'', color:'#a45da9', txt: 'white', gif:false});
  };


  $scope.sendMessage = function() {
    if (($scope.messageText != undefined)&&($scope.messageText.trim() != "")) {
      sock.send($scope.messageText);
      $scope.messageText = "";
    }
    else {
      var msgColor = $scope.genColor(name);
      var txtColor = $scope.textColor(msgColor);
      $scope.messages.push({msgNum:0, sender:'System', text:'You cannot send empty messages. Please try again.', time:'', color:'#a45da9', txt: 'white', gif:false});
    }
    if ($scope.limitEnabled==true) {
      if ($scope.messages.length>$scope.msgLimit) {
        for (var i=0; i < $scope.messages.length - $scope.msgLimit; i++) {
          $scope.messages.shift();
        }
      }
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

  $scope.msgLimitChange = function(type) {
    if (type=='minus') {
      $scope.msgLimit -=25;
      if ($scope.msgLimit<0) $scope.msgLimit=0;
    }
    if (type=='plus') {
      $scope.msgLimit +=25;
    }
    if ($scope.msgLimit==0) $scope.limitEnabled = false;
    else $scope.limitEnabled = true;
    
  }

  sock.onmessage = function(e) {

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

    //console.log(msgText);
    if ((name=='System')&&(msgText.match(/You JOINED the server /))) {
      var pos1 = msgText.indexOf('user');
      var pos2 = msgText.indexOf('You can get');
      $scope.sessionName=msgText.substring(pos1 + 6, pos2 - 2);
      $scope.placeHolderText='You are logged in as ' + $scope.sessionName +'. You are in room "lobby".';
    }

    if ((name=='System')&&(msgText.match(/<< You are now in room:/))) {
      var pos1 = msgText.indexOf('"');
      var pos2 = msgText.lastIndexOf('"');
      $scope.currentRoom=msgText.substring(pos1, pos2+1);
      $scope.placeHolderText='You are logged in as ' + $scope.sessionName +'. You are in room '+ $scope.currentRoom +'.';
    }

    var msgColor = $scope.genColor(name);
    var txtColor = $scope.textColor(msgColor);

    //if (msgText=="") {
    //  $scope.messages.push({msgNum:0, sender:'System', text:'You cannot send empty messages. Please try again.', time:'', color:'#a45da9', txt: 'white',gif:false});
    //}
    var send=true;
    for (var i=0; i<ignored.length; i++) {
      if (ignored[i]==name) send=false;
    }
    if (($scope.hideBroadcast==true)&&(name=='PIKCHAT')) send=false;
    if (($scope.hideYou==true)&&(name=='You')) send=false;
    if (($scope.hideWhisper==true)&&(name=='#whisper#')) send=false;

    if (send==true) {
      if (msgText.match(/^(\d)+###?(\d|\w)+/)) {
          var msgBackup = msgText;
          var searchType='stickers';
          if (msgText.match(/^(\d)+###(\d|\w)+/)) {
            searchType='gifs';
          }
          //msgText=msgText.replace(/#/g, ' ');
          msgText = msgText.replace(/\W/g, ' ')
          var tags=msgText.trim().split(/\s+/g);
          var chosen=tags[0];

          //for ( i = 0; i < tags.length; i++) {console.log('tag:' + tags[i])};
          var querystring = '';
          var first=true;
          for ( i = 1; i < tags.length; i++) {
            if ((!tags[i].match(/\s+/))||(tags[i]=='')) {
              if (first==true) {
                querystring += tags[i];
                first=false;
              }
              else {
                querystring += '+' + tags[i];
              } 
            }
          }
          if ((querystring=="")||($scope.hideGif==true)) {
            //$scope.messages.push({msgNum:0, sender:'System', text:'You have to enter tags when sending stickers. Please try again.', time:'', color:'#a45da9', txt: 'white',gif:false});

          $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
          }
          else {


            $http.get('http://api.giphy.com/v1/'+searchType+'/search?q='+ querystring +'&limit=1&api_key='+apiKey).
            success(function(data, status, headers, config) {
              try {
                var total=data.pagination.total_count;
                //console.log('total=' + total);
                //var chosen = Math.floor(Math.random() * (total - 0 + 1)) + 0;

                $http.get('http://api.giphy.com/v1/'+searchType+'/search?q='+ querystring +'&limit=1&offset='+chosen+'&api_key='+apiKey).
                success(function(data, status, headers, config) {
                  // this callback will be called asynchronously
                  // when the response is available
                  
                  //console.log(data.data[0].images.fixed_height.url);
                  //console.log(data.data[0].images.fixed_height_still.url);
                  try {
                    if ($scope.lowQualityGif==true) {
                      if ($scope.expandGif==true) {
                        var msgGif='<img src="'+data.data[0].images.fixed_height_downsampled.url+'" class="img-responsive" title="'+msgBackup+'"></img>';
                      }
                      else {
                        var msgGif='<img src="'+data.data[0].images.fixed_height_downsampled.url+'" class="img-responsive-small" title="'+msgBackup+'"></img>';
                      }
                     
                    }
                    else {
                      if ($scope.expandGif==true) {
                        var msgGif='<img src="'+data.data[0].images.fixed_height.url+'" class="img-responsive" title="'+msgBackup+'"></img>';
                      }
                      else {
                        var msgGif='<img src="'+data.data[0].images.fixed_height.url+'" class="img-responsive-small" title="'+msgBackup+'"></img>';
                      }
                    }
                    
                    var msgStill='<img src="'+data.data[0].images.fixed_height_still.url+ '" class="img-responsive-small" title="'+msgBackup+'"></img>';
                    $scope.messages.push({msgNum:num, sender:name, text:{gif:msgGif, still:msgStill}, time:timeStamp, color:msgColor, txt: txtColor, gif:true});
                    

                    
                  }
                  catch (err) {
                    msgBackup+= ' :did not return any matches.';
                    $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
                  }
                  
                }).
                error(function(data, status, headers, config) {
                  // called asynchronously if an error occurs
                  // or server returns response with an error status.
                });


              }
              catch (err) {
                msgBackup+= ' :did not return any matches.';
                $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
              }

            }).
            error(function(data, status, headers, config) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
            });
          }
        }
      else {
        $scope.messages.push({msgNum:num, sender:name, text:msgText, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
      }
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