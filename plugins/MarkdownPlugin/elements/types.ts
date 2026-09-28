export type MdElementButton = {
  label: string;
  href: string;
};

/** One extracted custom container from source Markdown. */
export type MdElementBlock = {
  id: string;
  title: string;
  body: string;
  buttons: MdElementButton[];
};

/**
 * Pluggable Markdown custom element (callout / card / …).
 * Syntax: `:::id Optional title` … body … optional `@btn[Label](url)` lines … `:::`.
 */
export type MdCustomElement = {
  id: string;
  label: string;
  /** Toolbar Insert / Turn into order (lower first). */
  order?: number;
  /** Default title when inserting a snippet. */
  defaultTitle?: string;
  /**
   * Return host HTML for the preview. Output is allowlist-sanitized afterward.
   * `bodyHtml` is projected/escaped prose HTML — not yet allowlist-cleaned.
   * Escape `block.title` / button labels yourself if emitting them into attributes or text.
   */
  toPreviewHtml(block: MdElementBlock, bodyHtml: string): string;
};

export type MdElementRegistry = {
  get(id: string): MdCustomElement | undefined;
  list(): MdCustomElement[];
  ids(): string[];
};
