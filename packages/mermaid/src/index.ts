import { detectDiagramType } from './detect';
import { layout } from './layout';
import { parse } from './parse';
import { renderSvg } from './svg/render';
import {
  ACTOR_SWATCHES,
  DARK,
  DEFAULTS,
  EDGE_LABEL_FILL,
  NOTE_SWATCH,
  resolveTheme,
} from './theme';
import type {
  DiagramIR,
  DiagramTheme,
  DiagramType,
  LayoutOptions,
  ParseResult,
  PositionedGraph,
  RenderOptions,
  ResolvedTheme,
} from './types';

export type {
  DiagramIR,
  DiagramTheme,
  DiagramType,
  LayoutOptions,
  ParseResult,
  PositionedGraph,
  RenderOptions,
  ResolvedTheme,
};

export {
  detectDiagramType,
  layout,
  parse,
  DEFAULTS,
  DARK,
  resolveTheme,
  ACTOR_SWATCHES,
  NOTE_SWATCH,
  EDGE_LABEL_FILL,
};

/** Sync: mermaid-subset source → SVG string (presentation attrs only, no CSS block). */
export function render(source: string, options: RenderOptions & LayoutOptions = {}): string {
  const result = parse(source);
  if (result.ir === null) {
    const msg = result.diagnostics.map((d) => d.message).join('\n');
    throw new Error(msg !== '' ? msg : 'Failed to parse diagram');
  }
  const positioned = layout(result.ir, {
    direction: options.direction,
    nodeSpacing: options.nodeSpacing,
    layerSpacing: options.layerSpacing,
    padding: options.padding,
  });
  return renderSvg(positioned, {
    theme: options.theme,
    padding: 0,
    transparent: options.transparent,
    palette: options.palette,
  });
}
