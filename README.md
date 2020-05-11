draughtsboard - JavaScript Draughts Board
==================================================

This library has been inspired from [ChessboardJS](https://github.com/oakmac/chessboardjs/). It uses similar methods & configuration options. You can also read up [chessboardjs documentation](https://chessboardjs.com/docs) for more usage example.


What is draughtsboard?
--------------------------------------

draughtsboard is a standalone JavaScript Draughts Board. It is designed to be "just a board" and expose a powerful API so that it can be used in different ways. Here's a non-exhaustive list of things you can do with draughtsboard:

- Use draughtsboard to show game positions alongside your expert commentary.
- Use draughtsboard to have a tactics website where users have to guess the best move.
- Integrate draughtsboard and [draughts.js](https://github.com/shubhendusaurabh/draughts.js) with a PDN database and allow people to search and playback games.
- Build a draughts server and have users play their games out using the draughtsboard board.

draughtsboard is flexible enough to handle any of these situations with relative ease.

What is draughtsboard not?
--------------------------------------

Here is a list of things that draughtsboard is **not**:

- A draughts engine
- A legal move validator
- A PDN parser

draughtsboard is designed to work well with any of those things, but the idea behind draughtsboard is that the logic that controls the board should be independent of those other problems.

See [draughts.js](https://github.com/shubhendusaurabh/draughts.js) library for parsing & validation.

Installation
--------------------------------------
Include `draughtsboard.js` & `draughtsboard.css` files in your html.
Required: jQuery
```
<script src="/js/draughtsboard.js"></script>
<link href="/css/draughtsboard.css" rel="stylesheet" />
```

Docs and Examples
--------------------------------------

## Example Usage

```html
<div id="board" style="width: 500px"></div>
```
```js
function onSnapEnd() {
    board.position(game.fen())
}
function onMouseoutSquare(square, piece) {
    // code
}
function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.getLegalMoves(square)
    // rest of the coe
}
function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
    })
    // illegal move
    if (move === null) return 'snapback'
}
function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.gameOver()) return false
}
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    pieceTheme: 'unicode'
}
board = DraughtsBoard('board', config)
```

### Config

Property | Type | Required | Default | Description
--- | --- | --- | --- | ---
draggable | Boolean | no | false | if true, pieces on the board are draggable to other squares.
dropOffBoard | 'snapback' or 'trash' | no | 'snapback' | If 'snapback', pieces dropped off the board will return to their original square. If 'trash', pieces dropped off the board will be removed from the board. This property has no effect when draggable is false.
position | 'start' or FEN string | no | n/a | If provided, sets the initial position of the board.
onChange | Function | no | n/a | Fires when the board position changes. The first argument to the function is the old position, the second argument is the new position.
onDragStart | Function | no | n/a | Fires when a piece is picked up.
onDragMove | Function | no | n/a | Fires when a dragged piece changes location.
onDrop | Function | no | n/a | Fires when a piece is dropped.
onMouseoutSquare | Function | no | n/a | Fires when the mouse leaves a square.
onMouseoverSquare | Function | no | n/a | Fires when the mouse enters a square.
onMoveEnd | Function | no | n/a | Fires at the end of animations when the board position changes.
onSnapbackEnd | Function | no | n/a | Fires when the "snapback" animation is complete when pieces are dropped off the board.
onSnapEnd | Function | no | n/a | Fires when the piece "snap" animation is complete.
orientation | 'white' or 'black' | no | 'white' | If provided, sets the initial orientation of the board.
showNotation | Boolean | no | true | Turn board notation on or off.
sparePieces | Boolean | no | false | If true, the board will have spare pieces that can be dropped onto the board.
showErrors | false or String or Function | no | n/a | showErrors is an optional parameter to control how ChessBoard reports errors.
pieceTheme | String or Function | no | 'unicode' | A template string (img/draughtspieces/{piece}.png e.g. img/draughtspieces/w.png) used to determine the source of piece images.
appearSpeed | Number or 'slow' or 'fast' | no | 200 | Animation speed for when pieces appear on a square.
moveSpeed | Number or 'slow' or 'fast' | no | 200 | Animation speed for when pieces move between squares or from spare pieces to the board.
snapbackSpeed | Number or 'slow' or 'fast' | no | 50 | Animation speed for when pieces that were dropped outside the board return to their original square.
snapSpeed | Number or 'slow' or 'fast' | no | 25 | Animation speed for when pieces "snap" to a square when dropped.
trashSpeed | Number or 'slow' or 'fast' | no | 100 | Animation speed for when pieces are removed.

### Methods

Method | Args | Description
--- | --- | ---
clear(useAnimation) | useAnimation - false | Removes all the pieces on the board. If useAnimation is false, removes pieces instantly.
destroy() | none | Remove the widget from the DOM.
fen() | none | Returns the current position as a FEN string.
flip() | none | Flips the board orientation.
move(move1, move2, etc) | moveN - '35-31', '19-23' | Executes one or more moves on the board. Returns an updated Position Object of the board including the move(s).
position(fen) | fen - 'fen' (optional) | fen - 'fen' (optional)
position(newPosition, useAnimation) | newPosition - Position Object, FEN string, or 'start' | Animates to a new position.
orientation() | none | Returns the current orientation of the board.
orientation(side) | side - 'white', 'black', or 'flip' | If 'white' or 'black', sets the orientation of the board accordingly. If 'flip', flips the orientation.
resize() | none | Recalculates board and square sizes based on the parent element and redraws the board accordingly.
start(useAnimation) | useAnimation - false (optional) | Sets the board to the start position.

Sites using draughtsboard
--------------------------------------

- [draughtsboard in action](https://www.shubhu.in/checkers-online/)

License
--------------------------------------

draughtsboard is released under the [MPL License](https://github.com/shubhendusaurabh/draughtsboardjs/blob/master/LICENSE).
