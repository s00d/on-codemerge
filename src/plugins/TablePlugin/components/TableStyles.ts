export class TableStyles {
  public setAlignment(cell: HTMLTableCellElement, align: 'left' | 'center' | 'right'): void {
    cell.style.textAlign = align;
  }

  public setVerticalAlignment(
    cell: HTMLTableCellElement,
    align: 'top' | 'middle' | 'bottom'
  ): void {
    cell.style.verticalAlign = align;
  }

  public setBackground(cell: HTMLTableCellElement, color: string): void {
    cell.style.backgroundColor = color;
  }
}
