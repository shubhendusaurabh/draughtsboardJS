# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **draughtsboard**, a standalone JavaScript library for creating interactive draughts/checkers boards. It's inspired by ChessboardJS and provides a "just a board" approach - it handles board display, piece movement, and animations but does not include game logic, move validation, or engine functionality.

## Key Architecture

### Core Components

- **draughtsboard.js** (1695 lines): Single-file library containing the complete DraughtsBoard implementation
  - Main constructor: `window.DraughtsBoard(containerElOrId, config)`
  - Exposed utilities: `DraughtsBoard.fenToObj()`, `DraughtsBoard.objToFen()`
  - Supports CommonJS (`exports`) and AMD (`define`) module patterns
- **draughtsboard.css**: Styling for board, squares, and piece themes

### Position System

- Uses FEN-like notation specific to draughts (not standard chess FEN)
- Squares numbered 1-50 (draughts convention)
- Position validation through `validFen()`, `validPositionObject()`, `validSquare()`
- Piece codes: `w/b` (men), `W/B` (kings)

### Configuration System

The library accepts extensive configuration options including:
- Board behavior: `draggable`, `dropOffBoard`, `orientation`
- Event handlers: `onDrop`, `onDragStart`, `onSnapEnd`, etc.
- Animations: `moveSpeed`, `snapSpeed`, `appearSpeed`
- Piece themes: `pieceTheme` (defaults to 'unicode')
- Visual options: `showNotation`, `sparePieces`

### Unicode Piece Rendering

Default piece theme uses Unicode symbols:
- `w`: '\u26C0', `b`: '\u26C2', `B`: '\u26C3', `W': '\u26C1'

## Dependencies

- **jQuery**: Required dependency for DOM manipulation and animations
- Minimum jQuery version enforced via `compareSemVer()` function

## Development Commands

No build system configured. Current package.json scripts:
- `npm test`: Not implemented (exits with error)

## Usage Pattern

The library is designed to work with external game logic libraries like [draughts.js](https://github.com/shubhendusaurabh/draughts.js) for move validation and game state management.

Typical integration involves:
1. Create board with event handlers
2. Use external library for move validation in `onDrop`
3. Update board position after valid moves via `board.position()`