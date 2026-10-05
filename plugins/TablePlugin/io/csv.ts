import type { TableGridDoc } from './adapters';
import { gridToMatrix } from './adapters';
import { matrixToCsv } from './matrix';

export function exportCsv(grid: TableGridDoc, delimiter = ','): string {
  return matrixToCsv(gridToMatrix(grid), delimiter);
}
