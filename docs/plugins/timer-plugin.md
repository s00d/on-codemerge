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
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TimerPlugin']" />

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

## API Reference

### Timer Methods

```javascript
// Create a new timer
const timer = timerManager.createTimer({
  title: 'Project Deadline',
  description: 'Final submission deadline',
  targetDate: new Date('2024-12-31'),
  targetTime: '23:59',
  category: 'Work',
  tags: ['deadline', 'important']
});

// Get all timers
const timers = timerManager.getTimers();

// Get specific timer
const timer = timerManager.getTimer(timerId);

// Update timer
timerManager.updateTimer(timerId, {
  title: 'Updated Project Deadline',
  targetDate: new Date('2024-12-30')
});

// Delete timer
timerManager.deleteTimer(timerId);

// Copy timer (new feature)
const copiedTimer = timerManager.copyTimer(timerId);

// Export timer data
const exportData = timerManager.exportTimer(timerId);

// Import timer data
const newTimer = timerManager.importTimer(exportData);

// Get time left for a timer
const timeLeft = timerManager.getTimeLeft(timer);
console.log(`${timeLeft.days} days, ${timeLeft.hours} hours remaining`);
```

### Timer Data Structure

```typescript
interface Timer {
  id: string;           // Unique timer identifier
  title: string;        // Timer title
  description?: string; // Timer description
  targetDate: Date;     // Target date
  targetTime: string;   // Target time (HH:mm format)
  color?: string;       // Timer color (hex)
  category?: string;    // Timer category
  tags?: string[];      // Timer tags
  isActive: boolean;    // Timer active status
  createdAt: number;    // Creation timestamp
  updatedAt: number;    // Last update timestamp
}

interface TimerTimeLeft {
  days: number;         // Days remaining
  hours: number;        // Hours remaining
  minutes: number;      // Minutes remaining
  seconds: number;      // Seconds remaining
  isExpired: boolean;   // Whether timer has expired
}
```

### Form Data Interfaces

```typescript
interface CreateTimerData {
  title: string;
  description?: string;
  targetDate: Date;
  targetTime: string;
  color?: string;
  category?: string;
  tags?: string[];
}

interface UpdateTimerData {
  title?: string;
  description?: string;
  targetDate?: Date;
  targetTime?: string;
  color?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}
```

## Events

```javascript
// Listen to timer events
editor.on('timer:created', (timer) => {
  console.log('Timer created:', timer);
});

editor.on('timer:updated', (timer) => {
  console.log('Timer updated:', timer);
});

editor.on('timer:deleted', (timerId) => {
  console.log('Timer deleted:', timerId);
});

editor.on('timer:expired', (timer) => {
  console.log('Timer expired:', timer);
});
```

## Examples

### Basic Timer Usage

```html
<!-- Simple timer widget -->
<div class="timer-widget" data-timer-id="deadline-1">
  <div class="timer-header">
    <h3 class="timer-title">Project Deadline</h3>
    <div class="timer-category">Work</div>
  </div>
  <div class="timer-body">
    <div class="timer-countdown" id="timer-countdown-deadline-1">
      <div class="timer-unit">
        <span class="timer-value" id="timer-days-deadline-1">30</span>
        <span class="timer-label">days</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-hours-deadline-1">12</span>
        <span class="timer-label">hours</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-minutes-deadline-1">45</span>
        <span class="timer-label">min</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-seconds-deadline-1">30</span>
        <span class="timer-label">sec</span>
      </div>
    </div>
    <div class="timer-target">Until: 31 Dec 2024, 23:59</div>
  </div>
</div>
```

### Timer with Custom Styling

```html
<div class="timer-widget" 
     data-timer-id="urgent-deadline"
     style="--timer-color: #dc2626">
  <div class="timer-header">
    <h3 class="timer-title">Urgent Deadline</h3>
    <div class="timer-category">Critical</div>
  </div>
  <div class="timer-body">
    <div class="timer-countdown" id="timer-countdown-urgent-deadline">
      <!-- Countdown units -->
    </div>
    <div class="timer-target">Until: 15 Dec 2024, 18:00</div>
  </div>
</div>
```

### Working with Timer Manager

```javascript
// Create a timer with specific target
const timer = timerManager.createTimer({
  title: 'Meeting in 2 hours',
  description: 'Team sync meeting',
  targetDate: new Date('2024-01-15'),
  targetTime: '14:00',
  category: 'Meeting',
  tags: ['team', 'sync'],
  color: '#3b82f6'
});

// Copy a timer
const copiedTimer = timerManager.copyTimer(timer.id);
// Result: "Meeting in 2 hours (Copy)"

// Export timer for backup
const exportData = timerManager.exportTimer(timer.id);
// Save exportData to file or send to server

// Import timer from backup
const importedTimer = timerManager.importTimer(exportData);

// Check time remaining
const timeLeft = timerManager.getTimeLeft(timer);
if (timeLeft.isExpired) {
  console.log('Timer has expired!');
} else {
  console.log(`${timeLeft.days} days, ${timeLeft.hours} hours remaining`);
}
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, TimerPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new TimerPlugin());
      
      // Listen to timer events
      editorInstance.current.on('timer:created', (timer) => {
        console.log('New timer:', timer);
      });
      
      editorInstance.current.on('timer:expired', (timer) => {
        console.log('Timer expired:', timer);
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
import { HTMLEditor, TimerPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new TimerPlugin());
    
    // Listen to timer events
    this.editor.on('timer:expired', (timer) => {
      this.$notify({
        title: 'Timer Expired',
        message: `Timer "${timer.title}" has expired!`,
        type: 'warning'
      });
    });
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+D` | Insert timer | `timer` |

## Timer Widget Structure

### HTML Structure
```html
<div class="timer-widget" data-timer-id="timer-123">
  <div class="timer-header">
    <h3 class="timer-title">Project Deadline</h3>
    <div class="timer-category">Work</div>
  </div>
  <div class="timer-body">
    <div class="timer-countdown" id="timer-countdown-timer-123">
      <div class="timer-unit">
        <span class="timer-value" id="timer-days-timer-123">30</span>
        <span class="timer-label">days</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-hours-timer-123">12</span>
        <span class="timer-label">hours</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-minutes-timer-123">45</span>
        <span class="timer-label">min</span>
      </div>
      <div class="timer-unit">
        <span class="timer-value" id="timer-seconds-timer-123">30</span>
        <span class="timer-label">sec</span>
      </div>
    </div>
    <div class="timer-target">Until: 31 Dec 2024, 23:59</div>
    <div class="timer-tags">
      <span class="timer-tag">deadline</span>
      <span class="timer-tag">important</span>
    </div>
  </div>
</div>
```

### CSS Classes
- `.timer-widget`: Main timer container
- `.timer-header`: Header with title and category
- `.timer-title`: Timer title
- `.timer-category`: Timer category display
- `.timer-body`: Timer content area
- `.timer-countdown`: Countdown display container
- `.timer-unit`: Individual time unit (days, hours, minutes, seconds)
- `.timer-value`: Time value display
- `.timer-label`: Time unit label
- `.timer-target`: Target date/time display
- `.timer-tags`: Tags container
- `.timer-tag`: Individual tag
- `.timer-expired`: Expired timer display

## Styling

### Custom Timer Colors

```css
.timer-widget {
  --timer-primary-color: #3b82f6;
  --timer-secondary-color: #f3f4f6;
  --timer-border-color: #e5e7eb;
  --timer-color: #3b82f6; /* Default timer color */
}

.timer-widget[style*="--timer-color: #dc2626"] {
  --timer-color: #dc2626; /* Red for urgent timers */
}
```

### Custom Timer Styles

```css
.timer-widget {
  border-left: 4px solid var(--timer-color);
  background: linear-gradient(90deg, var(--timer-color, #3b82f6) 0%, transparent 100%);
  opacity: 0.1;
}

.timer-countdown {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.timer-unit {
  text-align: center;
  min-width: 60px;
}

.timer-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--timer-color);
}

.timer-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}
```

### Dark Mode Support

The plugin automatically adapts to dark mode when the `html.dark` class is present:

```css
html.dark .timer-widget {
  background: #1f2937;
  color: #f9fafb;
  border-color: #374151;
}

html.dark .timer-value {
  color: var(--timer-color);
}

html.dark .timer-label {
  color: #9ca3af;
}
```

## Real-time Updates

The timer plugin automatically updates countdown displays every second using embedded JavaScript:

```javascript
// Automatic timer update script (embedded in each timer)
(function() {
  const timerId = 'timer-123';
  const targetDate = new Date('2024-12-31T23:59:00');
  const expiredText = 'Time expired';
  
  function updateTimer() {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      // Timer expired
      const countdownEl = document.getElementById('timer-countdown-' + timerId);
      if (countdownEl) {
        countdownEl.innerHTML = '<div class="timer-expired">' + expiredText + '</div>';
      }
      return;
    }
    
    // Update countdown values
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update DOM elements
    document.getElementById('timer-days-' + timerId).textContent = days;
    document.getElementById('timer-hours-' + timerId).textContent = hours.toString().padStart(2, '0');
    document.getElementById('timer-minutes-' + timerId).textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds-' + timerId).textContent = seconds.toString().padStart(2, '0');
  }
  
  // Update every second
  updateTimer();
  setInterval(updateTimer, 1000);
})();
```

## Data Persistence

Timers are automatically saved to localStorage and persist between browser sessions:

```javascript
// Storage key: 'html-editor-timers'
// Data format: JSON array of timer objects
const timers = [
  {
    id: 'timer-123',
    title: 'Project Deadline',
    description: 'Final submission deadline',
    targetDate: '2024-12-31T23:59:00.000Z',
    targetTime: '23:59',
    color: '#3b82f6',
    category: 'Work',
    tags: ['deadline', 'important'],
    isActive: true,
    createdAt: 1703123456789,
    updatedAt: 1703123456789
  }
];
```

## Error Handling

The plugin includes comprehensive error handling for common scenarios:

```javascript
// Validation errors
try {
  const timer = timerManager.createTimer({
    title: '', // Empty title will throw error
    targetDate: new Date('2024-12-31'),
    targetTime: '23:59'
  });
} catch (error) {
  console.error('Timer creation failed:', error.message);
  // Shows: "Title is required"
}

// Timer not found
try {
  timerManager.updateTimer('non-existent-id', { title: 'New Title' });
} catch (error) {
  console.error('Timer update failed:', error.message);
  // Shows: "Timer not found"
}
```