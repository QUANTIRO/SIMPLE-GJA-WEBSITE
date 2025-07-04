document.addEventListener('DOMContentLoaded', () => {
    const languages = {
        de: { name: 'Deutsch', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/de.svg' },
        en: { name: 'English', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/gb.svg' },
        es: { name: 'Español', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/es.svg' },
        fr: { name: 'Français', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/fr.svg' },
        pl: { name: 'Polski', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/pl.svg' },
        pt: { name: 'Português', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/pt.svg' },
        ru: { name: 'Русский', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/ru.svg' },
        uk: { name: 'Українська', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/ua.svg' },
        vi: { name: 'Tiếng Việt', flag: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/vn.svg' }
    };

    const updateContent = () => {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            let targetAttr = 'innerHTML';

            // Check for attribute targeting syntax like `[placeholder]key.name`
            if (key.startsWith('[')) {
                const match = key.match(/\[([^\]]+)\](.+)/);
                if (match) {
                    targetAttr = match[1];
                    const newKey = match[2];
                    const translation = i18next.t(newKey);
                    
                    // Handle special cases like dynamic heading separately
                    if (el.id !== 'dynamic-heading') {
                       el.setAttribute(targetAttr, translation);
                    }
                }
            } else {
                 if (el.id !== 'dynamic-heading') {
                    el.innerHTML = i18next.t(key);
                }
            }
        });

        // Handle dynamic heading separately
        if (typeof setupDynamicHeading === 'function') {
            setupDynamicHeading();
        }
    };
    
    const createLanguageSwitcher = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const currentLangCode = i18next.language || 'pl';
        const buttonId = `lang-switcher-button-${containerId}`;
        const currentLanguage = languages[currentLangCode] || languages.pl;

        // Main button
        let buttonHTML = `
            <button type="button" class="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-gold" id="${buttonId}">
                <img src="${currentLanguage.flag}" alt="${currentLanguage.name}" class="w-5 h-auto mr-2">
                ${currentLanguage.name}
                <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
        `;
        
        // Dropdown menu
        let menuHTML = `<div id="lang-menu-${containerId}" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden" style="max-height: 300px; overflow-y: auto;">
            <div class="py-1">`;
        
        const customOrder = ['vi', 'uk'];
        const sortedLangs = Object.keys(languages).sort((a, b) => {
            const indexA = customOrder.indexOf(a);
            const indexB = customOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) {
                return -1;
            }
            if (indexB !== -1) {
                return 1;
            }
            return languages[a].name.localeCompare(languages[b].name);
        });

        sortedLangs.forEach(lng => {
            const activeClass = i18next.language === lng ? 'bg-gray-100 font-bold' : '';
            const langData = languages[lng];
            menuHTML += `<a href="#" data-lang="${lng}" class="text-gray-700 block px-4 py-2 text-sm ${activeClass} flex items-center"><img src="${langData.flag}" alt="${langData.name}" class="w-5 h-auto mr-3"> ${langData.name}</a>`;
        });
        menuHTML += `</div></div>`;
        
        container.innerHTML = buttonHTML + menuHTML;

        // Add event listeners
        document.getElementById(buttonId).addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById(`lang-menu-${containerId}`);
            menu.classList.toggle('hidden');
        });

        container.querySelectorAll('[data-lang]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = e.currentTarget.getAttribute('data-lang');
                i18next.changeLanguage(lang);
                document.getElementById(`lang-menu-${containerId}`).classList.add('hidden');
            });
        });
    };

    const setupI18next = async () => {
        await i18next
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                fallbackLng: 'pl',
                debug: false,
                backend: {
                    loadPath: 'locales/{{lng}}/translation.json',
                },
                detection: {
                    order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
                    caches: ['cookie', 'localStorage'],
                }
            });
        
        updateContent();

        createLanguageSwitcher('language-switcher-container');
        createLanguageSwitcher('mobile-language-switcher-container');

        // Emit custom event when i18next is ready
        document.dispatchEvent(new CustomEvent('i18nextInitialized'));

        i18next.on('languageChanged', () => {
            updateContent();
            // Re-create switchers to update the displayed language
            createLanguageSwitcher('language-switcher-container');
            createLanguageSwitcher('mobile-language-switcher-container');
        });
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        document.querySelectorAll('[id^="lang-menu-"]').forEach(menu => {
            const buttonId = menu.id.replace('lang-menu-', 'lang-switcher-button-');
            const button = document.getElementById(buttonId);
            if (button && !button.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    });

    // Run setup
    setupI18next();
});

// Dynamic Heading needs to be global to be accessible after content update
let headingInterval;
function setupDynamicHeading() {
    const headingElement = document.getElementById('dynamic-heading');
    if (!headingElement) return;

    if (headingInterval) {
        clearInterval(headingInterval);
    }
    
    // Use i18next to get the translations
    const words = [
        i18next.t('employees.dynamic_heading.text1'),
        i18next.t('employees.dynamic_heading.text2'),
        i18next.t('employees.dynamic_heading.text3'),
    ];
    let index = 0;
    
    const updateHeading = () => {
        headingElement.style.opacity = 0;
        setTimeout(() => {
            headingElement.textContent = words[index];
            headingElement.style.opacity = 1;
            index = (index + 1) % words.length;
        }, 1000);
    };

    headingElement.style.transition = 'opacity 1s ease-in-out';
    headingInterval = setInterval(updateHeading, 4000);
    updateHeading();
} 