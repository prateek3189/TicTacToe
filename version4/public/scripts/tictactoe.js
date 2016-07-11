// Cell
var Cell = React.createClass({
    render: function() {
        return (
            <td onClick={this._onClick} width={100/this.props.size + '%'} height={100/this.props.size + '%'}>
                {this.props.data}
            </td>
        );
    },

    _onClick: function() {
        if (typeof this.props.onTurnPlayed === 'function') {
            this.props.onTurnPlayed(this.props.turn, this.props.rowNum, this.props.colNum);
        }
    }
});

// Row
var Row = React.createClass({
    render: function() {
        var cells = [];
        var i;

        for (i = 0; i < this.props.size; i++) {
            cells.push(<Cell {...this.props} data={this.props.data[i]} key={i} colNum={i} />);
        }

        return (
            <tr>
                {cells}
            </tr>
        );
    }
});

// Tic Tac Toe component
var TicTacToe = React.createClass({
    propTypes: {
        size: React.PropTypes.number.isRequired,
        data: React.PropTypes.array.isRequired,
        onTurnPlayed: React.PropTypes.func,
        onRestartGame: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            markerOne: 'X',
            markerTwo: 'O'
        };
    },

    render: function() {
        var rows = [];
        var i;

        for (i = 0; i < this.props.size; i++) {
            rows.push(<Row {...this.props} data={this.getMappedData(this.props.data[i])} key={i} rowNum={i}/>);
        }

        return (
            <div>
                <h1>Tic Tac Toe</h1>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
                <div id="overlay" className="overlay"><b>Waiting for second player</b></div>
                <div id="overlay_turn" className="overlay_turn"><b>Wait for your turn</b></div>
                <div className="information">
                    <div className="information_box">
                        <label>Player 1:</label>
                        <span className="marker">X</span>
                        <span id="turn_marker_X" className="turn_marker">&#x2713;</span>
                    </div>
                    <div className="information_box">
                        <label>Player 2:</label>
                        <span className="marker">O</span>
                        <span id="turn_marker_O" className="turn_marker">&#x2713;</span>
                    </div>
                </div>
                <span className="player_info">You are playing with <b id="player_marker">X</b></span>
                <button id="quitGame" onClick={this._quitGame}>Quit</button>
                <div className="popup" id="popup">
                    <div className="content">
                        <div id="popupContent">You Won...</div>
                        <button id="restartGame" className="restartGame" onClick={this._restartGame}>Restart Game</button>
                    </div>
                    <div className="fade"></div>
                </div>
            </div>
        );
    },

    _restartGame: function() {
        if (typeof this.props.onRestartGame === 'function') {
            this.props.onRestartGame();
        }
    },

    _quitGame: function() {
        if (typeof this.props.onQuitGame === 'function') {
            this.props.onQuitGame();
        }
    },

    getMappedData: function(data) {
        var hash = {
            0: null,
            1: this.props.markerOne,
            2: this.props.markerTwo
        };

        return data.map(function(data) {
            return hash[data];
        });
    }
});

// Main app component
var App = React.createClass({
    getInitialState: function() {
        return {};
    },

    componentDidMount: function() {
        var self = this;
        this.socket = io();
        var playerMarker, activePlayerMarker;

        this.socket.on('started:game', function(options) {
            if(document.getElementById('overlay')) {
                document.getElementById('overlay').style.display = 'none';
            }

            self.setState({
                data: options.data,
                size: options.size,
                marker: options.marker
            });
            document.getElementById('player_marker').innerHTML = options.marker;
            playerMarker = options.marker;
        });

        this.socket.on('start:game:limit:exceeded', function() {
            alert('No slot available to paly! Please check after some time :D');
        });

        this.socket.on('played:turn', function(updatedData) {
            self.setState({ data: updatedData });

            // Check for the winner
            this.socket.emit('game:check:winner', updatedData);
        });

        this.socket.on('played:turn:change', function(marker, oppmarker) {
            var turnOverlay  = document.getElementById('overlay_turn');
            document.getElementById('turn_marker_'+marker).style.display = 'none';
            document.getElementById('turn_marker_'+oppmarker).style.display = 'inline-block';
            turnOverlay.style.display = (playerMarker === marker) ? 'block' : 'none';
        });

        this.socket.emit('start:game');

        this.socket.on('start:game:player:onhold', function() {
            document.getElementById('overlay').style.display = 'block';
        });

        this.socket.on('start:game:ready', function(options) {
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('turn_marker_'+options.activeMarker).style.display = 'inline-block';
            activePlayerMarker = options.activeMarker;
            if(playerMarker !== activePlayerMarker) {
                document.getElementById('overlay_turn').style.display = 'block';
            }
        });

        this.socket.on('game:result', function(looser, winner) {
            var result = playerMarker === looser ? 'You loose...' : 'You Won...';
            document.getElementById('popup').style.display = 'block';
            document.getElementById('popupContent').innerHTML = result;
        });

        this.socket.on('restarted:game', function(updatedData) {
            self.setState({ data: updatedData });
            document.getElementById('popup').style.display = 'none';
            document.getElementById('popupContent').innerHTML = '';
        });

        this.socket.on('game:tie', function() {
            var result = 'Game Tie... ';
            document.getElementById('popup').style.display = 'block';
            document.getElementById('popupContent').innerHTML = result;
        });
    },

    render: function() {
        return (this.state.data
            ? <TicTacToe
                size={this.state.size}
                turn={2}
                data={this.state.data}
                onTurnPlayed={this._onTurnPlayed}
                onQuitGame={this._onQuitGame}
                onRestartGame={this._onRestartGame} />
            : null);
    },

    _onTurnPlayed: function(turn, rowNum, colNum) {
        this.socket.emit('play:turn', this.state.marker, rowNum, colNum);
    },

    _onQuitGame: function() {
        if(confirm('Are you sure want to quit the game? You can loose the game !!!')) {
            this.socket.emit('quit:game', this.state.marker);
        }
    },

    _onRestartGame: function() {
        this.socket.emit('restart:game');
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('content')
);
