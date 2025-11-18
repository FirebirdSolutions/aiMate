/**
 * aiMate.nz - Monaco Editor Integration
 * VS Code editor for CodeMate
 */

window.monacoEditor = {
    editors: {},

    /**
     * Initialize Monaco Editor
     */
    init: function() {
        if (typeof monaco === 'undefined') {
            console.error('Monaco Editor not loaded. Please include the Monaco CDN.');
            return false;
        }

        // Configure Monaco for C#
        monaco.languages.register({ id: 'csharp' });

        console.log('Monaco Editor initialized ✓');
        return true;
    },

    /**
     * Create a Monaco editor instance
     * @param {string} containerId - DOM element ID for the editor
     * @param {string} initialCode - Initial code content
     * @param {string} language - Programming language (default: csharp)
     * @returns {string} Editor instance ID
     */
    create: function(containerId, initialCode, language = 'csharp') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const editor = monaco.editor.create(container, {
            value: initialCode || '',
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            minimap: {
                enabled: true
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: true,
            folding: true,
            lineHeight: 20,
            padding: {
                top: 10,
                bottom: 10
            },
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        });

        // Store editor instance
        this.editors[containerId] = editor;

        console.log(`Monaco editor created: ${containerId}`);
        return containerId;
    },

    /**
     * Get editor value (code content)
     * @param {string} editorId - Editor instance ID
     * @returns {string} Current code
     */
    getValue: function(editorId) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return '';
        }
        return editor.getValue();
    },

    /**
     * Set editor value (code content)
     * @param {string} editorId - Editor instance ID
     * @param {string} code - New code content
     */
    setValue: function(editorId, code) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return;
        }
        editor.setValue(code || '');
    },

    /**
     * Format code
     * @param {string} editorId - Editor instance ID
     */
    format: async function(editorId) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return;
        }
        await editor.getAction('editor.action.formatDocument').run();
    },

    /**
     * Trigger save action (useful for Ctrl+S)
     * @param {string} editorId - Editor instance ID
     * @param {function} callback - Callback function to execute on save
     */
    onSave: function(editorId, callback) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return;
        }

        // Add Ctrl+S / Cmd+S keybinding
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    },

    /**
     * Add error markers to the editor
     * @param {string} editorId - Editor instance ID
     * @param {Array} diagnostics - Array of {line, column, message, severity}
     */
    setDiagnostics: function(editorId, diagnostics) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return;
        }

        const model = editor.getModel();
        const markers = diagnostics.map(d => ({
            severity: d.severity === 'Error' ? monaco.MarkerSeverity.Error :
                     d.severity === 'Warning' ? monaco.MarkerSeverity.Warning :
                     monaco.MarkerSeverity.Info,
            startLineNumber: d.line,
            startColumn: d.column,
            endLineNumber: d.line,
            endColumn: d.column + 1,
            message: d.message
        }));

        monaco.editor.setModelMarkers(model, 'csharp', markers);
    },

    /**
     * Clear all error markers
     * @param {string} editorId - Editor instance ID
     */
    clearDiagnostics: function(editorId) {
        const editor = this.editors[editorId];
        if (!editor) {
            console.error(`Editor ${editorId} not found`);
            return;
        }

        const model = editor.getModel();
        monaco.editor.setModelMarkers(model, 'csharp', []);
    },

    /**
     * Dispose an editor instance
     * @param {string} editorId - Editor instance ID
     */
    dispose: function(editorId) {
        const editor = this.editors[editorId];
        if (editor) {
            editor.dispose();
            delete this.editors[editorId];
            console.log(`Monaco editor disposed: ${editorId}`);
        }
    },

    /**
     * Get cursor position
     * @param {string} editorId - Editor instance ID
     * @returns {object} {line, column}
     */
    getCursorPosition: function(editorId) {
        const editor = this.editors[editorId];
        if (!editor) return { line: 0, column: 0 };

        const position = editor.getPosition();
        return {
            line: position.lineNumber,
            column: position.column
        };
    },

    /**
     * Set cursor position
     * @param {string} editorId - Editor instance ID
     * @param {number} line - Line number (1-indexed)
     * @param {number} column - Column number (1-indexed)
     */
    setCursorPosition: function(editorId, line, column) {
        const editor = this.editors[editorId];
        if (!editor) return;

        editor.setPosition({ lineNumber: line, column: column });
        editor.revealLineInCenter(line);
    },

    /**
     * Insert text at cursor position
     * @param {string} editorId - Editor instance ID
     * @param {string} text - Text to insert
     */
    insertAtCursor: function(editorId, text) {
        const editor = this.editors[editorId];
        if (!editor) return;

        const position = editor.getPosition();
        const range = new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
        );

        const op = { range: range, text: text, forceMoveMarkers: true };
        editor.executeEdits('insert-text', [op]);
    }
};

// Initialize Monaco when the script loads
console.log('aiMate.nz - Monaco Editor utilities loaded ✓');
