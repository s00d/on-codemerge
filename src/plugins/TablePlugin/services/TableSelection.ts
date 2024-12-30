// TableSelection.ts (дополнение)
export class TableSelection {
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

  public restoreSelection(): Range | null {
    if (this.lastSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.lastSelection);
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
