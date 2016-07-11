var path = require('path');
var fs = require('fs');
var express = require('express');

// Server part
var app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

var server = app.listen(3000);
console.log('Server listening on port 3000');

// Socket.IO part
var io = require('socket.io')(server);
var currentConnections = 0;

// Game configs
var SIZE = 3;
var MARKERS = ['X', 'O'];
var initialGameState = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
];

var activeMarker = 'X';

io.on('connection', function (socket) {
    ++currentConnections;

    if(currentConnections <= 0) {
        ++currentConnections;
    }
    socket.on('start:game', function () {
        if (currentConnections > 2) {
            socket.emit('start:game:limit:exceeded');
            return;
        }

        socket.emit('started:game', {
            size: SIZE,
            data: initialGameState,
            marker: MARKERS[currentConnections - 1],
            activeMarker: activeMarker
        });

        if (currentConnections < 2) {
            socket.emit('start:game:player:onhold');
            return;
        } else {
            io.emit('start:game:ready', {activeMarker: activeMarker});
            return;
        }
	});

    socket.on('play:turn', function(marker, rowNum, colNum) {
        var dataClone;
        if (!initialGameState[rowNum][colNum]) {
            dataClone = initialGameState.slice(0);
            dataClone[rowNum][colNum] = MARKERS.indexOf(marker) + 1;
            var oppmarker = MARKERS.indexOf(marker) === 0 ? MARKERS[1] : MARKERS[0];
            io.emit('played:turn', dataClone);
            io.emit('played:turn:change', marker, oppmarker);
        }
    });

    // Quit the game
    socket.on('quit:game', function(marker) {
        currentConnections = 0;
        initialGameState = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        activeMarker = 'X';
        var winner = MARKERS.indexOf(marker) === 0 ? MARKERS[1] : MARKERS[0];
        io.emit('game:result', marker, winner);
    });

    // Disconnect
    socket.on('disconnect', function () {
        --currentConnections;
    });
});
