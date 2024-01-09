
export class EditorState {
  private content: string = '';
  private history: string[] = [];
  private future: string[] = [];
  private readonly limit = 30;

  getContent(): string {
    return this.content;
  }

  setContent(newContent: string): void {
    this.future = []; // Очистить будущее при каждом новом изменении
    this.history.push(this.content); // Сохраняем текущее состояние в историю

    if (this.history.length > this.limit) {
      this.history.shift(); // Удаляем самый старый элемент, если превышен лимит
    }

    this.content = newContent;
  }

  isUndo() {
    return this.history.length > 0
  }

  isRedo() {
    return this.future.length > 0
  }

  undo(): string {
    if (this.history.length > 0) {
      const state = this.history.pop();
      this.future.push(this.content);

      if (this.future.length > this.limit) {
        this.future.shift(); // Аналогично для массива future
      }

      return this.content = state || '';
    }
    return this.getContent()
  }

  redo(): string {
    if (this.future.length > 0) {
      const state = this.future.pop();
      this.history.push(this.content);

      if (this.history.length > this.limit) {
        this.history.shift(); // Аналогично для массива history
      }

      return this.content = state || '';
    }
    return this.getContent()
  }

  // Другие методы для управления состоянием
}
