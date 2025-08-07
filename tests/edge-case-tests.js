describe('Edge Cases and Boundary Tests', function() {
    
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
    
    describe('Boundary Square Tests', function() {
        it('should handle moves to edge squares correctly', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '5': 'w', '46': 'b' }
            });
            
            expect(board).to.be.an('object');
            
            // Test moves to boundary squares (1, 5, 46, 50)
            board.move('5-1'); // Move to square 1 (edge)
            board.move('46-50'); // Move to square 50 (edge)
            
            const position = board.position();
            expect(position['1']).to.equal('w');
            expect(position['50']).to.equal('b');
            expect(position['5']).to.be.undefined;
            expect(position['46']).to.be.undefined;
            
            $container.data('board', board);
        });
        
        it('should validate square numbers at boundaries', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Test with boundary and invalid square numbers
            const testPositions = [
                { '0': 'w' },    // Invalid (too low)
                { '1': 'w' },    // Valid boundary
                { '50': 'b' },   // Valid boundary
                { '51': 'b' },   // Invalid (too high)
                { '-1': 'w' },   // Invalid (negative)
                { '100': 'b' }   // Invalid (too high)
            ];
            
            testPositions.forEach(pos => {
                expect(function() {
                    board.position(pos);
                }).to.not.throw();
                
                // Valid positions should be set, invalid ones should be ignored
                const currentPos = board.position();
                if (pos['1']) expect(currentPos['1']).to.equal('w');
                if (pos['50']) expect(currentPos['50']).to.equal('b');
            });
            
            $container.data('board', board);
        });
        
        it('should handle king promotion at board edges', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: {
                    '46': 'w', // White piece near promotion square
                    '5': 'b'   // Black piece near promotion square
                }
            });
            
            expect(board).to.be.an('object');
            
            // Promote pieces at edges
            board.position({
                '50': 'W', // White king at edge
                '1': 'B'   // Black king at edge
            });
            
            const position = board.position();
            expect(position['50']).to.equal('W');
            expect(position['1']).to.equal('B');
            
            $container.data('board', board);
        });
    });
    
    describe('Invalid Input Handling', function() {
        it('should handle null and undefined gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            expect(function() {
                const board = DraughtsBoard(null);
                if (board) board.destroy();
            }).to.not.throw();
            
            expect(function() {
                const board = DraughtsBoard(undefined);
                if (board) board.destroy();
            }).to.not.throw();
            
            expect(function() {
                const board = DraughtsBoard($container[0], null);
                if (board) board.destroy();
            }).to.not.throw();
            
            expect(function() {
                const board = DraughtsBoard($container[0], undefined);
                if (board && board.destroy) board.destroy();
            }).to.not.throw();
        });
        
        it('should handle malformed configuration objects', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const malformedConfigs = [
                { position: function() { return 'start'; } },
                { orientation: 123 },
                { draggable: 'maybe' },
                { moveSpeed: {} },
                { onDrop: 'not a function' },
                { pieceTheme: [] },
                { showNotation: null }
            ];
            
            malformedConfigs.forEach(config => {
                expect(function() {
                    const board = DraughtsBoard($container[0], config);
                    if (board && board.destroy) {
                        board.destroy();
                    }
                }).to.not.throw();
            });
        });
        
        it('should handle circular references in configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const circularConfig = {};
            circularConfig.self = circularConfig;
            circularConfig.position = 'start';
            
            expect(function() {
                const board = DraughtsBoard($container[0], circularConfig);
                if (board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
        
        it('should handle extremely large configuration objects', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const largeConfig = {
                position: 'start',
                orientation: 'white'
            };
            
            // Add many irrelevant properties
            for (let i = 0; i < 1000; i++) {
                largeConfig[`irrelevant${i}`] = `value${i}`;
            }
            
            expect(function() {
                const board = DraughtsBoard($container[0], largeConfig);
                expect(board).to.be.an('object');
                if (board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
    });
    
    describe('FEN Edge Cases', function() {
        it('should handle empty FEN components', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const edgeCaseFens = [
                'W::', // Empty position
                'B::', // Empty position, black to move
                'W:W:', // White pieces only
                'W::B', // Black pieces only
                'W:W1:' // Incomplete
            ];
            
            edgeCaseFens.forEach(fen => {
                expect(function() {
                    board.position(fen);
                }).to.not.throw();
            });
            
            $container.data('board', board);
        });
        
        it('should handle malformed FEN notation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const malformedFens = [
                '',
                'X:W31-50:B1-20', // Invalid turn indicator
                'W:X31-50:B1-20', // Invalid piece notation
                'W:W31-50:X1-20', // Invalid piece notation
                'W:W31-70:B1-20', // Invalid square numbers
                'W:W31--50:B1-20', // Double dash
                'W W31-50 B1-20', // Missing colons
                'W:W31-50:B1-20:extra', // Too many parts
                'incomplete'
            ];
            
            malformedFens.forEach(fen => {
                expect(function() {
                    board.position(fen);
                    const result = DraughtsBoard.fenToObj(fen);
                    // Should either return false or handle gracefully
                }).to.not.throw();
            });
            
            $container.data('board', board);
        });
        
        it('should handle FEN with invalid piece ranges', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const invalidRangeFens = [
                'W:W60-70:B1-20', // Invalid range
                'W:W50-31:B1-20',   // Backwards range
                'W:W31-1000:B1-20', // Huge range
                'W:W-5-5:B1-20',   // Negative numbers
                'W:Wa-z:B1-20'     // Non-numeric
            ];
            
            invalidRangeFens.forEach(fen => {
                expect(function() {
                    const result = DraughtsBoard.fenToObj(fen);
                    if (result !== false) {
                        board.position(result);
                    }
                }).to.not.throw();
            });
            
            $container.data('board', board);
        });
    });
    
    describe('Move Notation Edge Cases', function() {
        it('should handle invalid move notation', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w', '31': 'b' }
            });
            
            expect(board).to.be.an('object');
            
            const invalidMoves = [
                '',
                '1',
                '1-',
                '-5',
                'a1-a5',
                '1-99',
                '0-5',
                '51-55',
                '1x',
                'x5',
                '1--5',
                '1xx5',
                'move',
                null,
                undefined,
                123,
                {},
                []
            ];
            
            const originalPosition = board.position();
            
            invalidMoves.forEach(move => {
                expect(function() {
                    board.move(move);
                }).to.not.throw();
            });
            
            // Position should remain unchanged after invalid moves
            const newPosition = board.position();
            expect(JSON.stringify(newPosition)).to.equal(JSON.stringify(originalPosition));
            
            $container.data('board', board);
        });
        
        it('should handle moves with extreme square numbers', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: { '1': 'w' }
            });
            
            expect(board).to.be.an('object');
            
            const extremeMoves = [
                '1-999999',
                '1--999999',
                '999999-1',
                '0-50',
                '51-1',
                '1-0'
            ];
            
            const originalPosition = board.position();
            
            extremeMoves.forEach(move => {
                expect(function() {
                    board.move(move);
                }).to.not.throw();
            });
            
            // Should handle gracefully without breaking
            const newPosition = board.position();
            expect(newPosition).to.be.an('object');
            
            $container.data('board', board);
        });
    });
    
    describe('Container Edge Cases', function() {
        it('should handle containers with unusual CSS', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            // Apply unusual CSS that might break layout
            $container.css({
                'position': 'fixed',
                'top': '-1000px',
                'left': '-1000px',
                'width': '1px',
                'height': '1px',
                'transform': 'rotate(45deg) scale(0.1)',
                'opacity': '0',
                'z-index': '-1',
                'display': 'inline',
                'float': 'right',
                'overflow': 'hidden'
            });
            
            expect(function() {
                const board = DraughtsBoard($container[0], {
                    position: 'start'
                });
                
                expect(board).to.be.an('object');
                
                // Should still create board structure
                expect($container.find('.board-b72b1')).to.have.length(1);
                
                if (board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
        
        it('should handle detached containers', function() {
            const $container = $('<div class="test-board">'); // Not appended to DOM
            
            expect(function() {
                const board = DraughtsBoard($container[0], {
                    position: 'start'
                });
                
                if (board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
        
        it('should handle containers that are removed during initialization', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            expect(function() {
                // Start initialization
                const board = DraughtsBoard($container[0], {
                    position: 'start'
                });
                
                // Remove container during/after initialization
                $container.remove();
                
                if (board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
        
        it('should handle nested container structures', function() {
            const $outerContainer = $('<div class="outer">').appendTo('#test-boards');
            const $innerContainer = $('<div class="test-board">').appendTo($outerContainer);
            
            const board = DraughtsBoard($innerContainer[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            expect($innerContainer.find('.board-b72b1')).to.have.length(1);
            
            $outerContainer.data('board', board);
        });
    });
    
    describe('Event Handler Edge Cases', function() {
        it('should handle event handlers that throw errors', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            expect(function() {
                const board = DraughtsBoard($container[0], {
                    draggable: true,
                    position: 'start',
                    onDragStart: function() {
                        throw new Error('Handler error');
                    },
                    onDrop: function() {
                        throw new Error('Drop error');
                    },
                    onChange: function() {
                        throw new Error('Change error');
                    }
                });
                
                expect(board).to.be.an('object');
                
                // Operations should still work despite handler errors
                board.move('1-5');
                board.clear();
                board.start();
                
                $container.data('board', board);
            }).to.not.throw();
        });
        
        it('should handle event handlers that return unexpected values', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const board = DraughtsBoard($container[0], {
                draggable: function() {
                    return 'maybe'; // Invalid return value
                },
                position: 'start',
                onDrop: function() {
                    return { invalid: 'object' }; // Invalid return value
                },
                onChange: function() {
                    return false; // Unexpected return value
                }
            });
            
            expect(board).to.be.an('object');
            
            // Board should still function
            board.move('1-5');
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should handle recursive event handler calls', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let callCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function(oldPos, newPos) {
                    callCount++;
                    
                    // Prevent infinite recursion
                    if (callCount < 3) {
                        board.position({ [callCount.toString()]: 'w' });
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Should handle recursive calls without crashing
            board.move('1-5');
            expect(callCount).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
    });
    
    describe('Timing and Race Conditions', function() {
        it('should handle rapid method calls', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            // Rapid fire method calls
            for (let i = 0; i < 50; i++) {
                board.clear();
                board.start();
                board.flip();
                board.resize();
                board.move('1-5');
                board.position({ '1': 'w' });
            }
            
            // Board should still be functional
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should handle destroy during active operations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 500 // Slow animation
            });
            
            expect(board).to.be.an('object');
            
            // Start operations
            board.move('1-5');
            board.position('start', true);
            
            // Destroy immediately
            expect(function() {
                board.destroy();
            }).to.not.throw();
            
            // Container should be cleaned up
            expect($container.html()).to.equal('');
        });
        
        it('should handle position changes during animations', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let changeCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 200,
                onChange: function() {
                    changeCount++;
                }
            });
            
            expect(board).to.be.an('object');
            
            // Start animation
            board.move('1-5');
            
            // Change position during animation
            setTimeout(() => {
                board.position({ '10': 'w', '40': 'b' });
            }, 50);
            
            setTimeout(() => {
                board.clear();
            }, 100);
            
            setTimeout(() => {
                expect(changeCount).to.be.greaterThan(0);
                expect(board.position()).to.be.an('object');
                done();
            }, 400);
            
            $container.data('board', board);
        });
    });
    
    describe('Memory Boundary Tests', function() {
        it('should handle extremely large position objects', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            // Create position with valid and invalid squares
            const largePosition = {};
            for (let i = -100; i <= 200; i++) {
                largePosition[i.toString()] = i % 4 === 0 ? 'w' : 
                                            i % 4 === 1 ? 'W' :
                                            i % 4 === 2 ? 'b' : 'B';
            }
            
            expect(function() {
                board.position(largePosition);
                const currentPos = board.position();
                expect(currentPos).to.be.an('object');
            }).to.not.throw();
            
            $container.data('board', board);
        });
        
        it('should handle position objects with unusual property types', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            
            const weirdPosition = {
                '1': 'w',
                '2': null,
                '3': undefined,
                '4': 123,
                '5': {},
                '6': [],
                '7': function() {},
                '8': 'w',
                'invalid': 'b',
                '': 'w',
                ' ': 'b'
            };
            
            expect(function() {
                board.position(weirdPosition);
                const currentPos = board.position();
                expect(currentPos).to.be.an('object');
            }).to.not.throw();
            
            $container.data('board', board);
        });
    });
});