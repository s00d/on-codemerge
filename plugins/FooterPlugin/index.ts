import './style.scss';

import { definePlugin, h, mount, renderDetached } from '@on-codemerge/sdk';
import type { MountHandle, ViewSpec } from '@on-codemerge/sdk';
import { StatisticsCalculator } from './services/StatisticsCalculator';
import type { Statistics } from './services/StatisticsCalculator';

export function FooterPlugin() {
  const calculator = new StatisticsCalculator();

  return definePlugin({
    name: 'footer',
    setup(ctx) {
      const editor = ctx.editor;
      let stats: Statistics = {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
      };
      let footerMount: MountHandle | null = null;
      const t = (k: string) => editor.t(k) || k;

      const view = (): ViewSpec => {
        const s = stats;
        return h('div', { class: 'ocm-editor-footer' }, [
          h('div', { class: 'ocm-editor-footer__group' }, [
            h('span', null, `${t('common.words')}: ${s.words.toLocaleString()}`),
            h('span', null, `${t('common.characters')}: ${s.characters.toLocaleString()}`),
            h(
              'span',
              null,
              `${t('common.charactersWithoutSpaces')}: ${s.charactersNoSpaces.toLocaleString()}`
            ),
          ]),
          h('div', { class: 'ocm-editor-footer__group' }, [
            h('div', { class: 'collaboration-status' }),
            h('span', null, `${t('common.sentences')}: ${s.sentences.toLocaleString()}`),
            h('span', null, `${t('typography.paragraphs')}: ${s.paragraphs.toLocaleString()}`),
            h('span', null, `${t('common.readingTime')}: ${s.readingTime}`),
          ]),
        ]);
      };

      // Core-owned chrome slot (no plugin createElement) — append, never mount onto host
      // (mount replaces children and would wipe toolbar/content).
      const chrome = renderDetached(h('div', { attrs: { 'data-ocm-chrome': 'footer' } }));
      editor.host.append(chrome.el);
      footerMount = mount(chrome.el, view());
      ctx.disposable(() => {
        footerMount?.destroy();
        footerMount = null;
        chrome.el.remove();
        chrome.destroy();
      });

      const update = () => {
        stats = calculator.calculateFromDoc(editor.getJSON().doc);
        footerMount?.update(view());
      };
      ctx.on('docChanged', update);
      update();
    },
  });
}
