// TableSelection.ts (дополнение)
export class Selector {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  private lastSelection: Range | null = null;
  private lastTable: HTMLElement | null = null;
  private selectedCells: HTMLElement[] = [];

  public saveSelection(): void {
    const selection = window.getSelection(); // В Selector нет доступа к editor

    if (selection && selection.rangeCount > 0) {
      this.lastSelection = selection.getRangeAt(0).cloneRange();
    } else {
      const range = document.createRange();
      const container = this.container;

      if (container && container.childNodes.length > 0) {
        range.selectNodeContents(container);
        range.collapse(false);
      } else {
        range.setStart(container, 0);
        range.collapse(true);
      }

      selection?.removeAllRanges();
      selection?.addRange(range);
      this.lastSelection = range.cloneRange();
    }
  }

  public saveTable(table: HTMLElement): void {
    this.lastTable = table;
  }

  public selectCell(cell: HTMLElement): void {
    this.selectedCells.push(cell);
    cell.classList.add('selected');
  }

  public clearSelectedCells(): void {
    this.selectedCells.forEach((cell) => cell.classList.remove('selected'));
    this.selectedCells = [];
  }

  public getSelectedCells(): HTMLElement[] {
    return this.selectedCells;
  }

  public getSelection() {
    return this.lastSelection;
  }

  public restoreSelection(container: HTMLElement): Range | null {
    if (!this.lastSelection) {
      return null;
    }

    // Проверяем, что начальный и конечный узлы диапазона находятся внутри контейнера
    const startContainer = this.lastSelection.startContainer;
    const endContainer = this.lastSelection.endContainer;

    if (!container.contains(startContainer) || !container.contains(endContainer)) {
      this.clearSelection(); // Очищаем сохранённое выделение, если оно вне контейнера
      return null;
    }

    // Восстанавливаем выделение
    const selection = window.getSelection(); // В Selector нет доступа к editor
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(this.lastSelection);
    }

    return this.lastSelection;
  }

  public restoreTable(): HTMLElement | null {
    return this.lastTable;
  }

  public clearSelection(): void {
    this.lastSelection = null;
  }

  public clearTable(): void {
    this.lastTable = null;
  }
}
