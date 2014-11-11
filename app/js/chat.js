var sock = new SockJS('http://localhost:3000/chat');
//make sure to change if hosting somewhere to the server IP
//otherwise you will experience CORS issues with sockets
//sorry for the badly formatted html :(

var app = angular.module('pikchatApp', ['luegg.directives','dbaq.emoji','ngSanitize', 'filters','angular-loading-bar', 'ngAnimate', 'ui.bootstrap'])
.controller('ChatCtrl', ['$scope', 'truncate', '$sce','$http', function($scope, truncate, $sce, $http, $timeout){
  $scope.valHeight="65vh"; //a conservative number, 65% of window height is a good starter. user can expand or make smaller inside the app
  $scope.messages = [];    //where all messages are kept
  var num=1;               //every message has an incrementing number. Good to have, could be used in the future, especially for logging
  var ignored=[];          //for ignoring people
  $scope.msgLimit= 150;    //how many messages are visible in the window
  $scope.limitEnabled = true;    //some people might like infinite logging

  $scope.isOptionsCollapsed = true;   //for collapsible parts of the application
  $scope.isNavbarCollapsed = true;
  $scope.isHelpCollapsed = true;

  $scope.valBg='white';      //colors used in chat bubbles
  $scope.valBorder='black';
  $scope.valColor='black';

  $scope.lowQualityGif = false;  //options from the... options screen
  $scope.expandGif = false;

  $scope.hideGif = false;
  $scope.hideBroadcast = false;
  $scope.hideWhisper = false;
  $scope.hideYou = false;

  $scope.placeHolderText="Enter text here"; //later we modify the input placeholder to show information
  $scope.sessionName='';  //username for the session

  ///////// GIPHY API KEY
  var apiKey='dc6zaTOxFJmzC';
  ///////// GIPHY API KEY

  $scope.hoverIn = function(msg){ //hover function for expanding gifs
      this.value=msg.gif;
  };

  $scope.hoverOut = function(msg){
      this.value=msg.still;
  };

  $scope.ignore = function(sender){ //ignoring and un-ignoring users
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

  $scope.textColor = function(hexcolor) { //decide if white or black will fit chat bubble background color
    hexcolor = hexcolor.slice( 1 );
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  $scope.genColor = function(str) { //generate chat bubble color based on first six charactesr of md5 hash to hex
    return '#' + md5(str).slice(0, 6);
  };

  $scope.clearMsgs = function(){ //clear all messages in window
      while ($scope.messages.length) { $scope.messages.pop(); }
  };

  $scope.resetIgnore = function(){ //remove all people from ignore list
      while ($scope.ignored.length) { $scope.ignored.pop(); }
      $scope.messages.push({msgNum:0, sender:'System', text:'You are no longer ignoring anyone.', time:'', color:'#a45da9', txt: 'white', gif:false});
  };


  $scope.sendMessage = function() { //sending a message to the server
    if (($scope.messageText != undefined)&&($scope.messageText.trim() != "")) { //we do not want to send empty messages
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
          $scope.messages.shift(); //try to keep to the limit only after you send a messages. no missed messages due to someone else spamming
        }
      }
    }
  };

  $scope.incrHeight = function(incr) { //increase chat height (or decrease)
    var current = parseInt($scope.valHeight);
    if (incr===true) {
    current = current + 4;
    }
    else current = current - 4;
    $scope.valHeight=current + "vh";
  }

  $scope.msgLimitChange = function(type) { //modify message limit from options
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
    //strip the message from all colors. ESC character gets left though. On to-do list
    num++;
    if ((e.data.match(/^\[.+\]/))==null) timeStamp=""; //deciding how to parse the messages
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
    msgText = $sce.trustAsHtml(truncate(msgText, '')); //only way I could figure out to make emoji like :kiss: work. 
    msgText = msgText.toString();                      //translates msg to html, then strips away all the tags, if any, then back to a string
    msgText = msgText.trim();                          //in the html file we then make the "html" string unsafe so it doesn't try to parse things like <3
                                                       //finally we apply the emoji filter, which translates :kiss: to an html. "It just works"

    if ((name=='System')&&(msgText.match(/You JOINED the server /))) {  //the ESC characters I was talking about just a bit above
      var pos1 = msgText.indexOf('user');                                      //just figured it out at the last moment :/
      var pos2 = msgText.indexOf('You can get');                               //this part is about getting room and name to put in the input placeholder
      $scope.sessionName=msgText.substring(pos1 + 6, pos2 - 2);                //cool way of showing room and name without taking up more space
      $scope.placeHolderText='You are logged in as ' + $scope.sessionName +'. You are in room "lobby".';
    }

    if ((name=='System')&&(msgText.match(/<< You are now in room:/))) {
      var pos1 = msgText.indexOf('"');
      var pos2 = msgText.lastIndexOf('"');
      $scope.currentRoom=msgText.substring(pos1, pos2+1);
      $scope.placeHolderText='You are logged in as ' + $scope.sessionName +'. You are in room '+ $scope.currentRoom +'.';
    }

    var msgColor = $scope.genColor(name); //give color to the chat bubble
    var txtColor = $scope.textColor(msgColor);
    var send=true;
    for (var i=0; i<ignored.length; i++) { //stop message processing procedure, we are ignoring that person
      if (ignored[i]==name) send=false;
    }
    if (($scope.hideBroadcast==true)&&(name=='PIKCHAT')) send=false;
    if (($scope.hideYou==true)&&(name=='You')) send=false;
    if (($scope.hideWhisper==true)&&(name=='#whisper#')) send=false;
    //options menu... options for ignoring certain types of messages ^
    if (send==true) { //no else
      if (msgText.match(/^(\d)+###?(\d|\w)+/)) {  //mother lode of all parsing (yes, that is the correct spelling) //else - just regular print of text
          var msgBackup = msgText;                //this is for visualizing gifs/stickers
          var searchType='stickers';              
          if (msgText.match(/^(\d)+###(\d|\w)+/)) {
            searchType='gifs';
          }
          msgText = msgText.replace(/\W/g, ' ')
          var tags=msgText.trim().split(/\s+/g);
          var chosen=tags[0];
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
          if ((querystring=="")||($scope.hideGif==true)) { //don't have to put an image, just print the text
            $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
          }
          else {
            //this should probably be refactored, but I had trouble with the mixing the two types of quotes: '' and ""
            //that's why so much code copy-pasting. It's just a lot of text, but not really complicated.
            //We try to search for the tags. If it works we search for the specific image we want
            //then we decid if we want high quality or low quality gifs (i.e. downsampled)
            //then we decide what class we put those images in, one that expands on hover or one that doesn't
            //try-catch in case somebody decided to trick us and write a non-existent tag or number
            //(yes, if you like a gif/sticker, the title is the exact string needed to call it, thus you can it with a number and the frontend will process it)
            //boom, that's all!

            $http.get('http://api.giphy.com/v1/'+searchType+'/search?q='+ querystring +'&limit=1&api_key='+apiKey).
            success(function(data, status, headers, config) {
              try {
                var total=data.pagination.total_count;
                $http.get('http://api.giphy.com/v1/'+searchType+'/search?q='+ querystring +'&limit=1&offset='+chosen+'&api_key='+apiKey).
                success(function(data, status, headers, config) {
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
                  msgBackup+= ' :there was a problem fetching the image. Please try again';
                    $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
                });


              }
              catch (err) {
                msgBackup+= ' :did not return any matches.';
                $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
              }

            }).
            error(function(data, status, headers, config) {
              msgBackup+= ' :there was a problem fetching the image. Please try again';
                    $scope.messages.push({msgNum:num, sender:name, text:msgBackup, time:timeStamp, color:msgColor, txt: txtColor, gif:false});
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

app.filter('unsafe', function($sce) { return $sce.trustAsHtml; }); //for the emoji

app.directive('enterSubmit', function () { //allows the user to press enter to send messages 
    return {                               //shift+enter creates a newline in the textbox
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

angular.module('filters', []).factory('truncate', function () { //strips all the tags
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