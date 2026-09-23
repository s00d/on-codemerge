import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type {
  DisposableScope,
  EditorAPI,
  MountHandle,
  PopupItem,
  ViewSpec,
} from '@on-codemerge/sdk';

export type Mention = { id: string; label: string };

/** Mentions picker — popup lifetime via PopupController (no destroy/hide). */
export class MentionsMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private allMentions: Mention[];
  private onPick: ((m: Mention) => void) | null = null;
  private currentQuery = '';
  /** Live list host — updated in place so filter input is not remounted. */
  private listRoot: HTMLElement | null = null;
  private listMount: MountHandle | null = null;

  constructor(editor: EditorAPI, mentions: Mention[], scope: DisposableScope) {
    this.editor = editor;
    this.allMentions = mentions;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private filtered(query: string): Mention[] {
    return (
      query
        ? this.allMentions.filter((m) => m.label.toLowerCase().includes(query.toLowerCase()))
        : this.allMentions
    ).slice(0, 30);
  }

  private listItemsView(query: string): ViewSpec {
    return h(
      'div',
      { class: 'mentions-list-inner' },
      ...this.filtered(query).map((m) =>
        h(
          'button',
          {
            class: 'menu-item mentions-item',
            attrs: { type: 'button' },
            on: {
              click: () => {
                this.pick(m);
              },
            },
          },
          m.label
        )
      )
    );
  }

  private paintList(host: HTMLElement, query: string): void {
    this.listMount?.destroy();
    this.listMount = mount(host, this.listItemsView(query));
  }

  private listView(query: string): ViewSpec {
    return foreign((host, scope) => {
      host.className = 'mentions-list';
      this.listRoot = host;
      this.paintList(host, query);
      scope.disposable(() => {
        this.listMount?.destroy();
        this.listMount = null;
        if (this.listRoot === host) {
          this.listRoot = null;
        }
      });
    });
  }

  private buildItems(query: string): PopupItem[] {
    return [
      {
        type: 'input',
        id: 'mentions-search',
        label: this.editor.t('common.search'),
        placeholder: this.editor.t('mentions.typeToFilter'),
        value: query,
        onChange: (val) => {
          this.refresh(String(val ?? ''));
        },
      },
      { type: 'view', id: 'mentions-list', view: () => this.listView(query) },
    ];
  }

  private options(query: string) {
    return {
      title: this.editor.t('common.mentions'),
      className: 'mentions-menu',
      closeOnClickOutside: true,
      items: this.buildItems(query),
      buttons: [] as [],
    };
  }

  private refresh(query: string): void {
    this.currentQuery = query;
    // Prefer in-place list update — popup.update remounts the filter input and clears typing.
    if (this.listRoot) {
      this.paintList(this.listRoot, query);
      return;
    }
    this.popups.update(this.options(query));
  }

  private pick(m: Mention): void {
    this.onPick?.(m);
    this.popups.close();
  }

  public show(onPick: (m: Mention) => void, _x?: number, _y?: number): void {
    this.onPick = onPick;
    this.currentQuery = '';
    this.popups.open(this.options(this.currentQuery));
  }

  public setMentions(mentions: Mention[]): void {
    this.allMentions = mentions;
    if (this.popups.isOpen) {
      this.refresh(this.currentQuery);
    }
  }
}
