import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ResponsiveMenu } from './components/ResponsiveMenu';
import { ViewportManager } from './services/ViewportManager';
import { responsiveIcon, mobileIcon, tabletIcon, desktopIcon } from '../../icons';

export class ResponsivePlugin implements Plugin {
  name = 'responsive';
  hotkeys = [
    { keys: 'Ctrl+1', description: 'Mobile View', command: 'responsive-mobile', icon: '📱' },
    { keys: 'Ctrl+2', description: 'Tablet View', command: 'responsive-tablet', icon: '📱' },
    { keys: 'Ctrl+3', description: 'Desktop View', command: 'responsive-desktop', icon: '💻' },
    { keys: 'Ctrl+4', description: 'Large Desktop View', command: 'responsive-large', icon: '💻' },
    { keys: 'Ctrl+5', description: 'Ultra Wide View', command: 'responsive-ultra', icon: '💻' },
    { keys: 'Ctrl+0', description: 'Responsive View', command: 'responsive-fluid', icon: '🔄' },
    { keys: 'Ctrl+Alt+R', description: 'Responsive Menu', command: 'responsive', icon: '🔄' },
  ];
  private editor: HTMLEditor | null = null;
  private menu: ResponsiveMenu | null = null;
  public viewportManager: ViewportManager;
  private toolbarButton: HTMLElement | null = null;
  private viewportIndicator: HTMLElement | null = null;
  private resizeHandle: HTMLElement | null = null;
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;

  constructor() {
    this.viewportManager = new ViewportManager();
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new ResponsiveMenu(editor);
    this.editor = editor;
    this.addViewportIndicator();
    this.setupViewportControls();
    this.setupHotkeys();

    this.editor.on('responsive', () => {
      this.editor?.ensureEditorFocus();
      this.menu?.show();
    });

    // Обработчики для горячих клавиш
    this.editor.on('responsive-mobile', () => {
      this.setViewport('mobile');
    });
    this.editor.on('responsive-tablet', () => {
      this.setViewport('tablet');
    });
    this.editor.on('responsive-desktop', () => {
      this.setViewport('desktop');
    });
    this.editor.on('responsive-large', () => {
      this.setViewport('largeDesktop');
    });
    this.editor.on('responsive-ultra', () => {
      this.setViewport('ultraWide');
    });
    this.editor.on('responsive-fluid', () => {
      this.setViewport('responsive');
    });
  }

  private addViewportIndicator(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    this.viewportIndicator = document.createElement('div');
    this.viewportIndicator.className =
      'viewport-indicator flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors';
    this.viewportIndicator.title =
      this.editor?.t('Current viewport - Click to change') || 'Current viewport - Click to change';

    this.updateViewportIndicator();

    this.viewportIndicator.addEventListener('click', () => {
      this.menu?.show();
    });

    // Добавляем после кнопки responsive
    if (this.toolbarButton) {
      this.toolbarButton.parentNode?.insertBefore(
        this.viewportIndicator,
        this.toolbarButton.nextSibling
      );
    } else {
      toolbar.appendChild(this.viewportIndicator);
    }
  }

  private updateViewportIndicator(): void {
    if (!this.viewportIndicator) return;

    // Берём актуальный viewport из viewportManager
    const currentViewport = this.viewportManager.getCurrentViewport();
    const currentWidth = this.viewportManager.getCurrentWidth();

    // Выбираем иконку для текущего viewport'а
    let icon = responsiveIcon;
    switch (currentViewport) {
      case 'mobile':
        icon = mobileIcon;
        break;
      case 'tablet':
        icon = tabletIcon;
        break;
      case 'desktop':
      case 'largeDesktop':
      case 'ultraWide':
        icon = desktopIcon;
        break;
    }

    this.viewportIndicator.innerHTML = `
      <span class="viewport-icon">${icon}</span>
      <span class="viewport-label">${this.getViewportLabel(currentViewport)}</span>
      <span class="viewport-width text-xs text-gray-500">${currentWidth}px</span>
    `;
  }

  private getViewportLabel(viewport: string): string {
    const labels: Record<string, string> = {
      mobile: this.editor?.t('Mobile') || 'Mobile',
      tablet: this.editor?.t('Tablet') || 'Tablet',
      desktop: this.editor?.t('Desktop') || 'Desktop',
      largeDesktop: this.editor?.t('Large') || 'Large',
      ultraWide: this.editor?.t('Ultra') || 'Ultra',
      responsive: this.editor?.t('Fluid') || 'Fluid',
    };
    return labels[viewport] || viewport;
  }

  private setupViewportControls(): void {
    if (!this.editor) return;
    const container = this.editor.getContainer();
    // Устанавливаем начальный viewport
    const currentViewport = this.viewportManager.getCurrentViewport();
    this.viewportManager.setViewport(container, currentViewport);
    this.menu?.onViewportChange((viewport) => {
      this.viewportManager.setViewport(container, viewport);
      this.updateViewportIndicator();
      this.editor?.triggerEvent('viewportChanged', {
        viewport,
        width: this.viewportManager.getCurrentWidth(),
      });
      this.adaptTablesToViewport(viewport);
      this.removeResizeHandle();
      if (viewport === 'responsive') {
        // Сбрасываем сохранённый размер при переключении на responsive
        localStorage.removeItem('responsive-custom-width');
        container.style.width = '100%';
        container.style.maxWidth = 'none';
        setTimeout(() => {
          this.addResizeHandle();
        }, 0);
      }
    });
    this.viewportManager.onViewportChange((viewport, width) => {
      this.updateViewportIndicator();
      this.editor?.triggerEvent('viewportChanged', { viewport, width });
      this.adaptTablesToViewport(viewport);
      this.removeResizeHandle();
      if (viewport === 'responsive') {
        const saved = localStorage.getItem('responsive-custom-width');
        if (saved) {
          container.style.width = saved + 'px';
          container.style.maxWidth = saved + 'px';
        }
        setTimeout(() => {
          this.addResizeHandle();
        }, 0);
      }
    });
    // При инициализации
    if (currentViewport === 'responsive') {
      // Сбрасываем сохранённый размер при инициализации в responsive режиме
      localStorage.removeItem('responsive-custom-width');
      container.style.width = '100%';
      container.style.maxWidth = 'none';
      setTimeout(() => {
        this.addResizeHandle();
      }, 0);
    }
  }

  private adaptTablesToViewport(viewport: string): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const tables = container.querySelectorAll('.html-editor-table');

    tables.forEach((table) => {
      const tableElement = table as HTMLElement;

      // Удаляем старые классы responsive
      tableElement.classList.remove('responsive-table');
      tableElement.classList.remove(
        'breakpoint-320',
        'breakpoint-768',
        'breakpoint-1024',
        'breakpoint-1440',
        'breakpoint-1920'
      );

      // Применяем новые классы в зависимости от viewport'а
      switch (viewport) {
        case 'mobile':
          tableElement.classList.add('responsive-table', 'breakpoint-320');
          break;
        case 'tablet':
          tableElement.classList.add('responsive-table', 'breakpoint-768');
          break;
        case 'desktop':
          tableElement.classList.add('responsive-table', 'breakpoint-1024');
          break;
        case 'largeDesktop':
          tableElement.classList.add('responsive-table', 'breakpoint-1440');
          break;
        case 'ultraWide':
          tableElement.classList.add('responsive-table', 'breakpoint-1920');
          break;
        case 'responsive':
          // В responsive режиме не применяем фиксированные breakpoint'ы
          // Пользователь может настроить их вручную
          break;
      }
    });
  }

  private setupHotkeys(): void {
    document.addEventListener('keydown', (e) => {
      // Горячие клавиши для быстрого переключения viewport'ов
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key;
        const viewportMap: Record<string, string> = {
          '1': 'mobile',
          '2': 'tablet',
          '3': 'desktop',
          '4': 'largeDesktop',
          '5': 'ultraWide',
          '0': 'responsive',
        };

        if (viewportMap[key]) {
          e.preventDefault();
          const container = this.editor?.getContainer();
          if (container) {
            this.viewportManager.setViewport(container, viewportMap[key] as any);
          }
        }
      }

      // Стрелки для переключения между viewport'ами
      if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const container = this.editor?.getContainer();
        if (container) {
          if (e.key === 'ArrowRight') {
            this.viewportManager.nextViewport();
          } else {
            this.viewportManager.previousViewport();
          }
        }
      }
    });
  }

  private setViewport(viewport: string): void {
    const container = this.editor?.getContainer();
    if (container) {
      this.viewportManager.setViewport(container, viewport as any);
    }
  }

  public getCurrentViewport(): string {
    return this.viewportManager.getCurrentViewport();
  }

  public getCurrentWidth(): number {
    return this.viewportManager.getCurrentWidth();
  }

  private addResizeHandle(): void {
    if (!this.editor) return;
    const container = this.editor.getContainer();
    // Удаляем старый handle если есть
    this.removeResizeHandle();
    if (this.viewportManager.getCurrentViewport() !== 'responsive') return;

    container.style.position = 'relative';
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'html-editor-responsive-resize-handle';
    this.resizeHandle.title = this.editor.t('Resize editor width');
    container.appendChild(this.resizeHandle);

    this.resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
    document.addEventListener('mousemove', (e) => this.onResize(e));
    document.addEventListener('mouseup', (e) => this.stopResize(e));
  }

  private removeResizeHandle(): void {
    if (this.resizeHandle && this.resizeHandle.parentElement) {
      this.resizeHandle.parentElement.removeChild(this.resizeHandle);
    }
    this.resizeHandle = null;
  }

  private startResize(e: MouseEvent): void {
    if (!this.editor) return;
    if (this.viewportManager.getCurrentViewport() !== 'responsive') return;
    this.isResizing = true;
    this.startX = e.clientX;
    this.startWidth = this.editor.getContainer().offsetWidth;
    document.body.style.cursor = 'ew-resize';
  }

  private onResize(e: MouseEvent): void {
    if (!this.isResizing || !this.editor) return;
    const dx = e.clientX - this.startX;
    let newWidth = this.startWidth + dx;
    newWidth = Math.max(320, Math.min(newWidth, 1920));
    const container = this.editor.getContainer();
    container.style.width = newWidth + 'px';
    container.style.maxWidth = newWidth + 'px';
    localStorage.setItem('responsive-custom-width', String(newWidth));
  }

  private stopResize(_e: MouseEvent): void {
    if (!this.isResizing) return;
    this.isResizing = false;
    document.body.style.cursor = '';
  }

  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.viewportIndicator && this.viewportIndicator.parentElement) {
      this.viewportIndicator.parentElement.removeChild(this.viewportIndicator);
    }

    if (this.menu) {
      this.menu.destroy();
      this.menu = null;
    }

    this.viewportManager.destroy();
    this.editor?.off('responsive');

    this.editor = null;
    this.toolbarButton = null;
    this.viewportIndicator = null;
    this.removeResizeHandle();
  }
}
