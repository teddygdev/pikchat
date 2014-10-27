/*
var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  c.on('end', function() {
    console.log('server disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.listen(8124, function() { //'listening' listener
  console.log('server bound');
});
*/

/*var http = false, tcp = false
if ( process.argv.length > 2 ) {
    process.argv.forEach(function (val, index, array) {
        switch(val)
        {
            case "http":
                http = true
                break;
            case "tcp":
                tcp = true
                break
        }
    });
} else {
    http = true;
    tcp = true;
}
*/
// chat functions

// HTTP stuff
/*if ( http ) {
    var http_port = process.env.PORT || 5000;

    var express = require('express'), app = express()
      , http = require('http')
      , server = http.createServer(app)
      , jade = require('jade');

    var sockjs = require('sockjs');
    var chatSocket = sockjs.createServer();
    chatSocket.installHandlers(server, {prefix:'/chat'});


    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set("view options", { layout: false });
    //app.configure(function() {
        app.use(express.static(__dirname + '/public'));
    //});
    app.get('/', function(req, res){
        var tcpURI = null;
        if ( tcp ) {
            tcpURI = process.env.RUPPELLS_SOCKETS_FRONTEND_URI;
        }
        res.render('home.jade', { 'tcpURI': tcpURI });
    });
    server.listen(http_port);
    console.log("HTTP listening on " + http_port);
    chatSocket.on('connection', function(conn) {
        var name = "HTTP -> " + conn.remoteAddress + ":" + conn.remotePort;
        peeps[name] = {
            'send' : function (message, sender) { conn.write(JSON.stringify({ 'message' : message, 'name' : sender })); }
        };
        conn.write(JSON.stringify({ 'message' : "Welcome " + name, 'name' : "Server"}));
        joined(name);
        conn.on('data', function (message) {
            broadcast(message, name);
        });
        conn.on('disconnect', function () {
            left(name);
        });

        conn.on('data', function(message) {
            conn.write(message);
        });
        conn.on('close', function() {});
    });
}
*/

var peeps = {};

Array.prototype.remove = function(e) {
  for (var i = 0; i < this.length; i++) {
    if (e == this[i]) { return this.splice(i, 1); }
  }
};

function Client(socket) {
  this.name = null;
  this.socket = socket;
}

var clients = [];

function broadcast(message, sender) {
    for ( var sendTo in peeps ) {
        if ( sendTo != sender ) {
            console.log("checking " + sendTo + " in " + peeps);
            peeps[sendTo].send(message, sender);
        }
    }
}

function joined(name) {
    broadcast("I've joined the chat!", name)
}

function left(name) {
    broadcast(name + " left the chat.", name);
    delete peeps[name];
}

// TCP socket stuff
//if ( tcp ) {
    var tcpPort = 1337;
    net = require('net');
    var anonCount = 0;




    var server = net.createServer(function (socket) {
    	var client = new Client(socket);
  		clients.push(client);

    	socket.setEncoding("utf8");

    	socket.write("Welcome to the piKchat chat server!\n");
        socket.write("People connected to server: " + server.connections + "\n");
    	socket.write("Login Name?\n");
    	var duplicate = false;

    	socket.on("data", function (data) {
		    if (client.name == null) {
		    	var tempName = (data.trim()).match(/\S+/);
		    	clients.forEach(function(c) {
		    		console.log(c.name+""+"|");
			    	if ((c.name+"") === tempName) {
			    		duplicate = true;
			    	}
		    	});
		    	if (duplicate === false) {
		    		client.name = (data.trim()).match(/\S+/);
		    		socket.write("===========\n");
		    	}
		    	

		      /*console.log(clients.name+"");
		     	clients.forEach(function(c) {
		     		console.log(data.trim());
		     		console.log(c.name+"");
			      	if ((data.trim()) == (c.name+"")) {
			      		client.name == null;
			      		return;
			      	}
			    });

		      	client.name = data.match(/\S+/);
		      	clients.forEach(function(c) {
			      	if (c != client) {
			         	c.socket.write(client.name + " has joined.\n");
			         }
			    });		 	 
		    	return;
		    	socket.write("===========\n");
		    	*/
		  	}
		
		    

		    var command = data.match(/^\/(.*)/);
		    if (command) {
		      if (command[1] == 'users') {
		        clients.forEach(function(c) {
		          stream.write("- " + c.name + "\n");
		        });
		      }
		      else if (command[1] == 'quit') {
		        stream.end();
		      }
		      return;
		    }

		    clients.forEach(function(c) {
		    	//console.log(c.name+"");
		      if (c != client) {
		        c.socket.write(client.name + ": " + data);
		        
		      }
		    });
		  });


    	//var name = null;
    	//var checkTaken = true;
    	//console.log(peeps);
    	

    	/*socket.on('data', function (data) {
    		if (name == null) {
    			if (checkTaken === true) {
    				checkTaken=false;
    				for ( var taken in peeps ) {
	        			if (data.trim() == taken) {
	            			name = null;
	            			checkTaken=true;
	            			socket.write("Sorry, name taken. Choose another one");
	            		}
            		}
            	}
            	else {
            		if (data.match(/^Anon+/)) {
	    				anonCount++;
	    				name = 'Anon' + anonCount;
	    				peeps[name] = {
	            			'send' : function(message, sender) { socket.write(sender + " said: " + message + "\n") }
	        				};
	    			}

	    			else {
		    			name = data.match(/\S+/);	
		    			peeps[name] = {
		            		'send' : function(message, sender) { socket.write(sender + " said: " + message + "\n") }
		        			};
	    			}
            	}
    		}
    		else {
	    		broadcast(data.toString().replace(/(\r\n|\n|\r)/gm,""), name);
	            console.log(peeps);
    		}
            
        });
		*/
  		

    	/*var client = net.connect({port: 1337},
  		  function() { //'connect' listener
 			 console.log('client connected');
 			 socket.write('world!\r\n');
			});
		*/

        var address = "TCP -> " + socket.remoteAddress + ":" + socket.remotePort
        
        //socket.write("Welcome " + name + "\n");
        //joined(name);
        
        socket.on('close', function (had_error) {
            if (had_error) {
                console.log("I closed due to an error!");
            }
            left(name);
        });
    })
    server.listen(tcpPort);
    console.log("TCP listening on " + tcpPort);
//}
