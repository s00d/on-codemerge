import { PopupManager } from '../../../core/ui/PopupManager';
import type { TimerManager } from '../services/TimerManager';
import type { Timer } from '../types';
import { TimerForm } from './TimerForm';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class TimerMenu {
  private popup: PopupManager;
  private editor: HTMLEditor;
  private manager: TimerManager;
  private onSelect: ((timer: Timer) => void) | null = null;

  constructor(manager: TimerManager, editor: HTMLEditor) {
    this.editor = editor;
    this.manager = manager;
    this.popup = this.createMainPopup();
  }

  private createMainPopup(): PopupManager {
    return new PopupManager(this.editor, {
      title: this.editor.t('Timer'),
      className: 'timer-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Import'),
          variant: 'secondary',
          onClick: () => this.showImportDialog(),
        },
        {
          label: this.editor.t('New Timer'),
          variant: 'primary',
          onClick: () => this.showNewTimerForm(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'timers-content',
          content: () => this.createTimersList(),
        },
      ],
    });
  }

  private createTimersList(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'timers-list';

    const timers = this.manager.getTimers();

    if (timers.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>${this.editor.t('No timers found')}</p>
        <p>${this.editor.t('Create your first timer to get started')}</p>
      `;
      container.appendChild(emptyState);
    } else {
      timers.forEach(timer => {
        const timerItem = this.createTimerItem(timer);
        container.appendChild(timerItem);
      });
    }

    return container;
  }

  private createTimerItem(timer: Timer): HTMLElement {
    const timeLeft = this.manager.getTimeLeft(timer);
    const item = document.createElement('div');
    item.className = 'timer-item';
    
    const statusClass = timeLeft.isExpired ? 'expired' : 'active';
    const statusText = timeLeft.isExpired ? 'Истек' : 'Активен';
    
    item.innerHTML = `
      <div class="timer-info">
        <h4 class="timer-title">${timer.title}</h4>
        <p class="timer-description">${timer.description || ''}</p>
        <div class="timer-status ${statusClass}">${statusText}</div>
      </div>
      <div class="timer-actions">
        <button class="btn-edit" title="${this.editor.t('Edit')}">✏️</button>
        <button class="btn-delete" title="${this.editor.t('Delete')}">🗑️</button>
      </div>
    `;

    // Обработчики событий
    item.addEventListener('click', (e) => {
      if ((e.target as Element).classList.contains('btn-edit')) {
        e.stopPropagation();
        this.showEditTimerForm(timer);
      } else if ((e.target as Element).classList.contains('btn-delete')) {
        e.stopPropagation();
        this.handleDeleteTimer(timer);
      } else {
        this.handleSelectTimer(timer);
      }
    });

    return item;
  }

  private createFormPopup(
    title: string,
    form: TimerForm,
    submitLabel: string,
    onCancel?: () => void
  ): void {
    this.popup = new PopupManager(this.editor, {
      title: this.editor.t(title),
      className: 'timer-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => {
            if (onCancel) {
              onCancel();
            } else {
              this.popup.hide();
            }
          },
        },
        {
          label: this.editor.t(submitLabel),
          variant: 'primary',
          onClick: () => {
            this.editor!.ensureEditorFocus();
            form.submit();
          },
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'form-content',
          content: () => form.getElement(),
        },
      ],
    });

    this.popup.show();
  }

  public showNewTimerForm(onTimerCreated?: (timer: Timer) => void): void {
    // Сначала закрываем текущий popup
    if (this.popup) {
      this.popup.hide();
    }

    const form = new TimerForm(this.editor, (data) => {
      const newTimer = this.manager.createTimer(data);
      
      // Закрываем модалку и уничтожаем форму
      this.popup.hide();
      form.destroy();
      
      // Возвращаемся к главному меню
      this.popup = this.createMainPopup();
      this.popup.show();

      if (onTimerCreated && newTimer) {
        onTimerCreated(newTimer);
      }
    });

    this.createFormPopup('New Timer', form, 'Create', () => {
      // При отмене сначала уничтожаем форму, потом закрываем модалку
      form.destroy();
      this.popup.hide();
      // Возвращаемся к главному меню
      this.popup = this.createMainPopup();
      this.popup.show();
    });
  }

  public showEditTimerForm(timer: Timer): void {
    // Сначала закрываем текущий popup
    if (this.popup) {
      this.popup.hide();
    }

    const form = new TimerForm(
      this.editor,
      (data) => {
        this.manager.updateTimer(timer.id, data);
        
        // Закрываем модалку и уничтожаем форму
        this.popup.hide();
        form.destroy();
        
        // Возвращаемся к главному меню
        this.popup = this.createMainPopup();
        this.popup.show();
      },
      timer
    );

    this.createFormPopup('Edit Timer', form, 'Update', () => {
      // При отмене также уничтожаем форму
      form.destroy();
      this.popup = this.createMainPopup();
      this.popup.show();
    });
  }

  private handleSelectTimer(timer: Timer): void {
    this.onSelect?.(timer);
    this.popup.hide();
  }

  private handleDeleteTimer(timer: Timer): void {
    if (confirm(this.editor.t('Are you sure you want to delete this timer?'))) {
      this.manager.deleteTimer(timer.id);
      this.popup.hide();
      this.popup = this.createMainPopup();
      this.popup.show();
    }
  }

  public show(onSelect: (timer: Timer) => void): void {
    this.onSelect = onSelect;
    this.popup.show();
  }

  public showImportDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const timer = JSON.parse(e.target?.result as string);
            this.manager.importTimer(timer);
            this.editor?.showSuccessNotification(this.editor?.t('Timer imported successfully') || 'Timer imported successfully');
            this.popup.hide();
            this.popup = this.createMainPopup();
            this.popup.show();
          } catch (error) {
            this.editor?.showErrorNotification(this.editor?.t('Import failed') || 'Import failed');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.hide();
      if (typeof this.popup.destroy === 'function') {
        this.popup.destroy();
      }
      this.popup = null!;
    }

    this.editor = null!;
    this.manager = null!;
    this.onSelect = null;
  }
} 