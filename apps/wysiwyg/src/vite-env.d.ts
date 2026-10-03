/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module 'virtual:ocm-package-index.css' {}

declare module '*.aff?url' {
  const src: string;
  export default src;
}

declare module '*.dic?url' {
  const src: string;
  export default src;
}
