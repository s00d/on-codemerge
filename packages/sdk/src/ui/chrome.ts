import { tv } from './tv';

/** Shared surface class for editor content + published/export HTML. */
export const PUBLISHED_CONTENT_CLASS = 'ocm-content prose prose-zinc max-w-none';

/**
 * Semantic class names only — visuals live in sdk.scss (@apply).
 * Keeps hover/active working even when VitePress resets beat @layer utilities.
 */
export const toolbarTv = tv({
  slots: {
    host: 'ocm-toolbar-host',
    bar: 'ocm-toolbar',
    btn: 'ocm-toolbar__btn',
    sep: 'ocm-toolbar__sep',
    menu: 'ocm-toolbar-menu',
    menuItem: 'ocm-toolbar-menu__item',
  },
  variants: {
    active: {
      true: { btn: 'is-active', menuItem: 'is-active' },
      false: { btn: '', menuItem: '' },
    },
  },
  defaultVariants: {
    active: false,
  },
});

export const popupTv = tv({
  slots: {
    overlay: 'ocm-popup-overlay',
    popup: 'ocm-popup',
    header: 'ocm-popup__header',
    close: 'ocm-popup__close',
    content: 'ocm-popup__content',
    row: 'ocm-popup__row',
    label: '',
    input: '',
    footer: 'ocm-popup__footer',
    btn: 'ocm-popup__btn',
  },
  variants: {
    variant: {
      primary: { btn: 'ocm-popup__btn--primary' },
      secondary: { btn: '' },
      danger: { btn: 'ocm-popup__btn--danger' },
    },
    size: {
      sm: { popup: 'ocm-popup--sm' },
      md: { popup: 'ocm-popup--md' },
      lg: { popup: 'ocm-popup--lg' },
    },
  },
  defaultVariants: {
    variant: 'secondary',
    size: 'md',
  },
});

export const menuTv = tv({
  slots: {
    root: 'ocm-context-menu',
    item: 'ocm-context-menu__item',
    divider: 'ocm-context-menu__divider',
    groupTitle: 'ocm-context-menu__group-title',
  },
  variants: {
    danger: {
      true: { item: 'is-danger' },
      false: { item: '' },
    },
  },
  defaultVariants: {
    danger: false,
  },
});

export const notifyTv = tv({
  slots: {
    container: 'ocm-notify-container',
    toast: 'ocm-notify',
  },
  variants: {
    type: {
      success: { toast: 'ocm-notify--success' },
      error: { toast: 'ocm-notify--error' },
      warning: { toast: 'ocm-notify--warning' },
      info: { toast: 'ocm-notify--info' },
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

export const editorChromeTv = tv({
  slots: {
    host: 'ocm-editor-root',
    root: 'ocm-editor',
    content: PUBLISHED_CONTENT_CLASS,
    footer: 'ocm-editor-footer',
    atom: 'ocm-atom',
  },
});
