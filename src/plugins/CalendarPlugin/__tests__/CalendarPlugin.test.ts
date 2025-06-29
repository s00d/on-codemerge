import { CalendarPlugin } from '../index';
import { HTMLEditor } from '../../../core/HTMLEditor';

describe('CalendarPlugin', () => {
  let plugin: CalendarPlugin;
  let editor: HTMLEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new HTMLEditor(container);
    plugin = new CalendarPlugin();
  });

  afterEach(() => {
    plugin.destroy();
    editor.destroy();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(plugin.name).toBe('calendar');
    });

    it('should have hotkeys defined', () => {
      expect(plugin.hotkeys).toHaveLength(1);
      expect(plugin.hotkeys[0].keys).toBe('Ctrl+Alt+C');
      expect(plugin.hotkeys[0].command).toBe('calendar');
    });

    it('should initialize without errors', () => {
      expect(() => plugin.initialize(editor)).not.toThrow();
    });
  });

  describe('toolbar button', () => {
    beforeEach(() => {
      plugin.initialize(editor);
    });

    it('should add toolbar button', () => {
      const toolbar = this.editor?.getToolbar();
      const button = toolbar?.querySelector('[title="Calendar"]');
      expect(button).toBeTruthy();
    });
  });

  describe('calendar management', () => {
    beforeEach(() => {
      plugin.initialize(editor);
    });

    it('should create calendar with events', () => {
      const calendarData = {
        id: 'test-calendar',
        title: 'Test Calendar',
        description: 'Test Description',
        events: [
          {
            id: 'event-1',
            title: 'Test Event',
            description: 'Test Event Description',
            date: '2024-01-15',
            time: '14:00',
            duration: 60,
            location: 'Test Location',
            color: '#3b82f6',
            isAllDay: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const calendarHtml = plugin['generateCalendarHTML'](calendarData);
      expect(calendarHtml).toContain('Test Calendar');
      expect(calendarHtml).toContain('Test Event');
      expect(calendarHtml).toContain('14:00');
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      plugin.initialize(editor);
    });

    it('should handle calendar click events', () => {
      const calendarElement = document.createElement('div');
      calendarElement.className = 'calendar-widget';
      calendarElement.setAttribute('data-event-id', 'test-event');
      
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      // Mock the editEvent method
      const editEventSpy = jest.spyOn(plugin as any, 'editEvent');
      
      calendarElement.dispatchEvent(clickEvent);
      
      // Note: This test might need adjustment based on actual implementation
      expect(editEventSpy).toHaveBeenCalledWith('test-event');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on destroy', () => {
      plugin.initialize(editor);
      expect(() => plugin.destroy()).not.toThrow();
    });
  });
}); 