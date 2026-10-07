<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import '@codemerge/integrate/styles';
  import { createEditorHost } from '@codemerge/integrate';
  import type { ChromeMode, DocFormat, EditorHostHandle } from '@codemerge/integrate';

  export let value = '';
  export let format: DocFormat = 'html';
  export let chrome: ChromeMode = 'bar';
  export let minHeight: string | number = 300;

  const dispatch = createEventDispatcher<{ change: { value: string; format: DocFormat } }>();

  let el: HTMLDivElement;
  let handle: EditorHostHandle | null = null;

  onMount(() => {
    handle = createEditorHost(el, {
      value,
      format,
      chrome,
      onChange: (v, f) => {
        value = v;
        dispatch('change', { value: v, format: f });
      },
    });
  });

  $: if (handle && value !== undefined) {
    handle.setValue(value);
  }

  onDestroy(() => {
    handle?.destroy();
    handle = null;
  });
</script>

<div bind:this={el} style:min-height={minHeight}></div>
