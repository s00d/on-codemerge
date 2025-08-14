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
    }

    private registerPlugin(plugin: any): void {
        this.editor.use(plugin);
        this.pluginInstances.set(plugin.name, plugin);
    }

    private setupEventListeners(): void {
        this.outputElement = document.getElementById('output') as HTMLElement;
        this.pluginStatusElement = document.getElementById('pluginStatus') as HTMLElement;
        this.memoryInfoElement = document.getElementById('memoryInfo') as HTMLElement;

        this.setupControlButtons();
        this.setupContentButtons();

        // Subscribe to content changes for automatic HTML Output updates
        this.editor.subscribeToContentChange((newContent) => {
            this.updateHtmlOutput(newContent);
        });

        this.editor.on('contentChange', () => {
            // Content change event handled
        });
        
        // Setup plugin toggles after all event listeners are set up
        this.setupPluginToggles();
    }

    private setupPluginToggles(createNew: boolean = true): void {
        if (!this.editor) {
            return;
        }

        // Create plugin toggles dynamically from registered plugins
        this.pluginInstances.forEach((plugin, pluginName) => {
            // Get the actual plugin name from the instance
            const actualPluginName = plugin.name;
            const pluginId = `${actualPluginName}-plugin`;
            
            console.log('setupPluginToggles', pluginName, '->', actualPluginName, '->', pluginId);
            
            let checkbox: HTMLInputElement;
            if (createNew) {
                // Create new checkbox
                console.log(`Creating checkbox for plugin ${actualPluginName}`);
                checkbox = this.createPluginCheckbox(actualPluginName, pluginId);
            } else {
                // Use existing checkbox
                checkbox = document.getElementById(pluginId) as HTMLInputElement;
                if (!checkbox) {
                    console.warn(`Checkbox not found for plugin ${actualPluginName}`);
                    return;
                }
            }
            
            // Check if plugin is currently active
            const isActive = this.editor.getPlugins().has(actualPluginName);
            checkbox.checked = isActive;
            
            // Toolbar cannot be disabled
            if (actualPluginName === 'toolbar') {
                checkbox.disabled = true;
                checkbox.title = 'Toolbar plugin cannot be disabled';
            }
            
            // Add event listener only if creating new
            if (createNew) {
                checkbox.addEventListener('change', (e) => {
                    console.log('Checkbox changed for plugin:', actualPluginName, e);
                    const target = e.target as HTMLInputElement;
                    this.togglePlugin(actualPluginName, target.checked);
                });
            }
        });
    }

    // clearPluginToggleListeners method removed - no longer needed

    private createPluginCheckbox(pluginName: string, pluginId: string): HTMLInputElement {
        // Create checkbox container
        const container = document.createElement('div');
        container.className = 'plugin-toggle';
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = pluginId;
        checkbox.checked = true;
        
        // Create label
        const label = document.createElement('span');
        label.textContent = this.formatPluginName(pluginName);
        
        // Assemble
        container.appendChild(checkbox);
        container.appendChild(label);
        
        // Add to plugin controls container
        const pluginControls = document.querySelector('.plugin-toggles');
        if (pluginControls) {
            pluginControls.appendChild(container);
        }
        
        return checkbox;
    }

    private formatPluginName(pluginName: string): string {
        // Convert plugin name to display name
        return pluginName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private setupControlButtons(): void {
        const reloadButton = document.getElementById('reloadEditor');
        const destroyButton = document.getElementById('destroyEditor');
        const checkMemoryButton = document.getElementById('checkMemory');

        if (reloadButton) {
            reloadButton.addEventListener('click', () => {
                if (this.isReloading) {
                    return;
                }
                this.reloadEditor();
            });
        }

        if (destroyButton) {
            destroyButton.addEventListener('click', () => {
                if (this.isReloading) {
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
            return;
        }

        const pluginInstance = this.pluginInstances.get(pluginName);
        if (!pluginInstance) return;

        // Toolbar cannot be disabled - it's a core plugin
        if (pluginName === 'toolbar' && !enabled) {
            const checkbox = document.getElementById('toolbar-plugin') as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = true;
            }
            return;
        }

        try {
            if (enabled) {
                // Enable plugin - re-register it using stored instance
                this.editor.use(pluginInstance);
            } else {
                // Disable plugin - use the actual plugin name from instance
                const actualPluginName = pluginInstance.name;
                const result = this.editor.remove(actualPluginName);
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
            return;
        }

        if (!this.editor) {
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
            
            // Re-setup plugin toggles after reload (but don't create new checkboxes)
            this.setupPluginToggles();

            this.setupEventListeners();
            this.editor.setHtml(currentContent);
            // HTML Output will be updated automatically via subscribeToContentChange
            this.updatePluginStatus();
            
            // Update UI to show completed state
            this.updateReloadingState(false);
            this.isReloading = false;
        }, 100);
    }

    private destroyEditor(): void {
        if (!this.editor) {
            return;
        }

        this.editor.getPlugins().forEach((plugin, name) => {
            if (plugin.destroy) {
                try {
                    plugin.destroy();
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

        this.updatePluginStatus();
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
        } catch (error) {
            console.error('Error setting content:', error);
        }
    }

    private clearContent(): void {
        try {
            this.editor.setHtml('');
            this.updateHtmlOutput('');
        } catch (error) {
            console.error('Error clearing content:', error);
        }
    }

    private focusEditor(): void {
        try {
            this.editor.ensureEditorFocus();
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
            reloadButton.style.backgroundColor = isReloading ? '#ccc' : '#4CAF50';
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
