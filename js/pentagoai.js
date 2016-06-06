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
    // 1 is auto random
    // 2 is random opponent
    // 3 is auto smart
    // 4 is smart opponent
		var AUTOPLAY_MODE = 4; // 0 is manual
    var SMART_P1 = 5; // how many games to simulate for p1
    var SMART_P2 = 5; // " ", only for mode 3

		var PLAY_RATE = 80; // ms per turn in auto play
    var PLACE_DELAY = 500; // ms per placement 
    var ROTATE_DELAY = 500; // ms per rotation

    /****************
     * working vars */
    var state;
    var turnState;
    var currPlayer;
    var wins;

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
      wins = [0, 0, 0];

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

  		// play automatically 
		  if (AUTOPLAY_MODE === 1) {
        delayedCallbackLoop(makeRandomMove, PLAY_RATE);
      } else if (AUTOPLAY_MODE === 3) {
        delayedCallbackLoop(makeSmartMove, PLAY_RATE, [SMART_P1]);
      }
    }

    // chooses a random placement and rotation
		function getRandomMove(s) {
			var x = Math.floor(6*Math.random());
			var y = Math.floor(6*Math.random());
			while (s[y][x] !== -1) {
  			x = Math.floor(6*Math.random());
				y = Math.floor(6*Math.random());
			}

			var p = Math.floor(2*Math.random());
			var q = Math.floor(2*Math.random());
			var c = Math.floor(2*Math.random());
      return [x, y, p, q, c];
    }

    // and executes them as a player
		function makeRandomMove() {
      var move = getRandomMove(state);

			placeMarble(move[0], move[1]);
			setTimeout(function() {
        rotateBoard(move[2], move[3], move[4]);
      }, AUTOPLAY_MODE === 1 || AUTOPLAY_MODE === 3 ? 0 : ROTATE_DELAY);
		}

    // given state s and move <x, y, p, q, c>, gives the resulting game state
    function getNextState(s, player, x, y, p, q, c) {
      var newState = s.map(function(row) { return row.slice(0); });
      newState[y][x] = player; // place piece
      newState = rotateState(newState, p, q, c);
      return newState;
    }

    // given a state s and player p, returns all valid next
    function getValidMoves() {
      var moves = [];

      // get all open spots
      var openSpots = [];
      for (var yi = 0; yi < 6; yi++) {
        for (var xi = 0; xi < 6; xi++) {
          if (state[yi][xi] === -1) {
            openSpots.push([xi, yi])
          }
        }
      }

      // add eight moves (the eight rotations) for each of them
      for (var mi = 0; mi < openSpots.length; mi++) {
        for (var yi = 0; yi < 2; yi++) {
          for (var xi = 0; xi < 2; xi++) {
            for (var ci = 0; ci < 2; ci++) {
              moves.push(openSpots[mi].concat([xi, yi, ci]));
            }
          }
        }
      }

      return moves;
    }

    // given a state and next player, simulates a random match
    function simulateGameToEnd(s, p) {
      var nextState = s.map(function(row) { return row.slice(0); });

      while (!isTerminalState(nextState)) {
        var move = getRandomMove(nextState);
        nextState = getNextState.apply(this, [nextState, p].concat(move));
        p = 1-p;
      }

      return getWinningLine(nextState);
    }

    // given a state s and move m, returns the expected end game score
    function getProbabilisticScore(t, s, p, m) {
      var cumScore = 0;
      var nextState = getNextState.apply(this, [s, p].concat(m));
      for (var ti = 0; ti < t; ti++) {
        cumScore += simulateGameToEnd(nextState, 1-p); 
      }
      return cumScore/t;
    }

    // chooses a smart placement and rotation
    function getSmartMove(smartParam) {
      // get all the moves
      var moves = getValidMoves();

      // get the move with the best score
      var bestMove = [false, -Infinity];
      moves.forEach(function(move) {
        var score = getProbabilisticScore(smartParam, state, currPlayer, move);
        if (score > bestMove[1]) {
          bestMove = [move, score];
        }
      });

      return bestMove[0];
    }
    
    // and executes them as a player
    function makeSmartMove(smartParam) {
      var move = getSmartMove(smartParam);
      
      // execute that move
			placeMarble(move[0], move[1]);
			setTimeout(function() {
        rotateBoard(move[2], move[3], move[4]);
      }, AUTOPLAY_MODE === 1 || AUTOPLAY_MODE === 3 ? 0 : ROTATE_DELAY);
    }

    // detects whether or not the game is over and notifies the user
    function handleEndBehavior() {
      if (isTerminalState(state)) {
        // update winner count
        var winner = getWinningLine(state);
        if (winner !== -1) {
          wins[winner] += 1;
        } else wins[2] += 1;

        // render winner count
        $s('#red-wins').innerHTML = wins[0];
        $s('#blue-wins').innerHTML = wins[1];
        $s('#ties').innerHTML = wins[2];

        // alert the user
        if (AUTOPLAY_MODE === 0) alert('Game over!');
				else alertUser('Game over!');

        // reset the state
        state = [];
        for (var yi = 0; yi < 6; yi++) {
          state.push([]);
          for (var xi = 0; xi < 6; xi++) {
            state[state.length-1].push(-1);
          }
        }

        turnState = 0;
        currPlayer = 0;

        // render the end state
        setTimeout(function() {
          renderState(state, currPlayer, turnState);
        }, PLAY_RATE/2);
      }
    }

    // given a quadrant and direction, executes that rotation as a player
    function rotateBoard(x, y, c) {
      if (turnState === 0) {
        alertUser('First you must place a marble.');
      } else {
        // rotate now
        state = rotateState(state, x, y, c);
        renderState(state, currPlayer, turnState);

        // update turn state
        currPlayer = 1 - currPlayer;
        turnState = 0;
        $s('#turn').innerHTML = currPlayer === 0 ? 'Red' : 'Blue';
        $s('#what').innerHTML = 'place';

        handleEndBehavior();

        // only autoplay when it's the opponent's turn
        if (currPlayer === 0) return;

        // auto opponent
        if (AUTOPLAY_MODE === 2 || AUTOPLAY_MODE === 4) {
          setTimeout(function() {
            if (AUTOPLAY_MODE === 2) {
              makeRandomMove();
            } else if (AUTOPLAY_MODE === 4) {
              makeSmartMove(SMART_P1);
            }
          }, PLACE_DELAY);
          handleEndBehavior();
        }
      }
    }

    // given a quadrant and a direction, rotates the game state
    function rotateState(s, x, y, c) {
      if (c === 1) {
        var newState = rotateState(s, x, y, 0);
        newState = rotateState(newState, x, y, 0);
        return rotateState(newState, x, y, 0);
      } else {
        // rotate counterclockwise 90 degrees
        var newState = s.map(function(row) {
          return row.slice(0);
        });
        var bx = 3*x+1, by = 3*y+1;
        for (var yi = -1; yi < 2; yi++) {
          for (var xi = -1; xi < 2; xi++) {
            newState[by+yi][bx+xi] = s[by+xi][bx-yi];
          }
        }
        return newState;
      }
    }

    // looks at the game state and determines whether or not there's a 5-line
    function getWinningLine(s) {
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

      var S = s.map(function(row) { return row.slice(0); });
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
          var winner = checkLine(S, lines[li]);
          if (winner !== -1) return winner;
        }

        // rotate the grid to check isomorphic lines
        S = rotateGrid(S);
      }

      return -1;
    }

    // returns true iff there's a 5-line or the cells are all filled
    function isTerminalState(s) {
      var winner = getWinningLine(s);
      if (winner !== -1) {
        return true;
      } else {
        // if all of the cells are filled, it's true, else false
        for (var yi = 0; yi < 6; yi++) {
          for (var xi = 0; xi < 6; xi++) {
            if (s[yi][xi] === -1) {
              return false; 
            }
          }
        }
        return true;
      }
    }

    // renders the game state to the UI
    function renderState(s, p, r) {
      $s('#turn').innerHTML = p === 0 ? 'Red' : 'Blue';
      $s('#what').innerHTML = r === 0 ? 'place' : 'rotate';

      for (var yi = 0; yi < 6; yi++) {
        for (var xi = 0; xi < 6; xi++) {
          var cn = 'color-square blank';
          if (s[yi][xi] === 0) cn += ' red';
          else if (s[yi][xi] === 1) cn += ' blue';
          $s('#sq'+xi+'-'+yi).className = cn;
        }
      }
    }

    // given a location, executes that placement as a player
    function placeMarble(x, y) {
      if (state[y][x] < 0) {
        if (turnState === 1 ) {
          alertUser('You already placed a marble this turn. Now you rotate.');
        } else {
          state[y][x] = currPlayer;
          var cn = 'color-square ' + (state[y][x] === 0 ? 'red' : 'blue');
          $s('#sq'+x+'-'+y).className = cn;
          turnState += 1;
          $s('#what').innerHTML = 'rotate';

          // DO NOT check for this here; the turn must be completed first
          // handleEndBehavior();
        }
      } else {
        alertUser('This cell has a marble in it!');
      }
    }

    /********************
     * helper functions */
    function delayedCallbackLoop(f, delay, params) {
      delay = delay || 500;
      params = params || [];

      f.apply(this, params);
      setTimeout(function() {
        delayedCallbackLoop(f, delay, params);  
      }, delay);
    }

    function alertUser(msg) {
			$s('#action').className = 'action flash';
			setTimeout(function() {
				$s('#action').className = 'action';
			}, 2*300);
		}

    function $s(id) { //for convenience
      if (id.charAt(0) !== '#') return false;
      return document.getElementById(id.substring(1));
    }

    return {
      init: initPentagoAI
    };
})();

window.addEventListener('load', PentagoAI.init);
