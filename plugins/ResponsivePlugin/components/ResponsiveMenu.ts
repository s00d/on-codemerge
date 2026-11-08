import { PopupController, h } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@codemerge/sdk';

import type { Viewport } from '../types';
import { responsiveIcon, mobileIcon, tabletIcon, desktopIcon } from '@codemerge/sdk/icons';

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
        label: editor.t('responsive.tablet'),
        size: '768px',
        description: editor.t('responsive.tabletView2'),
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
        h('span', { class: 'text-sm text-ocm-text-muted' }, `${current?.label} (${current?.size})`),
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
                  ? 'border-ocm-accent bg-ocm-accent-soft shadow-md'
                  : 'border-ocm-border hover:border-ocm-accent hover:shadow-sm'
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
                h('span', { class: 'block text-sm font-medium text-ocm-text' }, viewport.label),
                h('span', { class: 'block text-xs text-ocm-text-muted mt-1' }, viewport.size),
                h('span', { class: 'block text-xs text-gray-400 mt-1' }, viewport.description),
                h(
                  'span',
                  { class: 'block text-xs text-ocm-accent mt-1 font-mono' },
                  viewport.hotkey
                ),
              ]),
            ])
          );
        })
      ),
      h('div', { class: 'mt-6 p-4 bg-ocm-surface-muted rounded-lg border border-ocm-border' }, [
        h(
          'span',
          { class: 'block text-sm font-medium text-ocm-text mb-2' },
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
