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

// Union type for all artifacts
export type ArtifactData =
  | FileArtifactData
  | JsonArtifactData
  | TableArtifactData
  | CodeArtifactData
  | ChartArtifactData
  | ImageArtifactData;

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
