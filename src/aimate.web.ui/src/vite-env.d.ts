/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AUTH_ENABLED: string;
  readonly VITE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Module declarations for packages without type definitions
declare module 'remark-math' {
  import { Plugin } from 'unified';
  const remarkMath: Plugin;
  export default remarkMath;
}

declare module 'rehype-katex' {
  import { Plugin } from 'unified';
  const rehypeKatex: Plugin;
  export default rehypeKatex;
}

declare module 'mermaid' {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    securityLevel?: string;
    flowchart?: object;
    sequence?: object;
    gantt?: object;
    [key: string]: any;
  }

  interface MermaidAPI {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, definition: string, container?: Element) => Promise<{ svg: string }>;
    parse: (definition: string) => Promise<boolean>;
    contentLoaded: () => void;
  }

  const mermaid: MermaidAPI;
  export default mermaid;
}

declare module 'gpt-tokenizer' {
  export function encode(text: string): number[];
  export function decode(tokens: number[]): string;
  export function isWithinTokenLimit(text: string, limit: number): boolean;
  export function encodeChat(messages: Array<{ role: string; content: string }>, model?: string): number[];
}

declare module 'vite-plugin-pwa' {
  import { Plugin } from 'vite';

  interface VitePWAOptions {
    registerType?: 'autoUpdate' | 'prompt';
    includeAssets?: string[];
    manifest?: {
      name?: string;
      short_name?: string;
      description?: string;
      theme_color?: string;
      icons?: Array<{
        src: string;
        sizes: string;
        type: string;
        purpose?: string;
      }>;
      [key: string]: any;
    };
    workbox?: object;
    [key: string]: any;
  }

  export function VitePWA(options?: VitePWAOptions): Plugin;
}
