// Cell
var Cell = React.createClass({
    render: function() {
        return (
            <td onClick={this._onClick}>
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
        onTurnPlayed: React.PropTypes.func
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
                <h1>Tic Tac Toe...</h1>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
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

        this.socket.on('started:game', function(options) {
            self.setState({
                data: options.data,
                size: options.size,
                marker: options.marker
            });
        });

        this.socket.on('start:game:limit:exceeded', function() {
            alert('No slot available to paly! Please check after some time :D');
        });

        this.socket.on('played:turn', function(updatedData) {
            self.setState({ data: updatedData });
        });

        this.socket.emit('start:game');
    },

    render: function() {
        return (this.state.data
            ? <TicTacToe
                size={this.state.size}
                turn={2}
                data={this.state.data}
                onTurnPlayed={this._onTurnPlayed} />
            : null);
    },

    _onTurnPlayed: function(turn, rowNum, colNum) {
        this.socket.emit('play:turn', this.state.marker, rowNum, colNum);
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('content')
);
