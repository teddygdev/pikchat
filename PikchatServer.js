//module dependencie
var net = require('net');
var moment = require('moment');

//keep track of users
var count = 0,
    users = {},
//entry room
    lobby = {};
//specific rooms
var random = {},
    videogames = {},
    anime = {},
    fitness = {},
    advice = {},
    technology = {},
    auto = {};

var rooms = [];
//$scope.messages.push({msgNum:num, sender:name, text:msgText, time:timeStamp, color:msgColor, txt: txtColor});
rooms.push({testroom: {} });
rooms.push({testroom2: {} });
//console.log(rooms[1].testroom2);

///////http part

var express = require('express');
var routes = require('./routes');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function(conn) {
    //connections.push(conn);
    //var number = connections.length;
    var nickname;

     conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' + 'Welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m!');
     conn.write(count + ' other people are connected at this time to the server.'); 
     conn.write('You are automatically placed in the lobby.');
     conn.write('Please write your name and press enter: ');
    
    
    var currentRoom = lobby;
    var currentRoomName = {value: 'lobby'};

    //conn.write("Welcome, User " + number);
    conn.on('data', function(data) {
        data = data.trim();
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >You< ' + data);
        // the first piece of data we expect is the nickname
        if (!nickname) {
            if (users[data]) {
                conn.write('That nickname is already in use. Try again: ');
                return;
            } 
            else if (data.length > 21) { //because nobody wants enourmous names. 21 seems reasonable
                conn.write('Your name is too long (>21 chars). Try again: ');
                return;
            } 
            else if (!data.match(/\S+/)) {
                conn.write('You name cannot be a blank space. Try again: ');
                return;
            }
            else if ((data.toLowerCase()=="admin")||(data.toLowerCase()=="mod")||(data.toLowerCase()=="administrator")||(data.toLowerCase()=="moderator")||(data.toLowerCase()=="you")) {
                conn.write('Those are reserved words. Choose a different name and try again: ');
                return;
            }  
            else {
                data = data.replace('/',''); //do not want pesky names like /quit, /whisper, etc...
                data = data.replace(/\s/g, ''); //single word names otherwise problems parsing /whisper
                nickname = data;
                users[nickname] = conn;
                currentRoom[nickname] = conn;
                conn.write('You can get a list of commands by typing "/\help"');
                broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom, nickname);
            }
        }
        //once we have the nickname establishied we can focus on parsing commands
        else {
            processData(data, currentRoom, nickname, conn);
        }
    });
    conn.on('close', function() {
        //count--;
        delete users[nickname];
        delete currentRoom[nickname];
        broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom, nickname);
        console.log(moment().format("MMMDD|HH:mm:ss") + " Users connected: " + count + "");
    });
});

// all environments
app.engine('html', require('ejs').renderFile);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//a/p.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'app')));

// development only
if ('development' == app.get('env')) {
  //app.use(express.errorHandler());
}

app.get('/', routes.index);
//app.get('/partials/:name', routes.partials);  //future proof
//app.get('/*', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
chat.installHandlers(server, {prefix:'/chat'});
    
    function broadcast(msg, exceptMyself, currentRoom, nickname) {
        for (var i in currentRoom) {
            if (!exceptMyself || i != nickname) {
                currentRoom[i].write('[' + moment().format("MMM DD HH:mm:ss") + ']' + msg);
            }
        }
    }

    function processData(data, currentRoom, nickname, conn) {
        if (data == "/quit") {
                conn.write('\n\033[93m > Bye-bye! Have an amazingly awesome day!\033[39m\n');
                conn.end();
            } else if (data == "/users") {
                getUsers(conn, currentRoom, nickname);
            } else if (data == "/allusers") {
                getAllUsers(conn, nickname);
            } else if (data == "/rooms") {
                listRooms(currentRoom, conn);
            } else if (data.match(/^\/whisper|^\/w/)) {
                try { //have to do some bothersome parsing, but not worth it bringing a parsing module just for this
                    data = data.trim();
                    var name = data.split(/\s+/)[1];
                    name = name.trim();
                    var n = data.indexOf(name);
                    var m = name.length;
                    var p = data.length;
                    var message = data.substring(n + m, p);
                    message = message.trim();
                    if (message == "") conn.write(' \033[93m> You cannot send an empty message.\033[39m\n');
                    else {
                        try {
                            whisper(message, name, nickname, conn);
                        } catch (err) {
                            conn.write(' \033[93m> Oh-oh. Error. Are you sure the receiver exists? Maybe you\'ve made a typo? Case matters!\033[39m\n');
                        }
                    }
                } catch (err) {
                    conn.write(' \033[93m> Oh-oh. Error. Did you add a receiver and a message?\033[39m\n');
                }
            } else if (data == "/help") {
                conn.write('\n > The list of possible commands are:'); 
                conn.write('\n > \033[94m\/help\033[39m - Show the help screen with commands');
                conn.write('\n > \033[94m\/quit\033[39m - Disconnects from the chat server and exits');
                conn.write('\n > \033[94m\/leave\033[39m - Leaves current room and goes back to lobby');
                conn.write('\n > \033[94m\/rooms\033[39m - Shows a list of all possible rooms and people in them');
                conn.write('\n > \033[94m\/join [roomname]\033[39m - Joins one of the existing rooms');
                conn.write('\n > \033[94m\/users\033[39m - Shows a list of all connected people to the current room');
                conn.write('\n > \033[94m\/allusers\033[39m - Shows a list of all connected people to server');
                conn.write('\n > \033[94m\/whisper [receiver] [message]\033[39m - Send a private message. Can be any user in any room');
                conn.write('\n > Q: How do I change my name?');
                conn.write('\n > A: You have to exit the server and rejoin to get a new name.');
                conn.write('\n > Q: Can I create a chat room?');
                conn.write('\n > A: Not as of now.\n');

            } else if (data == "/leave") {
                //reusing the /join here. This is what the /leave is supposed to do, right?
                if (currentRoom != lobby) {
                    changeRoom(lobby, 'lobby', 'lobby', currentRoom, nickname, conn);
                } else {
                    conn.write('\n \033[93m> You are in the Lobby, you cannot go up any further.\033[39m');
                    conn.write('\n > You can quit the chat server with "\033[94m/\quit\033[39m".');
                    conn.write('\n > Or you could join a specific room with "\033[94m/\join [roomname]\033[39m".\n');
                }
            } else if (data.match(/^\/join/)) {
                //some mild parsing again, but not as bad the the /whisper parsing
                var pass = false;
                try {
                    data = data.split(/\s+/)[1];
                    data = data.trim();
                    data = data.toLowerCase();
                    var pass = true;
                } catch (err) {
                    conn.write(' \033[93m> You have not specified a room to join.\033[39m\n');
                }
                if (pass === true) {
                    /*
                    if (data == 'lobby') {
                        changeRoom(lobby, 'lobby', data, currentRoom, nickname, conn);
                    } else if (data == 'random') {
                        changeRoom(random, 'random', data, currentRoom, nickname, conn);
                    } else if (data == 'videogames') {
                        changeRoom(videogames, 'videogames', data, currentRoom, nickname, conn);
                    } else if (data == 'anime') {
                        changeRoom(anime, 'anime', data, currentRoom, nickname, conn);
                    } else if (data == 'fitness') {
                        changeRoom(fitness, 'fitness', data, currentRoom, nickname, conn);
                    } else if (data == 'advice') {
                        changeRoom(advice, 'advice', data, currentRoom, nickname, conn);
                    } else if (data == 'technology') {
                        changeRoom(technology, 'technology', data, currentRoom, nickname, conn);
                    } else if (data == 'auto') {
                        changeRoom(auto, 'auto', data, currentRoom, nickname, conn);
                    } else conn.write('\033[93m > Room "' + data + '" does not exist.\033[39m\n');
                    */
                      //var id = arr.length + 1;
                      //var found = rooms.some(function (el) {
                      //  return el.username === name;
                      //});
                      //if (!found) { arr.push({ id: id, username: name }); }
                       for (i in rooms) {
                            if (rooms[i][data]) {
                                changeRoom(rooms[i][data], data, data, currentRoom, nickname, conn);
                            }
                            else conn.write('\033[93m > Room "' + data + '" does not exist.\033[39m\n');
                        }


                }

            } else {
                // if we have the name and it is not a command, it can only be a message
                broadcast('\033[96m >' + nickname + '<\033[39m ' + data + '\n', true, currentRoom, nickname);
            }
    }

        function whisper(msg, receiver, nickname, conn) {

        if (nickname != receiver) {
            users[receiver].write('\033[95m' + moment().format("MMMDD|HH:mm:ss ") + 'from: ' + nickname + ' > ' + msg + '\033[39m\n');
            conn.write('\033[95m' + moment().format("MMMDD|HH:mm:ss ") + 'to: ' + receiver + ' > ' + msg + '\033[39m\n');
        } else {
            conn.write('\033[93m > You cannot send a whisper to yourself.\033[39m\n');
        }

    }

    function getRoomName(currentRoom) {
        if (currentRoom.value == lobby) return "Lobby";
        if (currentRoom.value == random) return "Random";
        if (currentRoom.value == videogames) return "Videogames";
        if (currentRoom.value == anime) return "Anime";
        if (currentRoom.value == fitness) return "Fitness";
        if (currentRoom.value == advice) return "Advice";
        if (currentRoom.value == technology) return "Technology";
        if (currentRoom.value == auto) return "Auto";
    }

    function getUsers(conn, currentRoom, nickname) {
        var roomCount = 0;
        conn.write('\n > \033[92mUsers\033[39m in room \033[92m' + currentRoom + '\033[39m:');
        for (var i in currentRoom) {
            roomCount++;
            if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
            else conn.write('\n * ' + i);
        }
        conn.write('\n > End of user list');
        conn.write('\n > Users in room: \033[92m' + roomCount );
        conn.write('\033[39m\n > Total users in server: \033[92m' + count + '\033[39m\n');
    }

    function getAllUsers(conn, nickname) {
        conn.write('\n > \033[92mUsers\033[39m in \033[92mthe Server\033[39m:');
        for (var i in users) {
            if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
            else conn.write('\n * ' + i);
        }
        conn.write('\n > End of user list');
        conn.write('\n > Total users in server: \033[92m' + count + '\033[39m\n');
    }

    //hardcoded rooms :( should implement better in the future
    function listRooms(currentRoom, conn) {
        conn.write('\n > You are in: \033[92m' + getRoomName(currentRoom) + '\033[39m');
        conn.write('\n > \033[92mActive Rooms\033[39m are:');
        conn.write('\n > * lobby (' + Object.keys(lobby).length + ')' );
        conn.write('\n > * random (' + Object.keys(random).length + ')' );
        conn.write('\n > * videogames (' + Object.keys(videogames).length + ')' );
        conn.write('\n > * anime (' + Object.keys(anime).length + ')');
        conn.write('\n > * fitness (' + Object.keys(fitness).length + ')');
        conn.write('\n > * advice (' + Object.keys(advice).length + ')' );
        conn.write('\n > * technology (' + Object.keys(technology).length + ')' );
        conn.write('\n > * auto (' + Object.keys(auto).length + ')\n');
    }

    function changeRoom(roomObj, roomStr, data, currentRoom, nickname, conn) {
        if (currentRoom == roomObj) {
            conn.write(' \033[93m> You are already in room: ' + data + '\033[39m\n');
        } else {
            delete currentRoom[nickname];
            broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom, nickname);
            currentRoom = roomObj;
            currentRoom[nickname] = conn;
            conn.write('\n > Entering room: ' + data + '\n');
            broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom, nickname);
            getUsers(conn, currentRoom, nickname);
        }
    }


////////////////
//create the server
var server = net.createServer(function(conn) {

//some welcoming and relaxing ascii art    
    conn.write(
    '\n    　　　　　　　　 ,.'
    +'\n　　　　　 　　 /ﾉ'
    +'\n　 　 (＼;\'\'~⌒ヾ,'
    +'\n　　　 ~\'ﾐ　 ・　ｪ)　　　piKchat'
    +'\n　　　　 .,ゝ　 i\"'
    +'\n　ヘ\'\"\"~　　　ﾐ 　　　\゛　　～8'
    +'\n　　,)　ﾉ,,_,　,;\'ヽ) 　　　（○）　　（○）'
    +'\n　　し\'し\'　l,ﾉ 　　　　　 ヽ|〃　　ヽ|〃'
    );
//using ansi escape codes for coloring
    conn.write(
        '\n > welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m!'
        + '\n > ' + count + ' other people are connected at this time to the server.' + '\n > You are automatically placed in the lobby.'
        + '\n > Please write your name and press enter: '
    );
    count++;
    //for keeping track of connected users
    console.log(moment().format("MMMDD|HH:mm:ss") + " \033[92mUsers connected: " + count + "\033[39m");

    //to stringify all incoming data
    conn.setEncoding('utf8');

    //this timeout is pretty much useless. when a message is broadcasted,
    //all receivers have their timeout reset. 
    //maybe for preventing server being full with no one writing for a day?
    /*conn.setTimeout(86400000, function(){
          conn.write('\n > You timed-out after 24 hours. Disconnecting!\n');
          conn.destroy();
      });
    */

    // the user nickname for the current connection
    var nickname;
    //defaulting to lobby
    function CurrentRoom()
    {
        this.value = lobby;
    }
    var currentRoom = new CurrentRoom();
    





    //this is the entry point of the first input
    conn.on('data', function(data) {
        data = data.trim();
        // the first piece of data we expect is the nickname
        if (!nickname) {
            if (users[data]) {
                conn.write('\033[93m > That nickname is already in use. Try again:\033[39m ');
                return;
            } 
            else if (data.length > 21) { //because nobody wants enourmous names. 21 seems reasonable
                conn.write('\033[93m > Your name is too long (>21 chars). Try again:\033[39m ');
                return;
            } 
            else if (!data.match(/\S+/)) {
                conn.write('\033[93m > You name cannot be a blank space. Try again:\033[39m ');
                return;
            }
            else if ((data.toLowerCase()=="admin")||(data.toLowerCase()=="mod")||(data.toLowerCase()=="administrator")||(data.toLowerCase()=="moderator")||(data.toLowerCase()=="you")) {
                conn.write('\033[93m > Those are reserved words. Choose a different name and try again:\033[39m ');
                return;
            }   
            else {
                data = data.replace('/',''); //do not want pesky names like /quit, /whisper, etc...
                data = data.replace(/\s/g, ''); //single word names otherwise problems parsing /whisper
                nickname = data;
                users[nickname] = conn;
                currentRoom.value[nickname] = conn;
                conn.write('\n > You can get a list of commands by typing "\033[94m/\help\033[39m"\n');
                broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom, nickname);
            }
        }
        //once we have the nickname establishied we can focus on parsing commands
        else {
            processData(data, currentRoom, nickname, conn);
        }
    });

    conn.on('close', function() {
        count--;
        delete users[nickname];
        delete currentRoom.value[nickname];
        broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom, nickname);
        console.log(moment().format("MMMDD|HH:mm:ss") + " \033[91mUsers connected: " + count + "\033[39m");
    });
});


server.listen(4000, function() {
    console.log(moment().format("MMMDD|HH:mm:ss") + " \033[96m   server listening on *:3000\033[39m");
});