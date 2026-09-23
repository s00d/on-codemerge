# Calendar Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Calendar Plugin provides comprehensive calendar and event management capabilities for the on-CodeMerge editor, allowing users to create, edit, and manage calendars with events through an intuitive interface.

## Features

- **Calendar Creation**: Create multiple calendars with custom titles and descriptions
- **Event Management**: Add, edit, and delete events within calendars
- **Event Details**: Rich event information including title, description, date, time, duration, location, and color
- **All-Day Events**: Support for all-day events
- **Visual Calendar Widget**: Beautiful calendar display with event list
- **Event Colors**: Custom color coding for events
- **Context Menu**: Right-click context menu for quick actions on calendars and events
- **Copy & Duplicate**: Copy calendars and events with automatic naming
- **Export/Import**: Export and import calendar data in JSON format
- **Data Persistence**: Automatic saving to localStorage
- **Keyboard Shortcuts**: Quick access to calendar functions
- **Toolbar Integration**: Easy access via toolbar button
- **User Notifications**: Built-in notification system for user feedback
- **Responsive Design**: Works seamlessly on all screen sizes
- **Dark Mode Support**: Automatic theme adaptation

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, CalendarPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CalendarPlugin());
```

## Demo
## User Interface

### Toolbar Button
The plugin adds a calendar button to the editor toolbar. Click it to open the calendar creation menu.

### Context Menu
Right-click on any calendar or event to access the context menu with the following options:

#### Calendar Actions
- **Add Event**: Create a new event in the calendar
- **Edit Calendar**: Modify calendar title and description
- **Copy Calendar**: Duplicate the calendar with all its events
- **Export Calendar**: Download calendar data as JSON file
- **Import Calendar**: Import calendar data from JSON file
- **Delete Calendar**: Remove the calendar and all its events

#### Event Actions
- **Edit Event**: Modify event details
- **Copy Event**: Duplicate the event
- **Delete Event**: Remove the event from calendar

### Modal Forms
The plugin uses modal forms for creating and editing calendars and events:

- **Calendar Form**: Simple form for calendar title and description
- **Event Form**: Comprehensive form with all event fields including validation


_…trimmed for the v1 archive. See source history for the full guide._
