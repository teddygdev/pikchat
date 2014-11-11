# pikchat [![forthebadge](http://forthebadge.com/badges/certified-steve-bruhle.svg)](http://forthebadge.com)
[![forthebadge](http://forthebadge.com/badges/contains-cat-gifs.svg)](http://forthebadge.com)
[![forthebadge](http://forthebadge.com/badges/made-with-crayons.svg)](http://forthebadge.com)


(Super Awesome) TCP Chat Server + Web Frontend. Mobile Friendly. Engaging! Focus on colors, images, and feel.

Technologies used in the project: Node.js and AngularJS, with a sprinkle of SockJS.


## Features
  * Brand new spin on the semi-anomymous multi-user chatroom!
  * Commmunicate through an easy to use web interface, which is very mobile friendy.
  * Send Stickers/GIFs to each other using a state of the art translational engine.
  * No need to bother with links, downloading packages, or image hosting! -> just describe the image with words.
  * Using tags to send stickers is so easy and so intuitive that you might think it reads your mind!
  * But what about when I want some small picture to express my emotions with my text? Use EMOJI as well!
  * Colorful, yet easy on the eyes. Completely say goodbye to bland chatting.
  * Cutting edge color generating algorithm will make you fall in love with the interface!
  * Invite all your friends! No registration required! No pesky passwords to remember!
  * Create your own room. Hang out with your best buds!
  * Complete privacy! No IPs logged, no chat logs saved.
  * Ignore the people you dislike with a simple click. They'll never know you did it!
  * Ultramodern spam protection.
  * Designed by a team of world-class UI scientists. 
  * Voted most likely to be "Website of the decade!". Possible runner-up for "Website of the century".
  * Super responsive design! Stunning looks and perfect usability on any screen, any size.
  * Never dig through tons of messages to find just a few things. Use real-time filtering! Filter anything!
  * Need to be in two different rooms at the same time? Open two tabs! Unlimited sessions per IP!
  * Need to tell another user a secret? Use a whisper! Whispers are private messages dones right!
  * Running on a potato and want to keep with your friends? Join the server through telnet!
  * Mobile bandwith got you down? Internet not as fast? Use downsampled GIFs to reduce traffic and increase speed!
  * Respects your freedom! Free as in free speech! 
  * Funny cat GIFs! Need I say more?
  * You have to try it to believe it!
  * Yes, seriously, try it out! Go to http://pikchat.me/ right now!
  * On a potato? "telnet pikchat.me 4000" from your friendly GNU/Linux terminal.

## Implementation Features 
  * Due to node.js scalability, should be extremely scalable.
  * Very lightweight with very low resource requirements.
  * Provides a very good base, should be a cinch to implement more features on top.

## Lack of Unit Tests
  * Unit Testing for this project turned out to be non-trivial, contrary to my expectations. 
  * As bad as it sounds, unit tests had to be dropped to allow for a more complete product.
  * This chart was consulted: http://xkcd.com/1205/
  * However, in no way was testing skipped. Meticulous hand-testing was performed to ensure top quality.
  * The call had to be made, and given the circumstances, more features was the choice I made.

## Other Shortcomings / To-do list
  * The current architecture while very good, is not perfect. An "ignore" terminal implementation is much more time consuming than expected. Requires a fair bit of thought.
  * Could potentially benefit from some security features. While I've done my best, I am no security expert.
  * No administration/moderation implementation. However, very easily remedied.
  * A lot is still done through text commands rather than the web GUI. Again, very easily remedied.
  * Unicode values of emojis are not supported. (e.g. sending them through your phone). Most likely a trivial solution.
  * Absolutely no logging of messages/users. While some might say it is a design decision, I consider it a shortcoming.
  * Lack of notifications. Ideas: sounds and favicon number for unread messages. Again, easily remedied.

## Thoughts
  * Overall, I put in a lot of work in this project and I very proud of both the result and myself. 



## How to install on Ubuntu 14.10
1. Open the Terminal
2. `git clone https://github.com/teddygdev/pikchat.git` (Clone the repository)
  * Install GIT if not present on the system
  * `sudo apt-get install git-core`
3. Go into the folder where the pikchat reposity was cloned.
  * You are looking for the `PikchatServer.js` file
4. Install nodejs and npm if not present on the system
  * `sudo apt-get install nodejs`
  * `sudo apt-get install npm`
5. Once inside the folder (in the terminal), run `npm -install` to install the piKchat dependencies
6. Edit `PikchatServer.js` if you would like the TCP server to listen on another port. Default one is 4000
  * You are looking for this line:
  * `server.listen(4000, function() {
    console.log('[' + moment().format('MMM DD HH:mm:ss') + '] TCP server listening on port 4000');`
7. Edit `PikchatServer.js` if you would like the HTTP server to listen on another port. Default one is 3000   
  * You are looking for this line:
  * `app.set('port', process.env.PORT || 3000);` 
8. Edit `app/chat.js` if you would like the HTTP server fronted to run on anything different than localhost and port 3000
  * You are looking for this line:
  * `var sock = new SockJS('http://localhost:3000/chat');`
  * Replace localhost with whatever IP the server will be hosted on
  * Make sure the port matches the port from step 7!
9. Finally, start the server with `nodejs PikchatServer.js`
10. Enjoy the fruits of my labor

## How to connect
1. `telnet x.x.x.x 3000` from the terminal and just wing it from there. I've made it very intuitive.
  * `x.x.x.x` is the IP of the server. If running locally, it would be `localhost` or `127.0.0.1`
  * If you changed the port in step 6, put that port instead.
  * Please do not use the windows commandline for telnet. You will greatly regret it.
  * Putty is also not the best choice. However, at least it is less broken than cmd telnet.
  * Best way to use it is from your friendly GNU/Linux terminal. Maybe OS X will work really awesomely as well.
2. Visit `http://x.x.x.x:3000/` to checkout the web interface.
  * `x.x.x.x` is the IP of the server. If running locally, it would be `localhost` or `127.0.0.1`
  * If you changed the port in step 7, put that port instead.

## Demo
You can connect to my server as a client: `telnet pikchat.me 4000`
You can visit the website: `http://www.pikchat.me/`

## Credits
I would like to thank Guillermo Rauch for his book Smashing Node.js : JavaScript everywhere. Thanks to his TCP server starter, I was able to go in the right direction from the beginning!

Source to welcoming ASCII art in terminal: http://around140.en.utf8art.com/arc/goat_3.html

