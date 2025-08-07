describe('Board Initialization and Configuration', function() {
    
    beforeEach(function() {
        // Clean up any existing test boards
        $('#test-boards').empty();
    });
    
    afterEach(function() {
        // Clean up after each test
        $('#test-boards .test-board').each(function() {
            const $board = $(this);
            if($board.data('board') && $board.data('board').destroy) {
                $board.data('board').destroy();
            }
        });
        $('#test-boards').empty();
    });
    
    describe('Basic initialization', function() {
        it('should create a board with string ID', function() {
            const $container = $('<div id="test-board-1" class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard('test-board-1');
            
            expect(board).to.be.an('object');
            expect(board.position).to.be.a('function');
            expect(board.orientation).to.be.a('function');
            expect(board.flip).to.be.a('function');
            expect(board.clear).to.be.a('function');
            expect(board.destroy).to.be.a('function');
            expect(board.fen).to.be.a('function');
            expect(board.move).to.be.a('function');
            expect(board.resize).to.be.a('function');
            expect(board.start).to.be.a('function');
            
            $container.data('board', board);
        });
        
        it('should create a board with DOM element', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0]);
            
            expect(board).to.be.an('object');
            expect(board.position).to.be.a('function');
            
            $container.data('board', board);
        });
        
        it('should create a board with jQuery object', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container);
            
            expect(board).to.be.an('object');
            expect(board.position).to.be.a('function');
            
            $container.data('board', board);
        });
        
        it('should handle missing container gracefully', function() {
            // The library shows an alert but still returns a board object
            // However, the board won't be properly initialized
            const result = DraughtsBoard('non-existent-id');
            expect(result).to.be.an('object');
            expect(result.position).to.be.a('function');
        });
        
        it('should handle empty string ID gracefully', function() {
            // The library shows an alert but still returns a board object
            const result = DraughtsBoard('');
            expect(result).to.be.an('object');
            expect(result.position).to.be.a('function');
        });
    });
    
    describe('Configuration options', function() {
        it('should accept draggable configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { draggable: true });
            
            expect(board).to.be.an('object');
            
            // Check if draggable elements are present
            const $pieces = $container.find('.square-55d63');
            expect($pieces.length).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should accept position configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const position = {
                '1': 'w',
                '2': 'W',
                '31': 'b',
                '32': 'B'
            };
            const board = DraughtsBoard($container[0], { position: position });
            
            expect(board).to.be.an('object');
            expect(board.position()).to.be.an('array');
            
            $container.data('board', board);
        });
        
        it('should accept start position', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { position: 'start' });
            
            expect(board).to.be.an('object');
            const currentPosition = board.position();
            expect(currentPosition).to.be.an('array');
            
            // Should have pieces in starting positions
            const pieceCount = Object.keys(currentPosition).filter(key => currentPosition[key]).length;
            expect(pieceCount).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should accept orientation configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { orientation: 'black' });
            
            expect(board).to.be.an('object');
            expect(board.orientation()).to.equal('black');
            
            $container.data('board', board);
        });
        
        it('should accept pieceTheme configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { 
                position: 'start',
                pieceTheme: 'unicode'
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept showNotation configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { 
                showNotation: false
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept animation speed configurations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                moveSpeed: 'fast',
                snapSpeed: 100,
                appearSpeed: 'slow',
                trashSpeed: 50,
                snapbackSpeed: 'fast'
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept dropOffBoard configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                dropOffBoard: 'trash'
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept sparePieces configuration', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                sparePieces: true
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
    });
    
    describe('Event handler configuration', function() {
        it('should accept onChange handler', function() {
            let changeCount = 0;
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function(oldPos, newPos) {
                    changeCount++;
                    expect(oldPos).to.be.an('array');
                    expect(newPos).to.be.an('array');
                }
            });
            
            expect(board).to.be.an('object');
            
            // Trigger a change
            board.clear();
            expect(changeCount).to.be.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should accept onDragStart handler', function() {
            let dragStartCalled = false;
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDragStart: function(source, piece, position, orientation) {
                    dragStartCalled = true;
                    expect(source).to.be.a('string');
                    expect(piece).to.be.a('string');
                    expect(position).to.be.an('object');
                    expect(orientation).to.be.a('string');
                }
            });
            
            expect(board).to.be.an('object');
            // Note: Actually triggering drag events would require more complex DOM manipulation
            
            $container.data('board', board);
        });
        
        it('should accept onDrop handler', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDrop: function(source, target, piece, newPos, oldPos, orientation) {
                    expect(source).to.be.a('string');
                    expect(target).to.be.a('string');
                    expect(piece).to.be.a('string');
                    expect(newPos).to.be.an('object');
                    expect(oldPos).to.be.an('object');
                    expect(orientation).to.be.a('string');
                }
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept mouse event handlers', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onMouseoverSquare: function(square, piece) {
                    expect(square).to.be.a('string');
                },
                onMouseoutSquare: function(square, piece) {
                    expect(square).to.be.a('string');
                }
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should accept animation event handlers', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onSnapEnd: function() {
                    // Snap animation completed
                },
                onSnapbackEnd: function() {
                    // Snapback animation completed
                },
                onMoveEnd: function() {
                    // Move animation completed
                }
            });
            
            expect(board).to.be.an('object');
            
            $container.data('board', board);
        });
    });
    
    describe('Error handling', function() {
        it('should handle invalid configuration gracefully', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            // These should not throw errors
            expect(function() {
                const board = DraughtsBoard($container[0], {
                    position: 'invalid-position',
                    orientation: 'invalid-orientation',
                    pieceTheme: null,
                    moveSpeed: -1
                });
                if(board && board.destroy) {
                    board.destroy();
                }
            }).to.not.throw();
        });
        
        it('should validate configuration parameters', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const validConfigs = [
                { orientation: 'white' },
                { orientation: 'black' },
                { draggable: true },
                { draggable: false },
                { showNotation: true },
                { showNotation: false },
                { pieceTheme: 'unicode' }
            ];
            
            validConfigs.forEach(config => {
                const board = DraughtsBoard($container[0], config);
                expect(board).to.be.an('object');
                if(board && board.destroy) {
                    board.destroy();
                }
            });
        });
    });
    
    describe('Board DOM structure', function() {
        it('should create proper board structure', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { position: 'start' });
            
            expect(board).to.be.an('object');
            
            // Check that board elements were created
            expect($container.find('.board-b72b1')).to.have.length(1);
            expect($container.find('.square-55d63')).to.have.length.greaterThan(0);
            
            $container.data('board', board);
        });
        
        it('should apply CSS classes correctly', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], { position: 'start' });
            
            expect(board).to.be.an('object');
            
            // Should have both light and dark squares
            expect($container.find('.white-1e1d7')).to.have.length.greaterThan(0);
            expect($container.find('.black-3c85d')).to.have.length.greaterThan(0);
            
            $container.data('board', board);
        });
    });
});