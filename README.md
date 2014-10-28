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
..* Install GIT if not present on the system
..* `sudo apt-get install git-core`
3. Go into the folder where the pikchat reposity was clone.
..* You are looking for the `PikchatServer.js` file
4. Install nodejs and npm if not present on the system
..* `sudo apt-get install nodejs`
..* `sudo apt-get install npm`
5. Once inside the folder (in the terminal), run `npm -install` to install the piKchat dependencies
6. Edit `PikchatServer.js` if you would like the server to listen on another port. Default one is 3000
..* You are looking for this line. It is near the bottom.
..* `server.listen(3000, function() {`
7. Finally, start the server with `nodejs PikchatServer.js`
8. Enjoy the fruits of your labor
