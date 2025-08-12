import { PopupManager } from '../../../core/ui/PopupManager';
import type { Viewport } from '../types';
import { responsiveIcon, mobileIcon, tabletIcon, desktopIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer, createSpan } from '../../../utils/helpers.ts';
import { SetViewportCommand } from '../commands/SetViewportCommand';

// Интерфейс для описания структуры элемента массива viewports
interface ViewportOption {
  name: Viewport;
  icon: string;
  label: string;
  size: string;
  description: string;
  hotkey: string;
}

export class ResponsiveMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private viewportChangeHandlers: ((viewport: Viewport) => void)[] = [];
  private activeViewport: Viewport;

  private viewports: ViewportOption[] = [];

  constructor(editor: HTMLEditor) {
    this.editor = editor;

    // Синхронизируем с текущим состоянием ViewportManager
    const plugins = this.editor.getPlugins();
    const responsivePlugin = plugins.get('responsive') as any;
    this.activeViewport = responsivePlugin?.viewportManager?.getCurrentViewport?.() || 'responsive';

    this.viewports = [
      {
        name: 'mobile',
        icon: mobileIcon,
        label: editor.t('Mobile'),
        size: '320px',
        description: editor.t('Smartphone view'),
        hotkey: 'Ctrl+1',
      },
      {
        name: 'tablet',
        icon: tabletIcon,
        label: editor.t('Tablet'),
        size: '768px',
        description: editor.t('Tablet view'),
        hotkey: 'Ctrl+2',
      },
      {
        name: 'desktop',
        icon: desktopIcon,
        label: editor.t('Desktop'),
        size: '1024px',
        description: editor.t('Standard desktop'),
        hotkey: 'Ctrl+3',
      },
      {
        name: 'largeDesktop',
        icon: desktopIcon,
        label: editor.t('Large Desktop'),
        size: '1440px',
        description: editor.t('Large desktop view'),
        hotkey: 'Ctrl+4',
      },
      {
        name: 'ultraWide',
        icon: desktopIcon,
        label: editor.t('Ultra Wide'),
        size: '1920px',
        description: editor.t('Ultra wide screen'),
        hotkey: 'Ctrl+5',
      },
      {
        name: 'responsive',
        icon: responsiveIcon,
        label: editor.t('Responsive'),
        size: 'Fluid',
        description: editor.t('Fluid width'),
        hotkey: 'Ctrl+0',
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

    // Устанавливаем горячие клавиши
    this.setupHotkeys();
  }

  private createContent(): HTMLElement {
    const container = createContainer('p-6 space-y-6');

    // Заголовок с текущим viewport'ом
    const header = createContainer('flex items-center justify-between');
    const title = createSpan('text-lg font-semibold', this.editor.t('Select Viewport'));
    const currentViewport = this.viewports.find((v) => v.name === this.activeViewport);
    const currentInfo = createSpan(
      'text-sm text-gray-500',
      `${currentViewport?.label} (${currentViewport?.size})`
    );

    header.appendChild(title);
    header.appendChild(currentInfo);
    container.appendChild(header);

    // Сетка viewport'ов
    const grid = createContainer('grid grid-cols-2 gap-4');

    this.viewports.forEach((viewport) => {
      const button = this.createViewportButton(viewport);
      grid.appendChild(button);
    });

    container.appendChild(grid);

    // Информационная панель
    const infoPanel = this.createInfoPanel();
    container.appendChild(infoPanel);

    // Настройка обработчиков событий
    this.setupEventListeners(grid);

    return container;
  }

  private createViewportButton(viewport: ViewportOption): HTMLElement {
    const isActive = viewport.name === this.activeViewport;

    const button = createButton('', () => {
      this.setActiveViewport(viewport.name);
      this.popup.hide();
    });

    button.className = `viewport-btn w-full p-4 border-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
    }`;
    button.dataset.viewport = viewport.name;

    const buttonContent = createContainer('flex flex-col items-center gap-3');

    // Иконка с размером экрана
    const iconContainer = createContainer('relative');
    const iconElement = createContainer('text-2xl');
    iconElement.innerHTML = viewport.icon;

    // Превью экрана
    const screenPreview = createContainer(
      `w-16 h-10 border-2 border-gray-300 rounded ${
        viewport.name === 'responsive' ? 'w-20' : 'w-16'
      }`
    );
    screenPreview.style.background =
      'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
    screenPreview.style.backgroundSize = '4px 4px';
    screenPreview.style.backgroundPosition = '0 0, 0 2px, 2px -2px, -2px 0px';

    iconContainer.appendChild(iconElement);
    iconContainer.appendChild(screenPreview);

    // Текст
    const textContainer = createContainer('text-center');
    const labelElement = createSpan('block text-sm font-medium text-gray-900', viewport.label);
    const sizeElement = createSpan('block text-xs text-gray-500 mt-1', viewport.size);
    const descriptionElement = createSpan('block text-xs text-gray-400 mt-1', viewport.description);
    const hotkeyElement = createSpan('block text-xs text-blue-500 mt-1 font-mono', viewport.hotkey);

    textContainer.appendChild(labelElement);
    textContainer.appendChild(sizeElement);
    textContainer.appendChild(descriptionElement);
    textContainer.appendChild(hotkeyElement);

    buttonContent.appendChild(iconContainer);
    buttonContent.appendChild(textContainer);
    button.appendChild(buttonContent);

    return button;
  }

  private createInfoPanel(): HTMLElement {
    const panel = createContainer('mt-6 p-4 bg-gray-50 rounded-lg border');

    const title = createSpan('block text-sm font-medium text-gray-900 mb-2', this.editor.t('Tips'));

    const tips = [
      this.editor.t('• Use hotkeys for quick switching'),
      this.editor.t('• Responsive mode allows manual resizing'),
      this.editor.t('• Viewport state is saved automatically'),
      this.editor.t('• Tables adapt automatically to viewport size'),
    ];

    const tipsList = createContainer('space-y-1');
    tips.forEach((tip) => {
      const tipElement = createSpan('block text-xs text-gray-600', tip);
      tipsList.appendChild(tipElement);
    });

    panel.appendChild(title);
    panel.appendChild(tipsList);

    return panel;
  }

  private setupEventListeners(grid: HTMLElement): void {
    grid.querySelectorAll('.viewport-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewport = (btn as HTMLElement).dataset.viewport as Viewport;
        this.setActiveViewport(viewport);
        this.popup.hide();
      });
    });

    // Обработчик Escape для закрытия
    this.editor.getDOMContext().addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape') {
        this.popup?.hide();
      }
    });
  }

  private setupHotkeys(): void {
    this.editor.getDOMContext().addEventListener('keydown', (e: Event) => {
      if (
        (e as KeyboardEvent).ctrlKey &&
        !(e as KeyboardEvent).shiftKey &&
        !(e as KeyboardEvent).altKey
      ) {
        const key = (e as KeyboardEvent).key;
        const viewportMap: Record<string, Viewport> = {
          '1': 'mobile',
          '2': 'tablet',
          '3': 'desktop',
          '4': 'largeDesktop',
          '5': 'ultraWide',
          '0': 'responsive',
        };

        if (viewportMap[key]) {
          e.preventDefault();
          this.setActiveViewport(viewportMap[key]);
        }
      }
    });
  }

  private setActiveViewport(viewport: Viewport): void {
    this.activeViewport = viewport;
    this.notifyViewportChange(viewport);

    // Используем команду для изменения viewport'а
    const command = new SetViewportCommand(this.editor);
    command.setViewport(viewport);
    command.execute();

    // Обновляем UI если меню открыто
    if (this.popup) {
      const buttons = this.editor.getDOMContext().querySelectorAll('.viewport-btn');
      buttons.forEach((btn) => {
        const btnElement = btn as HTMLElement;
        const isActive = btnElement.dataset.viewport === viewport;
        btnElement.className = `viewport-btn w-full p-4 border-2 rounded-lg transition-all duration-200 ${
          isActive
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`;
      });
    }
  }

  public show(): void {
    // Перед каждым открытием меню синхронизируем activeViewport
    const plugins = this.editor.getPlugins();
    const responsivePlugin = plugins.get('responsive') as any;
    this.activeViewport = responsivePlugin?.viewportManager?.getCurrentViewport?.() || 'responsive';
    this.popup.show();
  }

  public onViewportChange(handler: (viewport: Viewport) => void): void {
    this.viewportChangeHandlers.push(handler);
  }

  private notifyViewportChange(viewport: Viewport): void {
    this.viewportChangeHandlers.forEach((handler) => handler(viewport));
  }

  public getActiveViewport(): Viewport {
    return this.activeViewport;
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
