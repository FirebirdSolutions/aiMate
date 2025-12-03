/**
 * Artifact Types
 *
 * Type definitions for the artifact system.
 * Artifacts are rich content blocks that can be rendered in chat.
 */

// Import and re-export FileArtifactData from the original component
import type { FileArtifactData as OriginalFileArtifactData } from "../FileArtifact";
export type FileArtifactData = OriginalFileArtifactData;

// Base artifact data that all artifacts share
export interface BaseArtifactData {
  id?: string;
  title?: string;
}

// JSON artifact - collapsible JSON viewer
export interface JsonArtifactData extends BaseArtifactData {
  type: 'json';
  data: any;
  collapsed?: boolean;
  maxDepth?: number;
}

// Table artifact - tabular data
export interface TableArtifactData extends BaseArtifactData {
  type: 'table';
  headers: string[];
  rows: any[][];
  sortable?: boolean;
  searchable?: boolean;
}

// Code artifact - syntax highlighted code
export interface CodeArtifactData extends BaseArtifactData {
  type: 'code';
  language: string;
  code: string;
  filename?: string;
  executable?: boolean;
}

// Chart artifact - visualizations
export interface ChartArtifactData extends BaseArtifactData {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  xKey: string;
  yKey: string | string[];
  colors?: string[];
}

// Image artifact - images (base64 or URL)
export interface ImageArtifactData extends BaseArtifactData {
  type: 'image';
  src: string; // URL or data URI
  alt?: string;
  width?: number;
  height?: number;
}

// Mermaid artifact - diagrams (flowcharts, sequence, ER, etc.)
export interface MermaidArtifactData extends BaseArtifactData {
  type: 'mermaid';
  code: string;
}

// Math artifact - LaTeX mathematical expressions
export interface MathArtifactData extends BaseArtifactData {
  type: 'math';
  latex: string;
  displayMode?: boolean; // Default: true (block display)
  description?: string;
}

// Diff artifact - code diff viewer
export interface DiffArtifactData extends BaseArtifactData {
  type: 'diff';
  // Either provide a pre-formatted diff string...
  diff?: string;
  // ...or provide two texts to compare
  oldText?: string;
  newText?: string;
  // Metadata
  oldFile?: string;
  newFile?: string;
  language?: string;
  viewMode?: 'split' | 'unified';
}

// Regex artifact - interactive regex tester
export interface RegexArtifactData extends BaseArtifactData {
  type: 'regex';
  pattern: string;
  flags?: string; // e.g., 'gi' for global+case-insensitive
  testString?: string;
  description?: string;
}

// SQL artifact - in-browser SQLite playground
export interface SqlArtifactData extends BaseArtifactData {
  type: 'sql';
  query: string;
  schema?: string; // CREATE TABLE statements to initialize
  seedData?: string; // INSERT statements to seed data
  description?: string;
}

// Canvas artifact - interactive Canvas/p5.js visualizations
export interface CanvasArtifactData extends BaseArtifactData {
  type: 'canvas';
  code: string;
  mode?: 'canvas' | 'p5'; // 'canvas' for raw Canvas API, 'p5' for p5.js
  width?: number;
  height?: number;
  autoRun?: boolean;
  description?: string;
}

// API artifact - REST API tester
export interface ApiArtifactData extends BaseArtifactData {
  type: 'api';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  description?: string;
}

// Union type for all artifacts
export type ArtifactData =
  | FileArtifactData
  | JsonArtifactData
  | TableArtifactData
  | CodeArtifactData
  | ChartArtifactData
  | ImageArtifactData
  | MermaidArtifactData
  | MathArtifactData
  | DiffArtifactData
  | RegexArtifactData
  | SqlArtifactData
  | CanvasArtifactData
  | ApiArtifactData;

// Props for artifact components
export interface ArtifactProps<T extends ArtifactData = ArtifactData> {
  data: T;
  onSaveToKnowledge?: (data: T) => void;
  collapsed?: boolean;
}

// Parsed artifact from markdown
export interface ParsedArtifact {
  type: string;
  data: ArtifactData;
  raw: string;
}
