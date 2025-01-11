// TableSelection.ts (дополнение)
export class Selector {
  private lastSelection: Range | null = null;
  private lastTable: HTMLTableElement | null = null;
  private selectedCells: HTMLTableCellElement[] = [];

  public saveSelection(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.lastSelection = selection.getRangeAt(0).cloneRange();
    }
  }

  public saveTable(table: HTMLTableElement): void {
    this.lastTable = table;
  }

  public selectCell(cell: HTMLTableCellElement): void {
    this.selectedCells.push(cell);
    cell.classList.add('selected');
  }

  public clearSelectedCells(): void {
    this.selectedCells.forEach((cell) => cell.classList.remove('selected'));
    this.selectedCells = [];
  }

  public getSelectedCells(): HTMLTableCellElement[] {
    return this.selectedCells;
  }

  public restoreSelection(container: HTMLElement): Range | null {
    if (!this.lastSelection) return null;

    // Проверяем, что начальный и конечный узлы диапазона находятся внутри контейнера
    const startContainer = this.lastSelection.startContainer;
    const endContainer = this.lastSelection.endContainer;

    if (!container.contains(startContainer) || !container.contains(endContainer)) {
      this.clearSelection(); // Очищаем сохранённое выделение, если оно вне контейнера
      return null;
    }

    // Восстанавливаем выделение
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(this.lastSelection);
    }

    return this.lastSelection;
  }

  public restoreTable(): HTMLTableElement | null {
    return this.lastTable;
  }

  public clearSelection(): void {
    this.lastSelection = null;
  }

  public clearTable(): void {
    this.lastTable = null;
  }
}
