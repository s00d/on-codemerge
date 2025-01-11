import { type PopupItem, PopupManager } from '../../../core/ui/PopupManager';
import { MathRenderer } from '../services/MathRenderer';
import type { MathExpression } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer, createLabel, createTextarea } from '../../../utils/helpers';
import { MathToolbar } from './MathToolbar';

export class MathMenu {
  private editor: HTMLEditor;
  private mathToolbar: MathToolbar;
  private popup: PopupManager;
  private renderer: MathRenderer;
  private onInsert: ((element: HTMLElement) => void) | null = null;
  private editingMath: HTMLElement | null = null;
  private expressionInput: HTMLTextAreaElement | null = null;
  private previewContainer: HTMLDivElement | null = null;
  private expression: string = '';

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.renderer = new MathRenderer();
    this.mathToolbar = new MathToolbar(this.handleInsertSymbol);
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Math'),
      className: 'math-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Insert'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: this.createPopupItems(),
    });
  }

  private createPopupItems(): PopupItem[] {
    return [
      {
        type: 'custom',
        id: 'math-editor-container',
        content: () => this.createMathEditorContainer(),
      },
      {
        type: 'custom',
        id: 'formula-help-section',
        content: () => this.createFormulaHelpSection(),
      },
      {
        type: 'custom',
        id: 'preview-math-container',
        content: () => this.createPreviewContainer(),
      },
    ];
  }

  private createFormulaHelpSection(): HTMLElement {
    const container = createContainer('formula-help-section mt-4');

    // Collapsible header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between cursor-pointer';
    header.innerHTML = `
      <span class="text-lg font-semibold m-0 text-gray-800">How to Write Formulas</span>
      <span class="arrow">▼</span>
    `;

    // Collapsible content
    const content = createContainer('formula-help-content hidden mt-2');
    content.innerHTML = `
      <p class="text-gray-600">
        Use LaTeX syntax to write mathematical expressions. Below are some examples:
      </p>
      <div class="mt-4 space-y-2">
        <div>
          <strong>Example 1:</strong> Quadratic formula
          <pre class="bg-gray-100 p-2 rounded-md">x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</pre>
        </div>
        <div>
          <strong>Example 2:</strong> Integral
          <pre class="bg-gray-100 p-2 rounded-md">\\int_{a}^{b} x^2 \\, dx</pre>
        </div>
        <div>
          <strong>Example 3:</strong> Matrix
          <pre class="bg-gray-100 p-2 rounded-md">
\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix}
          </pre>
        </div>
        <div>
          <strong>Example 4:</strong> Greek letters
          <pre class="bg-gray-100 p-2 rounded-md">\\alpha, \\beta, \\gamma</pre>
        </div>
      </div>
      <p class="mt-4 text-gray-600">
        For more information, refer to the <a href="https://en.wikibooks.org/wiki/LaTeX/Mathematics" target="_blank" class="text-blue-500 hover:underline">LaTeX documentation</a>.
      </p>
    `;

    // Toggle visibility on header click
    header.addEventListener('click', () => {
      content.classList.toggle('hidden');
      const arrow = header.querySelector('.arrow');
      if (arrow) {
        arrow.textContent = content.classList.contains('hidden') ? '▼' : '▲';
      }
    });

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  private handleInsertSymbol = (symbol: string): void => {
    if (!this.expressionInput) return;
    const cursorPos = this.expressionInput.selectionStart;
    const currentValue = this.expressionInput.value;
    this.expressionInput.value =
      currentValue.slice(0, cursorPos) + symbol + currentValue.slice(cursorPos);
    this.expressionInput.focus();
    this.expressionInput.setSelectionRange(cursorPos + symbol.length, cursorPos + symbol.length);
    this.handleInputChange(this.expressionInput.value);
  };

  private createMathEditorContainer(): HTMLElement {
    const container = createContainer('math-editor-container mb-6');

    container.appendChild(this.mathToolbar.getElement());

    const inputLabel = createLabel('Math Expression (LaTeX)', 'math-expression');
    this.expressionInput = createTextarea('Enter your math expression here...', '', (value) =>
      this.handleInputChange(value)
    );
    this.expressionInput.id = 'math-editor-container mb-6';
    this.expressionInput.className =
      'math-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

    container.appendChild(inputLabel);
    container.appendChild(this.expressionInput);

    return container;
  }

  private handleInputChange(value: string): void {
    this.expression = value;
    this.updatePreview(value);
  }

  private createPreviewContainer(): HTMLElement {
    this.previewContainer = createContainer(
      'preview-math-container h-64 bg-gray-50 rounded-lg flex items-center justify-center'
    );
    this.previewContainer.innerHTML =
      '<div class="text-gray-400">Math preview will appear here</div>';
    return this.previewContainer;
  }

  private async updatePreview(expression: MathExpression): Promise<void> {
    const previewContainer = this.popup.getElement()?.querySelector('.preview-math-container');
    if (!previewContainer) return;

    const canvas = await this.renderer.renderMath(expression, {
      width: 400,
      height: 100,
    });

    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
  }

  private async handleSubmit(): Promise<void> {
    const expression = this.expression;
    if (!expression) return;

    this.editor?.ensureEditorFocus();

    if (this.editingMath) {
      this.editingMath.setAttribute('data-math-expression', expression);

      const canvas = await this.renderer.renderMath(expression, {
        width: this.editingMath.clientWidth || 800,
        height: this.editingMath.clientHeight || 200,
      });

      this.editingMath.innerHTML = '';
      this.editingMath.appendChild(canvas);
    } else {
      const mathContainer = createContainer('math-container');
      mathContainer.style.width = '100%';
      mathContainer.style.height = '200px';
      mathContainer.setAttribute('data-math-expression', expression);

      const canvas = await this.renderer.renderMath(expression, {
        width: mathContainer.clientWidth || 800,
        height: mathContainer.clientHeight || 200,
      });
      mathContainer.appendChild(canvas);

      if (this.onInsert) {
        this.onInsert(mathContainer);
      }
    }

    this.popup.hide();
  }

  public show(onInsert: (element: HTMLElement) => void): void {
    this.editingMath = null;
    this.onInsert = onInsert;
    this.popup.show();
  }

  public edit(mathElement: HTMLElement): void {
    this.editingMath = mathElement;

    const expression = mathElement.getAttribute('data-math-expression');
    if (expression) {
      this.expression = expression;
      this.updatePreview(expression);
    }

    this.popup.show();
  }

  public async redrawMath(
    container: HTMLElement,
    expression: MathExpression,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    const canvas = await this.renderer.renderMath(expression, dimensions);
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  public destroy(): void {
    this.popup.destroy();
    this.mathToolbar.destroy();
    this.expressionInput?.remove();
    this.previewContainer?.remove();

    this.editor = null!;
    this.popup = null!;
    this.renderer = null!;
    this.onInsert = null;
    this.editingMath = null;
  }
}
