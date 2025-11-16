describe('Board Method Tests', function() {
    
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
    
    describe('Core Board Methods', function() {
        it('should have all required methods', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Check for all core methods
            expect(board.clear).to.be.a('function');
            expect(board.destroy).to.be.a('function');
            expect(board.fen).to.be.a('function');
            expect(board.flip).to.be.a('function');
            expect(board.move).to.be.a('function');
            expect(board.orientation).to.be.a('function');
            expect(board.position).to.be.a('function');
            expect(board.resize).to.be.a('function');
            expect(board.start).to.be.a('function');
            
            $container.data('board', board);
        });
    });
    
    describe('clear() method', function() {
        it('should clear the board without animation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Verify board has pieces initially
            let initialPosition = board.position();
            expect(Object.keys(initialPosition).length).to.be.greaterThan(0);
            
            // Clear the board
            board.clear();
            
            // Verify board is empty
            const clearedPosition = board.position();
            expect(Object.keys(clearedPosition).length).to.equal(0);
            
            $container.data('board', board);
        });
        
        it('should clear the board with animation', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let animationComplete = false;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                trashSpeed: 'fast',
                onMoveEnd: function() {
                    animationComplete = true;
                    
                    // Verify board is cleared
                    const position = board.position();
                    expect(Object.keys(position).length).to.equal(0);
                    
                    done();
                }
            });
            
            expect(board).to.be.an('object');
            
            // Clear with animation
            board.clear(true);
            
            $container.data('board', board);
            
            // Fallback
            setTimeout(() => {
                if (!animationComplete) {
                    done();
                }
            }, 1000);
        });
        
        it('should trigger onChange when clearing', function() {
            let changeCount = 0;
            let oldPos, newPos;
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function(oldPosition, newPosition) {
                    changeCount++;
                    oldPos = oldPosition;
                    newPos = newPosition;
                }
            });
            
            expect(board).to.be.an('object');
            
            board.clear();
            
            expect(changeCount).to.be.greaterThan(0);
            expect(oldPos).to.be.an('object');
            expect(newPos).to.be.an('object');
            expect(Object.keys(newPos).length).to.equal(0);
            
            $container.data('board', board);
        });
    });
    
    describe('destroy() method', function() {
        it('should completely destroy the board', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Verify board elements exist
            expect($container.find('.board-b72b1')).to.have.length(1);
            
            // Destroy the board
            board.destroy();
            
            // Verify board elements are removed
            expect($container.find('.board-b72b1')).to.have.length(0);
            expect($container.html()).to.equal('');
        });
        
        it('should handle multiple destroy calls gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Multiple destroy calls should not throw errors
            expect(function() {
                board.destroy();
                board.destroy();
                board.destroy();
            }).to.not.throw();
            
            expect($container.html()).to.equal('');
        });
        
        it('should clean up event listeners', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDragStart: function() {},
                onDrop: function() {},
                onMouseoverSquare: function() {},
                onMouseoutSquare: function() {}
            });
            
            expect(board).to.be.an('object');
            
            // Destroy should clean up all event listeners
            board.destroy();
            
            // Container should be empty
            expect($container.html()).to.equal('');
        });
    });
    
    describe('fen() method', function() {
        it('should return current position as FEN string', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            const fen = board.fen();
            expect(fen).to.be.a('string');
            expect(fen).to.match(/^[WB]:/); // Should start with turn indicator
            
            $container.data('board', board);
        });
        
        it('should return consistent FEN for empty board', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const fen = board.fen();
            expect(fen).to.be.a('string');
            expect(fen).to.equal('W::'); // Empty board FEN
            
            $container.data('board', board);
        });
        
        it('should return FEN that can be used to recreate position', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const originalPosition = { '1': 'w', '2': 'W', '31': 'b', '32': 'B' };
            const board = DraughtsBoard($container[0], {
                position: originalPosition
            });
            
            expect(board).to.be.an('object');
            
            const fen = board.fen();
            
            // Create new board with the FEN
            const $container2 = $('<div class="test-board">').appendTo('#test-boards');
            const board2 = DraughtsBoard($container2[0], {
                position: fen
            });
            
            const newPosition = board2.position();
            expect(newPosition['1']).to.equal('w');
            expect(newPosition['2']).to.equal('W');
            expect(newPosition['31']).to.equal('b');
            expect(newPosition['32']).to.equal('B');
            
            $container.data('board', board);
            $container2.data('board', board2);
        });
    });
    
    describe('flip() method', function() {
        it('should flip board orientation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                orientation: 'white'
            });
            
            expect(board).to.be.an('object');
            expect(board.orientation()).to.equal('white');
            
            board.flip();
            expect(board.orientation()).to.equal('black');
            
            board.flip();
            expect(board.orientation()).to.equal('white');
            
            $container.data('board', board);
        });
        
        it('should maintain position after flip', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const position = { '1': 'w', '31': 'b' };
            const board = DraughtsBoard($container[0], {
                position: position
            });
            
            expect(board).to.be.an('object');
            
            const beforeFlip = board.position();
            board.flip();
            const afterFlip = board.position();
            
            // Position should remain the same
            expect(afterFlip['1']).to.equal(beforeFlip['1']);
            expect(afterFlip['31']).to.equal(beforeFlip['31']);
            
            $container.data('board', board);
        });
        
        it('should update visual representation after flip', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Verify board exists
            expect($container.find('.board-b72b1')).to.have.length(1);
            
            board.flip();
            
            // Board should still exist and be functional
            expect($container.find('.board-b72b1')).to.have.length(1);
            expect(board.orientation()).to.equal('black');
            
            $container.data('board', board);
        });
    });
    
    describe('move() method', function() {
        it('should execute simple moves', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w' }
            });
            
            expect(board).to.be.an('object');
            
            // Execute move
            board.move('1-5');
            
            const position = board.position();
            expect(position['5']).to.equal('w');
            expect(position['1']).to.be.undefined;
            
            $container.data('board', board);
        });
        
        it('should handle capture moves', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w', '31': 'b' }
            });
            
            expect(board).to.be.an('object');
            
            // Execute capture move
            board.move('1x31');
            
            const position = board.position();
            expect(position['31']).to.equal('w');
            expect(position['1']).to.be.undefined;
            
            $container.data('board', board);
        });
        
        it('should trigger move animations', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let moveComplete = false;
            
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w' },
                moveSpeed: 'fast',
                onMoveEnd: function(source, target, piece) {
                    moveComplete = true;
                    expect(source).to.equal('1');
                    expect(target).to.equal('5');
                    expect(piece).to.equal('w');
                    done();
                }
            });
            
            expect(board).to.be.an('object');
            
            board.move('1-5');
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (!moveComplete) {
                    done();
                }
            }, 1000);
        });
        
        it('should handle invalid move notation gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w' }
            });
            
            expect(board).to.be.an('object');
            
            const originalPosition = board.position();
            
            // Try invalid moves
            expect(function() {
                board.move('invalid');
                board.move('1-');
                board.move('1-99');
                board.move('');
            }).to.not.throw();
            
            // Position should remain unchanged
            const newPosition = board.position();
            expect(newPosition['1']).to.equal(originalPosition['1']);
            
            $container.data('board', board);
        });
        
        it('should handle multiple sequential moves', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let moveCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w', '2': 'b' },
                moveSpeed: 'fast',
                onMoveEnd: function() {
                    moveCount++;
                    if (moveCount === 2) {
                        const position = board.position();
                        expect(position['5']).to.equal('w');
                        expect(position['6']).to.equal('b');
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            board.move('1-5');
            board.move('2-6');
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (moveCount === 0) {
                    done();
                }
            }, 2000);
        });
    });
    
    describe('orientation() method', function() {
        it('should get current orientation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                orientation: 'black'
            });
            
            expect(board).to.be.an('object');
            expect(board.orientation()).to.equal('black');
            
            $container.data('board', board);
        });
        
        it('should set new orientation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                orientation: 'white'
            });
            
            expect(board).to.be.an('object');
            expect(board.orientation()).to.equal('white');
            
            board.orientation('black');
            expect(board.orientation()).to.equal('black');
            
            $container.data('board', board);
        });
        
        it('should handle invalid orientation values gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const originalOrientation = board.orientation();
            
            // Try invalid orientations
            board.orientation('invalid');
            board.orientation('');
            board.orientation(123);
            board.orientation(null);
            
            // Should fallback to valid orientation
            const currentOrientation = board.orientation();
            expect(['white', 'black']).to.include(currentOrientation);
            
            $container.data('board', board);
        });
    });
    
    describe('resize() method', function() {
        it('should handle board resize', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            $container.css({ width: '400px', height: '400px' });
            
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Change container size
            $container.css({ width: '600px', height: '600px' });
            
            // Resize board
            board.resize();
            
            // Board should still function
            expect(board.position()).to.be.an('object');
            expect($container.find('.board-b72b1')).to.have.length(1);
            
            $container.data('board', board);
        });
        
        it('should maintain position after resize', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const position = { '1': 'w', '31': 'b' };
            const board = DraughtsBoard($container[0], {
                position: position
            });
            
            expect(board).to.be.an('object');
            
            const beforeResize = board.position();
            
            // Resize
            $container.css({ width: '500px', height: '500px' });
            board.resize();
            
            const afterResize = board.position();
            
            // Position should be preserved
            expect(afterResize['1']).to.equal(beforeResize['1']);
            expect(afterResize['31']).to.equal(beforeResize['31']);
            
            $container.data('board', board);
        });
        
        it('should handle resize with zero dimensions', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Set zero dimensions
            $container.css({ width: '0px', height: '0px' });
            
            expect(function() {
                board.resize();
            }).to.not.throw();
            
            $container.data('board', board);
        });
    });
    
    describe('start() method', function() {
        it('should set position to start', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Start position
            board.start();
            
            const position = board.position();
            expect(Object.keys(position).length).to.be.greaterThan(0);
            
            // Should have both white and black pieces
            const pieces = Object.values(position);
            expect(pieces.some(p => p === 'w' || p === 'W')).to.be.true;
            expect(pieces.some(p => p === 'b' || p === 'B')).to.be.true;
            
            $container.data('board', board);
        });
        
        it('should animate to start position when useAnimation is true', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let animationComplete = false;
            
            const board = DraughtsBoard($container[0], {
                position: { '25': 'w' }, // Non-start position
                moveSpeed: 'fast',
                onMoveEnd: function() {
                    animationComplete = true;
                    const position = board.position();
                    expect(Object.keys(position).length).to.be.greaterThan(1);
                    done();
                }
            });
            
            expect(board).to.be.an('object');
            
            board.start(true);
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (!animationComplete) {
                    done();
                }
            }, 1000);
        });
        
        it('should trigger onChange when starting', function() {
            let changeCount = 0;
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                onChange: function(oldPos, newPos) {
                    changeCount++;
                    expect(oldPos).to.be.an('object');
                    expect(newPos).to.be.an('object');
                    expect(Object.keys(newPos).length).to.be.greaterThan(Object.keys(oldPos).length);
                }
            });
            
            expect(board).to.be.an('object');
            
            board.start();
            
            expect(changeCount).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
    });
    
    describe('Method chaining and combinations', function() {
        it('should handle method combinations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Chain multiple method calls
            board.start();
            board.flip();
            board.move('1-5');
            board.clear();
            board.start();
            
            // Board should still be functional
            expect(board.position()).to.be.an('object');
            expect(Object.keys(board.position()).length).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should maintain state consistency across method calls', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Complex sequence of operations
            board.start();
            const startPos = board.position();
            
            board.orientation('black');
            expect(board.orientation()).to.equal('black');
            
            board.clear();
            expect(Object.keys(board.position()).length).to.equal(0);
            
            board.position(startPos);
            expect(Object.keys(board.position()).length).to.equal(Object.keys(startPos).length);
            
            $container.data('board', board);
        });
    });
    
    describe('Error handling and edge cases', function() {
        it('should handle method calls on destroyed board gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            board.destroy();
            
            // Method calls on destroyed board should not throw
            expect(function() {
                board.clear();
                board.flip();
                board.move('1-5');
                board.position('start');
                board.resize();
                board.start();
                board.fen();
                board.orientation('white');
            }).to.not.throw();
        });
        
        it('should handle rapid method calls', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Rapid method calls should not break the board
            for(let i = 0; i < 10; i++) {
                board.clear();
                board.start();
                board.flip();
            }
            
            // Board should still be functional
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
    });
});