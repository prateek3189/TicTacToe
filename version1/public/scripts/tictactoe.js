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
        return {
            data:  [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ]
        }
    },

    componentDidMount: function() {
        // Listen to socket io to retrive initial data
    },

    render: function() {
        return (
            <TicTacToe
                size={3}
                turn={2}
                data={this.state.data}
                onTurnPlayed={this._onTurnPlayed} />
        );
    },

    _onTurnPlayed: function(turn, rowNum, colNum) {
        var dataClone;
        if (!this.state.data[rowNum][colNum]) {
            dataClone = this.state.data.slice(0);
            dataClone[rowNum][colNum] = turn;
            this.setState({ data: dataClone });
        }
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('content')
);
