# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Added
- **AI Assistant Plugin**: New plugin with configurable options for AI-powered assistance
- **Calendar Plugin**: Complete calendar management system with events, reminders, and categories
- **Language Plugin**: Multi-language support with language switching capabilities
- **Responsive Plugin**: Enhanced responsive design tools with viewport management
- **Timer Plugin**: Countdown and countup timer functionality with export/import capabilities
- **Block Plugin**: Advanced block management with split, merge, duplicate, and delete operations
- **Lazy Table Support**: New lazy table functionality with data filling and editing capabilities
- **Enhanced Table Plugin**: 
  - New table commands for responsive design and styling
  - Cell formatting and border management
  - Table export/import functionality
  - Enhanced table context menu
- **Notification System**: New notification manager for user feedback
- **Enhanced Documentation**: 
  - Complete plugin documentation
  - Integration guides for various frameworks
  - Plugin development guide
- **Localization**: Complete translation support for 18 languages including:
  - Arabic, Czech, German, Spanish, French, Hindi, Indonesian
  - Italian, Japanese, Korean, Dutch, Polish, Portuguese
  - Russian, Thai, Turkish, Vietnamese, Chinese
- **New Icons**: Calendar, globe, lazy table, and timer icons
- **Locale Management**: Script for checking and synchronizing translation keys

### Changed
- **Core Architecture**: 
  - Renamed `TableSelection` to `Selector` for improved clarity
  - Enhanced container parameter handling in Selector
  - Updated content change callbacks type definitions
- **Shortcuts System**: Streamlined shortcut management and removed constants file
- **Charts Plugin**: Added option to hide popup during chart editing
- **Dark Mode**: Enhanced dark mode styles for various components
- **Code Style**: Improved consistency with proper semicolons and formatting

### Fixed
- **Code Style**: Corrected inconsistencies in hotkeys definition
- **Translation Keys**: Synchronized all translation keys across 18 language files
- **Missing Translations**: Added comprehensive timer and table-related translations

### Technical Improvements
- **Testing**: Added comprehensive test suites for plugins
- **Type Safety**: Enhanced TypeScript type definitions
- **Performance**: Optimized plugin loading and execution
- **Accessibility**: Improved keyboard navigation and screen reader support

## [1.0.28] - 2024-12-19

### Added
- AI Assistant plugin with configurable options
- Container parameter to Selector for improved range handling

### Changed
- Enhanced dark mode styles for various components

### Fixed
- Code style inconsistencies in hotkeys definition
- Missing semicolons for consistency

## [Previous Versions]

For earlier versions, please refer to the git history and commit messages.

---

## Contributing

When contributing to this project, please update this changelog with your changes following the format above.

### Categories

- **Added**: for new features
- **Changed**: for changes in existing functionality
- **Deprecated**: for soon-to-be removed features
- **Removed**: for now removed features
- **Fixed**: for any bug fixes
- **Security**: in case of vulnerabilities 