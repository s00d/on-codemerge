import './style.scss';

import { definePlugin, insertAtomAfter, attrString, foreign, h } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import { TimerMenu } from './components/TimerMenu';
import { TimerManager } from './services/TimerManager';
import { timerIcon } from '../../icons';
import type { Timer } from './types';
import { TimerContextMenu } from './components/TimerContextMenu';
import { pathFromEl } from '../../utils/atomPath';
import { downloadJson, pickJsonFile, mountTimerView, tickTimerWidget } from './widgets/domOps';

function serializeTimer(timer: Timer): string {
  return JSON.stringify({
    ...timer,
    targetDate:
      timer.targetDate instanceof Date ? timer.targetDate.toISOString() : timer.targetDate,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseTimer(raw: unknown): Timer | null {
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }
    if (typeof parsed.id !== 'string' || typeof parsed.title !== 'string') {
      return null;
    }
    const targetRaw = parsed.targetDate;
    if (typeof targetRaw !== 'string' && !(targetRaw instanceof Date)) {
      return null;
    }
    const now = Date.now();
    return {
      id: parsed.id,
      title: parsed.title,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      targetDate: targetRaw instanceof Date ? targetRaw : new Date(targetRaw),
      targetTime: typeof parsed.targetTime === 'string' ? parsed.targetTime : '00:00',
      color: typeof parsed.color === 'string' ? parsed.color : '#3b82f6',
      category: typeof parsed.category === 'string' ? parsed.category : '',
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string')
        : [],
      isActive: typeof parsed.isActive === 'boolean' ? parsed.isActive : true,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : now,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : now,
    };
  } catch {
    return null;
  }
}

export function TimerPlugin() {
  let editor!: EditorAPI;
  let manager!: TimerManager;
  let menu!: TimerMenu;
  let contextMenu!: TimerContextMenu;
  let openTimerMenu: (() => void) | null = null;

  const refreshTimers = () => {
    editor.host.querySelectorAll<HTMLElement>('.timer-widget').forEach((element) => {
      const timerId = element.dataset.timerId;
      if (!timerId) {
        return;
      }
      let timerData = manager.getTimer(timerId);
      if (!timerData) {
        const raw = element.dataset.timerPayload;
        const parsed = parseTimer(raw);
        if (parsed) {
          manager.ensureTimer(parsed);
          timerData = parsed;
        }
      }
      if (!timerData) {
        return;
      }
      tickTimerWidget(element, manager.getTimeLeft(timerData), editor.t('timer.timeExpired'));
    });
  };

  const persistTimer = (timer: Timer) => {
    editor.host
      .querySelectorAll<HTMLElement>('[data-ocm-type="timer"], .ocm-timer-atom')
      .forEach((el) => {
        const widget = el.querySelector<HTMLElement>('.timer-widget') ?? el;
        const id = widget.dataset.timerId;
        if (id !== timer.id) {
          return;
        }
        const path = pathFromEl(el);
        if (!path) {
          return;
        }
        editor.run(() => [
          {
            type: 'set_attrs',
            path,
            attrs: { payload: serializeTimer(timer), title: timer.title },
          },
        ]);
      });
  };

  const handleContextAction = (action: string, target: Timer) => {
    switch (action) {
      case 'edit-timer': {
        menu.showEditTimerForm(target);
        break;
      }
      case 'copy-timer': {
        try {
          manager.copyTimer(target.id);
          editor.notify(editor.t('timer.timerCopiedSuccessfully'));
          refreshTimers();
        } catch {
          editor.notify(editor.t('timer.failedToCopyTimer'));
        }
        break;
      }
      case 'export-timer': {
        try {
          downloadJson(`timer-${target.id}.json`, JSON.stringify(target, null, 2));
        } catch {
          editor.notify(editor.t('export.exportFailed'));
        }
        break;
      }
      case 'import-timer': {
        pickJsonFile((text) => {
          try {
            manager.importTimer(text);
            editor.notify(editor.t('timer.timerImportedSuccessfully'));
            refreshTimers();
          } catch {
            editor.notify(editor.t('common.importFailed'));
          }
        });
        break;
      }
      case 'delete-timer': {
        manager.deleteTimer(target.id);
        refreshTimers();
        break;
      }
    }
  };

  return definePlugin({
    name: 'timer',
    commands: {
      insertTimer: () => {
        openTimerMenu?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-d', command: 'insertTimer', description: 'Insert timer' }],
    nodes: [
      {
        name: 'timer',
        group: 'atom',
        atom: true,
        attrs: { payload: '', title: 'Timer', align: '' },
      },
    ],
    setup(ctx) {
      editor = ctx.editor;
      manager = new TimerManager(editor);
      menu = new TimerMenu(manager, editor, ctx.scope);
      contextMenu = ctx.own(new TimerContextMenu(manager, editor));

      openTimerMenu = () => {
        menu.show((timerData: Timer) => {
          manager.ensureTimer(timerData);
          editor.run(
            insertAtomAfter('timer', {
              payload: serializeTimer(timerData),
              title: timerData.title,
              align: '',
            })
          );
          persistTimer(timerData);
        });
      };

      ctx.toolbar.add({
        id: 'timer',
        icon: timerIcon,
        title: editor.t('timer.title'),
        menu: 'insert',
        order: 46,
        onClick: () => openTimerMenu?.(),
      });

      ctx.onDom('host', 'click', (e) => {
        const from = e.target instanceof Element ? e.target : null;
        const timerElement = from?.closest('.timer-widget') ?? null;
        if (!(timerElement instanceof HTMLElement)) {
          return;
        }
        const timerId = timerElement.dataset.timerId;
        if (!timerId) {
          return;
        }
        const timer = manager.getTimer(timerId);
        if (timer) {
          menu.showEditTimerForm(timer);
        }
      });

      ctx.onDom('host', 'contextmenu', (e) => {
        const from = e.target instanceof Element ? e.target : null;
        const timerElement = from?.closest('.timer-widget') ?? null;
        if (!(timerElement instanceof HTMLElement)) {
          return;
        }
        e.preventDefault();
        const timerId = timerElement.dataset.timerId;
        if (!timerId) {
          return;
        }
        const timer = manager.getTimer(timerId);
        if (!timer) {
          return;
        }
        contextMenu.show(e, timer, (action) => {
          handleContextAction(action, timer);
        });
      });

      ctx.interval(1000, refreshTimers);
    },
    widgets: {
      timer: {
        render(attrs): ViewSpec {
          return foreign((host, scope) => {
            const payload = parseTimer(attrs.payload);
            if (payload) {
              manager.ensureTimer(payload);
            }
            const align = attrString(attrs.align, '');
            const spec = payload
              ? manager.timerView(payload)
              : h('div', { class: 'timer-widget' }, attrString(attrs.title, 'Timer'));
            mountTimerView(host, spec, scope, align);
            const widget = host.querySelector('.timer-widget');
            if (widget instanceof HTMLElement && payload) {
              widget.dataset.timerPayload = serializeTimer(payload);
            }
          });
        },
      },
    },
    publish: {
      node: 'timer',
      runtime: 'timer',
      render: (attrs) => {
        const payload = parseTimer(attrs.payload);
        if (!payload) {
          return h('div', { attrs: { 'data-node': 'timer' } });
        }
        manager.ensureTimer(payload);
        return manager.timerView(payload, { align: attrString(attrs.align, '') });
      },
    },
  });
}
