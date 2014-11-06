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