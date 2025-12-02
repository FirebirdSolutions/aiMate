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
export * from './types';
