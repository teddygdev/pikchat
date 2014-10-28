/**
 * Module dependencies.
 */

var net = require('net');
var moment = require('moment');

/**
 * Keep track of connections.
 */

var count = 0, users = {}, lobby = {};
var random = {}, videogames = {}, anime = {}; //fitness = {}, advice = {}, technology = {}, auto = {};


/**
 * Create server.
 */

var server = net.createServer(function (conn) {
  conn.write(
'\n    　　　　　　　　 ,.'
+'\n　　　　　 　　 /ﾉ'
+'\n　 　 (＼;\'\'~⌒ヾ,'
+'\n　　　 ~\'ﾐ　 ・　ｪ)　　　piKchat'
+'\n　　　　 .,ゝ　 i\"'
+'\n　ヘ\'\"\"~　　　ﾐ 　　　\゛　　～8'
+'\n　　,)　ﾉ,,_,　,;\'ヽ) 　　　（○）　　（○）'
+'\n　　し\'し\'　l,ﾉ 　　　　　 ヽ|〃　　ヽ|〃');

//color refernce
/*
  conn.write(
'\n 90 \033[90mcolor\033[39m'     //black
+'\n 91 \033[91mcolor\033[39m'    //red
+'\n 92 \033[92mcolor\033[39m'    //green
+'\n 93 \033[93mcolor\033[39m'    //yellow
+'\n 94 \033[94mcolor\033[39m'    //blue
+'\n 95 \033[95mcolor\033[39m'    //purple
+'\n 96 \033[96mcolor\033[39m'    //cyan
+'\n 97 \033[97mcolor\033[39m'    //white
+'\n 100 \033[100mcolor\033[49m'  //black
+'\n 101 \033[101mcolor\033[49m'  //red
+'\n 102 \033[102mcolor\033[49m'  //green
+'\n 103 \033[103mcolor\033[49m'  //yellow
+'\n 104 \033[104mcolor\033[49m'  //blue
+'\n 105 \033[105mcolor\033[49m'  //purple
+'\n 106 \033[106mcolor\033[49m'  //cyan
+'\n 107 \033[107mcolor\033[49m'  //white
    );
*/

  conn.write(
      '\n > welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m!'
    + '\n > ' + count + ' other people are connected at this time to the server.'
    + '\n > You are automatically placed in the lobby.'
    + '\n > Please write your name and press enter: '
  );
  count++;
 
  conn.setEncoding('utf8');
  //this timeout is pretty much useless. when a message is broadcasted,
  //all receivers have their timeout reset. 
  //maybe for preventing server being full with no one writing for a day?
  /*conn.setTimeout(86400000, function(){
        conn.write('\n > You timed-out after 24 hours. Disconnecting!\n');
        conn.destroy();
    });
  */

  // the nickname for the current connection
  var nickname;
  var currentRoom = lobby;

  function broadcast (msg, exceptMyself, room) {
    for (var i in room) {
      if (!exceptMyself || i != nickname) {
          room[i].write(moment().format("MMMDD|HH:mm:ss") + msg);
      }
    }
  }

  function whisper (msg, receiver) {
      
      if (nickname != receiver) {
          users[receiver].write('\033[95m' + moment().format("MMMDD|HH:mm:ss ") +'from: ' +nickname + ' > ' + msg + '\033[39m\n');
          conn.write('\033[95m'+ moment().format("MMMDD|HH:mm:ss ") +'to: ' +receiver + ' > ' + msg + '\033[39m\n');
      }
      else {
        conn.write('\033[93m > You cannot send a whisper to yourself.\033[39m\n');
      }
    
  }

  function getRoomName () {
    if (currentRoom == lobby) return "Lobby"; 
    if (currentRoom == random) return "Random";    
    if (currentRoom == videogames) return "Videogames"; 
    if (currentRoom == anime) return "Anime"; 
  }

  function getUsers () {
    var roomCount = 0;
    conn.write('\n > \033[92mUsers\033[39m in room \033[92m'+getRoomName()+'\033[39m:');
    for (var i in currentRoom) {
      roomCount++;
      if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
      else conn.write('\n * ' + i);
       }
        conn.write('\n > End of user list'
        + '\n > Users in room: \033[92m' + roomCount
        + '\033[39m\n > Total users in server: \033[92m' + count +'\033[39m\n');
  }

  function getAllUsers () {
    conn.write('\n > \033[92mUsers\033[39m in \033[92mthe Server\033[39m:');
    for (var i in users) {
      if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
      else conn.write('\n * ' + i);
       }
        conn.write('\n > End of user list'
        + '\n > Total users in server: \033[92m' + count +'\033[39m\n');
  }

  function listRooms () {
    conn.write('\n > You are in: \033[92m' + getRoomName() +'\033[39m'
    +'\n > \033[92mActive Rooms\033[39m are:'
    +'\n > * lobby (' + Object.keys(lobby).length + ')'
    +'\n > * random (' + Object.keys(random).length + ')'
    +'\n > * videogames (' + Object.keys(videogames).length + ')'
    +'\n > * anime (' + Object.keys(anime).length + ')\n');
  }

  function changeRoom (roomObj, roomStr, data) {
    if (currentRoom == roomObj) {
      conn.write(' \033[93m> You are already in room: ' + data +'\033[39m\n');
    }
    else {
      delete currentRoom[nickname];
      broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom);
      currentRoom = roomObj;
      currentRoom[nickname] = conn;
      conn.write('\n > Entering room: ' + data +'\n');
      broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom);
      getUsers();
    }
  }

  conn.on('data', function (data) {
    data = data.trim();

    // the first piece of data we expect is the nickname
    if (!nickname) {
      if (users[data]) {
        conn.write('\033[93m > That nickname is already in use. Try again:\033[39m ');
        return;
      }
      else if (!data.match(/\S+/)) {
        conn.write('\033[93m > You name cannot be a blank space. Try again:\033[39m ');
        return;
      }
      else {
        nickname = data;
        users[nickname] = conn;
        currentRoom[nickname] = conn;
        conn.write('\n > You can get a list of commands by typing "\033[94m/\help\033[39m"\n');
        broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom);
      }
    } else {
      if (data == "/quit") {
        conn.write('\n\033[93m > Bye-bye! Have an amazingly awesome day!\033[39m');
        conn.end();
      }
      else if (data == "/users") {
        getUsers();
      }
      else if (data == "/allusers") {
        getAllUsers();
      }
      else if (data == "/rooms") {
        listRooms();
      }
      else if (data.match(/^\/whisper/)) {
        //whisper('lol test', 'teddy');
        try {
           data = data.trim();
           var name = data.split(/\s+/)[1];
           name = name.trim();
           var n = data.indexOf(name);
           var m = name.length;
           var p = data.length;
           var message = data.substring(n+m, p);
           message = message.trim();
           if (message == "") conn.write(' \033[93m> You cannot send an empty message.\033[39m\n');
           else {
              try {
                whisper(message, name);
              }
              catch (err) {
                conn.write(' \033[93m> Oh-oh. Error. Are you sure the receiver exists? Maybe you\'ve made a typo? Case matters!\033[39m\n');
              }
           }
        }
        catch (err) {
          conn.write(' \033[93m> Oh-oh. Error. Did you add a receiver and a message?\033[39m\n');
        }
      }
      else if (data == "/help") {
        conn.write('\n > The list of possible commands are:'
        + '\n > \033[94m\/help\033[39m - Show the help screen with commands'
        + '\n > \033[94m\/quit\033[39m - Disconnects from the chat server and exits' 
        + '\n > \033[94m\/leave\033[39m - Leaves current room and goes back to lobby'
        + '\n > \033[94m\/rooms\033[39m - Shows a list of all possible rooms and people in them'
        + '\n > \033[94m\/join [roomname]\033[39m - Joins one of the existing rooms'
        + '\n > \033[94m\/users\033[39m - Shows a list of all connected people to the current room'
        + '\n > \033[94m\/allusers\033[39m - Shows a list of all connected people to server'
        + '\n > \033[94m\/whisper [receiver] [message]\033[39m - Send a private message. Can be any user in any room'
        + '\n > Q: How do I change my name?'
        + '\n > A: You have to exit the server and rejoin to get a new name.'
        + '\n > Q: Can I create a chat room?'
        + '\n > A: Not as of now.\n');

      }
      else if (data == "/leave") {
        if (currentRoom != lobby) {
          changeRoom(lobby, 'lobby', 'lobby');
        }
        else {
          conn.write('\n \033[93m> You are in the Lobby, you cannot go up any further.\033[39m'
          + '\n > You can quit the chat server with "\033[94m/\quit\033[39m".'
          + '\n > Or you could join a specific room with "\033[94m/\join [roomname]\033[39m".\n');
        }
      }
      else if (data.match(/^\/join/)) {
        var pass = false;
        try {
           data = data.split(/\s+/)[1];
           data = data.trim();
           data = data.toLowerCase();
           var pass = true;
        }
        catch (err) {
          conn.write(' \033[93m> You have not specified a room to join.\033[39m\n');
        }
        if (pass === true) {
          if (data == 'lobby') {
            changeRoom(lobby, 'lobby', data);
          }
          else if (data == 'random') {
             changeRoom(random, 'random', data);
          }
          else if (data == 'videogames') {
             changeRoom(videogames, 'videogames', data);
          }
          else if (data == 'anime') {
             changeRoom(anime, 'anime', data);
          }
          else conn.write('\033[93m > Room "' + data + '" does not exist.\033[39m\n');
        }
       
      }
      else {
      // otherwise we consider it a chat message
      broadcast('\033[96m > ' + nickname + ':\033[39m ' + data + '\n', true, currentRoom);
      }
    }
  });

  conn.on('close', function () {
    count--;
    delete users[nickname];
    delete currentRoom[nickname];
    broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom);
  });
});

/**
 * Listen.
 */

server.listen(3000, function () {
  console.log('\033[96m   server listening on *:3000\033[39m');
});