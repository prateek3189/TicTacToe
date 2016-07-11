var path = require('path');
var fs = require('fs');
var express = require('express');

// Server part
var app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

var server = app.listen(9000);
console.log('Server listening on port 9000');

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

io.on('connection', function (socket) {
    ++currentConnections;

    socket.on('start:game', function () {
        if (currentConnections > 2) {
            socket.emit('start:game:limit:exceeded');
            return;
        }

        socket.emit('started:game', {
            size: SIZE,
            data: initialGameState,
            marker: MARKERS[currentConnections - 1]
        });
	});

    socket.on('play:turn', function(marker, rowNum, colNum) {
        var dataClone;
        if (!initialGameState[rowNum][colNum]) {
            dataClone = initialGameState.slice(0);
            dataClone[rowNum][colNum] = MARKERS.indexOf(marker) + 1;
            io.emit('played:turn', dataClone);
        }
    });

    // TODO: Check why this below is not working as expected
    socket.on('disconnect', function () {
        --currentConnections;
    });
});
