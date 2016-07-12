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
        } else {
            io.emit('start:game:ready', { activeMarker: activeMarker });
        }
    });

    socket.on('play:turn', function (marker, rowNum, colNum) {
        var dataClone, oppmarker;

        if (!initialGameState[rowNum][colNum]) {
            dataClone = initialGameState.slice(0);
            dataClone[rowNum][colNum] = MARKERS.indexOf(marker) + 1;
            oppmarker = MARKERS.indexOf(marker) === 0 ? MARKERS[1] : MARKERS[0];

            if (checkWinningState(dataClone, marker)) {
                quitGame(oppmarker);
            }

            // Withdraw game
            if (checkWithdrawGame(dataClone)) {
                onGameTieEvent();
            }

            io.emit('played:turn', dataClone);
            io.emit('played:turn:change', marker, oppmarker);
        }
    });

    // Check for winning state of given marker
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

    // Check withdraw  game
    function checkWithdrawGame(data) {
        result = data.every(function (row) {
            return row.indexOf(0) === -1;
        });
        return !!result;
    }

    // Quit the game
    socket.on('quit:game', function (marker) {
        quitGame(marker);
    });

    // Restart the game
    socket.on('restart:game', function () {
        _init();
        // TODO: Fix this tomorrow
        io.emit('started:game', { data: initialGameState });
        io.emit('restarted:game', initialGameState);
    });

    // Quit Game
    function quitGame(marker) {
        _init();
        var winner = MARKERS.indexOf(marker) === 0 ? MARKERS[1] : MARKERS[0];
        io.emit('game:result', marker, winner);
    }

    // on Tie Game
    function onGameTieEvent() {
        _init();
        io.emit('game:tie');
    }

    // Disconnect
    socket.on('disconnect', function () {
        --currentConnections;
        if (currentConnections === 0) {
            _init();
        } else if (currentConnections < 2) {
            io.emit('game:result', activeMarker === MARKERS[0] ? MARKERS[1] : MARKERS[0], activeMarker);
        }
    });


    // Utils
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
});
