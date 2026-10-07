import { createElement, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { createEditorHost } from '@codemerge/integrate';
import type {
  ChromeMode,
  ColorScheme,
  DocFormat,
  EditorHostHandle,
  HostOptions,
  HostPack,
  HostPlugins,
  HostToolbarOptions,
  HostUploadConfig,
} from '@codemerge/integrate';
import '@codemerge/integrate/styles';

export interface CodeMergeEditorProps {
  value?: string;
  format?: DocFormat;
  chrome?: ChromeMode;
  locale?: string;
  fallbackLocale?: string;
  colorScheme?: ColorScheme;
  toolbar?: HostToolbarOptions;
  history?: HostOptions['history'];
  pack?: HostPack;
  image?: HostUploadConfig;
  fileUpload?: HostUploadConfig;
  plugins?: HostPlugins;
  pluginsAppend?: HostPlugins;
  onChange?: (value: string, format: DocFormat) => void;
  onReady?: (host: EditorHostHandle) => void;
  className?: string;
  style?: Record<string, string | number>;
  minHeight?: number | string;
}

export function CodeMergeEditor({
  value = '',
  format = 'html',
  chrome = 'bar',
  locale,
  fallbackLocale,
  colorScheme,
  toolbar,
  history,
  pack,
  image,
  fileUpload,
  plugins,
  pluginsAppend,
  onChange,
  onReady,
  className,
  style,
  minHeight = 300,
}: CodeMergeEditorProps): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EditorHostHandle | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) {
      return undefined;
    }
    const handle = createEditorHost(el, {
      value,
      format,
      chrome,
      locale,
      fallbackLocale,
      colorScheme,
      toolbar,
      history,
      pack,
      image,
      fileUpload,
      plugins,
      pluginsAppend,
      onChange: (v, f) => onChangeRef.current?.(v, f),
      onReady: (h) => onReadyRef.current?.(h),
    });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, [
    format,
    chrome,
    locale,
    fallbackLocale,
    colorScheme,
    toolbar,
    history,
    pack,
    image,
    fileUpload,
    plugins,
    pluginsAppend,
  ]);

  useEffect(() => {
    handleRef.current?.setValue(value);
  }, [value]);

  return createElement('div', {
    ref: hostRef,
    className,
    style: { minHeight, ...style },
  });
}
