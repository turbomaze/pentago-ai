/******************\
|    Pentago AI    |
| @author Anthony  |
| @version 0.1     |
| @date 2016/06/05 |
| @edit 2016/06/05 |
\******************/

var PentagoAI = (function() {
    'use strict';

    /**********
     * config */

    /****************
     * working vars */
    var state;
    var turnState;
    var currPlayer;

    /******************
     * work functions */
    function initPentagoAI() {
      state = [];

      // generate ui grid
      for (var xi = 0; xi < 6; xi++) {
        var div = document.createElement('div');
        div.className = 'col';
        state.push([]);
        for (var yi = 0; yi < 6; yi++) {
          var sq = document.createElement('div');
          sq.className= 'color-square blank';
          sq.id = 'sq'+xi+'-'+yi;
          sq.addEventListener('click', function(e) {
            placeMarble.apply(
              this,
              this.id.substring(2).split('-').map(function(a) {
                return parseInt(a);
              }
            ));
          });

          div.appendChild(sq);
          state[state.length-1].push(-1);
        }
        $s('#container').appendChild(div);
      }

      // init working vars
      currPlayer = 0;
      turnState = 0;

      // add event listeners for the rotations
      for (var cw = 0; cw < 2; cw++) {
        for (var yi = 0; yi < 2; yi++) {
          for (var xi = 0; xi < 2; xi++) {
            $s('#r'+xi+'-'+yi+(cw === 0 ? 'ccw' : 'cw')).addEventListener(
              'click',
              (function(x, y, c) {
                return function(e) {
                  rotateBoard(x, y, c);
                };
              })(xi, yi, cw)
            );
          }
        }
      }
    }

    function handleEndBehavior() {
      if (isTerminalState()) {
        alert('Game over!');

        state = [];
        for (var yi = 0; yi < 6; yi++) {
          state.push([]);
          for (var xi = 0; xi < 6; xi++) {
            state[state.length-1].push(-1);
          }
        }

        turnState = 0;
        currPlayer = 0;

        renderState();
      }
    }

    function rotateBoard(x, y, c) {
      if (turnState === 0) {
        alert('First you must place a marble.');
      } else {
        // rotate now
        rotateState(x, y, c);

        // update turn state
        currPlayer = 1 - currPlayer;
        turnState = 0;
        $s('#turn').innerHTML = currPlayer === 0 ? 'Red' : 'Blue';
        $s('#what').innerHTML = 'place';

        handleEndBehavior();
      }
    }

    function rotateState(x, y, c) {
      if (c === 1) {
        rotateState(x, y, 0);
        rotateState(x, y, 0);
        rotateState(x, y, 0);
      } else {
        // rotate counterclockwise 90 degrees
        var newState = state.map(function(row) {
          return row.slice(0);
        });
        var bx = 3*x+1, by = 3*y+1;
        for (var yi = -1; yi < 2; yi++) {
          for (var xi = -1; xi < 2; xi++) {
            newState[by+yi][bx+xi] = state[by+xi][bx-yi];
          }
        }

        state = newState;
      }

      renderState();
    }

    function getWinningLine() {
      function rotateGrid(g) {
        var G = g.map(function(row) { return row.slice(0); });
        var bx = 2.5, by = 2.5;
        for (var yi = -2.5; yi < 3; yi++) {
          for (var xi = -2.5; xi < 3; xi++) {
            G[by+yi][bx+xi] = g[by+xi][bx-yi];
          }
        }
        return G;
      }

      function checkLine(g, line) {
        var start = g[line[0][1]][line[0][0]];
        for (var li = 1; li < line.length; li++) {
          var val = g[line[li][1]][line[li][0]];
          if (val !== start) return -1;
        }
        return start;
      }

      var s = state.map(function(row) { return row.slice(0); });
      var lines = [
        // left horizontals
        [[0,0], [1,0], [2,0], [3,0], [4,0]],
        [[0,1], [1,1], [2,1], [3,1], [4,1]],
        [[0,2], [1,2], [2,2], [3,2], [4,2]],

        // right horizontals1]
        [[1,0], [2,0], [3,0], [4,0], [5,0]],
        [[1,1], [2,1], [3,1], [4,1], [5,1]],
        [[1,2], [2,2], [3,2], [4,2], [5,2]],

        // long diagonal
        [[0,0], [1,1], [2,2], [3,3], [4,4]],

        // short diagonal
        [[1,0], [2,1], [3,2], [4,3], [5,4]]
      ];
      for (var ai = 0; ai < 4; ai++) {
        // check all the lines
        for (var li = 0; li < lines.length; li++) {
          var winner = checkLine(s, lines[li]);
          if (winner !== -1) return winner;
        }

        // rotate the grid to check isomorphic lines
        s = rotateGrid(s);
      }

      return -1;
    }

    function isTerminalState() {
      var winner = getWinningLine();
      if (winner !== -1) {
        return true;
      } else {
        // if all of the cells are filled, it's true, else false
        for (var yi = 0; yi < 6; yi++) {
          for (var xi = 0; xi < 6; xi++) {
            if (state[yi][xi] === -1) {
              return false; 
            }
          }
        }
        return true;
      }
    }

    function renderState() {
      for (var yi = 0; yi < 6; yi++) {
        for (var xi = 0; xi < 6; xi++) {
          var cn = 'color-square blank';
          if (state[yi][xi] === 0) cn += ' red';
          else if (state[yi][xi] === 1) cn += ' blue';
          $s('#sq'+xi+'-'+yi).className = cn;
        }
      }
    }

    function placeMarble(x, y) {
      if (state[y][x] < 0) {
        if (turnState === 1 ) {
          alert ('You already placed a marble this turn. Now you rotate.');
        } else {
          state[y][x] = currPlayer;
          var cn = 'color-square ' + (state[y][x] === 0 ? 'red' : 'blue');
          $s('#sq'+x+'-'+y).className = cn;
          turnState += 1;
          $s('#what').innerHTML = 'rotate';

          handleEndBehavior();
        }
      } else {
        alert('This cell has a marble in it!');
      }
    }

    /********************
     * helper functions */
    function $s(id) { //for convenience
      if (id.charAt(0) !== '#') return false;
      return document.getElementById(id.substring(1));
    }

    return {
      init: initPentagoAI
    };
})();

window.addEventListener('load', PentagoAI.init);
