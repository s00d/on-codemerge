import { type LanguageDefinition, TokenType } from '../../../types';
import { javascriptDefinition } from './javascript';

export const typescriptDefinition: LanguageDefinition = {
  ...javascriptDefinition,
  name: 'typescript',
  patterns: {
    ...javascriptDefinition.patterns,
    [TokenType.Type]:
      /^(?:string|number|boolean|any|void|never|object|symbol|unknown|undefined|null)\b/,
    [TokenType.Interface]: /^interface\s+([A-Z][a-zA-Z0-9_]*)/,
  },
  keywords: [
    ...javascriptDefinition.keywords,
    'interface',
    'type',
    'namespace',
    'declare',
    'abstract',
    'as',
    'enum',
    'implements',
    'is',
    'keyof',
    'module',
    'private',
    'protected',
    'public',
    'readonly',
    'static',
  ],
};
