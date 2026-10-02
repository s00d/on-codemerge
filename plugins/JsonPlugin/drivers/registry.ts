import type { JsonLeafType } from '../commands/types';
import {
  coerceToArray,
  coerceToBoolean,
  coerceToNull,
  coerceToNumber,
  coerceToObject,
  coerceToString,
} from './coerce';
import { booleanLeafView, nullLeafView, numberLeafView, stringLeafView } from './leafViews';
import type { JsonValueDriver } from './types';

export const DRIVERS: Record<JsonLeafType, JsonValueDriver> = {
  jsonObject: {
    type: 'jsonObject',
    label: 'object',
    defaults: () => ({}),
    coerce: coerceToObject,
    leafView: null,
  },
  jsonArray: {
    type: 'jsonArray',
    label: 'array',
    defaults: () => [],
    coerce: coerceToArray,
    leafView: null,
  },
  jsonString: {
    type: 'jsonString',
    label: 'string',
    defaults: () => '',
    coerce: coerceToString,
    leafView: stringLeafView,
  },
  jsonNumber: {
    type: 'jsonNumber',
    label: 'number',
    defaults: () => 0,
    coerce: coerceToNumber,
    leafView: numberLeafView,
  },
  jsonBoolean: {
    type: 'jsonBoolean',
    label: 'boolean',
    defaults: () => false,
    coerce: coerceToBoolean,
    leafView: booleanLeafView,
  },
  jsonNull: {
    type: 'jsonNull',
    label: 'null',
    defaults: () => null,
    coerce: coerceToNull,
    leafView: (_node, _path, _handlers) => nullLeafView(),
  },
};

export function getDriver(type: JsonLeafType): JsonValueDriver {
  return DRIVERS[type];
}

export function allJsonLeafTypes(): JsonLeafType[] {
  return ['jsonObject', 'jsonArray', 'jsonString', 'jsonNumber', 'jsonBoolean', 'jsonNull'];
}

export function isJsonLeafType(value: string): value is JsonLeafType {
  return Object.hasOwn(DRIVERS, value);
}

export function typeLabel(type: string): string {
  if (isJsonLeafType(type)) {
    return DRIVERS[type].label;
  }
  return type;
}

export function defaultValueForType(type: JsonLeafType): unknown {
  return getDriver(type).defaults();
}
