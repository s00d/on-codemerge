import type { Category, Tag } from '../types';

export class CategoryManager {
  private categoriesKey = 'html-editor-calendar-categories';
  private tagsKey = 'html-editor-calendar-tags';

  // Категории
  public getCategories(): Category[] {
    const stored = localStorage.getItem(this.categoriesKey);
    return stored ? JSON.parse(stored) : this.getDefaultCategories();
  }

  public getCategory(id: string): Category | null {
    const categories = this.getCategories();
    return categories.find((cat) => cat.id === id) || null;
  }

  public createCategory(name: string, color: string): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: Date.now(),
    };

    categories.push(newCategory);
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    return newCategory;
  }

  public updateCategory(id: string, data: Partial<Category>): Category {
    const categories = this.getCategories();
    const index = categories.findIndex((cat) => cat.id === id);

    if (index === -1) {
      throw new Error('Category not found');
    }

    const updated: Category = {
      ...categories[index],
      ...data,
    };

    categories[index] = updated;
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    return updated;
  }

  public deleteCategory(id: string): void {
    const categories = this.getCategories().filter((cat) => cat.id !== id);
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }

  // Теги
  public getTags(): Tag[] {
    const stored = localStorage.getItem(this.tagsKey);
    return stored ? JSON.parse(stored) : this.getDefaultTags();
  }

  public getTag(id: string): Tag | null {
    const tags = this.getTags();
    return tags.find((tag) => tag.id === id) || null;
  }

  public createTag(name: string, color: string): Tag {
    const tags = this.getTags();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: Date.now(),
    };

    tags.push(newTag);
    localStorage.setItem(this.tagsKey, JSON.stringify(tags));
    return newTag;
  }

  public updateTag(id: string, data: Partial<Tag>): Tag {
    const tags = this.getTags();
    const index = tags.findIndex((tag) => tag.id === id);

    if (index === -1) {
      throw new Error('Tag not found');
    }

    const updated: Tag = {
      ...tags[index],
      ...data,
    };

    tags[index] = updated;
    localStorage.setItem(this.tagsKey, JSON.stringify(tags));
    return updated;
  }

  public deleteTag(id: string): void {
    const tags = this.getTags().filter((tag) => tag.id !== id);
    localStorage.setItem(this.tagsKey, JSON.stringify(tags));
  }

  // Утилиты
  public getCategoryByName(name: string): Category | null {
    const categories = this.getCategories();
    return categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase()) || null;
  }

  public getTagByName(name: string): Tag | null {
    const tags = this.getTags();
    return tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase()) || null;
  }

  public getEventsByCategory(categoryId: string, events: any[]): any[] {
    return events.filter((event) => event.category === categoryId);
  }

  public getEventsByTag(tagName: string, events: any[]): any[] {
    return events.filter((event) => event.tags?.includes(tagName));
  }

  // Статистика
  public getCategoryStats(events: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    const categories = this.getCategories();

    categories.forEach((category) => {
      stats[category.id] = this.getEventsByCategory(category.id, events).length;
    });

    return stats;
  }

  public getTagStats(events: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    const tags = this.getTags();

    tags.forEach((tag) => {
      stats[tag.id] = this.getEventsByTag(tag.name, events).length;
    });

    return stats;
  }

  // Предустановленные категории и теги
  private getDefaultCategories(): Category[] {
    return [
      { id: 'work', name: 'Work', color: '#3b82f6', createdAt: Date.now() },
      { id: 'personal', name: 'Personal', color: '#10b981', createdAt: Date.now() },
      { id: 'meeting', name: 'Meeting', color: '#f59e0b', createdAt: Date.now() },
      { id: 'travel', name: 'Travel', color: '#8b5cf6', createdAt: Date.now() },
      { id: 'health', name: 'Health', color: '#ef4444', createdAt: Date.now() },
    ];
  }

  private getDefaultTags(): Tag[] {
    return [
      { id: 'urgent', name: 'Urgent', color: '#ef4444', createdAt: Date.now() },
      { id: 'important', name: 'Important', color: '#f59e0b', createdAt: Date.now() },
      { id: 'follow-up', name: 'Follow-up', color: '#3b82f6', createdAt: Date.now() },
      { id: 'completed', name: 'Completed', color: '#10b981', createdAt: Date.now() },
      { id: 'cancelled', name: 'Cancelled', color: '#6b7280', createdAt: Date.now() },
    ];
  }
}
