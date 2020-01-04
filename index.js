//ws://127.0.0.1:52300/socket.io/?EIO=4&transport=websocket
//ws://crazy-pharmacist.herokuapp.com:80/socket.io/?EIO=4&transport=websocket
//https://crazy-pharmacist.herokuapp.com/
let io = require('socket.io')(process.env.PORT || 52300);

//custom class
var Player = require('./Classes/Player.js');
var Bullet = require('./Classes/Bullet.js')

console.log('Server has started');

var players = [];
var sockets = [];
var bullets = [];

//updates
setInterval(() => {
    bullets.forEach(bullet => {
        var isDestroyed = bullet.onUpdate();

        //Remove
        if (isDestroyed) {
            var index = bullets.indexOf(bullet);
            if (index > -1) {
                bullets.splice(index, 1);
                var returnData = {
                    id: bullet.id
                }
                for (var playerID in players) {
                    sockets[playerID].emit('serverUnspawn', returnData);
                }
            }
        }
        else {
            //var returnData = {
            //    id: bullet.id,
            //    position: {
            //        x: bullet.position.x,
            //        y: bullet.position.y,
            //        z: bullet.position.z
            //    }
            //}
            //for (var playerID in players) {
            //    sockets[playerID].emit('updatePosition', returnData);
            //}
        }
    });
}, 100, 0);

io.on('connection', function (socket) {
    console.log('Connection Made!');

    var player = new Player();
    var thisPlayerID = player.id;

    players[thisPlayerID] = player;
    sockets[thisPlayerID] = socket;

    //Tell the client that this is our id for the server
    socket.emit('register', { id: thisPlayerID });
    socket.emit('spawn', player); //tell myself i have spawn
    socket.broadcast.emit('spawn', player); //tell other player ive spawn

    //Tell myself about everyone else in the game
    for (var playerID in players) {
        if (playerID != thisPlayerID) {
            socket.emit('spawn', players[playerID]);
        }
    }

    //Positional Data from Client
    socket.on('updatePosition', function (data) {
        player.position.x = data.position.x;
        player.position.y = data.position.y;
        player.position.z = data.position.z;

        socket.broadcast.emit('updatePosition', player);
    });

    socket.on('updateRotation', function (data) {
        player.tankRotation = data.tankRotation;
        player.barrelRotation = data.barrelRotation;

        socket.broadcast.emit('updateRotation', player);
    });
    socket.on('fireBullet', function (data) {
        var bullet = new Bullet();
        bullet.name = data.name;
        bullet.position.x = data.position.x;
        bullet.position.y = data.position.y;
        bullet.position.z = data.position.z;

        bullets.push(bullet);

        var returnData = {
            name: bullet.name,
            id: bullet.id,
            position: {
                x: bullet.position.x,
                y: bullet.position.y,
                z: bullet.position.z
            }
        }
        socket.emit('serverSpawn', returnData);
        socket.broadcast.emit('serverSpawn', returnData);
    });

    socket.on('updatePositionObj', function (data) {
        
        data.id;
        data.position.x;
        data.position.y;
        data.position.z;

        //console.log('id move ' + data.id);
        socket.emit('updatePositionObj', data);
        socket.broadcast.emit('updatePositionObj', data);
    });

    socket.on('disconnect', function () {
        console.log('A player has disconnected');
        delete players[thisPlayerID];
        delete sockets[thisPlayerID];
        socket.broadcast.emit('disconnected', player);
    });
});

function interval(func, wait, times) {
    var interv = function (w, t) {
        return function () {
            if (typeof t === "undefined" || t-- > 0) {
                setTimeout(interv, w);
                try {
                    func.call(null);
                } catch (e) {
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);
    setTimeout(interv, wait);
}