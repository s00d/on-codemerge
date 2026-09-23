import { PopupController, foreign, h, pickFile } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { TimerManager } from '../services/TimerManager';
import type { Timer } from '../types';
import { TimerForm } from './TimerForm';

/** Timer chrome — lists via ViewSpec; forms via foreign + mountInto. */
export class TimerMenu {
  private readonly popups: PopupController;
  private readonly editor: EditorAPI;
  private readonly manager: TimerManager;
  private onSelect: ((timer: Timer) => void) | null = null;

  constructor(manager: TimerManager, editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.manager = manager;
  }

  private listView(): ViewSpec {
    const timers = this.manager.getTimers();
    if (timers.length === 0) {
      return h('div', { class: 'empty-state' }, [
        h('p', null, this.editor.t('timer.noTimersFound')),
        h('p', null, this.editor.t('timer.createYourFirstTimerToGetStarted')),
      ]);
    }
    return h(
      'div',
      { class: 'timers-list' },
      ...timers.map((timer) => {
        const timeLeft = this.manager.getTimeLeft(timer);
        const statusClass = timeLeft.isExpired ? 'expired' : 'active';
        const statusText = timeLeft.isExpired
          ? this.editor.t('timer.expired')
          : this.editor.t('timer.active');
        return h(
          'div',
          {
            class: 'timer-item',
            on: {
              click: () => {
                this.handleSelectTimer(timer);
              },
            },
          },
          h('div', { class: 'timer-info' }, [
            h('h4', { class: 'timer-title' }, timer.title),
            h('p', { class: 'timer-description' }, timer.description ?? ''),
            h('div', { class: `timer-status ${statusClass}` }, statusText),
          ]),
          h('div', { class: 'timer-actions' }, [
            h(
              'button',
              {
                class: 'btn-edit',
                attrs: { type: 'button', title: this.editor.t('common.edit') },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.showEditTimerForm(timer);
                  },
                },
              },
              this.editor.t('common.edit')
            ),
            h(
              'button',
              {
                class: 'btn-delete',
                attrs: { type: 'button', title: this.editor.t('common.delete') },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.handleDeleteTimer(timer);
                  },
                },
              },
              this.editor.t('common.delete')
            ),
          ])
        );
      })
    );
  }

  private openMainPopup(): void {
    this.popups.open({
      title: this.editor.t('timer.title'),
      className: 'timer-menu',
      size: 'md',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('common.import'),
          variant: 'secondary',
          onClick: () => {
            this.showImportDialog();
            return true;
          },
        },
        {
          label: this.editor.t('timer.newTimer'),
          variant: 'primary',
          onClick: () => {
            this.showNewTimerForm();
            return true;
          },
        },
      ],
      items: [{ type: 'view', id: 'timers-content', view: () => this.listView() }],
    });
  }

  private createFormPopup(
    title: string,
    form: TimerForm,
    submitLabel: string,
    onCancel?: () => void
  ): void {
    this.popups.open({
      title: this.editor.t(title) || title,
      className: 'timer-menu',
      size: 'md',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {
            onCancel?.();
            return true;
          },
        },
        {
          label: this.editor.t(submitLabel) || submitLabel,
          variant: 'primary',
          onClick: () => {
            form.submit();
            return true;
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'form-content',
          view: () =>
            foreign((host, scope) => {
              form.mountInto(host);
              scope.disposable(() => {
                form.destroy();
              });
            }),
        },
      ],
    });
  }

  public showNewTimerForm(): void {
    const form = new TimerForm(this.editor, (data) => {
      const created = this.manager.createTimer(data);
      this.popups.close();
      this.onSelect?.(created);
      this.openMainPopup();
    });
    this.createFormPopup('New Timer', form, 'Create', () => {
      this.openMainPopup();
    });
  }

  public showEditTimerForm(timer: Timer): void {
    const form = new TimerForm(
      this.editor,
      (data) => {
        this.manager.updateTimer(timer.id, data);
        this.popups.close();
        this.openMainPopup();
      },
      timer
    );
    this.createFormPopup('Edit Timer', form, 'Update', () => {
      this.openMainPopup();
    });
  }

  private handleSelectTimer(timer: Timer): void {
    this.onSelect?.(timer);
    this.popups.close();
  }

  private handleDeleteTimer(timer: Timer): void {
    if (confirm(this.editor.t('timer.areYouSureYouWantToDeleteThisTimer') || 'Delete?')) {
      this.manager.deleteTimer(timer.id);
      this.popups.close();
      this.openMainPopup();
    }
  }

  public show(onSelect: (timer: Timer) => void): void {
    this.onSelect = onSelect;
    this.openMainPopup();
  }

  public showImportDialog(): void {
    void pickFile({ accept: '.json' }).then((files) => {
      const file = files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : '';
          this.manager.importTimer(text);
          this.editor.notify(this.editor.t('timer.timerImportedSuccessfully'));
          this.popups.close();
          this.openMainPopup();
        } catch {
          this.editor.notify(this.editor.t('common.importFailed'));
        }
      });
      reader.readAsText(file);
      return;
    });
  }
}
