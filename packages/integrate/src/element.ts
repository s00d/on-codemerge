import { createEditorHost } from '@codemerge/integrate';
import type { ChromeMode, DocFormat, EditorHostHandle, HostOptions } from '@codemerge/integrate';
import '@codemerge/integrate/styles';

const TAG = 'ocm-editor';

function parseFormat(value: string | null): DocFormat {
  if (value === 'markdown' || value === 'text' || value === 'html') {
    return value;
  }
  return 'html';
}

function parseChrome(value: string | null): ChromeMode {
  if (value === 'page' || value === 'bar') {
    return value;
  }
  return 'bar';
}

/**
 * Canonical non-framework host: `<ocm-editor>`.
 * Complex config via `.options` / `.configure()`. Events: `change`, `ready`.
 */
export class OcmEditorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['value', 'format', 'chrome', 'locale', 'pack'];
  }

  #host: EditorHostHandle | null = null;
  #mount: HTMLDivElement | null = null;
  #ready = false;
  #pending: HostOptions = {};

  get options(): HostOptions {
    return this.#pending;
  }

  set options(value: HostOptions) {
    this.#pending = { ...value };
  }

  configure(options: HostOptions): void {
    this.#pending = { ...this.#pending, ...options };
    if (this.#host) {
      this.#teardown();
      this.#mountEditor();
    }
  }

  connectedCallback(): void {
    if (this.#host) {
      return;
    }
    this.#mountEditor();
  }

  disconnectedCallback(): void {
    this.#teardown();
  }

  attributeChangedCallback(name: string, _old: string | null, next: string | null): void {
    if (name === 'value' && this.#host && this.#ready && next !== null) {
      if (this.#host.getValue() !== next) {
        this.#host.setValue(next);
      }
      return;
    }
    if (!this.#host) {
      return;
    }
    if (name === 'format' || name === 'chrome' || name === 'locale' || name === 'pack') {
      this.#teardown();
      this.#mountEditor();
    }
  }

  get host(): EditorHostHandle | null {
    return this.#host;
  }

  getValue(): string {
    return this.#host?.getValue() ?? this.getAttribute('value') ?? '';
  }

  setValue(value: string): void {
    this.setAttribute('value', value);
    this.#host?.setValue(value);
  }

  #teardown(): void {
    this.#host?.destroy();
    this.#host = null;
    this.#mount?.remove();
    this.#mount = null;
    this.#ready = false;
  }

  #mountEditor(): void {
    this.#mount = document.createElement('div');
    this.#mount.style.minHeight = this.getAttribute('min-height') || '300px';
    this.append(this.#mount);

    const packAttr = this.getAttribute('pack');
    const pack =
      packAttr === 'default' || packAttr === 'core' || packAttr === 'none'
        ? packAttr
        : this.#pending.pack;

    this.#host = createEditorHost(this.#mount, {
      ...this.#pending,
      value: this.getAttribute('value') ?? this.#pending.value,
      format: parseFormat(this.getAttribute('format') ?? this.#pending.format ?? null),
      chrome: parseChrome(this.getAttribute('chrome') ?? this.#pending.chrome ?? null),
      locale: this.getAttribute('locale') ?? this.#pending.locale,
      pack,
      onChange: (value, format) => {
        this.setAttribute('value', value);
        this.#pending.onChange?.(value, format);
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value, format },
            bubbles: true,
            composed: true,
          })
        );
      },
      onReady: (handle) => {
        this.#ready = true;
        this.#pending.onReady?.(handle);
        this.dispatchEvent(
          new CustomEvent('ready', {
            detail: handle,
            bubbles: true,
            composed: true,
          })
        );
      },
    });
  }
}

export function defineOcmEditor(tagName: string = TAG): void {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get(tagName)) {
    customElements.define(tagName, OcmEditorElement);
  }
}

defineOcmEditor();
