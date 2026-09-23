import { definePlugin, withMarkTarget, core } from '@on-codemerge/sdk';
import { boldIcon, italicIcon, underlineIcon, strikethroughIcon } from '../../icons';

/** Default mark buttons (B/I/U/S) on the SDK toolbar panel — not chrome owner. */
export function ToolbarPlugin() {
  return definePlugin({
    name: 'toolbar',
    setup(ctx) {
      const editor = ctx.editor;
      const marks: {
        id: string;
        icon: string;
        title: string;
        mark: string;
        order: number;
      }[] = [
        { id: 'bold', icon: boldIcon, title: 'Bold', mark: 'bold', order: 1 },
        { id: 'italic', icon: italicIcon, title: 'Italic', mark: 'italic', order: 2 },
        { id: 'underline', icon: underlineIcon, title: 'Underline', mark: 'underline', order: 3 },
        {
          id: 'strike',
          icon: strikethroughIcon,
          title: 'Strike',
          mark: 'strike',
          order: 4,
        },
      ];
      for (const m of marks) {
        const hasMark = core.selectionHasMark(m.mark);
        ctx.toolbar.add({
          id: m.id,
          icon: m.icon,
          title: editor.t(m.title) || m.title,
          group: 'marks',
          order: m.order,
          active: () => hasMark(editor.getState()),
          onClick: () => {
            withMarkTarget(editor, () => {
              editor.run(core.toggleMark(m.mark));
            });
          },
        });
      }
      ctx.on('selectionChanged', () => {
        editor.toolbar.refresh();
      });
    },
  });
}

/** @deprecated Prefer SDK separators via toolbar `group`. Kept for API compat. */
export function ToolbarDividerPlugin() {
  return definePlugin({
    name: 'toolbar-divider',
    setup() {
      /* no-op — separators come from ToolbarPanel group boundaries */
    },
  });
}
