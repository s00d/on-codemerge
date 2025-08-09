import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer } from '../../../utils/helpers';

export type Mention = { id: string; label: string };

export class MentionsMenu {
  private popup: PopupManager;
  private editor: HTMLEditor;
  private allMentions: Mention[];
  private onPick: ((m: Mention) => void) | null = null;
  private currentQuery = '';

  constructor(editor: HTMLEditor, mentions: Mention[]) {
    this.editor = editor;
    this.allMentions = mentions;
    this.popup = this.createPopup();
  }

  private createPopup(): PopupManager {
    return new PopupManager(this.editor, {
      title: this.editor.t('Mentions'),
      className: 'mentions-menu',
      closeOnClickOutside: true,
      items: this.buildItems(''),
      buttons: [],
    });
  }

  private buildItems(query: string): PopupItem[] {
    const filtered = (query
      ? this.allMentions.filter((m) => m.label.toLowerCase().includes(query.toLowerCase()))
      : this.allMentions
    ).slice(0, 30);

    const list = createContainer('mentions-list');
    filtered.forEach((m) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'menu-item mentions-item';
      item.textContent = m.label;
      item.addEventListener('click', () => this.pick(m));
      list.appendChild(item);
    });

    return [
      {
        type: 'input',
        id: 'mentions-search',
        label: this.editor.t('Search'),
        placeholder: this.editor.t('Type to filter...'),
        value: query,
        onChange: (val) => this.update(String(val || '')),
      },
      { type: 'custom', id: 'mentions-list', content: () => list },
    ];
  }

  private update(query: string): void {
    this.currentQuery = query;
    this.popup.setItems(this.buildItems(query));
  }

  private pick(m: Mention): void {
    this.onPick?.(m);
    this.popup.hide();
  }

  public show(onPick: (m: Mention) => void, x?: number, y?: number): void {
    this.onPick = onPick;
    this.update(this.currentQuery);
    this.popup.show(x, y);
  }

  public setMentions(mentions: Mention[]): void {
    this.allMentions = mentions;
    this.update(this.currentQuery);
  }

  public destroy(): void {
    this.popup.destroy();
  }
}


