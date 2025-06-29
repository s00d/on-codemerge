import { BlockPlugin } from '../index';
import { HTMLEditor } from '../../../core/HTMLEditor';
import { BlockCommand } from '../commands/BlockCommand';
import { SplitBlockCommand } from '../commands/SplitBlockCommand';
import { MergeBlocksCommand } from '../commands/MergeBlocksCommand';

describe('BlockPlugin', () => {
  let plugin: BlockPlugin;
  let editor: HTMLEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'editor-container';
    document.body.appendChild(container);

    editor = new HTMLEditor(container);
    plugin = new BlockPlugin();
    plugin.initialize(editor);
  });

  afterEach(() => {
    plugin.destroy();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize with correct name and hotkeys', () => {
      expect(plugin.name).toBe('block');
      expect(plugin.hotkeys).toHaveLength(3);
      expect(plugin.hotkeys[0].keys).toBe('Ctrl+Alt+B');
    });

    it('should add toolbar button', () => {
      const toolbar = this.editor?.getToolbar();
      expect(toolbar).toBeTruthy();
      expect(toolbar?.querySelector('[title*="Insert Block"]')).toBeTruthy();
    });
  });

  describe('block creation', () => {
    it('should create text block', () => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });

      const block = container.querySelector('.editor-block');
      expect(block).toBeTruthy();
      expect(block?.getAttribute('data-block-type')).toBe('text');
      expect(block?.classList.contains('text-block')).toBe(true);
    });

    it('should create container block', () => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'container' });

      const block = container.querySelector('.editor-block');
      expect(block).toBeTruthy();
      expect(block?.getAttribute('data-block-type')).toBe('container');
      expect(block?.classList.contains('container-block')).toBe(true);
    });

    it('should create split container', () => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'split', direction: 'horizontal' });

      const container = document.querySelector('.split-container');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('data-direction')).toBe('horizontal');
      
      const blocks = container?.querySelectorAll('.editor-block');
      expect(blocks).toHaveLength(2);
    });
  });

  describe('block splitting', () => {
    let block: HTMLElement;

    beforeEach(() => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });
      block = container.querySelector('.editor-block') as HTMLElement;
    });

    it('should split block horizontally', () => {
      const splitCommand = new SplitBlockCommand(editor);
      splitCommand.setData({ direction: 'horizontal', block });
      splitCommand.execute();

      const splitContainer = container.querySelector('.split-container');
      expect(splitContainer).toBeTruthy();
      expect(splitContainer?.classList.contains('horizontal')).toBe(true);
    });

    it('should split block vertically', () => {
      const splitCommand = new SplitBlockCommand(editor);
      splitCommand.setData({ direction: 'vertical', block });
      splitCommand.execute();

      const splitContainer = container.querySelector('.split-container');
      expect(splitContainer).toBeTruthy();
      expect(splitContainer?.classList.contains('vertical')).toBe(true);
    });

    it('should not split already split container', () => {
      // Сначала создаем split container
      const command = new BlockCommand(editor);
      command.execute({ type: 'split' });
      
      const splitContainer = container.querySelector('.split-container') as HTMLElement;
      const splitCommand = new SplitBlockCommand(editor);
      splitCommand.setData({ direction: 'horizontal', block: splitContainer });
      splitCommand.execute();

      // Проверяем, что split container остался
      expect(container.querySelectorAll('.split-container')).toHaveLength(1);
    });
  });

  describe('block merging', () => {
    let block1: HTMLElement;
    let block2: HTMLElement;

    beforeEach(() => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });
      command.execute({ type: 'text' });
      
      const blocks = container.querySelectorAll('.editor-block');
      block1 = blocks[0] as HTMLElement;
      block2 = blocks[1] as HTMLElement;
    });

    it('should merge adjacent blocks', () => {
      const mergeCommand = new MergeBlocksCommand(editor);
      mergeCommand.setData({ blocks: [block1, block2] });
      mergeCommand.execute();

      const remainingBlocks = container.querySelectorAll('.editor-block');
      expect(remainingBlocks).toHaveLength(1);
    });

    it('should not merge non-adjacent blocks', () => {
      // Создаем третий блок между первыми двумя
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });
      
      const blocks = container.querySelectorAll('.editor-block');
      const block3 = blocks[2] as HTMLElement;

      const mergeCommand = new MergeBlocksCommand(editor);
      mergeCommand.setData({ blocks: [block1, block3] });
      mergeCommand.execute();

      // Блоки не должны объединиться
      const remainingBlocks = container.querySelectorAll('.editor-block');
      expect(remainingBlocks).toHaveLength(3);
    });
  });

  describe('undo/redo', () => {
    it('should support undo for block creation', () => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });

      expect(container.querySelector('.editor-block')).toBeTruthy();

      command.undo();
      expect(container.querySelector('.editor-block')).toBeFalsy();
    });

    it('should support redo for block creation', () => {
      const command = new BlockCommand(editor);
      command.execute({ type: 'text' });
      command.undo();

      command.redo();
      expect(container.querySelector('.editor-block')).toBeTruthy();
    });
  });
}); 