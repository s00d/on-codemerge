export class DOMContext {
  private shadowRoot: ShadowRoot | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isShadowMode: boolean = false;
  private isIframeMode: boolean = false;

  constructor(shadowRoot?: ShadowRoot, iframe?: HTMLIFrameElement) {
    if (shadowRoot) {
      this.shadowRoot = shadowRoot;
      this.isShadowMode = true;
    } else if (iframe) {
      this.iframe = iframe;
      this.isIframeMode = true;
    }
  }

  getElementById(id: string): HTMLElement | null {
    if (this.isShadowMode && this.shadowRoot) {
      return this.shadowRoot.getElementById(id);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      return this.iframe.contentDocument.getElementById(id);
    }
    return document.getElementById(id);
  }

  querySelector(selector: string): Element | null {
    if (this.isShadowMode && this.shadowRoot) {
      return this.shadowRoot.querySelector(selector);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      return this.iframe.contentDocument.querySelector(selector);
    }
    return document.querySelector(selector);
  }

  querySelectorAll(selector: string): NodeListOf<Element> {
    if (this.isShadowMode && this.shadowRoot) {
      return this.shadowRoot.querySelectorAll(selector);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      return this.iframe.contentDocument.querySelectorAll(selector);
    }
    return document.querySelectorAll(selector);
  }

  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (this.isShadowMode && this.shadowRoot) {
      this.shadowRoot.addEventListener(type, listener, options);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      this.iframe.contentDocument.addEventListener(type, listener, options);
    } else {
      document.addEventListener(type, listener, options);
    }
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (this.isShadowMode && this.shadowRoot) {
      this.shadowRoot.removeEventListener(type, listener);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      this.iframe.contentDocument.removeEventListener(type, listener);
    } else {
      document.removeEventListener(type, listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (this.isShadowMode && this.shadowRoot) {
      return this.shadowRoot.dispatchEvent(event);
    } else if (this.isIframeMode && this.iframe?.contentDocument) {
      return this.iframe.contentDocument.dispatchEvent(event);
    }
    return document.dispatchEvent(event);
  }

  isShadowModeEnabled(): boolean {
    return !!(this.shadowRoot && this.isShadowMode);
  }

  isIframeModeEnabled(): boolean {
    return !!(this.iframe && this.isIframeMode);
  }

  getIframe(): HTMLIFrameElement | null {
    return this.iframe;
  }

  getIframeDocument(): Document | null {
    return this.iframe?.contentDocument || null;
  }

  getIframeWindow(): Window | null {
    return this.iframe?.contentWindow || null;
  }

  appendChild(child: Node): Node {
    if (this.isShadowMode && this.shadowRoot) {
      return this.shadowRoot.appendChild(child);
    } else if (this.isIframeMode && this.iframe?.contentDocument?.body) {
      return this.iframe.contentDocument.body.appendChild(child);
    } else {
      return document.body.appendChild(child);
    }
  }
}
