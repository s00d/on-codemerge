import './style.scss';
import './public.scss';

import type { PopupItem } from '../../core/ui/PopupManager';
import { PopupManager } from '../../core/ui/PopupManager';
import type { Plugin } from '../../core/Plugin';
import { createToolbarButton } from '../ToolbarPlugin/utils.ts';
import { aiAssistantIcon } from '../../icons/';
import {
  type AIDriver,
  OpenAIDriver,
  DeepSeekDriver,
  HuggingFaceDriver,
  GitHubAzureDriver,
  LlamaDriver,
  MistralDriver,
  OllamaDriver,
} from './drivers';
import type { HTMLEditor } from '../../core/HTMLEditor.ts';
import type { OptionsDescription } from './drivers/AIDriver.ts';

const LOCAL_STORAGE_KEY = 'aiAssistantSettings';

const defaultPrompt =
  'Write an article about the benefits of using artificial intelligence in web development. Include examples of JavaScript code and explain how AI can simplify the development process.';
const defaultStructurePrompt = `The response should be formatted as HTML code that can be inserted into a text editor. Follow these rules:
1. Headings should be wrapped in <h1>, <h2>, <h3>, etc.
2. Paragraphs should be wrapped in <p>.
3. Lists should use <ul>, <ol>, and <li>.
4. Code should be wrapped in <pre><code>.
5. Use <strong> and <em> for emphasis.
6. For images, use the <img> tag with the src attribute.
7. Links should use the <a> tag.
8. Tables should use <table>, <tr>, <th>, and <td>.
9. Do not include unnecessary tags like <html>, <head>, or <body>.
10. Ensure code examples are properly formatted.`;

export class AIAssistantPlugin implements Plugin {
  name = 'ai-assistant';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;
  private apiKey: string = '';
  private driver: AIDriver<any> | null = null;
  private driverName: string = 'openai';
  private structurePrompt: string = defaultStructurePrompt;
  private prompt: string = defaultPrompt;
  private driverOptions: any = {};
  private drivers: { [key: string]: AIDriver<any> } = {};

  constructor() {
    this.loadSettings();
    this.initializeDrivers();
  }

  private initializeDrivers(): void {
    this.drivers = {
      openai: new OpenAIDriver(this.apiKey),
      deepseek: new DeepSeekDriver(this.apiKey),
      huggingface: new HuggingFaceDriver(this.apiKey),
      github: new GitHubAzureDriver(this.apiKey),
      llama: new LlamaDriver(this.apiKey),
      mistral: new MistralDriver(this.apiKey),
      ollama: new OllamaDriver(this.apiKey),
    };
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupPopup();
    this.addToolbarButton();
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const aiButton = createToolbarButton({
        icon: aiAssistantIcon,
        title: 'AI Assistant',
        onClick: () => {
          this.popup?.show();
        },
      });

      toolbar.appendChild(aiButton);
    }
  }

  private createPopupItems(): PopupItem[] {
    // Массив стандартных полей для попапа
    const items: PopupItem[] = [
      {
        type: 'list',
        id: 'driver-select',
        label: 'AI Driver:',
        options: ['openai', 'deepseek', 'huggingface', 'github', 'llama', 'mistral', 'ollama'],
        value: this.driverName,
        onChange: (value) => {
          this.driverName = value as string;
          this.saveSettings();
          this.updatePopupContent(); // Обновляем содержимое попапа
        },
      },
      {
        type: 'input',
        id: 'api-key-input',
        label: 'API Key:',
        placeholder: 'Enter your API key',
        value: this.apiKey,
        onChange: (value) => {
          this.apiKey = value as string;
          this.saveSettings();
        },
      },
      {
        type: 'textarea',
        id: 'structure-prompt-textarea',
        label: 'Structure Prompt:',
        placeholder: 'Enter your structure prompt',
        value: this.structurePrompt,
        onChange: (value) => {
          this.structurePrompt = value as string;
          this.saveSettings();
        },
      },
      {
        type: 'textarea',
        id: 'prompt-textarea',
        label: 'Prompt:',
        placeholder: 'Enter your prompt',
        value: this.prompt,
        onChange: (value) => {
          this.prompt = value as string;
          this.saveSettings();
        },
      },
    ];

    // Добавляем динамические поля для опций драйвера
    const driverOptionsDescription = this.getDriverOptionsDescription();
    for (const [key, desc] of Object.entries(driverOptionsDescription)) {
      const item: PopupItem = {
        type: desc.type,
        id: `driver-option-${key}`,
        label: desc.label,
        options: desc.type === 'list' ? desc.options : undefined,
        value: this.driverOptions[key] || desc.default,
        onChange: (value) => {
          this.driverOptions[key] = value;
          this.saveSettings();
        },
      };

      if (desc.min) {
        item.min = desc.min;
      }

      if (desc.max) {
        item.max = desc.max;
      }

      items.push(item);
    }

    return items;
  }

  private setupPopup(): void {
    if (!this.editor) return;

    // Создаем массив items
    const items = this.createPopupItems();

    // Инициализируем попап
    this.popup = new PopupManager(this.editor, {
      title: 'AI Assistant',
      className: 'ai-assistant',
      closeOnClickOutside: true,
      buttons: [
        {
          label: 'Generate',
          variant: 'primary',
          onClick: () => this.handleGenerate(),
        },
        {
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
      ],
      items: items, // Передаем массив стандартных и динамических полей
    });
  }

  private updatePopupContent(): void {
    if (!this.popup) return;

    // Создаем массив items
    const items = this.createPopupItems();

    // Перерисовываем содержимое попапа
    this.popup.rerender(items);
  }

  private getDriverOptionsDescription(): OptionsDescription {
    const driver = this.drivers[this.driverName];
    if (driver) {
      return driver.getOptionsDescription();
    }
    return {};
  }

  private async handleGenerate(): Promise<void> {
    if (!this.editor || !this.popup) return;

    // Показываем лоадер
    this.popup.rerender([
      {
        type: 'loader',
        id: 'loader',
      },
      // Другие элементы попапа
    ]);

    // Получаем драйвер из массива
    this.driver = this.drivers[this.driverName];
    if (!this.driver) {
      throw new Error('Unsupported driver');
    }

    try {
      const fullPrompt = `${this.structurePrompt}\n\n${this.prompt}`;
      const generatedText = await this.driver.generateText(fullPrompt, this.driverOptions);

      this.editor.insertContent(generatedText);
      this.popup.hide();
    } catch (error) {
      console.error('Error generating text:', error);
      alert('Failed to generate text. Please check your API key and try again.');
    } finally {
      const items = this.createPopupItems();

      this.popup.rerender(items);
    }
  }

  private saveSettings(): void {
    const settings = {
      apiKey: this.apiKey,
      driverName: this.driverName,
      prompt: this.prompt,
      structurePrompt: this.structurePrompt,
      driverOptions: this.driverOptions,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }

  private loadSettings(): void {
    const settingsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      this.apiKey = settings.apiKey || '';
      this.driverName = settings.driverName || 'openai';
      this.prompt = settings.prompt || defaultPrompt;
      this.structurePrompt = settings.structurePrompt || defaultStructurePrompt;
      this.driverOptions = settings.driverOptions || {};
    }
  }

  destroy(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    this.editor = null;
  }
}
