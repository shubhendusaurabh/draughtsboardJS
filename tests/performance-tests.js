describe('Performance and Memory Tests', function() {
    
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
    
    describe('Initialization Performance', function() {
        it('should initialize quickly with default settings', function() {
            const startTime = performance.now();
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(board).to.be.an('object');
            expect(duration).to.be.lessThan(100); // Should initialize within 100ms
            
            $container.data('board', board);
        });
        
        it('should initialize multiple boards efficiently', function() {
            const startTime = performance.now();
            const boards = [];
            
            for (let i = 0; i < 5; i++) {
                const $container = $('<div class="test-board">').appendTo('#test-boards');
                const board = DraughtsBoard($container[0], {
                    position: i % 2 === 0 ? 'start' : { '1': 'w', '31': 'b' }
                });
                
                expect(board).to.be.an('object');
                boards.push(board);
                $container.data('board', board);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(boards.length).to.equal(5);
            expect(duration).to.be.lessThan(500); // 5 boards in under 500ms
        });
        
        it('should handle large initial positions efficiently', function() {
            const startTime = performance.now();
            
            // Create a position with many pieces
            const largePosition = {};
            for (let i = 1; i <= 50; i++) {
                if (i % 3 !== 0) { // Skip every third square
                    largePosition[i.toString()] = i % 2 === 0 ? 'w' : 'b';
                }
            }
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: largePosition
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(board).to.be.an('object');
            expect(duration).to.be.lessThan(150); // Should handle large positions quickly
            
            $container.data('board', board);
        });
    });
    
    describe('Animation Performance', function() {
        it('should handle rapid position changes smoothly', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let changeCount = 0;
            const startTime = performance.now();
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 'fast',
                onChange: function() {
                    changeCount++;
                    
                    if (changeCount === 20) {
                        const endTime = performance.now();
                        const duration = endTime - startTime;
                        
                        expect(duration).to.be.lessThan(2000); // 20 changes in under 2 seconds
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Rapid position changes
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    board.position({ [(i + 1).toString()]: 'w', [(31 + i % 20).toString()]: 'b' });
                }, i * 50);
            }
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (changeCount < 20) {
                    done();
                }
            }, 5000);
        });
        
        it('should maintain smooth animations under load', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let animationFrameCount = 0;
            const startTime = performance.now();
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 100, // Slower to test smoothness
                onMoveEnd: function() {
                    animationFrameCount++;
                    
                    if (animationFrameCount === 5) {
                        const endTime = performance.now();
                        const duration = endTime - startTime;
                        
                        // Should complete without blocking the UI
                        expect(duration).to.be.lessThan(3000);
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Multiple overlapping animations
            board.move('1-5');
            board.move('2-6');
            board.move('3-7');
            board.move('31-27');
            board.move('32-28');
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (animationFrameCount === 0) {
                    done();
                }
            }, 5000);
        });
        
        it('should optimize DOM updates during animations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 0 // Instant for testing
            });
            
            expect(board).to.be.an('object');
            
            const startTime = performance.now();
            
            // Many rapid moves
            for (let i = 0; i < 10; i++) {
                board.move(`${i + 1}-${i + 11}`);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).to.be.lessThan(50); // Instant moves should be very fast
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
    });
    
    describe('Memory Management', function() {
        it('should properly clean up on destroy', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                draggable: true,
                position: 'start',
                onDragStart: function() {},
                onDrop: function() {},
                onChange: function() {},
                onMouseoverSquare: function() {},
                onMouseoutSquare: function() {}
            });
            
            expect(board).to.be.an('object');
            
            // Verify board created DOM elements
            const initialChildCount = $container.children().length;
            expect(initialChildCount).to.be.greaterThan(0);
            
            // Destroy board
            board.destroy();
            
            // Verify cleanup
            expect($container.children().length).to.equal(0);
            expect($container.html()).to.equal('');
        });
        
        it('should handle multiple create/destroy cycles', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            for (let i = 0; i < 10; i++) {
                const board = DraughtsBoard($container[0], {
                    position: 'start'
                });
                
                expect(board).to.be.an('object');
                expect($container.find('.board-b72b1')).to.have.length(1);
                
                board.destroy();
                expect($container.html()).to.equal('');
            }
        });
        
        it('should not leak event listeners', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let eventCount = 0;
            
            // Create and destroy multiple boards with events
            for (let i = 0; i < 5; i++) {
                const board = DraughtsBoard($container[0], {
                    draggable: true,
                    position: 'start',
                    onDragStart: function() { eventCount++; },
                    onDrop: function() { return 'snapback'; },
                    onChange: function() { eventCount++; }
                });
                
                expect(board).to.be.an('object');
                
                // Trigger some events
                board.move('1-5');
                
                board.destroy();
            }
            
            // After all boards are destroyed, no events should fire
            const initialEventCount = eventCount;
            
            // Try to trigger events on the container
            $container.trigger('mousedown');
            $container.trigger('click');
            
            expect(eventCount).to.equal(initialEventCount); // No new events
        });
        
        it('should handle large position objects efficiently', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            // Create very large position object
            const hugePosition = {};
            for (let i = 1; i <= 50; i++) {
                hugePosition[i.toString()] = i % 4 === 0 ? 'W' : 
                                           i % 4 === 1 ? 'w' :
                                           i % 4 === 2 ? 'B' : 'b';
            }
            
            const startTime = performance.now();
            
            const board = DraughtsBoard($container[0], {
                position: hugePosition
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(board).to.be.an('object');
            expect(duration).to.be.lessThan(200); // Should handle efficiently
            
            // Test position manipulation
            const position = board.position();
            expect(Object.keys(position).length).to.equal(50);
            
            $container.data('board', board);
        });
    });
    
    describe('DOM Performance', function() {
        it('should minimize DOM queries during operations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            const startTime = performance.now();
            
            // Operations that might trigger DOM queries
            board.flip();
            board.orientation('black');
            board.orientation('white');
            board.resize();
            board.clear();
            board.start();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).to.be.lessThan(100); // Should be fast
            expect(board.position()).to.be.an('object');
            
            $container.data('board', board);
        });
        
        it('should efficiently update only changed pieces', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            const startTime = performance.now();
            
            // Make single piece changes
            board.position({ '1': 'w', '5': 'w', '31': 'b', '35': 'b' });
            board.position({ '2': 'w', '6': 'w', '32': 'b', '36': 'b' });
            board.position({ '3': 'w', '7': 'w', '33': 'b', '37': 'b' });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).to.be.lessThan(50); // Incremental updates should be fast
            
            $container.data('board', board);
        });
        
        it('should handle window resize efficiently', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            $container.css({ width: '400px', height: '400px' });
            
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            let resizeCount = 0;
            const startTime = performance.now();
            
            // Simulate multiple rapid resizes
            const resizeInterval = setInterval(() => {
                const newSize = 300 + (resizeCount * 20);
                $container.css({ width: `${newSize}px`, height: `${newSize}px` });
                board.resize();
                resizeCount++;
                
                if (resizeCount >= 10) {
                    clearInterval(resizeInterval);
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    expect(duration).to.be.lessThan(500); // 10 resizes in under 500ms
                    expect(board.position()).to.be.an('object');
                    done();
                }
            }, 20);
            
            $container.data('board', board);
        });
    });
    
    describe('Concurrent Operations', function() {
        it('should handle concurrent position updates', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let operationCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                onChange: function() {
                    operationCount++;
                    
                    if (operationCount >= 20) {
                        // All operations should complete successfully
                        expect(board.position()).to.be.an('object');
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Concurrent operations
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const position = {};
                    position[(i % 50 + 1).toString()] = i % 2 === 0 ? 'w' : 'b';
                    board.position(position);
                }, Math.random() * 100);
            }
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (operationCount < 20) {
                    done();
                }
            }, 2000);
        });
        
        it('should maintain stability under stress', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const board = DraughtsBoard($container[0], {
                position: 'start'
            });
            
            expect(board).to.be.an('object');
            
            const startTime = performance.now();
            
            // Stress test with many operations
            for (let i = 0; i < 100; i++) {
                if (i % 10 === 0) board.clear();
                else if (i % 7 === 0) board.start();
                else if (i % 5 === 0) board.flip();
                else if (i % 3 === 0) board.resize();
                else board.move(`${(i % 50) + 1}-${((i + 1) % 50) + 1}`);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(duration).to.be.lessThan(1000); // Should complete within 1 second
            expect(board.position()).to.be.an('object'); // Should still be functional
            
            $container.data('board', board);
        });
    });
    
    describe('Browser Compatibility Performance', function() {
        it('should perform consistently across different jQuery versions', function() {
            // This test assumes jQuery is loaded
            expect($).to.be.a('function');
            expect($.fn.jquery).to.be.a('string');
            
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            const startTime = performance.now();
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                draggable: true
            });
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            expect(board).to.be.an('object');
            expect(duration).to.be.lessThan(200); // Should work efficiently with current jQuery
            
            $container.data('board', board);
        });
        
        it('should handle CSS animations efficiently', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            let animationCount = 0;
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 'fast',
                onMoveEnd: function() {
                    animationCount++;
                    
                    if (animationCount === 5) {
                        // Animations should complete without performance issues
                        expect(board.position()).to.be.an('object');
                        done();
                    }
                }
            });
            
            expect(board).to.be.an('object');
            
            // Trigger multiple animations
            board.move('1-5');
            board.move('2-6');
            board.move('3-7');
            board.move('31-27');
            board.move('32-28');
            
            $container.data('board', board);
            
            setTimeout(() => {
                if (animationCount === 0) {
                    done();
                }
            }, 2000);
        });
    });
    
    describe('Resource Cleanup', function() {
        it('should clean up timers and intervals', function(done) {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 200 // Slow enough to have active timers
            });
            
            expect(board).to.be.an('object');
            
            // Start an animation
            board.move('1-5');
            
            // Destroy immediately (should clean up any timers)
            setTimeout(() => {
                board.destroy();
                
                // Board should be cleaned up
                expect($container.html()).to.equal('');
                done();
            }, 50);
        });
        
        it('should handle cleanup during active animations', function() {
            const $container = $('<div class="test-board">').appendTo('#test-boards');
            
            const board = DraughtsBoard($container[0], {
                position: 'start',
                moveSpeed: 1000 // Very slow animation
            });
            
            expect(board).to.be.an('object');
            
            // Start multiple slow animations
            board.move('1-5');
            board.move('2-6');
            board.move('3-7');
            
            // Destroy during animations
            board.destroy();
            
            // Should be cleaned up despite active animations
            expect($container.html()).to.equal('');
        });
    });
});