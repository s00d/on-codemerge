import type { DocumentNode, NodeType } from './DocumentNode';

type Callback = (...data: any[]) => void;

export class DocumentTree {
  private root: DocumentNode;
  private eventHandlers: Map<string, Callback[]>;

  constructor() {
    this.root = {
      type: 'root',
      content: '',
      children: [],
      attributes: {},
    };
    this.eventHandlers = new Map();
  }

  public getRoot(): DocumentNode {
    return this.root;
  }

  public createNode(type: NodeType, content: string = ''): DocumentNode {
    return {
      type,
      content,
      children: [],
      attributes: {},
    };
  }

  public insertNode(parent: DocumentNode, child: DocumentNode): void {
    parent.children.push(child);
  }

  public removeNode(node: DocumentNode): void {
    const removeFromParent = (parent: DocumentNode, target: DocumentNode) => {
      const index = parent.children.indexOf(target);
      if (index !== -1) {
        parent.children.splice(index, 1);
      }
    };

    const traverse = (current: DocumentNode) => {
      for (const child of current.children) {
        if (child === node) {
          removeFromParent(current, node);
          return true;
        }
        if (traverse(child)) {
          return true;
        }
      }
      return false;
    };

    traverse(this.root);
  }

  public fromHTML(html: string): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    this.root.children = this.parseNode(doc.body);
  }

  private parseNode(element: Element): DocumentNode[] {
    const nodes: DocumentNode[] = [];

    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent?.trim()) {
          nodes.push(this.createNode('text', child.textContent));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const elementChild = child as Element;
        const node = this.createNode(this.getNodeType(elementChild.tagName));
        node.children = this.parseNode(elementChild);
        nodes.push(node);
      }
    }

    return nodes;
  }

  private getNodeType(tagName: string): NodeType {
    const map: Record<string, NodeType> = {
      P: 'paragraph',
      H1: 'heading',
      H2: 'heading',
      H3: 'heading',
      UL: 'list',
      OL: 'list',
      LI: 'list-item',
      TABLE: 'table',
      TR: 'table-row',
      TD: 'table-cell',
    };
    return map[tagName.toUpperCase()] || 'text';
  }

  public toHTML(): string {
    const nodeToHTML = (node: DocumentNode): string => {
      const attributeString = Object.entries(node.attributes)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('');

      switch (node.type) {
        case 'text':
          return node.content;
        case 'paragraph':
          return `<p${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</p>`;
        case 'heading':
          return `<h1${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</h1>`;
        case 'list':
          return `<ul${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</ul>`;
        case 'list-item':
          return `<li${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</li>`;
        case 'table':
          return `<table${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</table>`;
        case 'table-row':
          return `<tr${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</tr>`;
        case 'table-cell':
          return `<td${attributeString}>${node.children.map((child) => nodeToHTML(child)).join('')}</td>`;
        default:
          return node.children.map((child) => nodeToHTML(child)).join('');
      }
    };

    return nodeToHTML(this.root);
  }

  public on(eventName: string, callback: Callback): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(callback);
  }

  public triggerEvent(eventName: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((callback) => callback(...args));
    }
  }
}
