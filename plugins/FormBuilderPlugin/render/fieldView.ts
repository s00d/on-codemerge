import type { ViewSpec } from '@codemerge/sdk';
import type { FieldConfig } from '../types';
import { getDriver } from '../drivers';

/** Thin render — all field DOM comes from FieldDriver.render. */
export function fieldView(field: FieldConfig): ViewSpec {
  return getDriver(field.type).render(field);
}
