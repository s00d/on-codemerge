import type { DisposableScope } from './disposable';
import type { HProps, ViewElementSpec, ViewForeignSpec, ViewSpec } from './types';

/** Hyperscript helper — builds a ViewElementSpec. */
export function h(
  tag: keyof HTMLElementTagNameMap | 'fragment',
  props: HProps | null = null,
  ...children: ViewSpec[]
): ViewElementSpec {
  const p = props ?? {};
  return {
    tag,
    class: p.class,
    attrs: p.attrs,
    style: p.style,
    props: p.props,
    on: p.on,
    key: p.key,
    ref: p.ref,
    children: children.length === 1 ? children[0] : children,
  };
}

export function foreign(
  mountFn: (host: HTMLElement, scope: DisposableScope) => void,
  opts: { key?: string; class?: string | string[] } = {}
): ViewForeignSpec {
  return { foreign: mountFn, key: opts.key, class: opts.class };
}

export function img(props: HProps & { src: string; alt?: string }): ViewElementSpec {
  return h('img', {
    ...props,
    attrs: { ...props.attrs, src: props.src, alt: props.alt ?? '' },
  });
}

export function video(props: HProps & { src: string; controls?: boolean }): ViewElementSpec {
  return h('video', {
    ...props,
    props: { ...props.props, controls: props.controls !== false, src: props.src },
    attrs: { ...props.attrs, src: props.src },
  });
}

export function iframe(
  props: HProps & { src: string; width?: string | number; height?: string | number }
): ViewElementSpec {
  return h('iframe', {
    ...props,
    attrs: {
      ...props.attrs,
      src: props.src,
      width: props.width,
      height: props.height,
      frameborder: '0',
      allowfullscreen: true,
    },
  });
}

export function canvas(props: HProps & { width?: number; height?: number } = {}): ViewElementSpec {
  return h('canvas', {
    ...props,
    attrs: {
      ...props.attrs,
      width: props.width,
      height: props.height,
    },
  });
}
