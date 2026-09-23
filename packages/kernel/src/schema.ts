import type { Mark } from './types';

export interface NodeSpec {
  name: string;
  group?: 'block' | 'inline' | 'atom';
  atom?: boolean;
  attrs?: Record<string, unknown>;
}

export interface MarkSpec {
  name: string;
  attrs?: Record<string, unknown>;
}

export interface Schema {
  nodes: Map<string, NodeSpec>;
  marks: Map<string, MarkSpec>;
  sealed: boolean;
}

export function createSchema(): Schema {
  const schema: Schema = {
    marks: new Map(),
    nodes: new Map(),
    sealed: false,
  };
  registerNode(schema, { group: 'block', name: 'doc' });
  registerNode(schema, { group: 'block', name: 'paragraph' });
  registerNode(schema, { group: 'inline', name: 'text' });
  registerNode(schema, { atom: true, group: 'inline', name: 'hardBreak' });
  registerMark(schema, { name: 'bold' });
  registerMark(schema, { name: 'italic' });
  registerMark(schema, { name: 'underline' });
  registerMark(schema, { name: 'strike' });
  return schema;
}

export function registerNode(schema: Schema, spec: NodeSpec): void {
  if (schema.sealed) {
    throw new Error('Schema is sealed');
  }
  if (schema.nodes.has(spec.name)) {
    throw new Error(`Node already registered: ${spec.name}`);
  }
  schema.nodes.set(spec.name, spec);
}

export function registerMark(schema: Schema, spec: MarkSpec): void {
  if (schema.sealed) {
    throw new Error('Schema is sealed');
  }
  if (schema.marks.has(spec.name)) {
    throw new Error(`Mark already registered: ${spec.name}`);
  }
  schema.marks.set(spec.name, spec);
}

export function sealSchema(schema: Schema): void {
  schema.sealed = true;
}

export function assertMark(schema: Schema, mark: Mark): void {
  if (!schema.marks.has(mark.type)) {
    throw new Error(`Unknown mark: ${mark.type}`);
  }
}

export function assertNodeType(schema: Schema, type: string): void {
  if (!schema.nodes.has(type)) {
    throw new Error(`Unknown node type: ${type}`);
  }
}
