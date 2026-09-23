> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).

 # Timer Plugin

The Timer Plugin provides comprehensive countdown timer functionality for the on-CodeMerge editor, allowing users to create, edit, and manage countdown timers with real-time updates through an intuitive interface.

## Features

- **Timer Creation**: Create multiple countdown timers with custom titles and descriptions
- **Real-time Countdown**: Live countdown display with automatic updates every second
- **Timer Management**: Add, edit, and delete timers with full CRUD operations
- **Rich Timer Details**: Comprehensive timer information including title, description, target date/time, category, and tags
- **Visual Timer Widget**: Beautiful countdown display with days, hours, minutes, and seconds
- **Timer Colors**: Custom color coding for different timer categories
- **Context Menu**: Right-click context menu for quick actions on timers
- **Copy & Duplicate**: Copy timers with automatic naming
- **Export/Import**: Export and import timer data in JSON format
- **Data Persistence**: Automatic saving to localStorage
- **Keyboard Shortcuts**: Quick access to timer functions
- **Toolbar Integration**: Easy access via toolbar button
- **User Notifications**: Built-in notification system for user feedback
- **Responsive Design**: Works seamlessly on all screen sizes
- **Dark Mode Support**: Automatic theme adaptation
- **Expiration Handling**: Automatic display when timer expires

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, TimerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TimerPlugin());
```

## Demo
## User Interface

### Toolbar Button
The plugin adds a timer button to the editor toolbar. Click it to open the timer creation menu.

### Context Menu
Right-click on any timer to access the context menu with the following options:

#### Timer Actions
- **Edit Timer**: Modify timer details including title, description, target date/time, and category
- **Copy Timer**: Duplicate the timer with automatic naming
- **Export Timer**: Download timer data as JSON file
- **Import Timer**: Import timer data from JSON file
- **Delete Timer**: Remove the timer

### Modal Forms
The plugin uses modal forms for creating and editing timers:

- **Timer Form**: Comprehensive form with all timer fields including validation
- **Real-time Preview**: Live preview of countdown display during creation/editing


_…trimmed for the v1 archive. See source history for the full guide._
