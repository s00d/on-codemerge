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
    ExportPlugin,
    ToolbarDividerPlugin
} from 'on-codemerge';

// Import styles
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

// Import plugin styles
import 'on-codemerge/plugins/TablePlugin/public.css';
// import 'on-codemerge/plugins/ImagePlugin/public.css';
import 'on-codemerge/plugins/LinkPlugin/public.css';
import 'on-codemerge/plugins/ListsPlugin/public.css';
// import 'on-codemerge/plugins/ColorPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/BlockPlugin/public.css';
import 'on-codemerge/plugins/CodeBlockPlugin/public.css';
// import 'on-codemerge/plugins/ExportPlugin/public.css';

interface PluginInfo {
    name: string;
    instance: any;
    enabled: boolean;
}

class DemoApp {
    private editor!: HTMLEditor;
    private outputElement!: HTMLElement;
    private pluginStatusElement!: HTMLElement;
    private memoryInfoElement!: HTMLElement;
    private pluginInstances: Map<string, any> = new Map(); // Store plugin instances for re-enabling
    private initialContent: string = '';
    private isReloading: boolean = false; // Prevent multiple reload calls

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

        this.editor = new HTMLEditor(editorContainer, { mode: 'direct' });

        // Register plugins
        this.registerPlugin(new ToolbarPlugin());
        this.registerPlugin(new TypographyPlugin());
        this.registerPlugin(new ToolbarDividerPlugin());
        this.registerPlugin(new TablePlugin());
        this.registerPlugin(new ImagePlugin());
        this.registerPlugin(new LinkPlugin());
        this.registerPlugin(new ListsPlugin());
        this.registerPlugin(new ColorPlugin());
        this.registerPlugin(new AlignmentPlugin());
        this.registerPlugin(new BlockPlugin());
        this.registerPlugin(new CodeBlockPlugin());
        this.registerPlugin(new ExportPlugin());

        console.log('Editor initialized successfully');
        
        // Setup plugin toggles after plugins are registered
        this.setupPluginToggles();
    }

    private registerPlugin(plugin: any): void {
        this.editor.use(plugin);
        this.pluginInstances.set(plugin.name, plugin); // Store instance for re-enabling
        console.log(`Plugin ${plugin.name} registered`);
    }

    private setupEventListeners(): void {
        this.outputElement = document.getElementById('output') as HTMLElement;
        this.pluginStatusElement = document.getElementById('pluginStatus') as HTMLElement;
        this.memoryInfoElement = document.getElementById('memoryInfo') as HTMLElement;

        this.setupControlButtons();
        this.setupContentButtons();

        // Subscribe to content changes for automatic HTML Output updates
        this.editor.subscribeToContentChange((newContent) => {
            console.log('Content changed, updating HTML Output');
            this.updateHtmlOutput(newContent);
        });

        this.editor.on('contentChange', () => {
            console.log('Content changed');
        });
    }

    private setupPluginToggles(): void {
        if (!this.editor) {
            console.warn('Cannot setup plugin toggles: editor not initialized');
            return;
        }

        // Clear existing event listeners first
        this.clearPluginToggleListeners();
        
        // Create plugin toggles dynamically from registered plugins
        this.pluginInstances.forEach((plugin, pluginName) => {
            const pluginId = `${pluginName}-plugin`;
            const checkbox = document.getElementById(pluginId) as HTMLInputElement;
            if (checkbox) {
                // Check if plugin is currently active
                const isActive = this.editor.getPlugins().has(pluginName);
                checkbox.checked = isActive;
                
                // Toolbar cannot be disabled
                if (pluginName === 'toolbar') {
                    checkbox.disabled = true;
                    checkbox.title = 'Toolbar plugin cannot be disabled';
                }
                
                checkbox.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    this.togglePlugin(pluginName, target.checked);
                });
            }
        });
    }

    private clearPluginToggleListeners(): void {
        if (!this.editor) {
            return;
        }

        // Clear event listeners from all plugin checkboxes
        this.pluginInstances.forEach((plugin, pluginName) => {
            const pluginId = `${pluginName}-plugin`;
            const checkbox = document.getElementById(pluginId) as HTMLInputElement;
            if (checkbox) {
                // Clone the checkbox to remove all event listeners
                const newCheckbox = checkbox.cloneNode(true) as HTMLInputElement;
                newCheckbox.checked = checkbox.checked;
                newCheckbox.disabled = checkbox.disabled;
                newCheckbox.title = checkbox.title;
                checkbox.parentNode?.replaceChild(newCheckbox, checkbox);
            }
        });
    }

    private setupControlButtons(): void {
        const reloadButton = document.getElementById('reloadEditor');
        const destroyButton = document.getElementById('destroyEditor');
        const checkMemoryButton = document.getElementById('checkMemory');

        if (reloadButton) {
            reloadButton.addEventListener('click', () => {
                if (this.isReloading) {
                    console.warn('Reload already in progress');
                    return;
                }
                this.reloadEditor();
            });
        }

        if (destroyButton) {
            destroyButton.addEventListener('click', () => {
                if (this.isReloading) {
                    console.warn('Cannot destroy editor during reload');
                    return;
                }
                this.destroyEditor();
            });
        }

        if (checkMemoryButton) {
            checkMemoryButton.addEventListener('click', () => {
                this.checkMemory();
            });
        }
    }

    private setupContentButtons(): void {
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
    }

    private togglePlugin(pluginName: string, enabled: boolean): void {
        if (!this.editor) {
            console.warn('Cannot toggle plugin: editor not initialized');
            return;
        }

        const plugin = this.editor.getPlugins().get(pluginName);
        const pluginInstance = this.pluginInstances.get(pluginName);
        
        if (!pluginInstance) return;

        // Toolbar cannot be disabled - it's a core plugin
        if (pluginName === 'toolbar' && !enabled) {
            console.warn('Toolbar plugin cannot be disabled');
            const checkbox = document.getElementById('toolbar-plugin') as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = true; // Return checkbox to "enabled" state
            }
            return;
        }

        try {
            if (enabled && !plugin) {
                // Enable plugin - re-register it using stored instance
                this.editor.use(pluginInstance);
                console.log(`Plugin ${pluginName} enabled`);
            } else if (!enabled && plugin) {
                // Disable plugin
                this.editor.remove(pluginName);
                console.log(`Plugin ${pluginName} disabled`);
            }
            this.updatePluginStatus();
        } catch (error) {
            console.error(`Error toggling plugin ${pluginName}:`, error);
            const checkbox = document.getElementById(`${pluginName}-plugin`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = !enabled;
            }
        }
    }

    private reloadEditor(): void {
        if (this.isReloading) {
            console.warn('Reload already in progress. Skipping.');
            return;
        }

        if (!this.editor) {
            console.warn('Cannot reload: editor not initialized');
            return;
        }

        this.isReloading = true;
        
        // Update UI to show reloading state
        this.updateReloadingState(true);

        // Save content before destroying editor
        const currentContent = this.editor.getHtml();
        
        this.destroyEditor();

        setTimeout(() => {
            this.initializeEditor();

            // Restore checkbox states based on currently active plugins
            this.editor.getPlugins().forEach((plugin, pluginName) => {
                const checkbox = document.getElementById(`${pluginName}-plugin`) as HTMLInputElement;
                if (checkbox) {
                    checkbox.checked = true; // Plugin is active
                }
            });

            this.setupEventListeners();
            this.editor.setHtml(currentContent);
            // HTML Output will be updated automatically via subscribeToContentChange
            this.setupPluginToggles(); // Re-setup plugin toggles after reload
            this.updatePluginStatus();
            
            // Update UI to show completed state
            this.updateReloadingState(false);
            this.isReloading = false;
            
            console.log('Editor reloaded successfully');
        }, 100);
    }

    private destroyEditor(): void {
        if (!this.editor) {
            console.warn('Editor already destroyed or not initialized');
            return;
        }

        this.editor.getPlugins().forEach((plugin, name) => {
            if (plugin.destroy) {
                try {
                    plugin.destroy();
                    console.log(`Plugin ${name} destroyed`);
                } catch (error) {
                    console.error(`Error destroying plugin ${name}:`, error);
                }
            }
        });

        this.editor.destroy();
        // @ts-ignore - editor will be recreated in reloadEditor
        this.editor = null;

        const editorContainer = document.getElementById('editor');
        if (editorContainer) {
            editorContainer.innerHTML = '';
        }

        // Clear plugin instances
        this.pluginInstances.clear();
        this.updatePluginStatus();
        console.log('Editor destroyed successfully');
    }

    private checkMemory(): void {
        if (!this.editor) {
            this.memoryInfoElement.textContent = 'Memory: Editor not loaded';
            return;
        }

        try {
            // @ts-ignore - performance.memory is available in Chrome
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

        const plugins = this.editor.getPlugins();
        const totalCount = plugins.size;

        const pluginsWithoutDestroy = Array.from(plugins.values())
            .filter(p => !p.destroy)
            .map(p => p.name);

        let statusText = `Status: ${totalCount} plugins loaded`;
        if (pluginsWithoutDestroy.length > 0) {
            statusText += ` | Plugins without destroy: ${pluginsWithoutDestroy.join(', ')}`;
        }
        statusText += ` | Toolbar: always enabled`;

        this.pluginStatusElement.textContent = statusText;
        this.checkMemory();
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

        this.editor.setHtml(this.initialContent);
        // HTML Output will be updated automatically via subscribeToContentChange
    }

    private getContent(): void {
        try {
            const content = this.editor.getHtml();
            this.updateHtmlOutput(content);
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
            this.editor.setHtml(sampleContent);
            // HTML Output will be updated automatically via subscribeToContentChange
            console.log('Content set successfully');
        } catch (error) {
            console.error('Error setting content:', error);
        }
    }

    private clearContent(): void {
        try {
            this.editor.setHtml('');
            this.updateHtmlOutput('');
            console.log('Content cleared');
        } catch (error) {
            console.error('Error clearing content:', error);
        }
    }

    private focusEditor(): void {
        try {
            this.editor.ensureEditorFocus();
            console.log('Editor focused');
        } catch (error) {
            console.error('Error focusing editor:', error);
        }
    }

    private updateHtmlOutput(newContent: string): void {
        this.outputElement.innerHTML = `<pre>${this.escapeHtml(newContent)}</pre>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private updateReloadingState(isReloading: boolean): void {
        const reloadButton = document.getElementById('reloadEditor') as HTMLButtonElement;
        if (reloadButton) {
            reloadButton.disabled = isReloading;
            reloadButton.textContent = isReloading ? 'Reloading...' : 'Reload Editor';
            reloadButton.style.backgroundColor = isReloading ? '#ccc' : '#4CAF50'; // Example color change
        }
    }
}

// Initialize application when DOM is loaded
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
