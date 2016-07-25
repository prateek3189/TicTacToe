var path = require('path');
var fs = require('fs');
var express = require('express');

// Server part
var app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

var server = app.listen(3000);
console.log('Server listening on port 3000: http://localhost:3000');

// Socket.IO part
var io = require('socket.io')(server);

// Game configs
var SIZE = 3,
    MARKERS = ['X', 'O'],
    currentConnections = 0,
    initialGameState, activeMarker;

function _init() {
    initialGameState = getInitialState(SIZE);
    activeMarker = MARKERS[0];
}

function getInitialState(size) {
    var i, j, result = [], row;
    for (i = 0; i < size; i++) {
        row = [];
        for (j = 0; j < size; j++) {
            row.push(0);
        }
        result.push(row);
    }
    return result;
};

// Kick off app state
_init();

io.on('connection', function (socket) {
    ++currentConnections;

    socket.on('game:start', function () {
        console.log('in game start');
        if (currentConnections > 2) {
            socket.emit('game:start:limit:exceeded');
            return;
        }

        socket.marker = MARKERS[currentConnections - 1];

        socket.emit('game:started', {
            size: SIZE,
            data: initialGameState,
            marker: MARKERS[currentConnections - 1],
            activeMarker: activeMarker
        });

        if (currentConnections < 2) {
            socket.emit('game:start:player:onhold');
        } else {
            io.emit('game:start:ready', { activeMarker: activeMarker });
        }

        // Maintaining log
        console.log("Player " + currentConnections + " Joined the game.");
    });

    socket.on('game:play:turn', function (marker, rowNum, colNum) {
        var dataClone, oppmarker;

        if (!initialGameState[rowNum][colNum]) {
            dataClone = initialGameState.slice(0);
            dataClone[rowNum][colNum] = MARKERS.indexOf(marker) + 1;
            oppmarker = getOpponentMarker(marker);

            if (checkWinningState(dataClone, marker)) {
                _init();
                io.emit('game:result', oppmarker, marker);
            }

            // Withdraw game
            if (checkWithdrawGame(dataClone)) {
                onGameTieEvent();
            }

            io.emit('game:played:turn', dataClone);
            io.emit('game:played:turn:change', marker, oppmarker);
        }
    });

    socket.on('game:restart', function() {
        io.emit('game:restart:done');
    });

    socket.on('disconnect', function () {
        --currentConnections;
        if (currentConnections === 0) {
            console.log("All Player left the game");
            _init();
        } else if (currentConnections < 2) {
            console.log("Player " + looser + " left the game");
            var looser = socket.marker;
            var winner = getOpponentMarker(socket.marker);
            io.emit('game:result', looser, winner);
        }
    });

    // Utils
    function checkWinningState(data, marker) {
        var valueToCheck = MARKERS.indexOf(marker) + 1;
        var result = false;
        var diagonalsArray = [true, true];

        // Check in every row
        result = data.find(function (row, index) {
            return _every(row, valueToCheck);
        });
        if (result) {
            return !!result;
        }

        // Check in every column
        result = data.find(function (row, index) {
            var column = getCol(data, index);
            return _every(column, valueToCheck);
        });
        if (result) {
            return !!result;
        }

        // Check in each diagonal
        result = diagonalsArray.find(function (value, index) {
            var diagonal = getDiagonal(data, index);
            return _every(diagonal, valueToCheck);
        });

        return !!result;
    }

    function checkWithdrawGame(data) {
        result = data.every(function (row) {
            return row.indexOf(0) === -1;
        });
        return !!result;
    }

    function onGameTieEvent() {
        _init();
        io.emit('game:tie');
    }

    function getCol(matrix, col) {
        var column = [];
        for (var i = 0; i < matrix.length; i++) {
            column.push(matrix[i][col]);
        }
        return column;
    }

    function getDiagonal(matrix, index) {
        var diagonal = [];
        var i = 0, j = matrix.length - 1;
        if (index === 0) {
            for (; i < matrix.length; i++) {
                diagonal.push(matrix[i][i]);
            }
        } else if (index === 1) {
            for (i = 0; i < matrix.length; i++) {
                diagonal.push(matrix[i][j]);
                j--;
            }
        }
        return diagonal;
    }

    function _every(array, valueToCheck) {
        return array.every(function (value) {
            return value === valueToCheck;
        });
    }

    function getOpponentMarker(marker) {
        return marker === MARKERS[0] ? MARKERS[1] : MARKERS[0];
    }
});
