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


///////http part

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
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
    var currentRoom=lobby;
    //conn.write("Welcome, User " + number);
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
            else {
                data = data.replace('/',''); //do not want pesky names like /quit, /whisper, etc...
                data = data.replace(/\s/g, ''); //single word names otherwise problems parsing /whisper
                nickname = data;
                users[nickname] = conn;
                currentRoom[nickname] = conn;
                conn.write('\n > You can get a list of commands by typing "\033[94m/\help\033[39m"\n');
                broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom);
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
        broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom);
        console.log(moment().format("MMMDD|HH:mm:ss") + " \033[91mUsers connected: " + count + "\033[39m");
    });
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//a/p.use(express.methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
//if ('development' == app.get('env')) {
//  app.use(express.errorHandler());
//}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
chat.installHandlers(server, {prefix:'/chat'});
    
    function broadcast(msg, exceptMyself, room, nickname) {
        for (var i in room) {
            if (!exceptMyself || i != nickname) {
                room[i].write(moment().format("MMMDD|HH:mm:ss") + msg);
            }
        }
    }

    function processData(data, currentRoom, nickname, conn) {
        if (data == "/quit") {
                conn.write('\n\033[93m > Bye-bye! Have an amazingly awesome day!\033[39m\n');
                conn.end();
            } else if (data == "/users") {
                getUsers();
            } else if (data == "/allusers") {
                getAllUsers();
            } else if (data == "/rooms") {
                listRooms();
            } else if (data.match(/^\/whisper/)) {
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
                            whisper(message, name);
                        } catch (err) {
                            conn.write(' \033[93m> Oh-oh. Error. Are you sure the receiver exists? Maybe you\'ve made a typo? Case matters!\033[39m\n');
                        }
                    }
                } catch (err) {
                    conn.write(' \033[93m> Oh-oh. Error. Did you add a receiver and a message?\033[39m\n');
                }
            } else if (data == "/help") {
                conn.write('\n > The list of possible commands are:' + '\n > \033[94m\/help\033[39m - Show the help screen with commands' + '\n > \033[94m\/quit\033[39m - Disconnects from the chat server and exits' + '\n > \033[94m\/leave\033[39m - Leaves current room and goes back to lobby' + '\n > \033[94m\/rooms\033[39m - Shows a list of all possible rooms and people in them' + '\n > \033[94m\/join [roomname]\033[39m - Joins one of the existing rooms' + '\n > \033[94m\/users\033[39m - Shows a list of all connected people to the current room' + '\n > \033[94m\/allusers\033[39m - Shows a list of all connected people to server' + '\n > \033[94m\/whisper [receiver] [message]\033[39m - Send a private message. Can be any user in any room' + '\n > Q: How do I change my name?' + '\n > A: You have to exit the server and rejoin to get a new name.' + '\n > Q: Can I create a chat room?' + '\n > A: Not as of now.\n');

            } else if (data == "/leave") {
                //reusing the /join here. This is what the /leave is supposed to do, right?
                if (currentRoom != lobby) {
                    changeRoom(lobby, 'lobby', 'lobby');
                } else {
                    conn.write('\n \033[93m> You are in the Lobby, you cannot go up any further.\033[39m' + '\n > You can quit the chat server with "\033[94m/\quit\033[39m".' + '\n > Or you could join a specific room with "\033[94m/\join [roomname]\033[39m".\n');
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
                    if (data == 'lobby') {
                        changeRoom(lobby, 'lobby', data);
                    } else if (data == 'random') {
                        changeRoom(random, 'random', data);
                    } else if (data == 'videogames') {
                        changeRoom(videogames, 'videogames', data);
                    } else if (data == 'anime') {
                        changeRoom(anime, 'anime', data);
                    } else if (data == 'fitness') {
                        changeRoom(anime, 'fitness', data);
                    } else if (data == 'advice') {
                        changeRoom(anime, 'advice', data);
                    } else if (data == 'technology') {
                        changeRoom(anime, 'technology', data);
                    } else if (data == 'auto') {
                        changeRoom(anime, 'auto', data);
                    } else conn.write('\033[93m > Room "' + data + '" does not exist.\033[39m\n');
                }

            } else {
                // if we have the name and it is not a command, it can only be a message
                broadcast('\033[96m > ' + nickname + ':\033[39m ' + data + '\n', true, currentRoom, nickname);
            }
    }

        function whisper(msg, receiver) {

        if (nickname != receiver) {
            users[receiver].write('\033[95m' + moment().format("MMMDD|HH:mm:ss ") + 'from: ' + nickname + ' > ' + msg + '\033[39m\n');
            conn.write('\033[95m' + moment().format("MMMDD|HH:mm:ss ") + 'to: ' + receiver + ' > ' + msg + '\033[39m\n');
        } else {
            conn.write('\033[93m > You cannot send a whisper to yourself.\033[39m\n');
        }

    }

    function getRoomName() {
        if (currentRoom == lobby) return "Lobby";
        if (currentRoom == random) return "Random";
        if (currentRoom == videogames) return "Videogames";
        if (currentRoom == anime) return "Anime";
        if (currentRoom == fitness) return "Fitness";
        if (currentRoom == advice) return "Advice";
        if (currentRoom == technology) return "Technology";
        if (currentRoom == auto) return "Auto";
    }

    function getUsers() {
        var roomCount = 0;
        conn.write('\n > \033[92mUsers\033[39m in room \033[92m' + getRoomName() + '\033[39m:');
        for (var i in currentRoom) {
            roomCount++;
            if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
            else conn.write('\n * ' + i);
        }
        conn.write('\n > End of user list' + '\n > Users in room: \033[92m' + roomCount + '\033[39m\n > Total users in server: \033[92m' + count + '\033[39m\n');
    }

    function getAllUsers() {
        conn.write('\n > \033[92mUsers\033[39m in \033[92mthe Server\033[39m:');
        for (var i in users) {
            if (i == nickname) conn.write('\n * ' + i + ' \033[92m(** this is you **)\033[39m');
            else conn.write('\n * ' + i);
        }
        conn.write('\n > End of user list' + '\n > Total users in server: \033[92m' + count + '\033[39m\n');
    }

    //hardcoded rooms :( should implement better in the future
    function listRooms() {
        conn.write('\n > You are in: \033[92m' + getRoomName() + '\033[39m' 
        + '\n > \033[92mActive Rooms\033[39m are:' 
        + '\n > * lobby (' + Object.keys(lobby).length + ')' 
        + '\n > * random (' + Object.keys(random).length + ')' 
        + '\n > * videogames (' + Object.keys(videogames).length + ')' 
        + '\n > * anime (' + Object.keys(anime).length + ')'
        + '\n > * fitness (' + Object.keys(fitness).length + ')'
        + '\n > * advice (' + Object.keys(advice).length + ')' 
        + '\n > * technology (' + Object.keys(technology).length + ')' 
        + '\n > * auto (' + Object.keys(auto).length + ')\n');
    }

    function changeRoom(roomObj, roomStr, data) {
        if (currentRoom == roomObj) {
            conn.write(' \033[93m> You are already in room: ' + data + '\033[39m\n');
        } else {
            delete currentRoom[nickname];
            broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom);
            currentRoom = roomObj;
            currentRoom[nickname] = conn;
            conn.write('\n > Entering room: ' + data + '\n');
            broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom);
            getUsers();
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
    var currentRoom = lobby;

    





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
            else {
                data = data.replace('/',''); //do not want pesky names like /quit, /whisper, etc...
                data = data.replace(/\s/g, ''); //single word names otherwise problems parsing /whisper
                nickname = data;
                users[nickname] = conn;
                currentRoom[nickname] = conn;
                conn.write('\n > You can get a list of commands by typing "\033[94m/\help\033[39m"\n');
                broadcast('\033[90m > ' + nickname + ' joined the room\033[39m\n', false, currentRoom);
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
        delete currentRoom[nickname];
        broadcast('\033[90m > ' + nickname + ' left the room\033[39m\n', false, currentRoom);
        console.log(moment().format("MMMDD|HH:mm:ss") + " \033[91mUsers connected: " + count + "\033[39m");
    });
});


server.listen(4000, function() {
    console.log(moment().format("MMMDD|HH:mm:ss") + " \033[96m   server listening on *:3000\033[39m");
});