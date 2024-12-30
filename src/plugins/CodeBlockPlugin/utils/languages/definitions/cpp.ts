import { type LanguageDefinition, TokenType } from '../../../types';

export const cppDefinition: LanguageDefinition = {
  name: 'cpp',
  patterns: {
    [TokenType.Comment]: /^\/\/.*$|^\/\*[\s\S]*?\*\//,
    [TokenType.String]: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/,
    [TokenType.Number]: /^\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
    [TokenType.Function]: /^\b[a-zA-Z_]\w*(?=\s*\()/,
    [TokenType.Type]:
      /^\b(?:void|int|float|double|bool|char|unsigned|signed|short|long|auto|const|volatile|static|extern|struct|class|enum|union|template|typename|virtual|explicit|override|final)\b/,
    [TokenType.Operator]: /^(?:->|::|\+\+|--|&&|\|\||[+\-*/%&|^<>!=]=?)/,
    [TokenType.Punctuation]: /^[{}[\]();,.]/,
  },
  keywords: [
    'alignas',
    'alignof',
    'and',
    'and_eq',
    'asm',
    'atomic_cancel',
    'atomic_commit',
    'atomic_noexcept',
    'bitand',
    'bitor',
    'break',
    'case',
    'catch',
    'class',
    'compl',
    'concept',
    'const',
    'constexpr',
    'const_cast',
    'continue',
    'co_await',
    'co_return',
    'co_yield',
    'decltype',
    'default',
    'delete',
    'do',
    'dynamic_cast',
    'else',
    'enum',
    'explicit',
    'export',
    'extern',
    'false',
    'for',
    'friend',
    'goto',
    'if',
    'import',
    'inline',
    'module',
    'mutable',
    'namespace',
    'new',
    'noexcept',
    'not',
    'not_eq',
    'nullptr',
    'operator',
    'or',
    'or_eq',
    'private',
    'protected',
    'public',
    'reflexpr',
    'register',
    'reinterpret_cast',
    'requires',
    'return',
    'sizeof',
    'static',
    'static_assert',
    'static_cast',
    'struct',
    'switch',
    'synchronized',
    'template',
    'this',
    'thread_local',
    'throw',
    'true',
    'try',
    'typedef',
    'typeid',
    'typename',
    'union',
    'using',
    'virtual',
    'volatile',
    'while',
    'xor',
    'xor_eq',
  ],
};