# draughtsboard - JavaScript Draughts Board

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/shubhendusaurabh/draughtsboardJS)
[![License](https://img.shields.io/badge/license-MPL--2.0-green.svg)](https://github.com/shubhendusaurabh/draughtsboardJS/blob/master/LICENSE)

A standalone JavaScript library for creating interactive draughts/checkers boards. Inspired by [ChessboardJS](https://github.com/oakmac/chessboardjs/), it provides a "just a board" approach with a powerful API for building draughts applications.

## Features

✨ **Interactive Board**: Drag and drop pieces with smooth animations  
🎯 **Position Management**: Full FEN notation support with enhanced parsing  
🎨 **Customizable**: Multiple piece themes and visual options  
📱 **Responsive**: Automatic resizing and mobile-friendly  
⚡ **Performance**: Optimized animations with throttling and queueing  
🛡️ **Type Safe**: Comprehensive TypeScript/JSDoc support  
🧪 **Well Tested**: 300+ test cases covering edge cases and performance  

## What is draughtsboard?

draughtsboard is a standalone JavaScript Draughts Board designed to be "just a board" and expose a powerful API for building draughts applications. Here's what you can do with draughtsboard:

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

## Installation

### Prerequisites
- jQuery (3.x recommended)

### Browser Installation
Include the draughtsboard files in your HTML:

```html
<!-- Required: jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- draughtsboard CSS and JS -->
<link rel="stylesheet" href="path/to/draughtsboard.css" />
<script src="path/to/draughtsboard.js"></script>
```

### Module Usage
draughtsboard supports CommonJS and AMD module patterns:

```javascript
// CommonJS
const DraughtsBoard = require('draughtsboard');

// AMD
define(['draughtsboard'], function(DraughtsBoard) {
    // Your code here
});
```

## Quick Start

### Basic Setup

Create a simple board:

```html
<div id="board" style="width: 500px"></div>
```

```javascript
// Create a board with starting position
const board = DraughtsBoard('board', {
    position: 'start',
    draggable: true,
    pieceTheme: 'unicode'
});
```

### Advanced Example with Game Logic

```javascript
// Event handlers for interactive gameplay
function onDragStart(source, piece, position, orientation) {
    // Don't allow picking up opponent's pieces
    if (game.gameOver()) return false;
    
    // Only allow dragging current player's pieces
    return piece.search(/^w/) !== -1 && game.turn() === 'w';
}

function onDrop(source, target) {
    // Validate move using game logic (e.g., draughts.js)
    const move = game.move({
        from: source,
        to: target
    });
    
    // Illegal move - return piece to source
    if (move === null) return 'snapback';
    
    // Move was legal - update board position
    updateStatus();
}

function onSnapEnd() {
    // Update board position after animations complete
    board.position(game.fen());
}

function onMouseoverSquare(square, piece) {
    // Show possible moves for hovered piece
    const moves = game.getLegalMoves(square);
    highlightSquares(square, moves);
}

function onMouseoutSquare(square, piece) {
    // Clear highlights
    removeHighlights();
}

// Board configuration
const config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'unicode',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    moveSpeed: 'slow',
    snapbackSpeed: 'fast'
};

const board = DraughtsBoard('board', config);
```

## API Reference

### Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `draggable` | `boolean` | `false` | Enable piece dragging |
| `dropOffBoard` | `'snapback'` \| `'trash'` | `'snapback'` | Behavior when pieces are dropped off board |
| `position` | `string` \| `object` | `'start'` | Initial position (FEN string, position object, or 'start') |
| `orientation` | `'white'` \| `'black'` | `'white'` | Board orientation |
| `showNotation` | `boolean` | `true` | Show square notation |
| `showErrors` | `boolean` | `false` | Show error messages |
| `sparePieces` | `boolean` | `false` | Show spare pieces area |
| `pieceTheme` | `string` \| `function` | `'unicode'` | Piece theme or custom piece function |

#### Animation Speeds
All animation properties accept: `number` (milliseconds), `'slow'` (600ms), or `'fast'` (200ms)

| Property | Default | Description |
|----------|---------|-------------|
| `appearSpeed` | `200` | Animation speed for piece appearance |
| `moveSpeed` | `200` | Animation speed for moves |
| `snapSpeed` | `50` | Animation speed for snapping to squares |
| `snapbackSpeed` | `200` | Animation speed for snapback |
| `trashSpeed` | `100` | Animation speed for removing pieces |

#### Event Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onDrop` | `(source, target, position, orientation) => string \| void` | Fired when piece is dropped. Return `'snapback'` to cancel move |
| `onDragStart` | `(source, piece, position, orientation) => boolean` | Fired when drag starts. Return `false` to prevent drag |
| `onDragMove` | `(newLocation, oldLocation, source, piece, position, orientation) => void` | Fired during piece drag |
| `onChange` | `(oldPos, newPos) => void` | Fired when board position changes |
| `onSnapEnd` | `(position, orientation) => void` | Fired when snap animation completes |
| `onMoveEnd` | `(oldPos, newPos) => void` | Fired when move animation completes |
| `onSnapbackEnd` | `(piece, square, position, orientation) => void` | Fired when snapback animation completes |
| `onInitComplete` | `() => void` | Fired when board initialization completes |
| `onMouseoverSquare` | `(square, piece) => void` | Fired when mouse enters a square |
| `onMouseoutSquare` | `(square, piece) => void` | Fired when mouse leaves a square |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `clear(useAnimation?)` | `useAnimation?: boolean` | `object` | Remove all pieces from board |
| `destroy()` | - | `object` | Remove board from DOM and clean up |
| `fen()` | - | `string` | Get current position as FEN string |
| `flip()` | - | `object` | Flip board orientation |
| `move(...moves)` | `moves: string[]` | `object` | Execute one or more moves (e.g., '23-19', '27x31') |
| `orientation()` | - | `'white' \| 'black'` | Get current board orientation |
| `orientation(newOrientation)` | `'white' \| 'black' \| 'flip'` | `object` | Set board orientation |
| `position()` | - | `object` | Get current position as position object |
| `position(newPosition, animate?)` | `newPosition: string \| object`, `animate?: boolean` | `object` | Set new position |
| `resize()` | - | `object` | Recalculate and redraw board dimensions |
| `start(animate?)` | `animate?: boolean` | `object` | Set board to starting position |

#### Position Formats

**FEN String Examples:**
```javascript
// Standard start position
'W:W31-50:B1-20'

// Mixed notation with kings
'W:WK41,31-39:BK10,1-9'

// Complex position
'W:WK32,K37,31-35:BK14,K18,11-15'
```

**Position Object Format:**
```javascript
{
    '1': 'b',   // Black man on square 1
    '2': 'B',   // Black king on square 2  
    '31': 'w',  // White man on square 31
    '32': 'W'   // White king on square 32
}
```

## TypeScript Support

draughtsboard includes comprehensive TypeScript definitions via JSDoc comments:

```typescript
interface DraughtsBoardConfig {
    draggable?: boolean;
    position?: string | Position;
    orientation?: 'white' | 'black';
    pieceTheme?: string | PieceThemeFunction;
    onDrop?: (source: string, target: string, position: Position, orientation: Orientation) => string | void;
    // ... other options
}

type PieceCode = 'w' | 'b' | 'W' | 'B';
type Position = { [square: string]: PieceCode | null };
```

## Testing

Run the comprehensive test suite:

```bash
npm run test        # Opens test.html in browser
npm run test:server # Start HTTP server for testing
```

The test suite includes:
- 300+ test cases covering core functionality
- Edge cases and error handling
- Performance and stress tests
- Animation and interaction tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## Sites Using draughtsboard

- [Checkers Online](https://www.shubhu.in/checkers-online/) - Interactive draughts game
- Your site here? [Open an issue](https://github.com/shubhendusaurabh/draughtsboardJS/issues) to be added!

## Related Projects

- [draughts.js](https://github.com/shubhendusaurabh/draughts.js) - Draughts game logic library
- [ChessboardJS](https://github.com/oakmac/chessboardjs/) - Chess board inspiration

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.

## License

draughtsboard is released under the [MPL-2.0 License](https://github.com/shubhendusaurabh/draughtsboardjs/blob/master/LICENSE).

---

**Made with ❤️ by [shubhu](https://github.com/shubhendusaurabh)**
