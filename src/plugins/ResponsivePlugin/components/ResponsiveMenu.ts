import { PopupManager } from '../../../core/ui/PopupManager';
import type { Viewport } from '../types';
import { responsiveIcon, mobileIcon, tabletIcon, desktopIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer, createP, createSpan } from '../../../utils/helpers.ts';

// Интерфейс для описания структуры элемента массива viewports
interface ViewportOption {
  name: Viewport;
  icon: string;
  label: string;
  size: string;
}

export class ResponsiveMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private viewportChangeHandlers: ((viewport: Viewport) => void)[] = [];

  private viewports: ViewportOption[] = [];

  constructor(editor: HTMLEditor) {
    this.editor = editor;

    this.viewports = [
      { name: 'mobile', icon: mobileIcon, label: editor.t('Mobile View'), size: '320px' },
      { name: 'tablet', icon: tabletIcon, label: editor.t('Tablet View'), size: '768px' },
      { name: 'desktop', icon: desktopIcon, label: editor.t('Desktop View'), size: '1024px' },
      {
        name: 'largeDesktop',
        icon: desktopIcon,
        label: editor.t('Large Desktop View'),
        size: '1440px',
      }, // Новый вьюпорт
      { name: 'ultraWide', icon: desktopIcon, label: editor.t('Ultra Wide View'), size: '1920px' }, // Новый
      {
        name: 'responsive',
        icon: responsiveIcon,
        label: editor.t('Responsive'),
        size: 'Fluid width',
      },
    ];

    this.popup = new PopupManager(editor, {
      title: editor.t('Responsive View'),
      className: 'responsive-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'responsive-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = createContainer('p-4');
    const grid = createContainer('grid grid-cols-3 gap-4');

    // Создаем кнопки на основе массива viewports
    this.viewports.forEach((viewport) => {
      const button = this.createViewportButton(viewport);
      grid.appendChild(button);
    });

    // Подсказка
    const hint = createContainer('mt-4 pt-4 border-t');
    const hintText = createP('text-sm text-gray-600');
    hintText.innerHTML = this.editor.t(
      `Select a viewport size to preview your content at different screen widths.<br>Use the resize handles in responsive mode to adjust the width manually.`
    );

    hint.appendChild(hintText);

    // Сборка структуры
    container.appendChild(grid);
    container.appendChild(hint);

    // Настройка обработчиков событий
    this.setupEventListeners(grid);

    return container;
  }

  private createViewportButton(viewport: ViewportOption): HTMLElement {
    const button = createButton('', () => {
      document
        .querySelectorAll('.viewport-btn')
        .forEach((btn) => btn.classList.remove('border-blue-500'));

      button.classList.add('border-blue-500');

      this.notifyViewportChange(viewport.name);

      this.popup.hide();
    });
    button.className = 'viewport-btn';
    button.dataset.viewport = viewport.name;

    const buttonContent = createContainer(
      'flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-blue-500 transition-colors text-center'
    );
    const iconElement = createContainer();
    iconElement.innerHTML = viewport.icon;

    const labelElement = createSpan('text-sm font-medium', viewport.label);
    const sizeElement = createSpan('text-xs text-gray-500', viewport.size);

    buttonContent.appendChild(iconElement);
    buttonContent.appendChild(labelElement);
    buttonContent.appendChild(sizeElement);
    button.appendChild(buttonContent);

    return button;
  }

  private setupEventListeners(grid: HTMLElement): void {
    grid.querySelectorAll('.viewport-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewport = (btn as HTMLElement).dataset.viewport as Viewport;
        this.notifyViewportChange(viewport);

        // Update active state
        grid.querySelectorAll('.viewport-btn').forEach((b) => {
          b.querySelector('div')?.classList.toggle('border-blue-500', b === btn);
        });

        this.popup.hide();
      });
    });
  }

  public show(): void {
    this.popup.show();
  }

  public onViewportChange(handler: (viewport: Viewport) => void): void {
    this.viewportChangeHandlers.push(handler);
  }

  private notifyViewportChange(viewport: Viewport): void {
    this.viewportChangeHandlers.forEach((handler) => handler(viewport));
  }

  public destroy(): void {
    // Уничтожаем PopupManager
    this.popup.destroy();

    // Очищаем обработчики изменений viewport
    this.viewportChangeHandlers = [];

    // Очищаем массив viewports
    this.viewports = [];

    // Очищаем ссылки
    this.editor = null!;
    this.popup = null!;
  }
}
