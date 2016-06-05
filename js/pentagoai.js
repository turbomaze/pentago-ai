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

    /***********
     * objects */

    /******************
     * work functions */
    function initPentagoAI() {
      // generate grid
      for (var xi = 0; xi < 6; xi++) {
        var div = document.createElement('div');
        div.className = 'col';
        for (var yi = 0; yi < 6; yi++) {
          var sq = document.createElement('div');
          sq.className= 'color-square blank';
          div.appendChild(sq);
        }
        $s('#container').appendChild(div);
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
