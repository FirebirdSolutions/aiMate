/**
 * Rich Content Module
 *
 * Rich content blocks that can be rendered in chat.
 *
 * Available artifact types:
 * - File: Downloadable files with preview
 * - JSON: Collapsible JSON tree viewer
 * - Table: Sortable, searchable data tables
 * - Code: Executable code with syntax highlighting
 * - Mermaid: Diagrams (flowcharts, sequence, ER, etc.)
 * - Math: LaTeX mathematical expressions
 * - Diff: Code diff viewer (split/unified)
 * - Regex: Interactive regex tester
 * - SQL: In-browser SQLite playground
 * - Image: Zoomable image viewer
 * - Chart: Data visualizations (bar, line, pie, area)
 * - Canvas: Interactive Canvas/p5.js visualizations
 * - API: REST API tester (mini Postman)
 */

export { ArtifactRenderer, parseArtifacts } from './ArtifactRenderer';
export { JsonArtifact } from './JsonArtifact';
export { TableArtifact } from './TableArtifact';
export { CodeArtifact } from './CodeArtifact';
export { MermaidArtifact } from './MermaidArtifact';
export { MathArtifact } from './MathArtifact';
export { DiffArtifact } from './DiffArtifact';
export { RegexArtifact } from './RegexArtifact';
export { SqlArtifact } from './SqlArtifact';
export { ImageArtifact } from './ImageArtifact';
export { ChartArtifact } from './ChartArtifact';
export { CanvasArtifact } from './CanvasArtifact';
export { ApiArtifact } from './ApiArtifact';
export * from './types';
