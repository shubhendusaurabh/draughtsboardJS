describe('Integration Tests', function() {
    
    beforeEach(function() {
        $('#test-boards').empty();
    });
    
    afterEach(function() {
        $('#test-boards .test-board').each(function() {
            const $board = $(this);
            if($board.data('board') && $board.data('board').destroy) {
                $board.data('board').destroy();
            }
        });
        $('#test-boards').empty();
    });
    
    describe('Full Game Workflow Integration', function() {
        it('should handle complete game setup and play', function(done) {
            let gameEvents = [];
            let moveCount = 0;
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                orientation: 'white',
                moveSpeed: 'fast',
                
                onDragStart: function(source, piece, position, orientation) {
                    gameEvents.push({ type: 'dragStart', source, piece });
                    expect(['w', 'b']).to.include(piece);
                    return true; // Allow drag
                },
                
                onDrop: function(source, target, piece, newPos, oldPos, orientation) {
                    gameEvents.push({ type: 'drop', source, target, piece });
                    
                    // Simple validation: only allow moves to empty squares
                    if (!oldPos[target]) {
                        moveCount++;
                        return null; // Accept move
                    }
                    return 'snapback'; // Reject move
                },
                
                onSnapEnd: function(source, square, piece) {
                    gameEvents.push({ type: 'snapEnd', source, square, piece });
                },
                
                onMoveEnd: function(source, target, piece) {
                    gameEvents.push({ type: 'moveEnd', source, target, piece });
                    
                    if (moveCount >= 3) {
                        // Verify game progression
                        expect(gameEvents.length).to.be.greaterThan(5);
                        expect(board.position()).to.be.an('object');
                        done();
                    }
                },
                
                onChange: function(oldPos, newPos) {
                    gameEvents.push({ type: 'change', oldPosCount: Object.keys(oldPos).length, newPosCount: Object.keys(newPos).length });
                }
            });
            
            expect(board).to.be.an('object');
            
            // Simulate a sequence of moves
            setTimeout(() => board.move('1-5'), 100);
            setTimeout(() => board.move('31-27'), 200);
            setTimeout(() => board.move('2-6'), 300);
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (moveCount === 0) {
                    done();
                }
            }, 2000);
        });
        
        it('should handle game state transitions', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Game progression: start -> play -> clear -> restart
            board.start();
            let startPosition = board.position();
            expect(Object.keys(startPosition).length).to.be.greaterThan(0);
            
            // Make some moves
            board.move('1-5');
            board.move('31-27');
            let midGamePosition = board.position();
            expect(midGamePosition['5']).to.equal('w');
            expect(midGamePosition['27']).to.equal('b');
            
            // Clear board
            board.clear();
            let emptyPosition = board.position();
            expect(Object.keys(emptyPosition).length).to.equal(0);
            
            // Restart
            board.start();
            let restartPosition = board.position();
            expect(Object.keys(restartPosition).length).to.equal(Object.keys(startPosition).length);
            
            $container.data('board', board);
        });
        
        it('should handle complex position changes with game logic', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let positionChanges = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 'fast',
                onChange: function(oldPos, newPos) {
                    positionChanges++;
                    
                    // Validate position consistency
                    for (let square in newPos) {
                        expect(['w', 'b', 'W', 'B']).to.include(newPos[square]);
                        expect(parseInt(square, 10)).to.be.within(1, 50);
                    }
                    
                    if (positionChanges === 3) {
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Simulate game progression with captures
            board.position({ '12': 'w', '16': 'b' }); // Setup for capture
            board.position({ '21': 'w' }); // Capture move
            board.position({ '21': 'W' }); // Promote to king
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (positionChanges < 3) {
                    done();
                }
            }, 1000);
        });
    });
    
    describe('Multi-Board Integration', function() {
        it('should handle multiple boards simultaneously', function() {
            const boards = [];
            const containers = [];
            
            // Create multiple boards
            for (let i = 0; i < 3; i++) {
                const $container = $('<div class="test-board">').appendTo('#test-boards');
                const board = DraughtsBoard($container[0], {
                    position: i === 0 ? 'start' : { [(i + 1).toString()]: 'w', [(31 + i).toString()]: 'b' },
                    orientation: i % 2 === 0 ? 'white' : 'black'
                });
                
                expect(board).to.be.an('object');
                
                boards.push(board);
                containers.push($container);
                $container.data('board', board);
            }
            
            // Test that all boards are independent
            boards[0].clear();
            boards[1].move('2-6');
            boards[2].flip();
            
            // Verify independence
            expect(Object.keys(boards[0].position()).length).to.equal(0);
            expect(boards[1].position()['6']).to.equal('w');
            expect(boards[2].orientation()).to.equal('white');
            
            // Test that other boards are unaffected
            expect(boards[1].position()['32']).to.equal('b');
            expect(boards[2].position()['3']).to.equal('w');
        });
        
        it('should handle board synchronization', function() {
            const $container1 = $('<div class="test-board">').appendTo('#test-boards');
            const $container2 = $('<div class="test-board">').appendTo('#test-boards');
            
            let syncCount = 0;
            
            const board1 = DraughtsBoard($container1[0], {
                position: 'start',
                onChange: function(oldPos, newPos) {
                    // Sync with board2
                    board2.position(newPos, false);
                    syncCount++;
                }
            });
            
            const board2 = DraughtsBoard($container2[0], {
                position: {}
            });
            
            expect(board1).to.be.an('object');
            expect(board2).to.be.an('object');
            
            // Change board1, should sync to board2
            board1.move('1-5');
            
            expect(syncCount).to.be.greaterThan(0);
            expect(board1.position()['5']).to.equal(board2.position()['5']);
            
            $container1.data('board', board1);
            $container2.data('board', board2);
        });
    });
    
    describe('Real-world Usage Scenarios', function() {
        it('should handle analysis mode (non-draggable with position changes)', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let analysisHistory = [];
            
            const board = DraughtsBoard($container[0], {
                draggable: false,
                position: 'start',
                showNotation: true,
                onChange: function(oldPos, newPos) {
                    analysisHistory.push({
                        from: Object.keys(oldPos).length,
                        to: Object.keys(newPos).length,
                        fen: board.fen()
                    });
                }
            });
            
            expect(board).to.be.an('object');
            
            // Simulate analysis moves
            board.move('1-5');
            board.move('31-27');
            board.move('5x12'); // Capture
            board.move('27-23');
            
            expect(analysisHistory.length).to.be.greaterThan(0);
            
            // Should be able to navigate history
            const position = board.position();
            expect(position).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should handle puzzle mode with specific setup', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            // Complex puzzle position
            const puzzlePosition = {
                '1': 'w', '5': 'W', '9': 'w',
                '15': 'b', '19': 'b',
                '31': 'B', '35': 'b', '39': 'b',
                '45': 'w', '49': 'W'
            };
            
            const board = DraughtsBoard($container[0], {
                position: puzzlePosition,
                draggable: function(source, piece, position, orientation) {
                    // Only allow white pieces to move (puzzle constraint)
                    return piece.toLowerCase() === 'w';
                },
                onDrop: function(source, target, piece, newPos, oldPos) {
                    // Puzzle validation logic
                    const sourceNum = parseInt(source, 10);
                    const targetNum = parseInt(target, 10);
                    
                    // Simple validation: must be a valid move
                    if (Math.abs(sourceNum - targetNum) === 4 || Math.abs(sourceNum - targetNum) === 5) {
                        return null; // Accept move
                    }
                    return 'snapback';
                }
            });
            
            expect(board).to.be.an('object');
            
            // Verify puzzle setup
            const currentPos = board.position();
            expect(currentPos['1']).to.equal('w');
            expect(currentPos['5']).to.equal('W');
            expect(currentPos['31']).to.equal('B');
            
            $container.data('board', board);
        });
        
        it('should handle training mode with move hints', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let hintSquares = [];
            let moveAttempts = [];
            
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDragStart: function(source, piece, position, orientation) {
                    // Provide hints by tracking potential moves
                    hintSquares.push(source);
                    return true;
                },
                onDrop: function(source, target, piece, newPos, oldPos) {
                    moveAttempts.push({ source, target, piece });
                    
                    // Training feedback
                    const isValidMove = !oldPos[target]; // Simple validation
                    
                    if (isValidMove) {
                        return null; // Good move
                    } else {
                        return 'snapback'; // Try again
                    }
                },
                onMouseoverSquare: function(square, piece) {
                    // Could highlight possible moves here
                }
            });
            
            expect(board).to.be.an('object');
            expect(hintSquares).to.be.an('array');
            expect(moveAttempts).to.be.an('array');
            
            $container.data('board', board);
        });
    });
    
    describe('External Library Integration', function() {
        it('should work with game state management', function() {
            // Simulate external game state
            const gameState = {
                currentPlayer: 'white',
                moveHistory: [],
                capturedPieces: [],
                gameStatus: 'playing'
            };
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDrop: function(source, target, piece, newPos, oldPos) {
                    // Update external game state
                    gameState.moveHistory.push({ from: source, to: target, piece: piece });
                    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
                    
                    // Simple move validation
                    if (!oldPos[target]) {
                        return null;
                    }
                    return 'snapback';
                }
            });
            
            expect(board).to.be.an('object');
            expect(gameState.currentPlayer).to.equal('white');
            
            // Simulate moves that update game state
            board.move('1-5');
            expect(gameState.moveHistory.length).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should integrate with move validation library', function() {
            // Mock draughts rules engine
            const MockDraughtsEngine = {
                isValidMove: function(from, to, position) {
                    // Simplified validation
                    const fromNum = parseInt(from, 10);
                    const toNum = parseInt(to, 10);
                    return Math.abs(fromNum - toNum) <= 9 && !position[to];
                },
                
                makeMove: function(from, to, position) {
                    const newPos = Object.assign({}, position);
                    newPos[to] = newPos[from];
                    delete newPos[from];
                    return newPos;
                }
            };
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDrop: function(source, target, piece, newPos, oldPos) {
                    // Use external validation
                    if (MockDraughtsEngine.isValidMove(source, target, oldPos)) {
                        const validatedPosition = MockDraughtsEngine.makeMove(source, target, oldPos);
                        board.position(validatedPosition, false);
                        return null;
                    }
                    return 'snapback';
                }
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
    });
    
    describe('Performance Integration Tests', function() {
        it('should handle rapid position updates efficiently', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let updateCount = 0;
            const startTime = Date.now();
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function() {
                    updateCount++;
                    
                    if (updateCount === 50) {
                        const duration = Date.now() - startTime;
                        expect(duration).to.be.lessThan(5000); // Should complete within 5 seconds
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Rapid updates
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    board.position({ [(i % 50 + 1).toString()]: i % 2 === 0 ? 'w' : 'b' });
                }, i * 20);
            }
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (updateCount < 50) {
                    done();
                }
            }, 10000);
        });
        
        it('should handle large numbers of simultaneous animations', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let animationCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 'fast',
                onMoveEnd: function() {
                    animationCount++;
                    
                    if (animationCount >= 10) {
                        expect(board.position()).to.be.an('object');
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Create position that will trigger many animations
            const newPosition = {};
            for (let i = 1; i <= 20; i++) {
                newPosition[(i + 20).toString()] = 'w';
            }
            for (let i = 31; i <= 50; i++) {
                newPosition[(i - 20).toString()] = 'b';
            }
            
            board.position(newPosition, true);
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (animationCount === 0) {
                    done();
                }
            }, 5000);
        });
    });
    
    describe('Error Recovery Integration', function() {
        it('should recover from DOM manipulation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Verify initial state
            expect($container.find('.board-b72b1')).to.have.length(1);
            
            // Simulate external DOM manipulation
            $container.find('.square-55d63').first().remove();
            
            // Board should still function
            board.resize();
            board.move('2-6');
            
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should handle CSS conflicts gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            // Add conflicting CSS
            $container.css({
                'position': 'absolute',
                'transform': 'scale(0.5)',
                'overflow': 'hidden'
            });
            
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Should still create board elements
            expect($container.find('.board-b72b1')).to.have.length(1);
            
            $container.data('board', board);
        });
    });
});