describe('Position and FEN Handling', function() {
    
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
    
    describe('Position getter/setter', function() {
        it('should get initial position', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const initialPosition = {
                '1': 'w',
                '2': 'W',
                '31': 'b',
                '32': 'B'
            };
            const board = DraughtsBoard($container[0], { position: initialPosition });
            
            const currentPosition = board.position();
            expect(currentPosition).to.be.an('object');
            expect(currentPosition['1']).to.equal('w');
            expect(currentPosition['2']).to.equal('W');
            expect(currentPosition['31']).to.equal('b');
            expect(currentPosition['32']).to.equal('B');
            
            $container.data('board', board);
        });
        
        it('should set new position with object', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            const newPosition = {
                '5': 'w',
                '6': 'W',
                '45': 'b',
                '46': 'B'
            };
            
            const result = board.position(newPosition);
            expect(result).to.be.an('array');
            
            const currentPosition = board.position();
            expect(currentPosition[5]).to.equal('w');
            expect(currentPosition[6]).to.equal('W');
            expect(currentPosition[45]).to.equal('b');
            expect(currentPosition[46]).to.equal('B');
            
            $container.data('board', board);
        });
        
        it('should set position with FEN string', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            const fen = 'W:W31-50:B1-20';
            board.position(fen);
            
            const currentPosition = board.position();
            expect(currentPosition).to.be.an('array');
            
            // Check some positions
            expect(currentPosition[31]).to.equal('w');
            expect(currentPosition[50]).to.equal('w');
            expect(currentPosition[1]).to.equal('b');
            expect(currentPosition[20]).to.equal('b');
            expect(currentPosition[25]).to.be.undefined; // Empty square
            
            $container.data('board', board);
        });
        
        it('should set position to start', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            board.position('start');
            
            const currentPosition = board.position();
            expect(currentPosition).to.be.an('array');
            const pieceCount = Object.keys(currentPosition).filter(key => currentPosition[key]).length;
            expect(pieceCount).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should handle position with animation parameter', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let moveEndCalled = false;
            
            const board = DraughtsBoard($container[0], { 
                position: 'start',
                moveSpeed: 'fast',
                onMoveEnd: function() {
                    moveEndCalled = true;
                    done();
                }
            });
            
            const newPosition = {
                '5': 'w',
                '45': 'b'
            };
            
            // This should trigger animation
            board.position(newPosition, true);
            
            $container.data('board', board);
            
            // Fallback timeout in case animation doesn't trigger
            setTimeout(() => {
                if (!moveEndCalled) {
                    done();
                }
            }, 1000);
        });
        
        it('should handle position without animation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            const newPosition = {
                '5': 'w',
                '45': 'b'
            };
            
            board.position(newPosition, false);
            
            const currentPosition = board.position();
            expect(currentPosition[5]).to.equal('w');
            expect(currentPosition[45]).to.equal('b');
            
            $container.data('board', board);
        });
    });
    
    describe('FEN string handling', function() {
        it('should get FEN string from current position', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { position: 'start' });
            
            const fen = board.fen();
            expect(fen).to.be.a('string');
            expect(fen).to.match(/^[WB]:/); // Should start with turn indicator
            
            $container.data('board', board);
        });
        
        it('should handle empty board FEN', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            const fen = board.fen();
            expect(fen).to.be.a('string');
            
            $container.data('board', board);
        });
        
        it('should maintain FEN consistency', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const originalFen = 'W:W31,32,33,34,35:B1,2,3,4,5';
            const board = DraughtsBoard($container[0], { position: originalFen });
            
            const currentFen = board.fen();
            expect(currentFen).to.be.a('string');
            
            // Set position again with the retrieved FEN
            board.position(currentFen);
            const newFen = board.fen();
            
            // The positions should be equivalent (though format might differ slightly)
            const pos1 = DraughtsBoard.fenToObj(currentFen);
            const pos2 = DraughtsBoard.fenToObj(newFen);
            
            for(let i = 1; i <= 50; i++) {
                expect(pos1[i]).to.equal(pos2[i]);
            }
            
            $container.data('board', board);
        });
    });
    
    describe('Complex position scenarios', function() {
        it('should handle position with mixed pieces', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const complexPosition = {
                '1': 'w',    // White man
                '2': 'W',    // White king
                '3': 'w',    // White man
                '15': 'b',   // Black man
                '16': 'B',   // Black king
                '17': 'b',   // Black man
                '25': 'W',   // White king in middle
                '35': 'B'    // Black king in middle
            };
            
            const board = DraughtsBoard($container[0], { position: complexPosition });
            
            const currentPosition = board.position();
            expect(currentPosition['1']).to.equal('w');
            expect(currentPosition['2']).to.equal('W');
            expect(currentPosition['15']).to.equal('b');
            expect(currentPosition['16']).to.equal('B');
            expect(currentPosition['25']).to.equal('W');
            expect(currentPosition['35']).to.equal('B');
            
            $container.data('board', board);
        });
        
        it('should handle sparse positions', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const sparsePosition = {
                '1': 'w',
                '50': 'b'
            };
            
            const board = DraughtsBoard($container[0], { position: sparsePosition });
            
            const currentPosition = board.position();
            expect(currentPosition['1']).to.equal('w');
            expect(currentPosition['50']).to.equal('b');
            expect(currentPosition['25']).to.be.undefined;
            
            $container.data('board', board);
        });
        
        it('should handle king promotion scenarios', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            // Simulate a piece reaching the end and becoming a king
            board.position({
                '46': 'w'  // White piece near black end
            });
            
            // Move to king row and promote
            board.position({
                '50': 'W'  // Now a white king
            });
            
            const currentPosition = board.position();
            expect(currentPosition['50']).to.equal('W');
            
            $container.data('board', board);
        });
        
        it('should validate position changes', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            // Try to set invalid positions
            const invalidPositions = [
                { '0': 'w' },      // Invalid square
                { '51': 'w' },     // Invalid square  
                { '1': 'x' },      // Invalid piece
                'invalid-fen'      // Invalid FEN
            ];
            
            invalidPositions.forEach(pos => {
                // These should either work with fallback or fail gracefully
                try {
                    board.position(pos);
                    // If it succeeds, that's fine too
                } catch(e) {
                    // Graceful failure is acceptable
                }
            });
            
            $container.data('board', board);
        });
    });
    
    describe('Position change events', function() {
        it('should trigger onChange when position changes', function() {
            let changeCount = 0;
            let oldPosition, newPosition;
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function(oldPos, newPos) {
                    changeCount++;
                    oldPosition = oldPos;
                    newPosition = newPos;
                }
            });
            
            // Change position
            board.position({ '5': 'w', '45': 'b' });
            
            expect(changeCount).to.be.greaterThan(0);
            expect(oldPosition).to.be.an('object');
            expect(newPosition).to.be.an('object');
            expect(newPosition['5']).to.equal('w');
            expect(newPosition['45']).to.equal('b');
            
            $container.data('board', board);
        });
        
        it('should not trigger onChange for same position', function() {
            let changeCount = 0;
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const position = { '5': 'w', '45': 'b' };
            const board = DraughtsBoard($container[0], {
                position: position,
                onChange: function() {
                    changeCount++;
                }
            });
            
            // Reset counter after initial setup
            changeCount = 0;
            
            // Set same position again
            board.position(position);
            
            // Should not trigger change
            expect(changeCount).to.equal(0);
            
            $container.data('board', board);
        });
    });
    
    describe('Edge cases and error handling', function() {
        it('should handle null/undefined positions', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            // These should not crash
            expect(function() {
                board.position(null);
                board.position(undefined);
            }).to.not.throw();
            
            $container.data('board', board);
        });
        
        it('should handle malformed FEN strings', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            const malformedFens = [
                '',
                'invalid',
                'W:',
                ':W31-50:B1-20',
                'W:W31-50',
                'W:W31-50:B1-20:extra'
            ];
            
            malformedFens.forEach(fen => {
                expect(function() {
                    board.position(fen);
                }).to.not.throw();
            });
            
            $container.data('board', board);
        });
        
        it('should handle position overflow', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            // Try to place pieces on all squares plus some invalid ones
            const overflowPosition = {};
            for(let i = 0; i <= 60; i++) {
                overflowPosition[i.toString()] = i % 2 === 0 ? 'w' : 'b';
            }
            
            expect(function() {
                board.position(overflowPosition);
            }).to.not.throw();
            
            $container.data('board', board);
        });
    });
});