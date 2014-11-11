//module dependencie
var net = require('net');
var moment = require('moment');
var request = require('request');

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


//giphy api key
var apiKey='dc6zaTOxFJmzC';

///////http part

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

var sockjs = require('sockjs');

var connections = [];

var chat = sockjs.createServer(); //create http socket
chat.on('connection', function(conn) {
    count++;
    console.log("[" + moment().format("MMM DD HH:mm:ss") + "] \033[92mUsers connected: " + count + "\033[39m");
    var nickname={'value':undefined};
    var rate = {'value':5000}; // unit: messages
    var per  = {'value':7000}; // unit: seconds -> 5 msg / 7 sec
    var allowance = {'value':rate.value}; // unit: messages
    var last_check = {'value':Date.now()}; 
    var spam={'value':0}; //increment everytime user hits msg limit

    //conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >Random Cat GIF< ' + (Math.floor((Math.random() * 15000) + 1)) +'###cat');
    //removed due to considerations for mobile users. War pretty cool though, everytime you login, a random cat gif
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' +
        'Welcome to \033[94mpi\033[93mK\033[92mchat \033[91ms\033[92me\033[93mr\033[94mv\033[95me\033[96mr\033[39m! ' +
        'You are automatically placed in the lobby. Messages by System are only visible to you.'+
        '\n\nPlease write your name in the text box below and press enter! Accepted characters: [ A-Z ][ a-z ][ 0-9 ][ _ ]');

    var currentRoomName = {'value': 'lobby'}; //for keeping track in which room we are, default to lobby

    conn.on('data', function(data) { //on input
        onData(nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data, 'http');

    });
    conn.on('close', function() { //exit
        count--;
        onClose(nickname, currentRoomName);
        console.log("[" + moment().format("MMM DD HH:mm:ss") + "] \033[91mUsers connected: " + count + "\033[39m");
    });
});

// http/jsocks conf
app.engine('html', require('ejs').renderFile);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html'); //just using ejs to serve "static" content
app.use(express.static(path.join(__dirname, 'app')));

app.get('/', routes.index);
//app.get('/partials/:name', routes.partials);  //in case we ever add more pages
//app.get('/*', routes.index); //having trouble making it work for any pages, commented for now

var server = http.createServer(app).listen(app.get('port'), function() { //http server
    console.log('[' + moment().format('MMM DD HH:mm:ss') + '] Express server listening on port ' + app.get('port'));
});
chat.installHandlers(server, {
    prefix: '/chat'
});


///////tcp part
//create the server
var server = net.createServer(function(conn) {
    count++;
    console.log("[" + moment().format("MMM DD HH:mm:ss") + "] \033[92mUsers connected: " + count + "\033[39m");

    //some welcoming and relaxing ascii art
    //it's supposed to be a sheep    
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
        //dropped as a ui decision. might put back some day
        '\n > You are automatically placed in the lobby.' +
        '\n > Messages by >System< are only visible to you.' +
        '\n > Accepted characters: [ A-Z ][ a-z ][ 0-9 ][ _ ]' +
        '\n \033[93m> Please write your name and press enter:\033[39m '
    );
    
    //to stringify all incoming data
    conn.setEncoding('utf8');
    var currentRoomName = {'value': 'lobby'}; //for keeping track in which room we are, default to lobby

    // the user nickname for the current connection
    var nickname={'value':undefined};
    var rate = {'value':5000}; // unit: messages
    var per  = {'value':7000}; // unit: seconds
    var allowance = {'value':rate.value}; // unit: messages
    var last_check = {'value':Date.now()}; // floating-point, e.g. usec accuracy. Unit: seconds
    var spam={'value':0};
    //same as the http websocket configuration 
    
    //difference with http websocket is the string type, which we use in the rest of the code to
    //differentiate between the two types of users
    conn.on('data', function(data) {
       onData(nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data, 'tcp');
    });

    conn.on('close', function() {
        count--;
        onClose(nickname, currentRoomName);
        console.log("[" + moment().format("MMM DD HH:mm:ss") + "] \033[91mUsers connected: " + count + "\033[39m");
    });
});


server.listen(4000, function() {
    console.log('[' + moment().format('MMM DD HH:mm:ss') + '] TCP server listening on port 4000');
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
                    //just in case, has potential for things going wrong here
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
                //delete nickname in all rooms possible. Should be more efficient than checking conditionally for specific room
            }
        }
        broadcast(' \033[92m>PIKCHAT<\033[39m ' + '\033[90m' + nickname.value +
            ' \033[91mLEFT\033[39m \033[90mthe "' + currentRoomName['value'] + '" room\033[39m\n', false, nickname,
            currentRoomName);
}


function onData (nickname, rate, per, allowance, last_check, spam, currentRoomName,conn,data,type) {
    //calculations for message rate limiting
    var current = Date.now();
    var time_passed = current - last_check.value;
    last_check.value = current;
    //increase time it takes to regenerate "tokens" if user is spamming
    if (spam.value > 5) {
        if (spam.value>10) per.value=30000;
        else if (spam.value>15) per.value=60000;
        else if (spam.value>20) per.value=120000;
        else per.value=15000;
    }
    else {
        per.value = 7000;
    }
    //token bucket algorithm
    allowance.value += time_passed * (rate.value / per.value);
    if (allowance.value > rate.value) {
        allowance.value = rate.value; //throttle
        if (spam.value>0) spam.value--; //decrease spam levels
    }
    if (allowance.value < 1000) {
        //discard message;
        spam.value++;
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' + 'You have hit the message limit. \nPlease wait a few seconds and try again.\n');
        if (spam.value>5) conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] >System< ' + 'You will have to wait longer than usual, because you have been spamming.\n');
    }
    else {
        //allowed to send
        allowance.value -= 1000;
        if (spam.value>0) spam.value--; //decrease spam even more
        data = data.trim();
        if ((type== 'http') &&(!data.match(/^##/))) conn.write('[' + moment().format("MMM DD HH:mm:ss") +'] >You< ' + data);
        //print everything the http users write, so he/she knows what he/she wrote, however, ignore things starting with hashtags as that is proccessed in another place
        //the first piece of data we expect is the nickname
        if (!nickname.value) { //nickname not set, i.e just connected user
            if (users[data]) { 
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '\033[93mThat nickname is already in use. Please try again.\033[39m\n'
                );
                return; //have to set name before being allowed to send messages
            } 
            else if (data.length > 20) { //because nobody wants enourmous names. 20 seems reasonable
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
            else if (!data.match(/^[A-Za-z0-9_]{2,}$/)) { //spaces create problems with /whisper implementation. I think it is better without spaces
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
            else if ((data.toLowerCase() == "admin") || (data  //eventually will have some way to login as admin and have special commands
                    .toLowerCase() == "mod") || (data.toLowerCase() ==
                    "administrator") || (data.toLowerCase() ==
                    "moderator") || (data.toLowerCase() ==
                    "broadcast") || (data.toLowerCase() ==
                    "whisper") || (data.toLowerCase() ==
                    "pikchat") || (data.toLowerCase() ==
                    "undefined") || (data.toLowerCase() ==
                    "system") || (data.toLowerCase() ==
                    "you")) {
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYou entered a reserved word. Please choose a different name and try again.\033[39m\n'
                );
                return;
            } 
            else { //the entered name doesn't conflict with any of the rules
                nickname.value = data;
                users[nickname.value] = conn;
                rooms[0][0]['value'][nickname.value] = conn; //room[0][0] is the lobby, and lobby is default, so hardcoded
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'You \033[92mJOINED\033[39m the server and "\033[93mlobby\033[39m" room as user \033[96m' +
                    nickname.value + '\033[39m\nYou can get a list of commands by typing "/\help"\n'
                );
                broadcast(' \033[92m>PIKCHAT<\033[39m ' + '\033[90m' + nickname.value +
                    ' \033[92mJOINED\033[39m \033[90mthe "'+ currentRoomName['value'] +'" room\033[39m\n', false,
                    nickname, currentRoomName);
            }
        }
        //once we have the nickname establishied we can focus on parsing commands
        else {
            processData(data, nickname, conn, currentRoomName, type);
        }

    } //token bucket function end
}



function processData(data, nickname, conn, currentRoomName, type) {
    if (data=="") {
        conn.write(' \033[91m>System<\033[39m \033[93mYou cannot send an empty message.\033[39m\n');
    }
    else if (data.length > 250) {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m Your message is too long! Keep it under \033[93m250 chars!\033[39m');
        conn.end();
    } 
    else if (data == "/quit") {
        conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m Bye! Have an awesome day!\n');
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
        try { 
            //primitive efforts at parsing
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
            '\n Q: Why is the time off by a few hours?' +
            '\n A: pikChat uses server time for everybody, for now at least. Server timezone is EST (GMT -5).' +
            '\n Q: What is the message rate limit?' +
            '\n A: You can send 5 messages/commands every 7 seconds. If you spam a lot you will get less messages per 7 seconds until you calm down.' +
            '\n Q: What are all these hashtags?' +
            '\n A: The browser version of the chat supports in-message GIFS. \#\#[tag] returns a sticker. \#\#\#[tag] returns a GIF. A number in front indicates that a specific' +
            'image matching that tag will be shown' +
            '\n Q: Why am I getting a >You< message when I try sending a random GIF/sticker?' +
            '\n A: There are many images tagged with the same tag. The pikChat server returns a random one of those and people need to get the same number to see the the same image.'+
            'This is how you send the same GIF/sticker to everyone.' +
            '\n Q: What extra features does the browser version have?' +
            '\n A: You can send GIFS/stickers, ignore certain people, hide specific types of messages, have real-time filtering. Overall a much posher way of enjoying piKchat.' +
            '\n Q: Why did my favorite room disapper?' +
            '\n A: Empty rooms are deleted every 5 minutes. You can just create it again. Remember to join it!\n');

    } 
    else if (data == "/leave") {
        //reusing the /join here. This is what the /leave is supposed to do after all, join the lobby.
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
        //getting better at this parsing thing!
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
        //yay, more parsing!
        var pass = false;
        try {
            data = data.split(/\s+/)[1];
            data = data.trim();
            data = data.toLowerCase();
            var pass = true;
        } 
        catch (err) {
            conn.write(
                '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m \033[93mYou have not specified a room to create.\033[39m\n'
            );
        }
        try {
            if (!data.match(/^[A-Za-z0-9_]{2,}$/)) {
                    conn.write(
                        '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +
                        '\033[93mOnly letters, digits, and underscore are accepted. You need at least 2 characters. Please try again.\033[39m\n'
                    );
                    pass=false;
                }
            if (data.length > 20) { //because nobody wants enourmous names. 20 seems reasonable
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +'\033[93mYour room name is too long (>20 chars). Please try again.\033[39m\n'
                );
                pass=false;
            }     
        } 
        catch (err) {
            pass=false;
        }
        if (pass === true) {
            var pass2 = true;
            for (var i in rooms) { //go through all array elements (rooms)
                for (var j in rooms[i]) {
                    if (rooms[i][j]['name'] === data) { //check if room name from the array equals the argument name
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
    else if (data.match(/^###?/)) {  //okay, so the frontend parses things like these: 37###lol, 75##lol, 1###ryan gosling, 23###funny cat
        var searchType = 'stickers'; //two hashtags means a sticker, three a gif. more than that and nothing is done about them
        var validHash = true;        //the number infront specifiecs which out of all the images with that tag will be chosen
        if (data.match(/^###/)) {    //users should be able to send a gif/sticker just based on a tag, don't have to search for a specific image
            searchType='gifs';       //this part of the code makes sure to put a number for an image that exists in the giphy gif database
        }
        if (data.match(/^####+/)) {
            validHash=false;
        }
        num = 0;
        var msgText = data;
        var msgBackup = msgText;        
        msgText = msgText.replace(/\W/g, ' ');
        var tags=msgText.trim().split(/\s+/g); //maybe I really should have used a parsing library
        var querystring = '';
        var first=true; //forming the search query properly
        for ( i = 0; i < tags.length; i++) {
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
        if ((querystring=='')||(validHash==false)) {  //non-valid hashtag request string. Into the trash it goes.
            broadcast('\033[96m >' + nickname.value + '<\033[39m ' + data + '\n',false, nickname, currentRoomName);
            if (type=='http') conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>You<\033[39m '+ data +'\n');
        }
        else { //the giphy api has some translation services, probably a tad better than search, but much harder to implement same image for everyone in chat
            request('http://api.giphy.com/v1/'+searchType+'/search?q='+ querystring +'&limit=1&api_key='+apiKey, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                try {
                    var total=body.pagination.total_count;
                    var num = Math.floor(Math.random() * (total-1 - 0 + 1)) + 0; //cool random function I found
                    broadcast('\033[96m >' + nickname.value + '<\033[39m ' + num + data + '\n',
                    false, nickname, currentRoomName);
                    conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>You<\033[39m '+ num + data +'\n');
                }
                catch (err) {
                    broadcast('\033[96m >' + nickname.value + '<\033[39m ' + num + data + '\n',
                    false, nickname, currentRoomName);
                    conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>You<\033[39m '+ num + data +'\n');
                }
              }
              else {
                broadcast('\033[96m >' + nickname.value + '<\033[39m ' + num + data + '\n',
                false, nickname, currentRoomName);
                conn.write(
                    '[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>You<\033[39m '+ num + data +'\n'
                );

              }
            }) //end of request
        } //end of else for valid search string
    } 
    else {
        //if we have the name and it is not a command, it can only be a message
        //finally just a regular message
        broadcast('\033[96m >' + nickname.value + '<\033[39m ' + data + '\n',
            false, nickname, currentRoomName);
    }
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
                    broadcast(' \033[92m>PIKCHAT<\033[39m ' + '\033[90m' + nickname.value +
                        ' \033[91mLEFT\033[39m \033[90mthe "' + currentRoomName['value'] + '" room\033[39m\n', false, nickname,
                        currentRoomName);
                    delete rooms[i][j]['value'][nickname.value]; //remove from room we are in
                    currentRoomName['value'] = data; //change to future room, inside connection
                    var stopLoop=true; //unexpected behaviour prevention
                    break; //so that it doesn't end up being recursive and causing unexpected behaviour
                }
            }
        }
        for (var i in rooms) { //go through all array elements (rooms)
            for (var j in rooms[i]) {
                if (rooms[i][j]['name'] === data) { //check if room name from the array equals the argument name
                    rooms[i][j]['value'][nickname.value] = conn; //join the new room
                    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' + '<< You are now in room: "\033[93m' + data + '\033[39m" >>\n'); 
                    broadcast(' \033[92m>PIKCHAT<\033[39m ' + '\033[90m' + nickname.value +
                        ' \033[92mJOINED\033[39m \033[90mthe "'+ currentRoomName['value'] +'" room\033[39m\n', false,
                        nickname, currentRoomName);
                    getUsers(conn, nickname, currentRoomName); //a bit against this as an UI choice due to cluttering, but I can live with it
                    //however I removed the >joining room from the requirements. I belive it is for the best.
                }
            }
        }
    }
}

function createRoom(data, conn) {
    try {
        //done in an obscure way, so that a property name can be a variable as well
        var object = {};
        var myVar = roomNumbers;
        roomNumbers++; //keeping track of room numbers, especially deleted ones would be really bothersome
        object[myVar] = {  //just incrementing all new rooms. with a 53 bit mantissa, someone would have to create a lot of rooms to crash the server
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
    conn.write('[' + moment().format("MMM DD HH:mm:ss") + '] \033[91m>System<\033[39m ' +
    'Users in server: \033[92m' + count + '\033[39m\n');
    //users could probably be used to send global messages. but that should be reserved for admins only
}


function whisper(msg, receiver, nickname, conn) {
    //I wanted whispers to have their own color, so that they stand out. Having a user named "whisper" is a cool way to do that
    //shortcoming: no way to block someone whispering you in the web client. A better implementation on the to-do list.
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
