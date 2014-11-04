var sock = new SockJS('http://localhost:3000/chat');

var app = angular.module('pikchatApp', ['luegg.directives']);



function ChatCtrl($scope) {

  $scope.valHeight="65vh";
  $scope.messages = [];
  var num=1;

  $scope.valBg='white';
  $scope.valBorder='black';
  $scope.valColor='black';

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
    console.log(e.data);
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
    var msgColor = $scope.genColor(name);
    var txtColor = $scope.textColor(msgColor);
    
    $scope.messages.push({msgNum:num, sender:name, text:msgText, time:timeStamp, color:msgColor, txt: txtColor});
    $scope.$apply();
  };
}



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