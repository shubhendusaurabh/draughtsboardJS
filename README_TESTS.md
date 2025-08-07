# DraughtsBoard Test Suite

This directory contains a comprehensive test suite for the DraughtsBoard JavaScript library, covering all aspects of functionality, performance, and edge cases.

## Test Structure

The test suite is organized into multiple test files, each focusing on specific aspects of the library:

### Core Test Files

1. **`utility-tests.js`** - Tests for utility functions
   - FEN to Object conversion (`DraughtsBoard.fenToObj()`)
   - Object to FEN conversion (`DraughtsBoard.objToFen()`)
   - Internal validation functions
   - Position validation

2. **`board-initialization-tests.js`** - Board creation and configuration
   - Basic initialization with different container types
   - Configuration options (draggable, position, orientation, etc.)
   - Event handler configuration
   - Error handling for invalid configurations
   - DOM structure creation

3. **`position-tests.js`** - Position management
   - Position getter/setter functionality
   - FEN string handling
   - Complex position scenarios
   - Position change events
   - Edge cases and error handling

4. **`interaction-tests.js`** - User interaction features
   - Drag and drop functionality
   - Mouse events (hover, click)
   - Touch and mobile support
   - Piece selection and highlighting
   - Event callback testing

5. **`animation-tests.js`** - Animation system
   - Move animations
   - Position change animations
   - Appear/disappear animations
   - Snap animations
   - Animation chaining and timing
   - Custom animation settings

6. **`method-tests.js`** - Board method functionality
   - All core methods (`clear`, `destroy`, `fen`, `flip`, `move`, etc.)
   - Method chaining and combinations
   - Error handling for method calls
   - State consistency across operations

### Advanced Test Files

7. **`integration-tests.js`** - Real-world scenarios
   - Full game workflow integration
   - Multi-board scenarios
   - External library integration
   - Performance under realistic conditions

8. **`performance-tests.js`** - Performance and memory testing
   - Initialization performance
   - Animation performance
   - Memory management
   - DOM performance optimization
   - Concurrent operations
   - Resource cleanup

9. **`edge-case-tests.js`** - Boundary and edge case testing
   - Boundary square tests (squares 1 and 50)
   - Invalid input handling
   - Malformed FEN notation
   - Container edge cases
   - Event handler edge cases
   - Memory boundary tests

## Running the Tests

### Browser Testing (Recommended)

1. **Open test.html directly:**
   ```bash
   # On macOS
   open test.html
   
   # On Linux
   xdg-open test.html
   
   # On Windows
   start test.html
   ```

2. **Using npm script:**
   ```bash
   npm test
   ```

3. **Using a local server:**
   ```bash
   npm run test:server
   # Then open http://localhost:8080/test.html in your browser
   ```

### Test Environment

The tests use:
- **Mocha** v10.2.0 - Test framework
- **Chai** v4.3.10 - Assertion library  
- **jQuery** v3.6.0 - DOM manipulation (required by DraughtsBoard)

All dependencies are loaded from CDN in the test.html file.

## Test Coverage

The test suite provides comprehensive coverage across:

### Functional Areas
- ✅ Board initialization and configuration
- ✅ Position management (objects and FEN strings)
- ✅ Drag and drop interactions
- ✅ Animation systems
- ✅ All board methods
- ✅ Event handling
- ✅ Utility functions

### Quality Aspects
- ✅ Performance testing
- ✅ Memory leak detection
- ✅ Error handling
- ✅ Edge cases and boundary conditions
- ✅ Cross-browser compatibility considerations
- ✅ Real-world usage scenarios

### Test Categories
- **Unit Tests** - Individual function testing
- **Integration Tests** - Component interaction testing
- **Performance Tests** - Speed and memory efficiency
- **Edge Case Tests** - Boundary conditions and error scenarios
- **User Experience Tests** - Real-world usage patterns

## Test Statistics

The complete test suite includes:
- **300+** individual test cases
- **9** test files covering different aspects
- **Comprehensive** coverage of all public APIs
- **Performance** benchmarks and memory testing
- **Edge case** handling for robustness

## Adding New Tests

When adding new tests:

1. Choose the appropriate test file based on functionality
2. Follow the existing test structure and naming conventions
3. Include both positive and negative test cases
4. Add performance considerations for complex features
5. Update this README if adding new test files

### Test File Template

```javascript
describe('Feature Name Tests', function() {
    
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
    
    describe('Specific Feature', function() {
        it('should handle normal case', function() {
            // Test implementation
        });
        
        it('should handle edge cases', function() {
            // Edge case testing
        });
    });
});
```

## Browser Compatibility

Tests are designed to work in:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Continuous Integration

The test suite is designed to be CI-friendly:
- All tests run in browser environment
- No external dependencies beyond CDN resources
- Deterministic test results
- Comprehensive error reporting

## Performance Benchmarks

Key performance targets verified by tests:
- **Initialization:** < 100ms for standard board
- **Position Changes:** < 50ms for typical updates  
- **Animations:** Smooth 60fps performance
- **Memory:** No leaks after destroy()
- **DOM Updates:** Optimized for minimal reflow

For detailed performance results, run the performance test suite and check browser dev tools.