import type { Template, CreateTemplateData } from '../types';

export class TemplateManager {
  private storageKey = 'html-editor-templates';

  public getTemplates(): Template[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  public saveTemplate(data: CreateTemplateData): Template {
    const templates = this.getTemplates();
    const newTemplate: Template = {
      id: crypto.randomUUID(),
      name: data.name,
      content: data.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    templates.push(newTemplate);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return newTemplate;
  }

  public updateTemplate(id: string, data: Partial<CreateTemplateData>): Template {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Template not found');
    }

    const updated: Template = {
      ...templates[index],
      ...data,
      updatedAt: Date.now(),
    };

    templates[index] = updated;
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return updated;
  }

  public deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter((t) => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }
}
