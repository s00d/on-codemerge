import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { CommentManager } from './services/CommentManager';
import { CommentMenu } from './components/CommentMenu';
import { ErrorModal } from './components/ErrorModal';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { commentIcon, commentMarkerIcon } from '../../icons';
import { createContainer, createSpan } from '../../utils/helpers.ts';

export class CommentsPlugin implements Plugin {
  name = 'comments';
  hotkeys = [{ keys: 'Ctrl+Alt+J', description: 'Insert comment', command: 'comment', icon: '💬' }];
  private editor: HTMLEditor | null = null;
  private manager: CommentManager;
  private menu: CommentMenu | null = null;
  private errorModal: ErrorModal | null = null;
  private tooltip: HTMLElement;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.manager = new CommentManager();
    this.tooltip = this.createTooltip();
  }

  initialize(editor: HTMLEditor): void {
    this.errorModal = new ErrorModal(editor);
    this.menu = new CommentMenu(editor);
    this.editor = editor;

    this.editor.getDOMContext()!.appendChild(this.tooltip);

    this.addToolbarButton();
    this.setupEventListeners();
    this.editor.on('comment', () => {
      this.addComment();
    });
  }

  private createTooltip(): HTMLElement {
    const tooltip = createContainer('comment-tooltip');
    tooltip.style.display = 'none';
    return tooltip;
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: commentIcon,
        title: this.editor?.t('Insert Comment'),
        onClick: () => this.addComment(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    // Сохраняем ссылки на обработчики, чтобы их можно было удалить
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  private handleMouseOver(e: MouseEvent): void {
    const marker = (e.target as Element).closest('.comment-marker');
    if (marker instanceof HTMLElement) {
      const commentId = marker.getAttribute('data-comment-id');
      if (commentId) {
        this.showTooltip(marker, commentId);
      }
    }
  }

  private handleMouseOut(e: MouseEvent): void {
    const marker = (e.target as Element).closest('.comment-marker');
    if (marker) {
      this.hideTooltip();
    }
  }

  private handleClick(e: MouseEvent): void {
    const marker = (e.target as Element).closest('.comment-marker');
    if (marker instanceof HTMLElement) {
      const commentId = marker.getAttribute('data-comment-id');
      if (commentId) {
        this.editComment(commentId);
      }
    }
  }

  private showTooltip(marker: HTMLElement, commentId: string): void {
    const comment = this.manager.getComment(commentId);
    if (!comment) return;

    this.tooltip.textContent = comment.content;
    this.tooltip.style.display = 'block';

    const rect = marker.getBoundingClientRect();
    this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
    this.tooltip.style.top = `${rect.bottom + 8}px`;
  }

  private hideTooltip(): void {
    this.tooltip.style.display = 'none';
  }

  private addComment(): void {
    if (!this.editor) {
      this.errorModal?.show('Editor not initialized');
      return;
    }

    const selection = this.editor.getTextFormatter()?.getSelection();
    if (!selection || !selection.rangeCount) {
      this.errorModal?.show(this.editor.t('Please select some text to comment on'));
      return;
    }

    const range = selection.getRangeAt(0);
    // Проверяем, что выделение находится внутри редактора
    if (!this.isRangeInsideEditor(range)) {
      this.errorModal?.show(this.editor.t('Please select text inside the editor'));
      return;
    }
    if (range.collapsed) {
      this.errorModal?.show(this.editor.t('Please select some text to comment on'));
      return;
    }

    this.menu?.show((content, action) => {
      if (action === 'save') {
        const comment = this.manager.createComment(content);
        this.insertCommentMarker(comment.id, range);
      }
    });
  }

  private isRangeInsideEditor(range: Range): boolean {
    const container = this.editor?.getContainer();
    if (!container) return false;
    return container.contains(range.startContainer) && container.contains(range.endContainer);
  }

  private editComment(id: string): void {
    const comment = this.manager.getComment(id);
    if (!comment) return;

    this.menu?.show(
      (content, action) => {
        if (action === 'save') {
          this.manager.updateComment(id, content);
        } else if (action === 'delete') {
          this.manager.deleteComment(id);
          // Remove comment marker and unwrap commented text
          const marker = this.editor?.getContainer().querySelector(`[data-comment-id="${id}"]`);
          if (marker) {
            const wrapper = marker.previousElementSibling;
            if (wrapper?.classList.contains('commented-text')) {
              const parent = wrapper.parentNode;
              if (parent) {
                while (wrapper.firstChild) {
                  parent.insertBefore(wrapper.firstChild, wrapper);
                }
                wrapper.remove();
                marker.remove();
              }
            }
          }
        }
      },
      comment.content,
      true // Show delete button
    );
  }

  private insertCommentMarker(id: string, range: Range): void {
    try {
      // Extract the selected content
      const contents = range.cloneContents();

      // Create wrapper and marker elements
      const wrapper = createSpan('commented-text');
      wrapper.appendChild(contents);

      const marker = createSpan('comment-marker');
      marker.setAttribute('data-comment-id', id);
      marker.innerHTML = commentMarkerIcon;

      // Create a fragment to hold both elements
      const fragment = document.createDocumentFragment();
      fragment.appendChild(wrapper);
      fragment.appendChild(marker);

      // Delete the original content and insert the new elements
      range.deleteContents();
      range.insertNode(fragment);

      // Move the cursor after the comment
      range.setStartAfter(marker);
      range.setEndAfter(marker);

      const selection = this.editor!.getTextFormatter()?.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error('Failed to insert comment:', error);
      this.errorModal?.show(
        this.editor?.t('Failed to insert comment. Please try selecting a simpler text range.') ?? ''
      );
    }
  }

  public destroy(): void {
    if (this.editor) {
      const container = this.editor.getContainer();
      // Удаляем все обработчики событий
      container.removeEventListener('mouseover', this.handleMouseOver);
      container.removeEventListener('mouseout', this.handleMouseOut);
      container.removeEventListener('click', this.handleClick);
    }

    // Уничтожаем все UI компоненты
    if (this.tooltip && this.tooltip.parentElement) {
      this.tooltip.parentElement.removeChild(this.tooltip);
    }

    // Удаляем кнопку из тулбара
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = null;
    }

    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }

    if (this.errorModal) {
      this.errorModal.destroy();
      this.errorModal = null;
    }

    // Отписываемся от всех событий
    this.editor?.off('comment');

    // Очищаем все ссылки
    this.editor = null;
    this.menu = null;
    this.errorModal = null;
    this.tooltip = null!;
    this.manager = null!;
  }
}
