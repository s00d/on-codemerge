import {
    HTMLEditor,
    ToolbarPlugin,
    TypographyPlugin,
    TablePlugin,
    ImagePlugin,
    LinkPlugin,
    ListsPlugin,
    ColorPlugin,
    AlignmentPlugin,
    BlockPlugin,
    CodeBlockPlugin,
    ExportPlugin
} from 'on-codemerge';

// Импортируем стили
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

// Импортируем стили плагинов
import 'on-codemerge/plugins/TablePlugin/public.css';
import 'on-codemerge/plugins/ImagePlugin/public.css';
import 'on-codemerge/plugins/LinkPlugin/public.css';
import 'on-codemerge/plugins/ListsPlugin/public.css';
import 'on-codemerge/plugins/ColorPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/BlockPlugin/public.css';
import 'on-codemerge/plugins/CodeBlockPlugin/public.css';
import 'on-codemerge/plugins/ExportPlugin/public.css';

interface PluginInfo {
    name: string;
    instance: any;
    enabled: boolean;
}

class DemoApp {
    private editor: HTMLEditor | null = null;
    private outputElement!: HTMLElement;
    private pluginStatusElement!: HTMLElement;
    private memoryInfoElement!: HTMLElement;
    private plugins: Map<string, PluginInfo> = new Map();
    private initialContent: string = '';

    constructor() {
        this.initializeEditor();
        this.setupEventListeners();
        this.loadInitialContent();
        this.updatePluginStatus();
    }

    private initializeEditor(): void {
        const editorContainer = document.getElementById('editor');
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }

        // Создаем экземпляр редактора
        this.editor = new HTMLEditor(editorContainer, { mode: 'direct' });

        // Регистрируем плагины и сохраняем информацию о них
        this.registerPlugin('toolbar', new ToolbarPlugin());
        this.registerPlugin('typography', new TypographyPlugin());
        this.registerPlugin('table', new TablePlugin());
        this.registerPlugin('image', new ImagePlugin());
        this.registerPlugin('link', new LinkPlugin());
        this.registerPlugin('lists', new ListsPlugin());
        this.registerPlugin('color', new ColorPlugin());
        this.registerPlugin('alignment', new AlignmentPlugin());
        this.registerPlugin('block', new BlockPlugin());
        this.registerPlugin('codeblock', new CodeBlockPlugin());
        this.registerPlugin('export', new ExportPlugin());

        console.log('Editor initialized successfully');
    }

    private registerPlugin(name: string, plugin: any): void {
        if (this.editor) {
            this.editor.use(plugin);
            this.plugins.set(name, {
                name,
                instance: plugin,
                enabled: true
            });
        }
    }

    private setupEventListeners(): void {
        this.outputElement = document.getElementById('output') as HTMLElement;
        this.pluginStatusElement = document.getElementById('pluginStatus') as HTMLElement;
        this.memoryInfoElement = document.getElementById('memoryInfo') as HTMLElement;

        // Кнопки управления плагинами
        this.setupPluginToggles();
        
        // Кнопки управления редактором
        document.getElementById('reloadEditor')?.addEventListener('click', () => {
            this.reloadEditor();
        });

        document.getElementById('destroyEditor')?.addEventListener('click', () => {
            this.destroyEditor();
        });

        document.getElementById('checkMemory')?.addEventListener('click', () => {
            this.checkMemory();
        });

        // Кнопки контента
        document.getElementById('getContent')?.addEventListener('click', () => {
            this.getContent();
        });

        document.getElementById('setContent')?.addEventListener('click', () => {
            this.setContent();
        });

        document.getElementById('clearContent')?.addEventListener('click', () => {
            this.clearContent();
        });

        document.getElementById('focusEditor')?.addEventListener('click', () => {
            this.focusEditor();
        });

        // Слушаем изменения в редакторе
        if (this.editor) {
            this.editor.on('contentChange', () => {
                console.log('Content changed');
            });
        }
    }

    private setupPluginToggles(): void {
        const pluginIds = [
            'toolbar-plugin', 'typography-plugin', 'table-plugin', 'image-plugin',
            'link-plugin', 'lists-plugin', 'color-plugin', 'alignment-plugin',
            'block-plugin', 'codeblock-plugin', 'export-plugin'
        ];

        pluginIds.forEach(pluginId => {
            const checkbox = document.getElementById(pluginId) as HTMLInputElement;
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    const pluginName = pluginId.replace('-plugin', '');
                    this.togglePlugin(pluginName, target.checked);
                });
            }
        });
    }

    private togglePlugin(pluginName: string, enabled: boolean): void {
        const pluginInfo = this.plugins.get(pluginName);
        if (!pluginInfo || !this.editor) return;

        try {
            if (enabled && !pluginInfo.enabled) {
                // Включаем плагин
                this.editor.use(pluginInfo.instance);
                pluginInfo.enabled = true;
                console.log(`Plugin ${pluginName} enabled`);
            } else if (!enabled && pluginInfo.enabled) {
                // Отключаем плагин
                if (pluginInfo.instance.destroy) {
                    pluginInfo.instance.destroy();
                }
                pluginInfo.enabled = false;
                console.log(`Plugin ${pluginName} disabled`);
            }
            this.updatePluginStatus();
        } catch (error) {
            console.error(`Error toggling plugin ${pluginName}:`, error);
            // Возвращаем checkbox в предыдущее состояние
            const checkbox = document.getElementById(`${pluginName}-plugin`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = !enabled;
            }
        }
    }

    private reloadEditor(): void {
        try {
            if (!this.editor) return;
            
            // Сохраняем текущий контент
            const currentContent = this.editor.getHtml();
            
            // Уничтожаем текущий редактор
            this.destroyEditor();
            
            // Создаем новый редактор
            setTimeout(() => {
                this.initializeEditor();
                this.setupEventListeners();
                if (this.editor) {
                    this.editor.setHtml(currentContent);
                }
                this.updatePluginStatus();
                console.log('Editor reloaded successfully');
            }, 100);
        } catch (error) {
            console.error('Error reloading editor:', error);
        }
    }

    private destroyEditor(): void {
        try {
            if (this.editor) {
                // Уничтожаем все плагины
                this.plugins.forEach((pluginInfo, name) => {
                    if (pluginInfo.enabled && pluginInfo.instance.destroy) {
                        try {
                            pluginInfo.instance.destroy();
                            console.log(`Plugin ${name} destroyed`);
                        } catch (error) {
                            console.error(`Error destroying plugin ${name}:`, error);
                        }
                    }
                });

                // Уничтожаем редактор
                this.editor.destroy();
                this.editor = null;
                
                // Очищаем контейнер
                const editorContainer = document.getElementById('editor');
                if (editorContainer) {
                    editorContainer.innerHTML = '';
                }

                // Очищаем плагины
                this.plugins.clear();
                
                this.updatePluginStatus();
                console.log('Editor destroyed successfully');
            }
        } catch (error) {
            console.error('Error destroying editor:', error);
        }
    }

    private checkMemory(): void {
        try {
            // @ts-ignore - performance.memory доступен в Chrome
            if (performance.memory) {
                // @ts-ignore
                const memory = performance.memory;
                const memoryInfo = `
                    Used: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB
                    Total: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB
                    Limit: ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB
                `;
                this.memoryInfoElement.textContent = `Memory: ${memoryInfo}`;
            } else {
                this.memoryInfoElement.textContent = 'Memory: Performance.memory not available';
            }
        } catch (error) {
            console.error('Error checking memory:', error);
            this.memoryInfoElement.textContent = 'Memory: Error checking memory';
        }
    }

    private updatePluginStatus(): void {
        if (!this.editor) {
            this.pluginStatusElement.textContent = 'Status: Editor not loaded';
            return;
        }

        const enabledCount = Array.from(this.plugins.values()).filter(p => p.enabled).length;
        const totalCount = this.plugins.size;
        this.pluginStatusElement.textContent = `Status: ${enabledCount}/${totalCount} plugins enabled`;
    }

    private loadInitialContent(): void {
        this.initialContent = `
            <h1>Welcome to on-codemerge!</h1>
            <p>This is a demo of a powerful WYSIWYG editor. Try:</p>
            <ul>
                <li><strong>Formatting text</strong> - use the toolbar</li>
                <li><em>Creating headings</em> - select heading level</li>
                <li>Adding <span style="color: #007bff;">colored text</span></li>
                <li>Creating lists and tables</li>
            </ul>
            <p>The editor supports many plugins to extend functionality.</p>
            <p><strong>Test plugin management:</strong></p>
            <ul>
                <li>Toggle plugins on/off using checkboxes above</li>
                <li>Reload the editor to test plugin reinitialization</li>
                <li>Destroy and recreate the editor</li>
                <li>Check memory usage</li>
            </ul>
        `;

        if (this.editor) {
            this.editor.setHtml(this.initialContent);
        }
    }

    private getContent(): void {
        try {
            if (!this.editor) {
                this.outputElement.innerHTML = '<p style="color: red;">Editor not loaded</p>';
                return;
            }
            const content = this.editor.getHtml();
            this.outputElement.innerHTML = `<pre>${this.escapeHtml(content)}</pre>`;
            console.log('Content retrieved:', content);
        } catch (error) {
            console.error('Error getting content:', error);
            this.outputElement.innerHTML = `<p style="color: red;">Error getting content: ${error}</p>`;
        }
    }

    private setContent(): void {
        const sampleContent = `
            <h2>New Content</h2>
            <p>This is an example of new content that can be set programmatically.</p>
            <table border="1" style="width: 100%;">
                <tr>
                    <th>Column 1</th>
                    <th>Column 2</th>
                </tr>
                <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                </tr>
            </table>
        `;

        try {
            if (this.editor) {
                this.editor.setHtml(sampleContent);
                console.log('Content set successfully');
            }
        } catch (error) {
            console.error('Error setting content:', error);
        }
    }

    private clearContent(): void {
        try {
            if (this.editor) {
                this.editor.setHtml('');
            }
            this.outputElement.innerHTML = '';
            console.log('Content cleared');
        } catch (error) {
            console.error('Error clearing content:', error);
        }
    }

    private focusEditor(): void {
        try {
            if (this.editor) {
                this.editor.ensureEditorFocus();
                console.log('Editor focused');
            }
        } catch (error) {
            console.error('Error focusing editor:', error);
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализируем приложение когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    try {
        new DemoApp();
        console.log('Demo app started successfully');
    } catch (error) {
        console.error('Failed to start demo app:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h1>Initialization Error</h1>
                <p>Failed to start demo application: ${error}</p>
                <p>Check browser console for additional information.</p>
            </div>
        `;
    }
});
