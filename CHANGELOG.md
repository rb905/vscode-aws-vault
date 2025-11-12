# Change Log

All notable changes to the "vscode-aws-vault" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.


## [0.0.4] - 2025-11-11

### Added
- Added support for "Run Without Debugging" (Ctrl+F5) in addition to regular debugging

### Changed
- Moved credential fetching to `resolveDebugConfigurationWithSubstitutedVariables` for better compatibility
- Removed `resolveDebugConfiguration` method to simplify code
- Updated session notification message to be more generic ("Starting session" instead of "Debug session")

## [0.0.3] - 2025-09-26

### Fixed
- Simplified debug credential fetching logic (removed --no-session, no fallback, single attempt)
- Improved error handling: debug session now terminates on credential fetch failure
- Updated error messages to be more actionable and concise

## [0.0.2] - 2025-04-09

### Added
- Added serverless example project to test the extension
- Added GitHub Actions CI/CD pipeline for automated testing and deployment

### Fixed
- Fixed credential fetching to only happen once during the lifecycle of debug

## [0.0.1]

- Initial release
