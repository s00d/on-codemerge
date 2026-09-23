import type { Template, CreateTemplateData } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTemplate(value: unknown): value is Template {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'number' &&
    typeof value.updatedAt === 'number'
  );
}

export class TemplateManager {
  private readonly storageKey = 'html-editor-templates';

  public getTemplates(): Template[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === null || stored === '') {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isTemplate);
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
