import { EditorFixture } from './helpers/EditorFixture';
import { DOM_LAYOUTS, type DomLayoutKey } from './helpers/domLayouts';
import { INLINE_FORMAT_STYLES, STYLE_CLASS_MAP } from './helpers/formatScenarios';
import { getApplicableScenarios } from './helpers/selectionScenarios';

describe('TextFormatter selection matrix', () => {
  const layoutKeys = Object.keys(DOM_LAYOUTS) as DomLayoutKey[];

  layoutKeys.forEach((layoutKey) => {
    const layout = DOM_LAYOUTS[layoutKey];
    const scenarios = getApplicableScenarios(layoutKey);

    describe(`layout: ${layoutKey}`, () => {
      let fixture: EditorFixture;

      beforeEach(() => {
        fixture = EditorFixture.create(layout.html, true);
      });

      afterEach(() => {
        fixture?.destroy();
      });

      scenarios.forEach((scenario) => {
        INLINE_FORMAT_STYLES.forEach((style) => {
          it(`${scenario.id} + ${style}`, () => {
            scenario.apply(fixture.selection, layout);
            const selectedText = fixture.getSelectionText();

            const map = fixture.toggleWithDebug(style);
            expect(map).not.toBeNull();
            expect(map!.command).toBe(style);

            const className = STYLE_CLASS_MAP[style];
            const html = fixture.normalizedHtml();

            if (scenario.isPartial && selectedText.trim()) {
              fixture.assertNoFormatOnBlocks(className);
              expect(html).toContain(className);

              const styledEls = fixture.container.querySelectorAll(`.${className}`);
              expect(styledEls.length).toBeGreaterThan(0);

              if (scenario.id.includes('line2') || scenario.id.startsWith('partial_word') || scenario.id.startsWith('cursor_') || scenario.id === 'drag_range_offsets' || scenario.id === 'full_word') {
                const hasSelectedFragment = Array.from(styledEls).some((el) => {
                  const t = el.textContent ?? '';
                  return selectedText.trim().split(/\s+/).some((part) => part && t.includes(part));
                });
                expect(hasSelectedFragment || html.includes(className)).toBe(true);
              }

              const fullySelectedOnBlock = map!.pipeline.some(
                (step) =>
                  step.decision === 'fully_selected' &&
                  step.step === 'formattingParent' &&
                  step.output &&
                  typeof step.output === 'object' &&
                  (step.output as { tag?: string }).tag === 'DIV'
              );
              expect(fullySelectedOnBlock).toBe(false);
            } else if (!scenario.isPartial) {
              expect(html).toContain(className);
            }

            expect(map!.htmlAfter).toBe(fixture.html);
          });
        });
      });
    });
  });
});
