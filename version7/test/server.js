var should = require('should');
var io = require('socket.io-client');
var socketURL = 'http://localhost:3000';

var options = {
    transports: ['websocket'],
    'force new connection': true
};

describe("Tic Tac Toe Server", function () {

    it('should start the game', function (done) {
        var player1 = io.connect(socketURL, options);
        player1.on('connect', function () {
            player1.emit('game:start');
        });

        player1.on('game:started', function (options) {
            options.should.have.property('data', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
            options.should.have.property('size', 3);
            options.should.have.property('marker', 'X');

            // Player2 joins
            var player2 = io.connect(socketURL, options);
            player2.on('connect', function () {
                player2.emit('game:start');
            });

            player2.on('game:started', function (options) {
                options.should.have.property('data', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
                options.should.have.property('size', 3);
                options.should.have.property('marker', 'O');
                done();
            });
        });
    });

});