var sock = new SockJS('http://localhost:3000/chat');
function ChatCtrl($scope) {
  $scope.messages = [];
  $scope.sendMessage = function() {
    sock.send($scope.messageText);
    $scope.messageText = "";
  };

  sock.onmessage = function(e) {
  	e.data = e.data.replace(/\[90m|\[91m|\[92m|\[93m|\[94m|\[95m|\[96m|\[97m|\[39m/g, '');
  	e.data = e.data.replace(/\s>/, '');
    $scope.messages.push(e.data);
    $scope.$apply();
  };
}
