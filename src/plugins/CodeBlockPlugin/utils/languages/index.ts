import type { LanguageDefinition } from '../../types';

// Import all language definitions
import { javascriptDefinition } from './definitions/javascript';
import { typescriptDefinition } from './definitions/typescript';
import { pythonDefinition } from './definitions/python';
import { cssDefinition } from './definitions/css';
import { sqlDefinition } from './definitions/sql';
import { jsonDefinition } from './definitions/json';
import { markdownDefinition } from './definitions/markdown';
import { rubyDefinition } from './definitions/ruby';
import { goDefinition } from './definitions/go';
import { rustDefinition } from './definitions/rust';
import { shellDefinition } from './definitions/shell';
import { cppDefinition } from './definitions/cpp';
import { csharpDefinition } from './definitions/csharp';
import { javaDefinition } from './definitions/java';
import { phpDefinition } from './definitions/php';
import { yamlDefinition } from './definitions/yaml';
import { htmlDefinition } from './definitions/html';
import { swiftDefinition } from './definitions/swift';
import { kotlinDefinition } from './definitions/kotlin';
import { scalaDefinition } from './definitions/scala';
import { dartDefinition } from './definitions/dart';
import { rDefinition } from './definitions/r';
import { matlabDefinition } from './definitions/matlab';
import { juliaDefinition } from './definitions/julia';
import { haskellDefinition } from './definitions/haskell';
import { elixirDefinition } from './definitions/elixir';
import { erlangDefinition } from './definitions/erlang';
import { clojureDefinition } from './definitions/clojure';

// Map of all supported languages
const languages: Record<string, LanguageDefinition> = {
  // Web Development
  javascript: javascriptDefinition,
  typescript: typescriptDefinition,
  html: htmlDefinition,
  css: cssDefinition,

  // Systems Programming
  rust: rustDefinition,
  cpp: cppDefinition,
  'c++': cppDefinition,

  // General Purpose
  python: pythonDefinition,
  java: javaDefinition,
  csharp: csharpDefinition,
  'c#': csharpDefinition,
  go: goDefinition,
  ruby: rubyDefinition,
  php: phpDefinition,

  // Mobile Development
  swift: swiftDefinition,
  kotlin: kotlinDefinition,
  dart: dartDefinition,

  // JVM Languages
  scala: scalaDefinition,

  // Shell Scripting
  shell: shellDefinition,
  bash: shellDefinition,
  zsh: shellDefinition,

  // Data & Configuration
  json: jsonDefinition,
  yaml: yamlDefinition,
  yml: yamlDefinition,
  sql: sqlDefinition,

  // Documentation
  markdown: markdownDefinition,

  // Scientific Computing
  r: rDefinition,
  matlab: matlabDefinition,
  julia: juliaDefinition,

  // Functional Programming
  haskell: haskellDefinition,
  elixir: elixirDefinition,
  erlang: erlangDefinition,
  clojure: clojureDefinition,

  // Default fallback
  plaintext: {
    name: 'plaintext',
    patterns: {},
    keywords: [],
  },
};

/**
 * Get the language definition for a given language identifier.
 * Falls back to plaintext if the language is not supported.
 */
export function getLanguageDefinition(language: string): LanguageDefinition {
  return languages[language.toLowerCase()] || languages.plaintext;
}

/**
 * Get a list of all supported language identifiers
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(languages).filter((lang) => lang !== 'plaintext');
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language.toLowerCase() in languages;
}
