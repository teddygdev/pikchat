# pikchat [![forthebadge](http://forthebadge.com/badges/certified-steve-bruhle.svg)](http://forthebadge.com)
[![forthebadge](http://forthebadge.com/badges/contains-cat-gifs.svg)](http://forthebadge.com)
[![forthebadge](http://forthebadge.com/badges/made-with-crayons.svg)](http://forthebadge.com)


TCP Chat Server + (to be impemented) Web Frontend. Focus (will be) on communication through images/stickers.

Technologies used in the project: Node.js

Source to ASCII art: http://around140.en.utf8art.com/arc/goat_3.html

Created by Teddy G for a job interview.

## How to install on Ubuntu 14.10
1. Open the Terminal
2. `git clone https://github.com/teddygdev/pikchat.git` (Clone the repository)
  * Install GIT if not present on the system
  * `sudo apt-get install git-core`
3. Go into the folder where the pikchat reposity was clone.
  * You are looking for the `PikchatServer.js` file
4. Install nodejs and npm if not present on the system
  * `sudo apt-get install nodejs`
  * `sudo apt-get install npm`
5. Once inside the folder (in the terminal), run `npm -install` to install the piKchat dependencies
6. Edit `PikchatServer.js` if you would like the server to listen on another port. Default one is 3000
  * You are looking for this line. It is near the bottom.
  * `server.listen(3000, function() {`
7. Finally, start the server with `nodejs PikchatServer.js`
8. Enjoy the fruits of my labor

## More about the project
### Or the story explaining why pikchat doesn't have pictures

Originally, when I started the project, I did not have the slightest clue about how node.js works. I had been intimidated by node.js for some time and had failed to pick it up on multiple occassions. However, after some research, I found out it would suite my requirements for this project perfectly. 

The idea was to have node.js running in the background and have a angular.js web frontend. It was supposed to extremely interactive and pleasant to use. I did some prototyping, found some really cool examples, socket.io was a blast... it was going to be amazing. My vision was to make a more chatty and fluid imageboard.

Halfway through the project, by the time I am getting down to the nitty-gritty parts, I realize a node http server is not going to work. In order to use telnet (required by the... requirements) I would have to implement a TCP server. It's probably a good idea to share that I don't know that much about TCP, have only used telnet to play starwars in the command prompt (telnet towel.blinkenlights.nl), have never really used chat rooms and not really familiar with how they work, first time using node.js... you get the idea. No biggie, I'll just put the http server on the backburner and quickly do the TCP server, so that I can get back to http faster. After all, how hard could it be?

Well, very hard, especially for a newbie. The last few days have been a mad dash to finish at least the basics of the TCP server. I wasn't even sure if I would make it in time. On the flipside, I learned more about TCP, cloud servers, and node.js from my one week coding sprint than I ever learned about those technologies in school or at work. I am really sad I had to scrap the web part of the project... at least for now. I really plan on getting back to this project soon, after all, why buy a domain and cloud hosting if you are not going to use it?

Overall, I am really happy how the TCP part turned out. Taking in all that knowledge was overwhelming, but extremely satisfying at the same moment. However, I did have to cut some corners to meet the deadline. The most evident being: no automated testing and hardcoded rooms. Luckily node.js is there to pick up my slack. It was really the best choice, as even with ~300 connections, the cloud server barely goes above 1% CPU usage. 

In conclusion, I would like to finish with a quote by Albert Camus. 
“I leave Sisyphus at the foot of the mountain. One always finds one's burden again. But Sisyphus teaches the higher fidelity that negates the gods and raises rocks. He too concludes that all is well. This universe henceforth without a master seems to him neither sterile nor futile. Each atom of that stone, each mineral flake of that night-filled mountain, in itself, forms a world. The struggle itself toward the heights is enough to fill a man's heart. One must imagine Sisyphus happy.”
The way I see it, no matter how the interview goes, the struggle towards fulfilling the interview task was the most fulfilling for me. I learned so much in such a small time frame, knowledge I did not plan on acquiring anytime soon. And especially cloud servers and node.js, they opened so many doors, almost instantly. Both of those make so many future project possible, it is hard to imagine now not knowing how to work with those. Thank you for giving me this opportunity. I gained hundreds of times more from this interview than I initially thought I would.



