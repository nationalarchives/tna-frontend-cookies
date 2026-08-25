# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.5...HEAD)

### Added

- Added support for `preferencesSet` when all cookie preferences have been set

### Changed
### Deprecated
### Removed
### Fixed
### Security

## [0.1.5](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.4...v0.1.5) - 2026-07-28

### Fixed

- Removed `"type": "module"` from `package.json`

## [0.1.4](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.3...v0.1.4) - 2026-07-28

### Changed

- Updated `exports` in `package.json`
- Changed `isPreferenceAccepted` to `preference`

### Fixed

- Fixed spelling mistake `ensableAllPreferences` -> `enableAllPreferences`

## [0.1.3](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.2...v0.1.3) - 2026-07-28

### Changed

- Updated all references to "policy" to "preference", e.g. `policiesKey` (defaulting to `cookies_policy`) is now `preferencesKey` (defaulting to `cookie_preferences`)

## [0.1.2](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.1...v0.1.2) - 2026-07-24

### Changed

- Included compiled files in `dist`
- Changed from a `main` entrypoint in `package.json` to `exports`

## [0.1.1](https://github.com/nationalarchives/tna-frontend-cookies/compare/v0.1.0...v0.1.1) - 2026-07-24

### Changed

- IIFE added

## [0.1.0](https://github.com/nationalarchives/tna-frontend-cookies/releases/tag/v0.1.0) - 2026-07-24

- Initial release
