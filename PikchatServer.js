//module dependencie
var net = require('net');
var moment = require('moment');

//keep track of users
var count = 0,
    users = {};

//default rooms that won't be deletable
var rooms = [{0: {name: 'lobby',value: {}}}, 
            {1: {name: 'random',value: {}}}, 
            {2: {name: 'anime',value: {}}}, 
            {3: {name: 'videogames',value: {}}}, 
            {4: {name: 'advice',value: {}}}];
var roomNumbers = 5;
//counter needed for generating more rooms



///////http part

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer();
chat.on('connection', function(conn) {
    var nickname={'value':undefined};
    //console.log(nickname.value);
    var rate = {'value':5000}; // unit: messages
    var per  = {'value':7000}; // unit: seconds
    var allowance = {'value':rate}; // unit: messages
    var last_check = {'value':Date.now()}; // floating-point, e.g. usec accuracy. Unit: seconds
    var spam={'value':0};

    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' +
        'Welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m! ' +
        'You are automatically placed in the lobby. Messages by System are only visible to you.'+
        '\n\nPlease write your name in the text box below and press enter! Accepted characters: [ A-Z ][ a-z ][ 0-9 ][ _ ]');

    var currentRoomName = {'value': 'lobby'}; //for keeping track in which room we are

    conn.on('data', function(data) {
        onData(nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data, 'http');

    });
    conn.on('close', function() {
       onClose(nickname, currentRoomName);
    });
});





// http/jsocks conf
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

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
chat.installHandlers(server, {
    prefix: '/chat'
});






////////////////
//create the server
var server = net.createServer(function(conn) {

    //some welcoming and relaxing ascii art    
    conn.write(
        '\n    　　　　　　　　 ,.' + 
        '\n　　　　　 　　 /ﾉ' +
        '\n　 　 (＼;\'\'~⌒ヾ,' +
        '\n　　　 ~\'ﾐ　 ・　ｪ)　　　piKchat' + 
        '\n　　　　 .,ゝ　 i\"' +
        '\n　ヘ\'\"\"~　　　ﾐ 　　　\゛　　～8' +
        '\n　　,)　ﾉ,,_,　,;\'ヽ) 　　　（○）　　（○）' +
        '\n　　し\'し\'　l,ﾉ 　　　　　 ヽ|〃　　ヽ|〃'
    );
    //using ansi escape codes for coloring
    conn.write(
        '\n > welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m!' +
        //'\n > ' + count +
        //' other people are connected at this time to the server.' +
        '\n > You are automatically placed in the lobby.' +
        '\n > Messages by >System< are only visible to you.' +
        '\n > Accepted characters: [ A-Z ][ a-z ][ 0-9 ][ _ ]' +
        '\n \033[93m> Please write your name and press enter:\033[39m '
    );
    //count++;
    //for keeping track of connected users
    //console.log(moment().format("MMMDD|HH:mm:ss") + " \033[92mUsers connected: " + count + "\033[39m");

    //to stringify all incoming data
    conn.setEncoding('utf8');
    var currentRoomName = {'value': 'lobby'}; //for keeping track in which room we are

    //this timeout is pretty much useless. when a message is broadcasted,
    //all receivers have their timeout reset. 
    //maybe for preventing server being full with no one writing for a day?
    /*conn.setTimeout(86400000, function(){
          conn.write('\n > You timed-out after 24 hours. Disconnecting!\n');
          conn.destroy();
      });
    */

    // the user nickname for the current connection
    var nickname={'value':undefined};
    //console.log(nickname.value);
    var rate = {'value':5000}; // unit: messages
    var per  = {'value':7000}; // unit: seconds
    var allowance = {'value':rate}; // unit: messages
    var last_check = {'value':Date.now()}; // floating-point, e.g. usec accuracy. Unit: seconds
    var spam={'value':0};


    //this is the entry point of the first input
    conn.on('data', function(data) {
       onData(nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data, 'tcp');
    });

    conn.on('close', function() {
        onClose(nickname, currentRoomName);
    });
});


server.listen(4000, function() {
    console.log(moment().format("MMMDD|HH:mm:ss") +
        " \033[96m   server listening on *:4000\033[39m");
});

//function that deletes non-default empty-rooms
setInterval(function() {
    console.log('[' + moment().format("MMM DD HH:mm:ss") +
        '] Destroying non-default rooms with no active users.');
    for (i in rooms) {
        for (var j in rooms[i]) {
            if (j > 4) {
                if (Object.getOwnPropertyNames(rooms[i][j]['value']).length == 0) {
                    try {
                        console.log('[' + moment().format("MMM DD HH:mm:ss") +
                            '] Deleted room: ' + rooms[i][j]['name']);
                        rooms.splice(i, 1);
                    } 
                    catch (err) {
                        console.log('[' + moment().format("MMM DD HH:mm:ss") +
                            '] Catch: Something went wrong with deleting room.');
                    }
                }
            }
        }
    }
}, 5 * 60 * 1000);
//5 min

function onClose (nickname, currentRoomName) {
     delete users[nickname.value];
        for (i in rooms) {
            for (var j in rooms[i]) {
                delete rooms[i][j]['value'][nickname.value];
                //delete nickname in all rooms possible. Should be better than checking conditionally for specific room
            }
        }
        broadcast(' \033[92m>piKchat<\033[39m ' + '\033[90m' + nickname.value +
            ' \033[91mLEFT\033[39m \033[90mthe "' + currentRoomName['value'] + '" room\033[39m\n', false, nickname,
            currentRoomName);
}


function onData (nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data,type) {
    var current = Date.now();
    var time_passed = current - last_check.value;
    last_check.value = current;

    if (spam.value > 5) {
        if (spam.value>10) per.value=30000;
        else if (spam.value>15) per.value=60000;
        else if (spam.value>20) per.value=120000;
        else per.value=15000;
    }
    else {
        per.value = 7000;
    }
    allowance.value += time_passed * (rate.value / per.value);
    if (allowance.value > rate.value) {
        allowance.value = rate.value; // throttle
        if (spam.value>0) spam.value--;
    }
    if (allowance.value < 1000) {
        //discard_message;
        spam.value++;
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' + 'You have hit the message limit. \nPlease wait a few seconds and try again.\n');
        if (spam.value>5) conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' + 'You will have to wait longer than usual, because you have been spamming.\n');
    }
    else {
        allowance.value -= 1000;
        if (spam.value>0) spam.value--;
        data = data.trim();
        if (type== 'http') conn.write('[' + moment().format("MMM DD HH:mm:ss") +'] >You< ' + data);
        // the first piece of data we expect is the nickname
        if (!nickname.value) { //see if it fits all the criteria
            if (users[data]) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '\033[93mThat nickname is already in use. Please try again.\033[39m\n'
                );
                return;
            } 
            else if (data.length > 20) { //because nobody wants enourmous names. 14 seems reasonable
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYour name is too long (>20 chars). Please try again.\033[39m\n'
                );
                return;
            } 
            else if (!data.match(/\S+/)) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYour name cannot be a blank space. Please try again.\033[39m\n'
                );
                return;
            } 
            else if (!data.match(/^[A-Za-z0-9_]{2,}$/)) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +
                    '\033[93mOnly letters, digits, and underscore are accepted. You need at least 2 characters. Please try again.\033[39m\n'
                );
                return;
            } 
            else if (!data.match(/[A-Za-z]+/)) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYour name has to have at least one letter in it. Please try again.\033[39m\n'
                );
                return;
            } 
            else if ((data.toLowerCase() == "admin") || (data
                    .toLowerCase() == "mod") || (data.toLowerCase() ==
                    "administrator") || (data.toLowerCase() ==
                    "moderator") || (data.toLowerCase() ==
                    "broadcast") || (data.toLowerCase() ==
                    "whisper") || (data.toLowerCase() ==
                    "system") || (data.toLowerCase() ==
                    "you")) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYou entered a reserved word. Please choose a different name and try again.\033[39m\n'
                );
                return;
            } 
            else { //it fits the criteria!
                nickname.value = data;
                users[nickname.value] = conn;
                rooms[0][0]['value'][nickname.value] = conn; //room[0][0] is the lobby
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'You \033[92mJOINED\033[39m the server and "\033[93mlobby\033[39m" room as user \033[96m' +
                    nickname.value + '\033[39m\nYou can get a list of commands by typing "/\help"\n'
                );
                broadcast(' \033[92m>piKchat<\033[39m ' + '\033[90m' + nickname.value +
                    ' \033[92mJOINED\033[39m \033[90mthe "'+ currentRoomName['value'] +'" room\033[39m\n', false,
                    nickname, currentRoomName);
            }
        }
        //once we have the nickname establishied we can focus on parsing commands
        else {
            processData(data, nickname, conn, currentRoomName);
        }

    } //bucket function
}

function broadcast(msg, sendMyself, nickname, currentRoomName) {
    for (var i in rooms) { //go through all array elements (rooms)
        for (var j in rooms[i]) {
            if (rooms[i][j]['name'] === currentRoomName['value']) { //check if room name from the array equals the argument name
                for (k in rooms[i][j]['value']) { //for that room go through all values (users)
                    if (sendMyself || k != nickname.value) { // send/notsend to self or send to all else
                        rooms[i][j]['value'][k].write('[' + moment().format(
                            "MMM DD HH:mm:ss") + ']' + msg);
                        //print on the screen of all that fit the if statement
                    }
                }
            }
        }
    }
}

function getUsers(conn, nickname, currentRoomName) {
    var roomCount = 0;
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '\033[92mUsers\033[39m in room "\033[93m' +
        currentRoomName['value'] + '\033[39m":');
    for (var i in rooms) { //go through all array elements (rooms)
        for (var j in rooms[i]) {
            if (rooms[i][j]['name'] === currentRoomName['value']) { //check if room name from the array equals the argument name
                for (k in rooms[i][j]['value']) { //for that room go through all values (users)
                    roomCount++;
                    if (k == nickname.value) conn.write('\n * ' + k +
                        ' \033[92m(** this is you **)\033[39m');
                    else conn.write('\n * ' + k);
                }
                conn.write('\n << End of user list >>\n');
            }
        }
    }
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +
    'Users in room: \033[92m' + roomCount + '\033[39m\n');
}

function changeRoom(data, nickname, conn, currentRoomName) {
    if (data == currentRoomName['value']) {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93m> You are already in room: ' + data +
            '\033[39m\n');
    } 
    else {
        var stopLoop=false;
        for (var i in rooms) { //go through all array elements (rooms)
            if (stopLoop===true) break;
            for (var j in rooms[i]) {
                if (rooms[i][j]['name'] === currentRoomName['value']) { //check if room name from the array equals the argument name
                    broadcast(' \033[92m>piKchat<\033[39m ' + '\033[90m' + nickname.value +
                        ' \033[91mLEFT\033[39m \033[90mthe "' + currentRoomName['value'] + '" room\033[39m\n', false, nickname,
                        currentRoomName);
                    delete rooms[i][j]['value'][nickname.value];
                    currentRoomName['value'] = data;
                    var stopLoop=true;
                    break; //so that it doesn't end up being recursive and causing unexpected behaviour
                }
            }
        }
        for (var i in rooms) { //go through all array elements (rooms)
            for (var j in rooms[i]) {
                if (rooms[i][j]['name'] === data) { //check if room name from the array equals the argument name
                    rooms[i][j]['value'][nickname.value] = conn;
                    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '<< You are now in room: "\033[93m' + data + '\033[39m" >>\n'); 
                    broadcast(' \033[92m>piKchat<\033[39m ' + '\033[90m' + nickname.value +
                        ' \033[92mJOINED\033[39m \033[90mthe "'+ currentRoomName['value'] +'" room\033[39m\n', false,
                        nickname, currentRoomName);
                    getUsers(conn, nickname, currentRoomName);
                }
            }
        }
    }
}

function createRoom(data, conn) {
    try {
        var object = {};
        var myVar = roomNumbers;
        roomNumbers++;
        object[myVar] = {
            'name': data,
            'value': {}
        };
        rooms.push(object);
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + 'You have \033[92msuccessfully\033[39m created the room: "\033[93m' + data + '\033[39m"\n' +
            'You can join it by writing "\033[94m/join ' + data + '\033[39m"\n\033[93mNote: Empty rooms are deleted every 5 minutes.\033[39m\n');
    } catch (err) {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '\033[93mThere was a problem creating the room. Please try again.\033[39m\n');
        console.log('[' + moment().format("MMM DD HH:mm:ss") + '] Error creating a room');
        console.log('[' + moment().format("MMM DD HH:mm:ss") + ']' + err);
    }
}

function getAllUsers(conn, nickname) {
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[92mUsers\033[39m connected to the \033[92mServer\033[39m:');
    for (var i in users) {
        if (i == nickname.value) conn.write('\n * ' + i +
            ' \033[92m(** this is you **)\033[39m');
        else conn.write('\n * ' + i);
    }
    conn.write('\n << End of user list >>\n');
    //conn.write('\n > Total users in server: \033[92m' + count + '\033[39m\n');
}

function processData(data, nickname, conn, currentRoomName) {
    if (data=="") {
        conn.write(' \033[91m>System<\033[39m \033[93mYou cannot send an empty message.\033[39m\n');
    }
    else if (data.length > 250) {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m Your message is too long! Keep it under \033[93m250 chars!\033[39m');
        conn.end();
    } 
    else if (data == "/quit") {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m Bye! Have an awesome day!');
        conn.end();
    } 
    else if (data == "/users") {
        getUsers(conn, nickname, currentRoomName);
    } 
    else if (data == "/allusers") {
        getAllUsers(conn, nickname);
    } 
    else if (data == "/rooms") {
        listRooms(currentRoomName, conn);
    } 
    else if (data.match(/^\/whisper|^\/w/)) {
        try { //have to do some bothersome parsing, but not worth it bringing a parsing module just for this
            data = data.trim();
            var name = data.split(/\s+/)[1];
            name = name.trim();
            var n = data.indexOf(name);
            var m = name.length;
            var p = data.length;
            var message = data.substring(n + m, p);
            message = message.trim();
            if (message == "") conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mOh-oh. Error. You cannot send someone an empty message.\033[39m\n'
            );
            else {
                try {
                    whisper(message, name, nickname, conn);
                } catch (err) {
                    conn.write(
                        '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mOh-oh. Error. Are you sure the receiver exists? Maybe you\'ve made a typo? Case matters!\033[39m\n'
                    );
                }
            }
        } catch (err) {
            conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mOh-oh. Error. Did you add a receiver and a message?\033[39m\n'
            );
        }
    } 
    else if (data == "/help") {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m The list of possible commands are:\n' +
            '\n \033[94m\/help\033[39m - Show the help screen with commands' +
            '\n \033[94m\/quit\033[39m - Disconnects from the chat server and exits' +
            '\n \033[94m\/leave\033[39m - Leaves current room and goes back to lobby' +
            '\n \033[94m\/rooms\033[39m - Shows a list of all possible rooms and people in them' +
            '\n \033[94m\/create [room name]\033[39m - Create a nwe room for people to join' +
            '\n \033[94m\/join [roomname]\033[39m - Joins one of the existing rooms' +
            '\n \033[94m\/users\033[39m - Shows a list of all connected people to the current room' +
            '\n \033[94m\/allusers\033[39m - Shows a list of all connected people to server' +
            '\n \033[94m\/whisper [receiver] [message]\033[39m - Send a private message. Can be any user in any room' +
            '\n \033[94m\/w [receiver] [message]\033[39m - Shorter version of whisper\n' +
            '\n \033[93mFAQ:\033[39m' +
            '\n Q: How do I change my name?' +
            '\n A: You have to exit the server and rejoin to get a new name.' +
            '\n Q: What is the message rate limit?' +
            '\n A: You can send 5 messages/commands every 7 seconds. If you spam a lot you will get less messages per 7 seconds until you calm down.' +
            '\n Q: Why did my favorite room disapper?' +
            '\n A: Empty rooms are deleted every 5 minutes. You can just create it again. Remember to join it!\n');

    } 
    else if (data == "/leave") {
        //reusing the /join here. This is what the /leave is supposed to do, right?
        if (currentRoomName['value'] != 'lobby') {
            changeRoom('lobby', nickname, conn, currentRoomName);
        } else {
            conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mYou are in the "lobby" room, you cannot go up any further.\033[39m' +
                ' If you want to quit the server you have to enter: "\033[94m/\quit\033[39m".\n'
            );
        }
    } 
    else if (data.match(/^\/join/)) {
        //some mild parsing again, but not as bad the the /whisper parsing
        var pass = false;
        try {
            data = data.split(/\s+/)[1];
            data = data.trim();
            data = data.toLowerCase();
            var pass = true;
        } catch (err) {
            conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mYou have not specified a room to join.\033[39m\n'
            );
        }
        if (pass === true) {
            var pass2 = false;
            for (var i in rooms) { //go through all array elements (rooms)
                for (var j in rooms[i]) {
                    if (rooms[i][j]['name'] === data) { //check if room name from the array equals the argument name
                        changeRoom(data, nickname, conn, currentRoomName);
                        pass2 = true;
                    }
                }
            }
            if (pass2 == false) conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mRoom "' + data +
                '" does not exist.\033[39m\n');

        }

    } 
    else if (data.match(/^\/create/)) {
        //some mild parsing again, but not as bad the the /whisper parsing
        var pass = false;
        try {
            data = data.split(/\s+/)[1];
            data = data.trim();
            data = data.toLowerCase();
            var pass = true;
        } catch (err) {
            conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mYou have not specified a room to create.\033[39m\n'
            );
        }
        if (pass === true) {
            var pass2 = true;
            for (var i in rooms) { //go through all array elements (rooms)
                for (var j in rooms[i]) {
                    if (rooms[i][j]['name'] === data) { //check if room name from the array equals the argument name
                        //changeRoom(data, nickname, conn, currentRoomName);
                        pass2 = false;
                    }
                }
            }
            if (pass2 == false) conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mRoom "' + data +
                '" already exists.\033[39m\n');
            else {
                createRoom(data, conn);
            }

        }

    } 
    else {
        // if we have the name and it is not a command, it can only be a message
        broadcast('\033[96m >' + nickname.value + '<\033[39m ' + data + '\n',
            false, nickname, currentRoomName);
    }
}


function whisper(msg, receiver, nickname, conn) {

    if (nickname.value != receiver) {
        users[receiver].write('[' + moment().format("MMM DD HH:mm:ss") + ']\033[95m >#whisper#< FROM: ' + nickname.value + ' MSG: ' + msg +
            '\033[39m\n');
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + ']\033[95m >#whisper#< TO: ' + receiver + ' MSG: ' + msg +
            '\033[39m\n');
    } else {
        conn.write(
            '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mYou cannot send a whisper to yourself.\033[39m\n'
        );
    }

}



function listRooms(currentRoomName, conn) {
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[92mActive Rooms\033[39m are:');
    for (var i in rooms) { //go through all array elements (rooms)
        for (var j in rooms[i]) {
            if (rooms[i][j]['name'] === currentRoomName['value']) { //check if room name from the array equals the argument name
                conn.write('\n * \033[92m' +
                    currentRoomName['value'] + '\033[39m' + ' (' +
                    Object.keys(rooms[i][j]['value']).length + ') << You are here');
            } else {
                conn.write('\n * ' + rooms[i][j]['name'] + ' (' + Object.keys(
                    rooms[i][j]['value']).length + ')');
            }
        }
    }
    conn.write('\n << End of rooms list >>\n');
}
