# Changelog

All notable changes to the draughtsboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-01-13

### Added
- Comprehensive JSDoc type annotations for better TypeScript support
- Enhanced FEN parsing with support for mixed notation (kings and ranges in same section)
- Visual error notification system replacing blocking window.alert dialogs
- Comprehensive test suite with 300+ test cases covering edge cases and performance
- Animation safety checks and timeout mechanisms
- Performance optimizations with throttling for resize events and position updates
- Input validation and boundary checking for all configuration options

### Fixed
- **Breaking**: FEN parsing now correctly handles mixed notation like `W:WK1,2-5:BK31,32-35`
- **Breaking**: Position methods now consistently return objects with string keys instead of sparse arrays
- Event handler error handling with try-catch wrappers to prevent crashes
- Invalid square validation (now properly validates 1-50 range instead of 0-50)
- Animation concurrency issues and potential memory leaks
- Window resize efficiency and performance under stress testing
- CSS animation performance optimizations
- Position object filtering to handle invalid squares gracefully

### Changed
- **Breaking**: `fenToObj()` now returns objects with string keys (e.g., `{'1': 'w'}`) instead of arrays
- **Breaking**: `position()` method returns objects consistently across all use cases
- Improved error handling throughout the library with non-blocking notifications
- Enhanced validation functions with better edge case handling
- Optimized animation queueing and sequencing

### Technical Improvements
- Added comprehensive JSDoc documentation with TypeScript-compatible types
- Implemented robust error handling patterns throughout the codebase
- Added performance monitoring and optimization for common operations
- Enhanced test coverage with edge cases, performance tests, and integration tests
- Improved code documentation and inline comments

### Migration Guide
If upgrading from a previous version:
1. **Position Objects**: Update code expecting arrays from `position()` or `fenToObj()` to use objects with string keys
2. **FEN Parsing**: Mixed notation FENs now parse correctly - verify your FEN strings work as expected
3. **Error Handling**: Replace any custom error handling for draughtsboard errors as the library now handles them internally

## [0.2.0] - 2024-12-XX

### Added
- Comprehensive test suite with 300+ test cases
- Support for various piece themes and board configurations
- Enhanced animation controls and customization options

### Fixed
- Various bugs and stability improvements
- Performance optimizations

### Changed
- Default piece theme set to 'unicode' for better compatibility
- Improved documentation and examples

## [0.1.1] - Previous Release

### Added
- Basic draughts board functionality
- Drag and drop support  
- FEN notation support
- Animation system
- Event callback system

### Features
- Interactive draughts/checkers board
- Support for standard 10x10 International draughts
- Piece movement and animation
- Board orientation control
- Spare pieces functionality
- Customizable piece themes

## [0.1.0] - Initial Release

### Added
- Core draughts board implementation
- Basic position management
- jQuery-based DOM manipulation
- CSS styling system
- AMD and CommonJS module support

---

## Version History Summary

- **v0.3.0**: Major improvements with breaking changes - enhanced FEN parsing, comprehensive TypeScript support, and robust error handling
- **v0.2.0**: Enhanced stability, comprehensive testing, and improved developer experience
- **v0.1.1**: Basic functionality with core features
- **v0.1.0**: Initial implementation

For more detailed information about specific changes, see the git commit history or the test files for examples of new functionality.