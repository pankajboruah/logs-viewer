/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg?react' {
  const content: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default content;
}
