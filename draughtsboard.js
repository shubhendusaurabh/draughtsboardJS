(function () {
  'use strict'

  /**
   * @typedef {'w'|'b'|'W'|'B'} PieceCode
   * @typedef {Object.<string, PieceCode|null>} Position
   * @typedef {'white'|'black'} Orientation
   * @typedef {'snapback'|'trash'} DropOffBoardAction
   * @typedef {'slow'|'fast'|number} AnimationSpeed
   * @typedef {function(string, string, Position, Orientation): string} DropFunction
   * @typedef {function(string, PieceCode, Position, Orientation): boolean} DragStartFunction
   * @typedef {function(string, PieceCode): void} DragMoveFunction
   * @typedef {function(Position, Position): void} ChangeFunction
   * @typedef {function(Position, Orientation): void} SnapEndFunction
   * @typedef {function(Position, Position): void} MoveEndFunction
   * @typedef {function(): void} InitCompleteFunction
   * @typedef {function(string, PieceCode, Position, Orientation): void} SnapbackEndFunction
   * 
   * @typedef {Object} DraughtsBoardConfig
   * @property {boolean} [draggable=false] - Allow pieces to be dragged
   * @property {DropOffBoardAction} [dropOffBoard='snapback'] - What happens when pieces are dropped off board
   * @property {Position|string} [position='start'] - Starting position (FEN string or position object)
   * @property {Orientation} [orientation='white'] - Board orientation
   * @property {boolean} [showNotation=true] - Show square notation
   * @property {boolean} [showErrors=false] - Show error messages
   * @property {boolean} [sparePieces=false] - Show spare pieces
   * @property {string} [pieceTheme='unicode'] - Piece theme
   * @property {AnimationSpeed} [appearSpeed=200] - Animation speed for piece appearance
   * @property {AnimationSpeed} [moveSpeed=200] - Animation speed for moves
   * @property {AnimationSpeed} [snapSpeed=50] - Animation speed for snapping
   * @property {AnimationSpeed} [snapbackSpeed=200] - Animation speed for snapback
   * @property {AnimationSpeed} [trashSpeed=100] - Animation speed for trashing
   * @property {DropFunction} [onDrop] - Callback when piece is dropped
   * @property {DragStartFunction} [onDragStart] - Callback when drag starts
   * @property {DragMoveFunction} [onDragMove] - Callback when piece is being dragged
   * @property {SnapEndFunction} [onSnapEnd] - Callback when snap animation ends
   * @property {MoveEndFunction} [onMoveEnd] - Callback when move animation ends
   * @property {ChangeFunction} [onChange] - Callback when position changes
   * @property {InitCompleteFunction} [onInitComplete] - Callback when initialization is complete
   * @property {SnapbackEndFunction} [onSnapbackEnd] - Callback when snapback animation ends
   */

  var SIZE
  var COLUMNS
  var UNICODES = {
    'w': '\u26C0',
    'b': '\u26C2',
    'B': '\u26C3',
    'W': '\u26C1',
    '0': '  '
  }
  var START_FEN
  /**
   * Validates if a move string is in the correct format
   * @param {string} move - Move in format "27x31" or "23-32"
   * @returns {boolean} True if move is valid format
   */
  function validMove (move) {
    // move should be a string
    if (typeof move !== 'string') return false

    // move should be in the form of "27x31", "23-32"
    var tmp = move.split(/-|x/)
    if (tmp.length !== 2) return false

    return (validSquare(tmp[0]) === true && validSquare(tmp[1]) === true)
  }

  /**
   * Validates if a square is valid (1-50 for draughts, with optional K prefix for kings)
   * @param {string|number} square - Square identifier
   * @returns {boolean} True if square is valid
   */
  function validSquare (square) {
    if (square && square.toString().substr(0, 1) === 'K') {
      square = square.toString().substr(1)
    }
    square = parseInt(square, 10)
    return (square >= 1 && square <= 50)
  }

  /**
   * Validates if a piece code is valid (w, b, W, B)
   * @param {string} code - Piece code to validate
   * @returns {boolean} True if piece code is valid
   */
  function validPieceCode (code) {
    if (typeof code !== 'string') return false
    return (code.search(/^[bwBW]$/) !== -1)
  }

  /**
   * Validates if a FEN string is in the correct draughts format
   * @param {string} fen - FEN string to validate
   * @returns {boolean} True if FEN is valid
   */
  // TODO: this whole function could probably be replaced with a single regex
  function validFen (fen) {
    if (typeof fen !== 'string') return false
    if (fen === START_FEN) return true
    // Updated pattern to support ranges (e.g., "31-50") and individual squares with optional K prefix
    var FENPattern = /^(W|B):(W|B)([K]?\d+(?:-\d+)?(?:,[K]?\d+(?:-\d+)?)*)(?::(W|B)([K]?\d+(?:-\d+)?(?:,[K]?\d+(?:-\d+)?)*))?$/
    var matches = FENPattern.exec(fen)
    if (matches != null) {
      return true
    }
    return false
  }

  /**
   * Validates if a position object has valid squares and piece codes
   * @param {Position} pos - Position object to validate
   * @returns {boolean} True if position is valid
   */
  function validPositionObject (pos) {
    if (typeof pos !== 'object') return false
    // pos = fenToObj(pos)
    for (var i in pos) {
      if (pos.hasOwnProperty(i) !== true) continue
      if (pos[i] == null) {
        continue
      }
      if (validSquare(i) !== true || validPieceCode(pos[i]) !== true) {
        // TODO console.trace('flsed in valid check', i,pos[i], validSquare(i), validPieceCode(pos[i]))
        return false
      }
    }
    return true
  }

  /**
   * Filters a position object to only include valid squares and pieces
   * @param {Position} pos - Position object to filter
   * @returns {Position} Filtered position object with only valid entries
   */
  function filterValidPosition (pos) {
    if (typeof pos !== 'object' || pos === null) return {}
    
    var filtered = {}
    for (var i in pos) {
      if (pos.hasOwnProperty(i) !== true) continue
      if (pos[i] == null) {
        continue
      }
      if (validSquare(i) === true && validPieceCode(pos[i]) === true) {
        filtered[i] = pos[i]
      }
    }
    return filtered
  }

  /**
   * Converts FEN string to position object
   * @param {string} fen - FEN string to convert
   * @returns {Position|false} Position object or false if invalid
   */
  function fenToObj (fen) {
    if (validFen(fen) !== true) {
      return false
    }

    // cut off any move, castling, etc info from the end
    // we're only interested in position information
    fen = fen.replace(/\s+/g, '')
    fen = fen.replace(/\..*$/, '')

    var rows = fen.split(':')
    var position = {}

    for (var i = 1; i <= 2; i++) {
      var color = rows[i].substr(0, 1)
      var row = rows[i].substr(1)
      
      // Split by comma first to handle mixed notation (K1,2-5)
      var parts = row.split(',')
      
      for (var p = 0; p < parts.length; p++) {
        var part = parts[p]
        
        if (part.indexOf('-') !== -1) {
          // Handle ranges (e.g., "2-5")
          var rangeParts = part.split('-')
          var start = parseInt(rangeParts[0], 10)
          var end = parseInt(rangeParts[1], 10)
          
          for (var j = start; j <= end; j++) {
            position[j.toString()] = color.toLowerCase()
          }
        } else if (part.substr(0, 1) === 'K') {
          // Handle kings (e.g., "K1")
          var square = part.substr(1)
          position[square] = color.toUpperCase()
        } else {
          // Handle individual squares (e.g., "1")
          position[part] = color.toLowerCase()
        }
      }
    }

    return position
  }

  // position object to FEN string
  // returns false if the obj is not a valid position object
  /**
   * Converts position object to FEN string
   * @param {Position} obj - Position object to convert
   * @returns {string|false} FEN string or false if invalid
   */
  function objToFen (obj) {
    if (validPositionObject(obj) !== true) {
      return false
    }
    var black = []
    var white = []
    
    for (var square in obj) {
      if (obj.hasOwnProperty(square) !== true) continue
      
      var piece = obj[square]
      var squareNum = parseInt(square, 10)
      
      switch (piece) {
        case 'w':
          white.push(squareNum)
          break
        case 'W':
          white.push('K' + squareNum)
          break
        case 'b':
          black.push(squareNum)
          break
        case 'B':
          black.push('K' + squareNum)
          break
        default:
          break
      }
    }
    
    // Sort the arrays to ensure consistent output
    white.sort(function(a, b) {
      var aNum = typeof a === 'string' ? parseInt(a.substr(1), 10) : a
      var bNum = typeof b === 'string' ? parseInt(b.substr(1), 10) : b
      return aNum - bNum
    })
    black.sort(function(a, b) {
      var aNum = typeof a === 'string' ? parseInt(a.substr(1), 10) : a
      var bNum = typeof b === 'string' ? parseInt(b.substr(1), 10) : b
      return aNum - bNum
    })
    
    return 'W:W' + white.join(',') + ':B' + black.join(',')
  }

  /**
   * Creates a new DraughtsBoard instance
   * @param {string|Element} containerElOrId - Container element or ID
   * @param {DraughtsBoardConfig} [cfg={}] - Configuration options
   * @param {string} [board='draughts'] - Board type ('draughts' or 'checkers')
   * @returns {Object} DraughtsBoard widget object with methods
   */
  window['DraughtsBoard'] = window['DraughtsBoard'] || function (containerElOrId, cfg, board) {
    cfg = cfg || {}
    board = board || 'draughts'
    // ------------------------------------------------------------------------------
    // Constants
    // ------------------------------------------------------------------------------

    var MINIMUM_JQUERY_VERSION = '1.7.0'
    if (board === 'checkers') {
      START_FEN = 'W:W21-32:B1-12'
      SIZE = 8
      COLUMNS = '01234567'.split('')
    } else {
      START_FEN = 'W:W31-50:B1-20'
      SIZE = 10
      COLUMNS = '0123456789'.split('')
    }
    var START_POSITION = fenToObj(START_FEN)

    // use unique class names to prevent clashing with anything else on the page
    // and simplify selectors
    // NOTE: these should never change
    var CSS = {
      alpha: 'alpha-d2270',
      black: 'black-3c85d',
      board: 'board-b72b1',
      draughtsboard: 'draughtsboard-63f37',
      clearfix: 'clearfix-7da63',
      highlight1: 'highlight1-32417',
      highlight2: 'highlight2-9c5d2',
      notation: 'notation-322f9',
      numeric: 'numeric-fc462',
      piece: 'piece-417db',
      row: 'row-5277c',
      sparePieces: 'spare-pieces-7492f',
      sparePiecesBottom: 'spare-pieces-bottom-ae20f',
      sparePiecesTop: 'spare-pieces-top-4028b',
      square: 'square-55d63',
      white: 'white-1e1d7'
    }

    // ------------------------------------------------------------------------------
    // Module Scope Variables
    // ------------------------------------------------------------------------------

    // DOM elements
    var containerEl,
      boardEl,
      draggedPieceEl,
      sparePiecesTopEl,
      sparePiecesBottomEl

    // constructor return object
    var widget = {}

    // ------------------------------------------------------------------------------
    // Stateful
    // ------------------------------------------------------------------------------

    var ANIMATION_HAPPENING = false
    var BOARD_BORDER_SIZE = 2
    var CURRENT_ORIENTATION = 'white'
    var CURRENT_POSITION = {}
    var SQUARE_SIZE
    var DRAGGED_PIECE
    var DRAGGED_PIECE_LOCATION
    var DRAGGED_PIECE_SOURCE
    var DRAGGING_A_PIECE = false
    var SPARE_PIECE_ELS_IDS = {}
    var SQUARE_ELS_IDS = {}
    var SQUARE_ELS_OFFSETS

    // ------------------------------------------------------------------------------
    // JS Util Functions
    // ------------------------------------------------------------------------------

    // http://tinyurl.com/3ttloxj
    function uuid () {
      return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
        var r = Math.random() * 16 | 0
        return r.toString(16)
      })
    }

    function deepCopy (thing) {
      return JSON.parse(JSON.stringify(thing))
    }

    function parseSemVer (version) {
      var tmp = version.split('.')
      return {
        major: parseInt(tmp[0], 10),
        minor: parseInt(tmp[1], 10),
        patch: parseInt(tmp[2], 10)
      }
    }

    // returns true if version is >= minimum
    function compareSemVer (version, minimum) {
      version = parseSemVer(version)
      minimum = parseSemVer(minimum)

      var versionNum = (version.major * 10000 * 10000) +
        (version.minor * 10000) + version.patch
      var minimumNum = (minimum.major * 10000 * 10000) +
        (minimum.minor * 10000) + minimum.patch

      return (versionNum >= minimumNum)
    }

    // ------------------------------------------------------------------------------
    // Validation / Errors
    // ------------------------------------------------------------------------------

    /**
     * Shows a non-blocking error notification
     * @param {string} errorText - Error message to display
     */
    function showErrorNotification (errorText) {
      // Try to create a visual notification element
      try {
        var notification = document.createElement('div')
        notification.style.cssText = [
          'position: fixed',
          'top: 20px',
          'right: 20px',
          'background: #f44336',
          'color: white',
          'padding: 16px',
          'border-radius: 4px',
          'box-shadow: 0 4px 12px rgba(0,0,0,0.3)',
          'font-family: monospace',
          'font-size: 14px',
          'max-width: 400px',
          'z-index: 10000',
          'line-height: 1.4'
        ].join(';')
        
        // Create close button
        var closeButton = document.createElement('span')
        closeButton.innerHTML = '×'
        closeButton.style.cssText = [
          'position: absolute',
          'top: 8px',
          'right: 12px',
          'cursor: pointer',
          'font-size: 18px',
          'font-weight: bold',
          'opacity: 0.7'
        ].join(';')
        closeButton.onclick = function() {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        }
        
        notification.innerHTML = errorText.replace(/\n/g, '<br>')
        notification.appendChild(closeButton)
        document.body.appendChild(notification)
        
        // Auto-remove after 5 seconds
        setTimeout(function() {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        }, 5000)
        
        // Also log to console
        console.error('DraughtsBoard:', errorText)
      } catch (e) {
        // Fallback to console if DOM manipulation fails
        console.error('DraughtsBoard:', errorText)
      }
    }

    /**
     * Handles error reporting based on configuration
     * @param {number} code - Error code
     * @param {string} msg - Error message
     * @param {*} [obj] - Optional object to log
     */
    function error (code, msg, obj) {
      // do nothing if showErrors is not set
      if (cfg.hasOwnProperty('showErrors') !== true ||
        cfg.showErrors === false) {
        return
      }

      var errorText = 'DraughtsBoard Error ' + code + ': ' + msg

      // print to console
      if (cfg.showErrors === 'console' &&
        typeof console === 'object' &&
        typeof console.log === 'function') {
        console.trace(errorText)
        if (arguments.length >= 2) {
          console.log(obj)
        }
        return
      }

      // show errors as non-blocking notifications
      if (cfg.showErrors === 'alert') {
        if (obj) {
          errorText += '\n\n' + JSON.stringify(obj)
        }
        showErrorNotification(errorText)
        return
      }

      // custom function
      if (typeof cfg.showErrors === 'function') {
        cfg.showErrors(code, msg, obj)
      }
    }

    /**
     * Safely calls an event handler function with error handling
     * @param {Function} handler - Event handler function to call
     * @param {...*} [args] - Arguments to pass to the handler
     * @returns {*} Handler return value, or undefined if error occurred
     */
    function callEventHandler (handler) {
      if (typeof handler !== 'function') {
        return undefined
      }
      
      try {
        var args = Array.prototype.slice.call(arguments, 1)
        return handler.apply(null, args)
      } catch (e) {
        // Log the error but don't let it crash the board
        error(8001, 'Event handler threw an error: ' + e.message, e)
        return undefined
      }
    }

    // check dependencies
    function checkDeps () {
      // check for null or undefined container
      if (containerElOrId === null || containerElOrId === undefined) {
        error(1005, 'The first argument to DraughtsBoard() cannot be null or undefined.')
        return false
      }

      // if containerId is a string, it must be the ID of a DOM node
      if (typeof containerElOrId === 'string') {
        // cannot be empty
        if (containerElOrId === '') {
          console.error('DraughtsBoard Error 1001: ' +
            'The first argument to DraughtsBoard() cannot be an empty string. ' +
            'Initialization failed.')
          return false
        }

        // make sure the container element exists in the DOM
        var el = document.getElementById(containerElOrId)
        if (!el) {
          console.error('DraughtsBoard Error 1002: Element with id "' +
            containerElOrId + '" does not exist in the DOM. ' +
            'Initialization failed.')
          return false
        }

        // set the containerEl
        containerEl = $(el)
      } else {
        // else it must be something that becomes a jQuery collection
        // with size 1
        // ie: a single DOM node or jQuery object
        containerEl = $(containerElOrId)

        if (containerEl.length !== 1) {
          console.error('DraughtsBoard Error 1003: The first argument to ' +
            'DraughtsBoard() must be an ID or a single DOM node. ' +
            'Initialization failed.')
          return false
        }
      }

      // JSON must exist
      if (!window.JSON ||
        typeof JSON.stringify !== 'function' ||
        typeof JSON.parse !== 'function') {
        console.error('DraughtsBoard Error 1004: JSON does not exist. ' +
          'Please include a JSON polyfill. Initialization failed.')
        return false
      }

      // check for a compatible version of jQuery
      if (!(typeof window.$ && $.fn && $.fn.jquery &&
        compareSemVer($.fn.jquery, MINIMUM_JQUERY_VERSION) === true)) {
        console.error('DraughtsBoard Error 1005: Unable to find a valid version ' +
          'of jQuery. Please include jQuery ' + MINIMUM_JQUERY_VERSION + ' or ' +
          'higher on the page. Initialization failed.')
        return false
      }

      return true
    }

    function validAnimationSpeed (speed) {
      if (speed === 'fast' || speed === 'slow') {
        return true
      }

      if ((parseInt(speed, 10) + '') !== (speed + '')) {
        return false
      }

      return (speed >= 0)
    }

    // validate config / set default options
    /**
     * Expands and validates configuration options with defaults
     * @returns {boolean} True if config is valid
     */
    function expandConfig () {
      // Ensure cfg is a proper object
      if (typeof cfg !== 'object' || cfg === null) {
        if (typeof cfg === 'string' || validPositionObject(cfg) === true) {
          cfg = {
            position: cfg
          }
        } else {
          cfg = {}
        }
      }

      // default for orientation is white
      if (cfg.orientation !== 'black' && cfg.orientation !== 'white') {
        cfg.orientation = 'white'
      }
      CURRENT_ORIENTATION = cfg.orientation

      // default for showNotation is true
      if (cfg.showNotation !== false) {
        cfg.showNotation = true
      }

      // default for draggable is false
      if (cfg.draggable !== true && cfg.draggable !== false) {
        cfg.draggable = false
      } else if (cfg.draggable !== true) {
        cfg.draggable = false
      }

      // default for dropOffBoard is 'snapback'
      if (cfg.dropOffBoard !== 'trash') {
        cfg.dropOffBoard = 'snapback'
      }

      // default for sparePieces is false
      if (cfg.sparePieces !== true) {
        cfg.sparePieces = false
      }

      // draggable must be true if sparePieces is enabled
      if (cfg.sparePieces === true) {
        cfg.draggable = true
      }

      // default piece theme is unicode
      if (cfg.hasOwnProperty('pieceTheme') !== true ||
        (typeof cfg.pieceTheme !== 'string' &&
        typeof cfg.pieceTheme !== 'function')) {
        cfg.pieceTheme = 'unicode'
      }

      // animation speeds
      if (cfg.hasOwnProperty('appearSpeed') !== true ||
        validAnimationSpeed(cfg.appearSpeed) !== true) {
        cfg.appearSpeed = 200
      }
      if (cfg.hasOwnProperty('moveSpeed') !== true ||
        validAnimationSpeed(cfg.moveSpeed) !== true) {
        cfg.moveSpeed = 200
      }
      if (cfg.hasOwnProperty('snapbackSpeed') !== true ||
        validAnimationSpeed(cfg.snapbackSpeed) !== true) {
        cfg.snapbackSpeed = 50
      }
      if (cfg.hasOwnProperty('snapSpeed') !== true ||
        validAnimationSpeed(cfg.snapSpeed) !== true) {
        cfg.snapSpeed = 25
      }
      if (cfg.hasOwnProperty('trashSpeed') !== true ||
        validAnimationSpeed(cfg.trashSpeed) !== true) {
        cfg.trashSpeed = 100
      }

      // make sure position is valid
      if (cfg.hasOwnProperty('position') === true) {
        if (cfg.position === 'start') {
          CURRENT_POSITION = deepCopy(START_POSITION)
        } else if (validFen(cfg.position) === true) {
          CURRENT_POSITION = fenToObj(cfg.position)
        } else if (validPositionObject(cfg.position) === true) {
          CURRENT_POSITION = deepCopy(cfg.position)
        } else {
          error(7263, 'Invalid value passed to config.position.', cfg.position)
        }
      }

      // validate event handler functions - reset invalid ones to undefined
      var eventHandlers = ['onDrop', 'onDragStart', 'onDragMove', 'onChange', 'onSnapEnd', 'onMoveEnd', 'onSnapbackEnd', 'onInitComplete']
      for (var i = 0; i < eventHandlers.length; i++) {
        var handler = eventHandlers[i]
        if (cfg.hasOwnProperty(handler) && typeof cfg[handler] !== 'function') {
          cfg[handler] = undefined
        }
      }

      return true
    }

    // ------------------------------------------------------------------------------
    // DOM Misc
    // ------------------------------------------------------------------------------

    // calculates square size based on the width of the container
    // got a little CSS black magic here, so let me explain:
    // get the width of the container element (could be anything), reduce by 1 for
    // fudge factor, and then keep reducing until we find an exact mod SIZE for
    // our square size
    function calculateSquareSize () {
      var containerWidth = parseInt(containerEl.width(), 10)

      // defensive, prevent infinite loop
      if (!containerWidth || containerWidth <= 0) {
        return 0
      }

      // pad one pixel
      var boardWidth = containerWidth - 1

      while (boardWidth % SIZE !== 0 && boardWidth > 0) {
        boardWidth--
      }

      return (boardWidth / SIZE)
    }

    // create random IDs for elements
    function createElIds () {
      // squares on the board
      for (var i = 0; i <= (SIZE - 1); i++) {
        for (var j = 1; j <= SIZE; j++) {
          var square = (i * SIZE) + j
          SQUARE_ELS_IDS[square] = square + '-' + uuid()
        }
      }

      // spare pieces
      var pieces = 'bBwW'.split('')
      for (i = 0; i < pieces.length; i++) {
        SPARE_PIECE_ELS_IDS[pieces[i]] = pieces[i] + '-' + uuid()
      }
    }

    // ------------------------------------------------------------------------------
    // Markup Building
    // ------------------------------------------------------------------------------

    function buildBoardContainer () {
      var html = '<div class="' + CSS.draughtsboard + '">'

      if (cfg.sparePieces === true) {
        html += '<div class="' + CSS.sparePieces + ' ' +
          CSS.sparePiecesTop + '"></div>'
      }

      html += '<div class="' + CSS.board + '"></div>'

      if (cfg.sparePieces === true) {
        html += '<div class="' + CSS.sparePieces + ' ' +
          CSS.sparePiecesBottom + '"></div>'
      }

      html += '</div>'

      return html
    }

    /*
    var buildSquare = function(color, size, id) {
      var html = '<div class="' + CSS.square + ' ' + CSS[color] + '" ' +
      'style="width: ' + size + 'px; height: ' + size + 'px" ' +
      'id="' + id + '">'

      if (cfg.showNotation === true) {

      }

      html += '</div>'

      return html
    }
    */

    function buildBoard (orientation) {
      if (orientation !== 'black') {
        orientation = 'white'
      }

      var html = ''

      // algebraic notation / orientation
      var alpha = deepCopy(COLUMNS)
      var row = SIZE
      if (orientation === 'black') {
        alpha.reverse()
        row = 1
      }

      var squareColor = 'white'
      for (var i = 0; i < SIZE; i++) {
        html += '<div class="' + CSS.row + '">'
        for (var j = 1; j <= SIZE; j++) {
          var square
          if (orientation === 'black') {
            square = (parseInt(alpha[i], 10) * SIZE) + ((SIZE + 1) - j)
          } else {
            square = (parseInt(alpha[i], 10) * SIZE) + j
          }
          square = Math.round(square / 2)
          if (squareColor === 'white') {
            html += '<div class="' + CSS.square + ' ' + CSS[squareColor] + ' ' +
              'square-empty' + '" ' +
              'style="width: ' + SQUARE_SIZE + 'px; height: ' + SQUARE_SIZE + 'px">'
          } else {
            html += '<div class="' + CSS.square + ' ' + CSS[squareColor] + ' ' +
              'square-' + square + '" ' +
              'style="width: ' + SQUARE_SIZE + 'px; height: ' + SQUARE_SIZE + 'px" ' +
              'id="' + SQUARE_ELS_IDS[square] + '" ' +
              'data-square="' + square + '">'

            if (cfg.showNotation === true) {
              html += '<div class="' + CSS.notation + ' ' + CSS.alpha + '">' +
                square + '</div>'
              if (j === 0) {
                html += '<div class="' + CSS.notation + ' ' + CSS.numeric + '">' +
                  row + '</div>'
              }
            }
          }
          html += '</div>' // end .square
          squareColor = (squareColor === 'white' ? 'black' : 'white')
        }
        html += '<div class="' + CSS.clearfix + '"></div></div>'

        squareColor = (squareColor === 'white' ? 'black' : 'white')

        if (orientation === 'white') {
          row--
        } else {
          row++
        }
      }

      return html
    }

    function buildPieceImgSrc (piece) {
      // For handling case insensetive windows :(
      if (piece === 'W' || piece === 'B') {
        piece = 'K' + piece
      }
      if (typeof cfg.pieceTheme === 'function') {
        return cfg.pieceTheme(piece)
      }

      if (typeof cfg.pieceTheme === 'string') {
        return cfg.pieceTheme.replace(/{piece}/g, piece)
      }

      // NOTE: this should never happen
      error(8272, 'Unable to build image source for cfg.pieceTheme.')
      return ''
    }

    function buildPiece (piece, hidden, id) {
      if (!piece) {
        return false
      }
      var html
      if (cfg.pieceTheme === 'unicode') {
        html = '<span '
        if (id && typeof id === 'string') {
          html += 'id="' + id + '" '
        }
        html += 'class="unicode ' + piece + ' ' + CSS.piece + '" '
        html += 'data-piece="' + piece + '" '
        html += 'style="font-size: ' + SQUARE_SIZE + 'px;'
        if (hidden === true) {
          html += 'display:none;'
        }
        html += '">' + UNICODES[piece] + '</span>'
        return html
      }
      html = '<img src="' + buildPieceImgSrc(piece) + '" '
      if (id && typeof id === 'string') {
        html += 'id="' + id + '" '
      }
      html += 'alt="" ' +
        'class="' + CSS.piece + '" ' +
        'data-piece="' + piece + '" ' +
        'style="width: ' + SQUARE_SIZE + 'px;' +
        'height: ' + SQUARE_SIZE + 'px;'
      if (hidden === true) {
        html += 'display:none;'
      }
      html += '" />'

      return html
    }

    function buildSparePieces (color) {
      var pieces = ['w', 'W']
      if (color === 'black') {
        pieces = ['b', 'B']
      }

      var html = ''
      for (var i = 0; i < pieces.length; i++) {
        html += buildPiece(pieces[i], false, SPARE_PIECE_ELS_IDS[pieces[i]])
      }

      return html
    }

    // ------------------------------------------------------------------------------
    // Animations
    // ------------------------------------------------------------------------------

    function animateSquareToSquare (src, dest, piece, completeFn) {
      // get information about the source and destination squares
      var srcSquareEl = $('#' + SQUARE_ELS_IDS[src])
      var destSquareEl = $('#' + SQUARE_ELS_IDS[dest])
      
      // check if squares exist
      if (srcSquareEl.length === 0 || destSquareEl.length === 0) {
        if (typeof completeFn === 'function') {
          completeFn()
        }
        return
      }
      
      var srcSquarePosition = srcSquareEl.offset()
      var destSquarePosition = destSquareEl.offset()
      
      // check if positions are valid
      if (!srcSquarePosition || !destSquarePosition) {
        if (typeof completeFn === 'function') {
          completeFn()
        }
        return
      }

      // create the animated piece and absolutely position it
      // over the source square
      var animatedPieceId = uuid()
      $('body').append(buildPiece(piece, true, animatedPieceId))
      var animatedPieceEl = $('#' + animatedPieceId)
      animatedPieceEl.css({
        display: '',
        position: 'absolute',
        top: srcSquarePosition.top,
        left: srcSquarePosition.left,
        fontSize: SQUARE_SIZE + 'px'
      })

      // remove original piece from source square
      srcSquareEl.find('.' + CSS.piece).remove()

      // on complete
      var complete = function () {
        // add the "real" piece to the destination square
        destSquareEl.append(buildPiece(piece))

        // remove the animated piece
        animatedPieceEl.remove()

        // run complete function
        if (typeof completeFn === 'function') {
          completeFn()
        }
      }

      // animate the piece to the destination square
      var opts = {
        duration: cfg.moveSpeed,
        complete: complete,
        fail: complete // Ensure completion even if animation fails
      }
      animatedPieceEl.animate(destSquarePosition, opts)
    }

    function animateSparePieceToSquare (piece, dest, completeFn) {
      var srcOffset = $('#' + SPARE_PIECE_ELS_IDS[piece]).offset()
      var destSquareEl = $('#' + SQUARE_ELS_IDS[dest])
      var destOffset = destSquareEl.offset()

      // create the animate piece
      var pieceId = uuid()
      $('body').append(buildPiece(piece, true, pieceId))
      var animatedPieceEl = $('#' + pieceId)
      animatedPieceEl.css({
        display: '',
        position: 'absolute',
        left: srcOffset.left,
        top: srcOffset.top,
        fontSize: SQUARE_SIZE + 'px'
      })

      // on complete
      var complete = function () {
        // add the "real" piece to the destination square
        destSquareEl.find('.' + CSS.piece).remove()
        destSquareEl.append(buildPiece(piece))

        // remove the animated piece
        animatedPieceEl.remove()

        // run complete function
        if (typeof completeFn === 'function') {
          completeFn()
        }
      }

      // animate the piece to the destination square
      var opts = {
        duration: cfg.moveSpeed,
        complete: complete,
        fail: complete // Ensure completion even if animation fails
      }
      animatedPieceEl.animate(destOffset, opts)
    }

    // execute an array of animations
    function doAnimations (a, oldPos, newPos) {
      if (a.length === 0) {
        return
      }

      ANIMATION_HAPPENING = true

      var numFinished = 0
      var animationTimeout = null
      
      function onFinish () {
        numFinished++

        // Clear timeout since we're finishing normally
        if (animationTimeout) {
          clearTimeout(animationTimeout)
          animationTimeout = null
        }

        // exit if all the animations aren't finished
        if (numFinished !== a.length) return

        drawPositionInstant()
        ANIMATION_HAPPENING = false

        // Process queued position updates
        if (widget._positionQueue && widget._positionQueue.length > 0) {
          var nextUpdate = widget._positionQueue.shift()
          // Use setTimeout to prevent stack overflow and ensure async processing
          setTimeout(function() {
            try {
              widget.position(nextUpdate.position, nextUpdate.useAnimation)
            } catch (e) {
              // Continue processing queue even if one update fails
              if (widget._positionQueue && widget._positionQueue.length > 0) {
                setTimeout(function() {
                  widget.position(widget._positionQueue.shift().position, false)
                }, 10)
              }
            }
          }, 10)
        }

        // run their onMoveEnd function
        if (cfg.hasOwnProperty('onMoveEnd') === true) {
          callEventHandler(cfg.onMoveEnd, deepCopy(oldPos), deepCopy(newPos))
        }
      }

      for (var i = 0; i < a.length; i++) {
        // clear a piece
        if (a[i].type === 'clear') {
          $('#' + SQUARE_ELS_IDS[a[i].square] + ' .' + CSS.piece)
            .fadeOut(cfg.trashSpeed, onFinish)
        }

        // add a piece (no spare pieces)
        if (a[i].type === 'add' && cfg.sparePieces !== true) {
          $('#' + SQUARE_ELS_IDS[a[i].square])
            .append(buildPiece(a[i].piece, true))
            .find('.' + CSS.piece)
            .fadeIn(cfg.appearSpeed, onFinish)
        }

        // add a piece from a spare piece
        if (a[i].type === 'add' && cfg.sparePieces === true) {
          animateSparePieceToSquare(a[i].piece, a[i].square, onFinish)
        }

        // move a piece
        if (a[i].type === 'move') {
          animateSquareToSquare(a[i].source, a[i].destination, a[i].piece,
            onFinish)
        }
      }

      // Safety timeout to prevent hanging animations
      var maxAnimationTime = Math.max(cfg.moveSpeed || 200, cfg.appearSpeed || 200, cfg.trashSpeed || 100)
      if (typeof maxAnimationTime === 'string') {
        maxAnimationTime = maxAnimationTime === 'fast' ? 200 : maxAnimationTime === 'slow' ? 600 : 400
      }
      
      animationTimeout = setTimeout(function() {
        if (ANIMATION_HAPPENING && numFinished < a.length) {
          // Force completion of stuck animation
          numFinished = a.length
          onFinish()
        }
      }, maxAnimationTime + 1000) // Add 1 second buffer
    }

    // returns the distance between two squares
    function squareDistance (s1, s2) {
      s1 = s1.split('')
      var s1x = COLUMNS.indexOf(s1[0]) + 1
      var s1y = parseInt(s1[1], 10)

      s2 = s2.split('')
      var s2x = COLUMNS.indexOf(s2[0]) + 1
      var s2y = parseInt(s2[1], 10)

      var xDelta = Math.abs(s1x - s2x)
      var yDelta = Math.abs(s1y - s2y)

      if (xDelta >= yDelta) return xDelta
      return yDelta
    }

    // returns an array of closest squares from square
    function createRadius (square) {
      var squares = []

      // calculate distance of all squares
      for (var i = 0; i < SIZE; i++) {
        for (var j = 0; j < SIZE; j++) {
          var s = COLUMNS[i] + (j + 1)

          // skip the square we're starting from
          if (square === s) continue

          squares.push({
            square: s,
            distance: squareDistance(square, s)
          })
        }
      }

      // sort by distance
      squares.sort(function (a, b) {
        return a.distance - b.distance
      })

      // just return the square code
      var squares2 = []
      for (i = 0; i < squares.length; i++) {
        squares2.push(squares[i].square)
      }

      return squares2
    }

    // returns the square of the closest instance of piece
    // returns false if no instance of piece is found in position
    function findClosestPiece (position, piece, square) {
      // create array of closest squares from square
      var closestSquares = createRadius(square)

      // search through the position in order of distance for the piece
      for (var i = 0; i < closestSquares.length; i++) {
        var s = closestSquares[i]

        if (position.hasOwnProperty(s) === true && position[s] === piece) {
          return s
        }
      }

      return false
    }

    // calculate an array of animations that need to happen in order to get
    // from pos1 to pos2
    function calculateAnimations (pos1, pos2) {
      // make copies of both
      pos1 = deepCopy(pos1)
      pos2 = deepCopy(pos2)

      var animations = []
      var squaresMovedTo = {}

      // remove pieces that are the same in both positions
      for (var i in pos2) {
        if (pos2.hasOwnProperty(i) !== true) continue

        if (pos1.hasOwnProperty(i) === true && pos1[i] === pos2[i]) {
          delete pos1[i]
          delete pos2[i]
        }
      }

      // find all the "move" animations
      for (i in pos2) {
        if (pos2.hasOwnProperty(i) !== true) continue

        var closestPiece = findClosestPiece(pos1, pos2[i], i)
        if (closestPiece !== false) {
          animations.push({
            type: 'move',
            source: closestPiece,
            destination: i,
            piece: pos2[i]
          })

          delete pos1[closestPiece]
          delete pos2[i]
          squaresMovedTo[i] = true
        }
      }

      // add pieces to pos2
      for (i in pos2) {
        if (pos2.hasOwnProperty(i) !== true) continue

        animations.push({
          type: 'add',
          square: i,
          piece: pos2[i]
        })

        delete pos2[i]
      }

      // clear pieces from pos1
      for (i in pos1) {
        if (pos1.hasOwnProperty(i) !== true) continue

        // do not clear a piece if it is on a square that is the result
        // of a "move", ie: a piece capture
        if (squaresMovedTo.hasOwnProperty(i) === true) continue

        animations.push({
          type: 'clear',
          square: i,
          piece: pos1[i]
        })

        delete pos1[i]
      }

      return animations
    }

    // ------------------------------------------------------------------------------
    // Control Flow
    // ------------------------------------------------------------------------------

    function drawPositionInstant () {
      // clear the board
      boardEl.find('.' + CSS.piece).remove()

      // add the pieces
      for (var i in CURRENT_POSITION) {
        if (CURRENT_POSITION.hasOwnProperty(i) !== true) {
          continue
        }
        if (CURRENT_POSITION[i] !== null) {
          $('#' + SQUARE_ELS_IDS[i]).append(buildPiece(CURRENT_POSITION[i]))
        }
      }
    }

    function drawBoard () {
      boardEl.html(buildBoard(CURRENT_ORIENTATION))
      drawPositionInstant()

      if (cfg.sparePieces === true) {
        if (CURRENT_ORIENTATION === 'white') {
          sparePiecesTopEl.html(buildSparePieces('black'))
          sparePiecesBottomEl.html(buildSparePieces('white'))
        } else {
          sparePiecesTopEl.html(buildSparePieces('white'))
          sparePiecesBottomEl.html(buildSparePieces('black'))
        }
      }
    }

    // given a position and a set of moves, return a new position
    // with the moves executed
    function calculatePositionFromMoves (position, moves) {
      position = deepCopy(position)

      for (var i in moves) {
        if (moves.hasOwnProperty(i) !== true) continue

        // skip the move if the position doesn't have a piece on the source square
        if (position.hasOwnProperty(i) !== true) continue

        var piece = position[i]
        delete position[i]
        position[moves[i]] = piece
      }

      return position
    }

    function setCurrentPosition (position) {
      var oldPos = deepCopy(CURRENT_POSITION)
      var newPos = deepCopy(position)
      var oldFen = objToFen(oldPos)
      var newFen = objToFen(newPos)
      // do nothing if no change in position
      if (oldFen === newFen) {
        return false
      }
      // run their onChange function
      if (cfg.hasOwnProperty('onChange') === true) {
        callEventHandler(cfg.onChange, oldPos, newPos)
      }

      // update state
      CURRENT_POSITION = position
    }

    function isXYOnSquare (x, y) {
      for (var i in SQUARE_ELS_OFFSETS) {
        if (SQUARE_ELS_OFFSETS.hasOwnProperty(i) !== true) continue

        var s = SQUARE_ELS_OFFSETS[i]
        if (typeof s !== 'object') continue
        if (x >= s.left && x < s.left + SQUARE_SIZE &&
          y >= s.top && y < s.top + SQUARE_SIZE) {
          return i
        }
      }

      return 'offboard'
    }

    // records the XY coords of every square into memory
    function captureSquareOffsets () {
      SQUARE_ELS_OFFSETS = {}

      for (var i in SQUARE_ELS_IDS) {
        if (SQUARE_ELS_IDS.hasOwnProperty(i) !== true) continue

        SQUARE_ELS_OFFSETS[i] = $('#' + SQUARE_ELS_IDS[i]).offset()
      }
    }

    function removeSquareHighlights () {
      boardEl.find('.' + CSS.square)
        .removeClass(CSS.highlight1 + ' ' + CSS.highlight2)
    }

    function snapbackDraggedPiece () {
      // there is no "snapback" for spare pieces
      if (DRAGGED_PIECE_SOURCE === 'spare') {
        trashDraggedPiece()
        return
      }

      removeSquareHighlights()

      // animation complete
      function complete () {
        drawPositionInstant()
        draggedPieceEl.css('display', 'none')

        // run their onSnapbackEnd function
        if (cfg.hasOwnProperty('onSnapbackEnd') === true) {
          callEventHandler(cfg.onSnapbackEnd, DRAGGED_PIECE, DRAGGED_PIECE_SOURCE,
            deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION)
        }
      }

      // get source square position
      var sourceSquarePosition =
      $('#' + SQUARE_ELS_IDS[DRAGGED_PIECE_SOURCE]).offset()

      // animate the piece to the target square
      var opts = {
        duration: cfg.snapbackSpeed,
        complete: complete
      }
      draggedPieceEl.animate(sourceSquarePosition, opts)

      // set state
      DRAGGING_A_PIECE = false
    }

    function trashDraggedPiece () {
      removeSquareHighlights()

      // remove the source piece
      var newPosition = deepCopy(CURRENT_POSITION)
      delete newPosition[DRAGGED_PIECE_SOURCE]
      setCurrentPosition(newPosition)

      // redraw the position
      drawPositionInstant()

      // hide the dragged piece
      draggedPieceEl.fadeOut(cfg.trashSpeed)

      // set state
      DRAGGING_A_PIECE = false
    }

    function dropDraggedPieceOnSquare (square) {
      removeSquareHighlights()

      // update position
      var newPosition = deepCopy(CURRENT_POSITION)
      delete newPosition[DRAGGED_PIECE_SOURCE]
      newPosition[square] = DRAGGED_PIECE
      setCurrentPosition(newPosition)

      // get target square information
      var targetSquarePosition = $('#' + SQUARE_ELS_IDS[square]).offset()

      // animation complete
      var complete = function () {
        drawPositionInstant()
        draggedPieceEl.css('display', 'none')

        // execute their onSnapEnd function
        if (cfg.hasOwnProperty('onSnapEnd') === true) {
          callEventHandler(cfg.onSnapEnd, DRAGGED_PIECE_SOURCE, square, DRAGGED_PIECE)
        }
      }

      // snap the piece to the target square
      var opts = {
        duration: cfg.snapSpeed,
        complete: complete
      }
      draggedPieceEl.animate(targetSquarePosition, opts)

      // set state
      DRAGGING_A_PIECE = false
    }

    function beginDraggingPiece (source, piece, x, y) {
      // run their custom onDragStart function
      // their custom onDragStart function can cancel drag start
      if (typeof cfg.onDragStart === 'function') {
        var result = callEventHandler(cfg.onDragStart, source, piece,
          deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION)
        if (result === false) {
          return
        }
      }
      // set state
      DRAGGING_A_PIECE = true
      DRAGGED_PIECE = piece
      DRAGGED_PIECE_SOURCE = source

      // if the piece came from spare pieces, location is offboard
      if (source === 'spare') {
        DRAGGED_PIECE_LOCATION = 'offboard'
      } else {
        DRAGGED_PIECE_LOCATION = source
      }

      // capture the x, y coords of all squares in memory
      captureSquareOffsets()

      // create the dragged piece
      if (cfg.pieceTheme === 'unicode') {
        draggedPieceEl.text(UNICODES[piece])
        draggedPieceEl.attr('class', '').addClass(piece).addClass('unicode')
      } else {
        draggedPieceEl.attr('src', buildPieceImgSrc(piece))
      }
      draggedPieceEl
        .css({
          display: '',
          position: 'absolute',
          left: x - (SQUARE_SIZE / 2),
          top: y - (SQUARE_SIZE / 2),
          fontSize: SQUARE_SIZE + 'px'
        })

      if (source !== 'spare') {
        // highlight the source square and hide the piece
        $('#' + SQUARE_ELS_IDS[source]).addClass(CSS.highlight1)
          .find('.' + CSS.piece).css('display', 'none')
      }
    }

    function updateDraggedPiece (x, y) {
      // put the dragged piece over the mouse cursor
      draggedPieceEl.css({
        left: x - (SQUARE_SIZE / 2),
        top: y - (SQUARE_SIZE / 2)
      })

      // get location
      var location = isXYOnSquare(x, y)

      // do nothing if the location has not changed
      if (location === DRAGGED_PIECE_LOCATION) return

      // remove highlight from previous square
      if (validSquare(DRAGGED_PIECE_LOCATION) === true) {
        $('#' + SQUARE_ELS_IDS[DRAGGED_PIECE_LOCATION])
          .removeClass(CSS.highlight2)
      }

      // add highlight to new square
      if (validSquare(location) === true) {
        $('#' + SQUARE_ELS_IDS[location]).addClass(CSS.highlight2)
      }

      // run onDragMove
      if (typeof cfg.onDragMove === 'function') {
        callEventHandler(cfg.onDragMove, location, DRAGGED_PIECE_LOCATION,
          DRAGGED_PIECE_SOURCE, DRAGGED_PIECE,
          deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION)
      }

      // update state
      DRAGGED_PIECE_LOCATION = location
    }

    function stopDraggedPiece (location) {
      // determine what the action should be
      var action = 'drop'
      if (location === 'offboard' && cfg.dropOffBoard === 'snapback') {
        action = 'snapback'
      }
      if (location === 'offboard' && cfg.dropOffBoard === 'trash') {
        action = 'trash'
      }

      // run their onDrop function, which can potentially change the drop action
      if (cfg.hasOwnProperty('onDrop') === true) {
        var newPosition = deepCopy(CURRENT_POSITION)

        // source piece is a spare piece and position is off the board
        // if (DRAGGED_PIECE_SOURCE === 'spare' && location === 'offboard') {...}
        // position has not changed; do nothing

        // source piece is a spare piece and position is on the board
        if (DRAGGED_PIECE_SOURCE === 'spare' && validSquare(location) === true) {
          // add the piece to the board
          newPosition[location] = DRAGGED_PIECE
        }

        // source piece was on the board and position is off the board
        if (validSquare(DRAGGED_PIECE_SOURCE) === true && location === 'offboard') {
          // remove the piece from the board
          delete newPosition[DRAGGED_PIECE_SOURCE]
        }

        // source piece was on the board and position is on the board
        if (validSquare(DRAGGED_PIECE_SOURCE) === true &&
          validSquare(location) === true) {
          // move the piece
          delete newPosition[DRAGGED_PIECE_SOURCE]
          newPosition[location] = DRAGGED_PIECE
        }

        var oldPosition = deepCopy(CURRENT_POSITION)

        var result = callEventHandler(cfg.onDrop, DRAGGED_PIECE_SOURCE, location, DRAGGED_PIECE,
          newPosition, oldPosition, CURRENT_ORIENTATION)
        // Only accept valid return values
        if (result === 'snapback' || result === 'trash') {
          action = result
        }
      }

      // do it!
      if (action === 'snapback') {
        snapbackDraggedPiece()
      } else if (action === 'trash') {
        trashDraggedPiece()
      } else if (action === 'drop') {
        dropDraggedPieceOnSquare(location)
      }
    }

    // ------------------------------------------------------------------------------
    // Public Methods
    // ------------------------------------------------------------------------------

    /**
     * Clears the board of all pieces
     * @param {boolean} [useAnimation=true] - Whether to animate the clearing
     */
    widget.clear = function (useAnimation) {
      widget.position({}, useAnimation)
    }

    /**
     * Removes the widget from the page and cleans up
     */
    widget.destroy = function () {
      // remove markup
      containerEl.html('')
      draggedPieceEl.remove()

      // remove event handlers
      containerEl.unbind()
    }

    // shorthand method to get the current FEN
    widget.fen = function () {
      return widget.position('fen')
    }

    // flip orientation
    widget.flip = function () {
      return widget.orientation('flip')
    }

    /*
    // TODO: write this, GitHub Issue #5
    widget.highlight = function() {

    }
    */

    /**
     * Moves pieces on the board
     * @param {...(string|boolean)} moves - Move strings like "27x31" or "23-32", or false to disable animation
     * @returns {Position} New position after moves
     */
    widget.move = function () {
      // no need to throw an error here; just do nothing
      if (arguments.length === 0) return

      var useAnimation = true

      // collect the moves into an object
      var moves = {}
      for (var i = 0; i < arguments.length; i++) {
        // any "false" to this function means no animations
        if (arguments[i] === false) {
          useAnimation = false
          continue
        }

        // skip invalid arguments
        if (validMove(arguments[i]) !== true) {
          error(2826, 'Invalid move passed to the move method.', arguments[i])
          continue
        }

        var tmp = arguments[i].split(/-|x/)
        moves[tmp[0]] = tmp[1]
      }

      // calculate position from moves
      var newPos = calculatePositionFromMoves(CURRENT_POSITION, moves)

      // update the board
      widget.position(newPos, useAnimation)

      // return the new position object
      return newPos
    }

    /**
     * Gets or sets the board orientation
     * @param {Orientation|'flip'} [arg] - 'white', 'black', or 'flip' to flip current
     * @returns {Orientation} Current orientation
     */
    widget.orientation = function (arg) {
      // no arguments, return the current orientation
      if (arguments.length === 0) {
        return CURRENT_ORIENTATION
      }

      // set to white or black
      if (arg === 'white' || arg === 'black') {
        CURRENT_ORIENTATION = arg
        drawBoard()
        return CURRENT_ORIENTATION
      }

      // flip orientation
      if (arg === 'flip') {
        CURRENT_ORIENTATION = (CURRENT_ORIENTATION === 'white') ? 'black' : 'white'
        drawBoard()
        return CURRENT_ORIENTATION
      }

      error(5482, 'Invalid value passed to the orientation method.', arg)
    }

    /**
     * Gets or sets the board position
     * @param {Position|string} [position] - Position object, FEN string, 'fen', or 'start'
     * @param {boolean} [useAnimation=true] - Whether to animate the position change
     * @returns {Position|string|undefined} Current position if no args, FEN if 'fen' passed
     */
    widget.position = function (position, useAnimation) {
      // no arguments, return the current position
      if (arguments.length === 0) {
        return deepCopy(CURRENT_POSITION)
      }

      // get position as FEN
      if (typeof position === 'string' && position.toLowerCase() === 'fen') {
        return objToFen(CURRENT_POSITION)
      }

      // default for useAnimations is true
      if (useAnimation !== false) {
        useAnimation = true
      }

      // start position
      if (typeof position === 'string' && position.toLowerCase() === 'start') {
        position = deepCopy(START_POSITION)
      }

      // convert FEN to position object
      if (validFen(position) === true) {
        position = fenToObj(position)
      }

      // filter out invalid squares and pieces, but don't reject the whole position
      if (typeof position === 'object' && position !== null) {
        position = filterValidPosition(position)
      } else {
        error(6482, 'Invalid value passed to the position method.', position)
        return
      }

      if (useAnimation === true) {
        // If animation is already happening, queue this update
        if (ANIMATION_HAPPENING) {
          if (!widget._positionQueue) {
            widget._positionQueue = []
          }
          widget._positionQueue.push({ position: position, useAnimation: useAnimation })
          return deepCopy(position)
        }

        // start the animations
        doAnimations(calculateAnimations(CURRENT_POSITION, position),
          CURRENT_POSITION, position)

        // set the new position
        setCurrentPosition(position)
        drawPositionInstant()
      } else {
        // instant update
        setCurrentPosition(position)
        drawPositionInstant()
      }

      // return the new position
      return deepCopy(position)
    }

    /**
     * Recalculates board dimensions and redraws the board
     */
    widget.resize = function () {
      // Throttle resize calls to improve performance
      if (widget._resizeTimeout) {
        clearTimeout(widget._resizeTimeout)
      }
      
      widget._resizeTimeout = setTimeout(function() {
        // calulate the new square size
        SQUARE_SIZE = calculateSquareSize()

        // set board width
        boardEl.css('width', (SQUARE_SIZE * SIZE) + 'px')

        // set drag piece size
        draggedPieceEl.css({
          height: SQUARE_SIZE,
          width: SQUARE_SIZE
        })

        // spare pieces
        if (cfg.sparePieces === true) {
          containerEl.find('.' + CSS.sparePieces)
            .css('paddingLeft', (SQUARE_SIZE + BOARD_BORDER_SIZE) + 'px')
        }

        // redraw the board
        drawBoard()
        
        widget._resizeTimeout = null
      }, 16) // ~60fps throttling
    }

    /**
     * Sets the board to the starting position
     * @param {boolean} [useAnimation=true] - Whether to animate the position change
     */
    widget.start = function (useAnimation) {
      widget.position('start', useAnimation)
    }

    // ------------------------------------------------------------------------------
    // Browser Events
    // ------------------------------------------------------------------------------

    function isTouchDevice () {
      return ('ontouchstart' in document.documentElement)
    }

    // reference: http://www.quirksmode.org/js/detect.html
    function isMSIE () {
      return (navigator && navigator.userAgent &&
      navigator.userAgent.search(/MSIE/) !== -1)
    }

    function stopDefault (e) {
      e.preventDefault()
    }

    function mousedownSquare (e) {
      // do nothing if we're not draggable
      if (cfg.draggable !== true) return

      var square = $(this).attr('data-square')

      // no piece on this square
      if (validSquare(square) !== true ||
        CURRENT_POSITION.hasOwnProperty(square) !== true) {
        return
      }

      beginDraggingPiece(square, CURRENT_POSITION[square], e.pageX, e.pageY)
    }

    function touchstartSquare (e) {
      // do nothing if we're not draggable
      if (cfg.draggable !== true) return

      var square = $(this).attr('data-square')

      // no piece on this square
      if (validSquare(square) !== true ||
        CURRENT_POSITION.hasOwnProperty(square) !== true) {
        return
      }

      e = e.originalEvent
      beginDraggingPiece(square, CURRENT_POSITION[square],
        e.changedTouches[0].pageX, e.changedTouches[0].pageY)
    }

    function mousedownSparePiece (e) {
      // do nothing if sparePieces is not enabled
      if (cfg.sparePieces !== true) return

      var piece = $(this).attr('data-piece')

      beginDraggingPiece('spare', piece, e.pageX, e.pageY)
    }

    function touchstartSparePiece (e) {
      // do nothing if sparePieces is not enabled
      if (cfg.sparePieces !== true) return

      var piece = $(this).attr('data-piece')

      e = e.originalEvent
      beginDraggingPiece('spare', piece,
        e.changedTouches[0].pageX, e.changedTouches[0].pageY)
    }

    function mousemoveWindow (e) {
      // do nothing if we are not dragging a piece
      if (DRAGGING_A_PIECE !== true) return

      updateDraggedPiece(e.pageX, e.pageY)
    }

    function touchmoveWindow (e) {
      // do nothing if we are not dragging a piece
      if (DRAGGING_A_PIECE !== true) return

      // prevent screen from scrolling
      e.preventDefault()

      updateDraggedPiece(e.originalEvent.changedTouches[0].pageX,
        e.originalEvent.changedTouches[0].pageY)
    }

    function mouseupWindow (e) {
      // do nothing if we are not dragging a piece
      if (DRAGGING_A_PIECE !== true) return

      // get the location
      var location = isXYOnSquare(e.pageX, e.pageY)

      stopDraggedPiece(location)
    }

    function touchendWindow (e) {
      // do nothing if we are not dragging a piece
      if (DRAGGING_A_PIECE !== true) return

      // get the location
      var location = isXYOnSquare(e.originalEvent.changedTouches[0].pageX,
        e.originalEvent.changedTouches[0].pageY)

      stopDraggedPiece(location)
    }

    function mouseenterSquare (e) {
      // do not fire this event if we are dragging a piece
      // NOTE: this should never happen, but it's a safeguard
      if (DRAGGING_A_PIECE !== false) return

      if (cfg.hasOwnProperty('onMouseoverSquare') !== true ||
        typeof cfg.onMouseoverSquare !== 'function') return

      // get the square
      var square = $(e.currentTarget).attr('data-square')

      // NOTE: this should never happen; defensive
      if (validSquare(square) !== true) return

      // get the piece on this square
      var piece = false
      if (CURRENT_POSITION.hasOwnProperty(square) === true) {
        piece = CURRENT_POSITION[square]
      }

      // execute their function
      cfg.onMouseoverSquare(square, piece, deepCopy(CURRENT_POSITION),
        CURRENT_ORIENTATION)
    }

    function mouseleaveSquare (e) {
      // do not fire this event if we are dragging a piece
      // NOTE: this should never happen, but it's a safeguard
      if (DRAGGING_A_PIECE !== false) return

      if (cfg.hasOwnProperty('onMouseoutSquare') !== true ||
        typeof cfg.onMouseoutSquare !== 'function') return

      // get the square
      var square = $(e.currentTarget).attr('data-square')

      // NOTE: this should never happen; defensive
      if (validSquare(square) !== true) return

      // get the piece on this square
      var piece = false
      if (CURRENT_POSITION.hasOwnProperty(square) === true) {
        piece = CURRENT_POSITION[square]
      }

      // execute their function
      cfg.onMouseoutSquare(square, piece, deepCopy(CURRENT_POSITION),
        CURRENT_ORIENTATION)
    }

    // ------------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------------

    function addEvents () {
      // prevent browser "image drag"
      $('body').on('mousedown mousemove', '.' + CSS.piece, stopDefault)

      // mouse drag pieces
      boardEl.on('mousedown', '.' + CSS.square, mousedownSquare)
      containerEl.on('mousedown', '.' + CSS.sparePieces + ' .' + CSS.piece,
        mousedownSparePiece)

      // mouse enter / leave square
      boardEl.on('mouseenter', '.' + CSS.square, mouseenterSquare)
        .on('mouseleave', '.' + CSS.square, mouseleaveSquare)

      // IE doesn't like the events on the window object, but other browsers
      // perform better that way
      if (isMSIE() === true) {
        // IE-specific prevent browser "image drag"
        document.ondragstart = function () { return false }

        $('body').on('mousemove', mousemoveWindow)
          .on('mouseup', mouseupWindow)
      } else {
        $(window).on('mousemove', mousemoveWindow)
          .on('mouseup', mouseupWindow)
      }

      // touch drag pieces
      if (isTouchDevice() === true) {
        boardEl.on('touchstart', '.' + CSS.square, touchstartSquare)
        containerEl.on('touchstart', '.' + CSS.sparePieces + ' .' + CSS.piece,
          touchstartSparePiece)
        $(window).on('touchmove', touchmoveWindow)
          .on('touchend', touchendWindow)
      }
    }

    function initDom () {
      // create unique IDs for all the elements we will create
      createElIds()

      // build board and save it in memory
      containerEl.html(buildBoardContainer())
      boardEl = containerEl.find('.' + CSS.board)

      if (cfg.sparePieces === true) {
        sparePiecesTopEl = containerEl.find('.' + CSS.sparePiecesTop)
        sparePiecesBottomEl = containerEl.find('.' + CSS.sparePiecesBottom)
      }

      // create the drag piece
      var draggedPieceId = uuid()
      $('body').append(buildPiece('w', true, draggedPieceId))
      draggedPieceEl = $('#' + draggedPieceId)

      // get the border size
      BOARD_BORDER_SIZE = parseInt(boardEl.css('borderLeftWidth'), 10)

      // set the size and draw the board
      widget.resize()
    }

    function init () {
      if (checkDeps() !== true ||
        expandConfig() !== true) return

      initDom()
      addEvents()
    }

    // go time
    init()

    // return the widget object
    return widget
  }
  // end window.DraughtsBoard

  // expose util functions
  /**
   * @type {function(string): Position|false}
   */
  window.DraughtsBoard.fenToObj = fenToObj
  /**
   * @type {function(Position): string|false}
   */
  window.DraughtsBoard.objToFen = objToFen

  if (typeof exports !== 'undefined') {
    exports.DraughtsBoard = window.DraughtsBoard
  }

  if (typeof define !== 'undefined') {
    define(function () {
      return window.DraughtsBoard
    })
  }
})()
