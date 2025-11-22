// TopBar helper for aiMate

window.topBarHelper = {
    dotNetHelper: null,

    // Initialize all TopBar functionality
    initialize: function (dotNetHelper) {
        this.dotNetHelper = dotNetHelper;
        this.initializeClickOutside();
        this.initializeKeyboardShortcuts();
    },

    // Handle click-outside for dropdown menus
    initializeClickOutside: function () {
        document.addEventListener('click', (e) => {
            const isDropdownButton = e.target.closest('[data-dropdown-button]');
            const isDropdownMenu = e.target.closest('[data-dropdown-menu]');

            if (!isDropdownButton && !isDropdownMenu) {
                if (this.dotNetHelper) {
                    this.dotNetHelper.invokeMethodAsync('CloseAllMenus');
                }
            }
        });
    },

    // Handle keyboard shortcuts
    initializeKeyboardShortcuts: function () {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (this.dotNetHelper) {
                    this.dotNetHelper.invokeMethodAsync('HandleSearchShortcut');
                }
            }

            // Escape key to close menus/search
            if (e.key === 'Escape') {
                if (this.dotNetHelper) {
                    this.dotNetHelper.invokeMethodAsync('CloseAllMenus');
                }
            }
        });
    }
};
