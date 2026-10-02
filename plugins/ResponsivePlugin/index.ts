import './style.scss';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import { ViewportManager } from './services/ViewportManager';
import { ResponsiveMenu } from './components/ResponsiveMenu';
import { responsiveIcon } from '@ocm/wysiwyg/icons';
import type { Viewport } from './types';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export function ResponsivePlugin(opts?: PluginToolbarOpts) {
  return definePlugin({
    name: 'responsive',
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      const editor = ctx.editor;
      const viewportManager = ctx.own(new ViewportManager());
      viewportManager.setViewport(editor.host, viewportManager.getCurrentViewport());

      (
        editor.host as HTMLElement & { __ocmViewportManager?: ViewportManager }
      ).__ocmViewportManager = viewportManager;
      ctx.disposable(() => {
        delete (editor.host as HTMLElement & { __ocmViewportManager?: ViewportManager })
          .__ocmViewportManager;
      });

      const menu = new ResponsiveMenu(editor, ctx.scope);
      menu.onViewportChange((viewport: Viewport) => {
        viewportManager.setViewport(editor.host, viewport);
      });

      ctx.toolbar.add({
        id: 'responsive',
        icon: responsiveIcon,
        title: () => editor.t('responsive.title'),
        ...pluginToolbarPlacement({ menu: 'tools', order: 86 }, opts),
        onClick: () => {
          menu.show();
        },
      });

      const map: Record<string, Viewport> = {
        '1': 'mobile',
        '2': 'tablet',
        '3': 'desktop',
        '4': 'largeDesktop',
        '5': 'ultraWide',
        '0': 'responsive',
      };
      ctx.onDom('host', 'keydown', (e) => {
        if (!e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }
        const viewport = map[e.key];
        if (!viewport) {
          return;
        }
        e.preventDefault();
        viewportManager.setViewport(editor.host, viewport);
      });
    },
  });
}
