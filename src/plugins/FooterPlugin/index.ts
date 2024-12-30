import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { StatisticsCalculator } from './services/StatisticsCalculator';
import { FooterRenderer } from './components/FooterRenderer';

export class FooterPlugin implements Plugin {
  name = 'footer';
  private editor: HTMLEditor | null = null;
  private calculator: StatisticsCalculator;
  private renderer: FooterRenderer | null = null;
  private updateTimeout: number | null = null;

  constructor() {
    this.calculator = new StatisticsCalculator();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.renderer = new FooterRenderer(editor);
    this.setupFooter();
    this.setupEventListeners();
  }

  private setupFooter(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    const footer = this.renderer?.createElement();
    if (footer) container.parentElement?.insertBefore(footer, container.nextSibling);
    this.updateStatistics();
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    container.addEventListener('input', () => this.scheduleUpdate());
    container.addEventListener('paste', () => this.scheduleUpdate());
  }

  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      window.clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = window.setTimeout(() => {
      this.updateStatistics();
    }, 300);
  }

  private updateStatistics(): void {
    if (!this.editor) return;

    const content = this.editor.getContainer().innerHTML;
    const stats = this.calculator.calculate(content);
    this.renderer?.update(stats);
  }
}