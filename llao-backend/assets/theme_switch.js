// Ce script écoute les changements du store Dash 'theme-store' et applique la classe 'dark' sur <body> si besoin
(function() {
    // Fonction utilitaire pour appliquer le thème
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    function getThemeFromStore(store) {
        try {
            const data = JSON.parse(store.dataset.storedData || '{}');
            return data.theme || 'light';
        } catch (e) {
            return 'light';
        }
    }

    // Observe le store Dash
    function observeThemeStore() {
        const store = document.querySelector('#theme-store');
        if (!store) {
            setTimeout(observeThemeStore, 200); // Réessaie tant que le store n'est pas là
            return;
        }
        // Applique le thème initial
        applyTheme(getThemeFromStore(store));
        // Observe les changements
        const observer = new MutationObserver(function() {
            applyTheme(getThemeFromStore(store));
        });
        observer.observe(store, { attributes: true, attributeFilter: ['data-stored-data'] });

        // Ajoute aussi un listener sur le bouton pour forcer le thème
        const btn = document.querySelector('#theme-toggle');
        if (btn) {
            btn.addEventListener('click', function() {
                setTimeout(function() {
                    applyTheme(getThemeFromStore(store));
                }, 100);
            });
        }
        console.log('[theme_switch.js] Thème dynamique prêt');
    }

    // Attendre que le DOM soit prêt
    document.addEventListener('DOMContentLoaded', observeThemeStore);
    // Pour Dash qui recharge dynamiquement
    setTimeout(observeThemeStore, 1000);
})(); 