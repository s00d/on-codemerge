# Calendar Plugin

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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, CalendarPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [CalendarPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CalendarPlugin']" />

## Public API (v2)

Factory: `CalendarPlugin()`.

| Command          |                                    |
| ---------------- | ---------------------------------- |
| `insertCalendar` | `editor.command('insertCalendar')` |

### Keyboard shortcuts

| Shortcut    | Command          |
| ----------- | ---------------- |
| `Mod-Alt-l` | `insertCalendar` |

> **Note:** No public `calendarManager` API.

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

## Calendar Widget Structure

### HTML Structure

```html
<div class="calendar-widget" data-calendar-id="calendar-123">
  <div class="calendar-header">
    <h3 class="calendar-title">My Calendar</h3>
  </div>
  <div class="calendar-body">
    <div class="calendar-events">
      <div class="calendar-event" data-event-id="event-456" style="--event-color: #3b82f6">
        <div class="event-time">14:00</div>
        <div class="event-title">Team Meeting</div>
        <div class="event-description">Weekly team sync</div>
      </div>
    </div>
  </div>
</div>
```

### CSS Classes

- `.calendar-widget`: Main calendar container
- `.calendar-header`: Header with title
- `.calendar-title`: Calendar title
- `.calendar-body`: Calendar content area
- `.calendar-events`: Events list container
- `.calendar-event`: Individual event item
- `.event-time`: Event time display
- `.event-title`: Event title
- `.event-description`: Event description

## Event Data Structure

```typescript
interface CalendarEvent {
  id: string; // Unique event identifier
  title: string; // Event title
  description?: string; // Event description
  date: string; // Event date (YYYY-MM-DD)
  time: string; // Event time (HH:MM)
  duration?: number; // Duration in minutes
  location?: string; // Event location
  color?: string; // Event color (hex)
  isAllDay?: boolean; // All-day event flag
  createdAt: number; // Creation timestamp
  updatedAt: number; // Last update timestamp
}
```

## Calendar Data Structure

```typescript
interface Calendar {
  id: string; // Unique calendar identifier
  title: string; // Calendar title
  description?: string; // Calendar description
  events: CalendarEvent[]; // Array of events
  createdAt: number; // Creation timestamp
  updatedAt: number; // Last update timestamp
}
```

## Form Data Interfaces

```typescript
interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  duration?: number;
  location?: string;
  color?: string;
  isAllDay?: boolean;
}

interface CreateCalendarData {
  title: string;
  description?: string;
  events?: CreateEventData[];
}

interface UpdateEventData extends Partial<CreateEventData> {}

interface UpdateCalendarData extends Partial<CreateCalendarData> {}
```

## Examples

### Basic Calendar Usage

```html
<!-- Simple calendar widget -->
<div class="calendar-widget" data-calendar-id="personal">
  <div class="calendar-header">
    <h3 class="calendar-title">Personal Calendar</h3>
  </div>
  <div class="calendar-body">
    <div class="calendar-events">
      <div class="calendar-event" data-event-id="meeting-1">
        <div class="event-time">09:00</div>
        <div class="event-title">Morning Standup</div>
        <div class="event-description">Daily team sync</div>
      </div>
    </div>
  </div>
</div>
```

### Event with Custom Styling

```html
<div class="calendar-event" data-event-id="important-meeting" style="--event-color: #dc2626">
  <div class="event-time">15:30</div>
  <div class="event-title">Important Meeting</div>
  <div class="event-description">Client presentation</div>
</div>
```

### Working with Calendar Manager

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { Editor, CalendarPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(CalendarPlugin());

      // Listen to calendar events
      editorInstance.current.on('calendar:created', (calendar) => {
        console.log('New calendar:', calendar);
      });
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return <div ref={editorRef} className="editor-container" />;
}
```

### Vue Integration

```vue
<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script>
import { Editor, CalendarPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this./* use plugins: [CalendarPlugin()] in Editor(...) */;
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Styling

### Custom Calendar Colors

```css
.calendar-widget {
  --calendar-primary-color: #3b82f6;
  --calendar-secondary-color: #f3f4f6;
  --calendar-border-color: #e5e7eb;
}

.calendar-event {
  --event-color: #3b82f6; /* Default event color */
}
```

### Custom Event Styles

```css
.calendar-event {
  border-left: 4px solid var(--event-color);
  background: linear-gradient(90deg, var(--event-color, #3b82f6) 0%, transparent 100%);
  opacity: 0.1;
}
```

### Dark Mode Support

The plugin automatically adapts to dark mode when the `html.dark` class is present:

```css
html.dark .calendar-widget {
  background: #1f2937;
  color: #f9fafb;
  border-color: #374151;
}

html.dark .calendar-event {
  background: #374151;
  color: #f9fafb;
}
```

## Best Practices

### User Experience

- Use descriptive calendar and event titles
- Provide meaningful descriptions for events
- Use color coding to categorize events
- Set appropriate durations for events
- Include location information when relevant

### Data Management

- Regularly export important calendars as backup
- Use the copy feature to create templates
- Organize events with consistent naming conventions
- Use the import feature to restore from backups

### Performance

- Avoid creating too many events in a single calendar
- Use the date range queries for large datasets
- Consider archiving old calendars to improve performance

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
