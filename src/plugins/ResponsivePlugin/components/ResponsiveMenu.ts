import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { Viewport } from '../types';
import { responsiveIcon, mobileIcon, tabletIcon, desktopIcon } from '../../../icons';
import { SetViewportCommand } from '../commands/SetViewportCommand';

interface ViewportOption {
  name: Viewport;
  icon: string;
  label: string;
  size: string;
  description: string;
  hotkey: string;
}

type ViewportManagerLike = {
  getCurrentViewport?: () => Viewport;
};

export class ResponsiveMenu {
  private readonly editor: EditorAPI;
  private readonly viewportChangeHandlers: ((viewport: Viewport) => void)[] = [];
  private activeViewport: Viewport;
  private readonly viewports: ViewportOption[];

  private readonly popups: PopupController;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    const mgr = (this.editor.host as HTMLElement & { __ocmViewportManager?: ViewportManagerLike })
      .__ocmViewportManager;
    this.activeViewport = mgr?.getCurrentViewport?.() ?? 'responsive';

    this.viewports = [
      {
        name: 'mobile',
        icon: mobileIcon,
        label: editor.t('responsive.mobile'),
        size: '320px',
        description: editor.t('common.smartphoneView'),
        hotkey: 'Ctrl+1',
      },
      {
        name: 'tablet',
        icon: tabletIcon,
        label: editor.t('table.tablet'),
        size: '768px',
        description: editor.t('table.tabletView2'),
        hotkey: 'Ctrl+2',
      },
      {
        name: 'desktop',
        icon: desktopIcon,
        label: editor.t('responsive.desktop'),
        size: '1024px',
        description: editor.t('responsive.standardDesktop'),
        hotkey: 'Ctrl+3',
      },
      {
        name: 'largeDesktop',
        icon: desktopIcon,
        label: editor.t('responsive.largeDesktop'),
        size: '1440px',
        description: editor.t('responsive.largeDesktopView2'),
        hotkey: 'Ctrl+4',
      },
      {
        name: 'ultraWide',
        icon: desktopIcon,
        label: editor.t('responsive.ultraWide'),
        size: '1920px',
        description: editor.t('responsive.ultraWideScreen'),
        hotkey: 'Ctrl+5',
      },
      {
        name: 'responsive',
        icon: responsiveIcon,
        label: editor.t('responsive.title'),
        size: 'Fluid',
        description: editor.t('common.fluidWidth'),
        hotkey: 'Ctrl+0',
      },
    ];
  }

  private content(): ViewSpec {
    const current = this.viewports.find((v) => v.name === this.activeViewport);
    return h('div', { class: 'p-6 space-y-6' }, [
      h('div', { class: 'flex items-center justify-between' }, [
        h('span', { class: 'text-lg font-semibold' }, this.editor.t('responsive.selectViewport')),
        h('span', { class: 'text-sm text-gray-500' }, `${current?.label} (${current?.size})`),
      ]),
      h(
        'div',
        { class: 'grid grid-cols-2 gap-4' },
        ...this.viewports.map((viewport) => {
          const isActive = viewport.name === this.activeViewport;
          return h(
            'button',
            {
              class: `viewport-btn w-full p-4 border-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`,
              attrs: { type: 'button', 'data-viewport': viewport.name },
              on: {
                click: () => {
                  this.setActiveViewport(viewport.name);
                  this.popups.close();
                },
              },
            },
            h('div', { class: 'flex flex-col items-center gap-3' }, [
              h('span', { class: 'text-2xl', props: { innerHTML: viewport.icon } }),
              h('div', { class: 'text-center' }, [
                h('span', { class: 'block text-sm font-medium text-gray-900' }, viewport.label),
                h('span', { class: 'block text-xs text-gray-500 mt-1' }, viewport.size),
                h('span', { class: 'block text-xs text-gray-400 mt-1' }, viewport.description),
                h('span', { class: 'block text-xs text-blue-500 mt-1 font-mono' }, viewport.hotkey),
              ]),
            ])
          );
        })
      ),
      h('div', { class: 'mt-6 p-4 bg-gray-50 rounded-lg border' }, [
        h(
          'span',
          { class: 'block text-sm font-medium text-gray-900 mb-2' },
          this.editor.t('common.tips')
        ),
        h('div', { class: 'space-y-1' }, [
          h(
            'span',
            { class: 'block text-xs text-gray-600' },
            this.editor.t('shortcuts.useHotkeysForQuickSwitching')
          ),
          h(
            'span',
            { class: 'block text-xs text-gray-600' },
            this.editor.t('responsive.responsiveModeAllowsManualResizing')
          ),
          h(
            'span',
            { class: 'block text-xs text-gray-600' },
            this.editor.t('responsive.viewportStateIsSavedAutomatically')
          ),
        ]),
      ]),
    ]);
  }

  private setActiveViewport(viewport: Viewport): void {
    this.activeViewport = viewport;
    for (const handler of this.viewportChangeHandlers) {
      handler(viewport);
    }
    const command = new SetViewportCommand(this.editor);
    command.setViewport(viewport);
    command.execute();
  }

  show(): void {
    const mgr = (this.editor.host as HTMLElement & { __ocmViewportManager?: ViewportManagerLike })
      .__ocmViewportManager;
    this.activeViewport = mgr?.getCurrentViewport?.() ?? 'responsive';
    this.popups.open({
      title: this.editor.t('responsive.view'),
      className: 'responsive-menu',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'responsive-content',
          view: () => this.content(),
        },
      ],
    });
  }

  onViewportChange(handler: (viewport: Viewport) => void): void {
    this.viewportChangeHandlers.push(handler);
  }
}
