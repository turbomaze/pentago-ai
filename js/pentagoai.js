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
        console.log('b', bx, by);
        for (var yi = -1; yi < 2; yi++) {
          for (var xi = -1; xi < 2; xi++) {
            newState[by+yi][bx+xi] = state[by+xi][bx-yi];
          }
        }

        state = newState;
      }

      renderState();
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
