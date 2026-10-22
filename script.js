
// --- محرك قاعدة البيانات الهجين فائق السرعة والمثبت دائمًا ضد التحديث (Zero-Loss Synchronous Hybrid Storage) ---
window.AppStorage = {
    cache: {},
    db: null,
    writeQueue: {},
    writeTimer: null,
    
    initSync() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                this.cache[k] = localStorage.getItem(k);
            }
        } catch (e) {}
    },

    async init() {
        this.initSync();
        // تفعيل حماية التخزين الدائم على هواتف الأندرويد لمنع مسح البيانات نهائياً
        try {
            if (navigator.storage && navigator.storage.persist) {
                const isPersisted = await navigator.storage.persist();
                console.log(`[Storage] Persistent Storage Mode: ${isPersisted ? 'LOCKED & PERMANENT 🛡️' : 'Standard'}`);
            }
        } catch (e) {}

        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('CashCalc_DB', 2);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('store')) {
                        db.createObjectStore('store');
                    }
                };
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    const transaction = this.db.transaction('store', 'readonly');
                    const store = transaction.objectStore('store');
                    
                    const req = store.openCursor();
                    req.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            // دمج البيانات: كاش وقاعدة بيانات
                            if (this.cache[cursor.key] === undefined || this.cache[cursor.key] === null) {
                                this.cache[cursor.key] = cursor.value;
                                // عدم كتابة السجلات الكبيرة في localStorage لتفادي خطأ QuotaExceededError
                                if (cursor.key !== 'cashCalculatorHistory' && cursor.key !== 'bayan_last_auto_backup' && cursor.key !== 'bayan_exit_auto_backup') {
                                    try { localStorage.setItem(cursor.key, cursor.value); } catch (err) {}
                                }
                            }
                            cursor.continue();
                        } else {
                            resolve();
                        }
                    };
                    req.onerror = () => resolve();
                };
                request.onerror = () => resolve();
            } catch (err) {
                resolve();
            }
        });
    },

    // قراءة فورية في 0ms
    getItem(key) {
        if (this.cache[key] !== undefined && this.cache[key] !== null) {
            return this.cache[key];
        }
        try {
            const v = localStorage.getItem(key);
            if (v !== null) {
                this.cache[key] = v;
                return v;
            }
        } catch (e) {}
        return null;
    },

    // حفظ فوري في الذاكرة + كتابة آمنة ومحمية الكوتا في localStorage و IndexedDB
    setItem(key, value) {
        this.cache[key] = value;
        
        // حماية كوتا localStorage من الامتلاء مع السجلات الكبيرة لسنوات طويلة
        const isLargeKey = key === 'cashCalculatorHistory' || key === 'bayan_last_auto_backup' || key === 'bayan_exit_auto_backup';
        if (!isLargeKey) {
            try { localStorage.setItem(key, value); } catch (e) {}
        } else {
            try {
                // حفظ نسخة إضافية في localStorage فقط إذا كانت خفيفة وأقل من 500KB
                if (typeof value === 'string' && value.length < 500000) {
                    localStorage.setItem(key, value);
                }
            } catch (e) {}
        }

        if (this.db) {
            this.writeQueue[key] = value;
            if (!this.writeTimer) {
                this.writeTimer = setTimeout(() => {
                    this.flushQueue();
                }, 40);
            }
        }
    },

    flushQueue() {
        if (!this.db || Object.keys(this.writeQueue).length === 0) {
            this.writeTimer = null;
            return;
        }
        try {
            const tx = this.db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            for (const key in this.writeQueue) {
                store.put(this.writeQueue[key], key);
            }
            this.writeQueue = {};
        } catch (e) {
        } finally {
            this.writeTimer = null;
        }
    },

    removeItem(key) {
        delete this.cache[key];
        try { localStorage.removeItem(key); } catch (e) {}
        if (this.db) {
            try {
                const tx = this.db.transaction('store', 'readwrite');
                tx.objectStore('store').delete(key);
            } catch (e) {}
        }
    },

    clear() {
        this.cache = {};
        this.writeQueue = {};
        try { localStorage.clear(); } catch (e) {}
        if (this.db) {
            try {
                const tx = this.db.transaction('store', 'readwrite');
                tx.objectStore('store').clear();
            } catch (e) {}
        }
    }
};

// تهيئة فورية للكاش المتزامن فور تحميل السكريبت
window.AppStorage.initSync();
// ------------------------------------------------

        /* ---------------------------------------------------- */
        /* وظائف جافاسكريبت (JavaScript) - استعادة وظائف SweetAlert2 و html2canvas */
        /* ---------------------------------------------------- */

        let currencyDenominations = [200, 100, 50, 20, 10, 5, 1, 0.50, 0.25];
        let currencySymbol = 'جنيه';
        const icons = {
            200: '<i class="fas fa-money-bill" style="color: #556b2f;"></i>', // Olive (200 EGP)
            100: '<i class="fas fa-money-bill" style="color: #6a4c93;"></i>', // Purple (100 EGP)
            50: '<i class="fas fa-money-bill" style="color: #8b4513;"></i>',  // Brown (50 EGP)
            20: '<i class="fas fa-money-bill" style="color: #2e8b57;"></i>',  // Green (20 EGP)
            10: '<i class="fas fa-money-bill" style="color: #e76f51;"></i>',  // Orange/Red (10 EGP)
            5: '<i class="fas fa-money-bill" style="color: #2a9d8f;"></i>',   // Teal (5 EGP)
            1: '<i class="fas fa-coins" style="color: #adb5bd;"></i>',        // Silver (1 EGP Coin)
            0.50: '<i class="fas fa-circle" style="color: #ffd700;"></i>',    // Gold (50pt Coin)
            0.25: '<i class="far fa-circle" style="color: #cd7f32;"></i>'     // Bronze (25pt Coin)
        };

        const translations = {
            ar: {
                title: 'حاسبة النقد الاحترافية',
                h1: 'حاسبة النقود النقدية',
                totalTitle: 'الإجمالي النقدي:',
                saveBtn: 'حفظ يومية',
                shareBtn: 'مشاركة',
                copyBtn: 'نسخ',
                clearBtn: 'تصفير',
                settingsTitle: 'الإعدادات والأدوات',
                stats: 'الإحصائيات',
                pdf: 'تصدير PDF',
                screenshot: 'لقطة شاشة عالية الجودة',
                aboutApp: 'عن التطبيق والميزات',
                theme: 'تبديل الوضع (داكن/فاتح)',
                export: 'تصدير البيانات',
                import: 'استيراد البيانات',
                toolsTitle: 'الأدوات والتقارير',
                appearanceTitle: 'المظهر والتفضيلات',
                securityTitle: 'الأمان والبيانات',
                soundLabel: 'تفعيل الأصوات 🔊',
                themeColorsLabel: 'ألوان السمة:',
                currencyLabelSettings: 'العملة:',
                exchangeRateLabel: 'سعر الصرف:',
                systemSalesLabel: 'مبيعات النظام:',
                languageLabelSettings: 'اللغة:',
                passwordToggleLabel: 'تفعيل حماية كلمة المرور',
                setPasswordBtn: 'تعيين',
                vodafoneLabel: 'فودافون كاش',
                instapayLabel: 'إنستا باي',
                cashBreakdown: '💵 نقدي:',
                digitalBreakdown: '📱 رقمي:',
                historySummary: 'مجموع السجلات المعروضة:'
            },
            en: {
                title: 'Professional Cash Calculator',
                h1: 'Cash Calculator',
                totalTitle: 'Total Cash:',
                saveBtn: 'Save Daily',
                shareBtn: 'Share',
                copyBtn: 'Copy',
                clearBtn: 'Reset',
                settingsTitle: 'Settings & Tools',
                stats: 'Statistics',
                pdf: 'Export PDF',
                screenshot: 'High Quality Screenshot',
                aboutApp: 'About App & Features',
                theme: 'Toggle Mode (Dark/Light)',
                export: 'Export Data',
                import: 'Import Data',
                toolsTitle: 'Tools & Reports',
                appearanceTitle: 'Appearance & Preferences',
                securityTitle: 'Security & Data',
                soundLabel: 'Enable Sounds 🔊',
                themeColorsLabel: 'Theme Colors:',
                currencyLabelSettings: 'Currency:',
                exchangeRateLabel: 'Exchange Rate:',
                systemSalesLabel: 'System Sales:',
                languageLabelSettings: 'Language:',
                passwordToggleLabel: 'Enable Password Protection',
                setPasswordBtn: 'Set',
                vodafoneLabel: 'Vodafone Cash',
                instapayLabel: 'InstaPay',
                cashBreakdown: '💵 Cash:',
                digitalBreakdown: '📱 Digital:',
                historySummary: 'Total Displayed Records:'
            },
            fr: {
                title: 'Calculatrice de Trésorerie Pro',
                h1: 'Calculatrice d\'Espèces',
                totalTitle: 'Total Espèces:',
                saveBtn: 'Enregistrer',
                shareBtn: 'Partager',
                copyBtn: 'Copier',
                clearBtn: 'Réinitialiser',
                settingsTitle: 'Paramètres & Outils',
                stats: 'Statistiques',
                pdf: 'Exporter PDF',
                screenshot: 'Capture d\'écran HD',
                theme: 'Mode (Sombre/Clair)',
                export: 'Exporter Données',
                import: 'Importer Données',
                toolsTitle: 'Outils et Rapports',
                appearanceTitle: 'Apparence et Préférences',
                securityTitle: 'Sécurité et Données',
                soundLabel: 'Activer les Sons 🔊',
                themeColorsLabel: 'Couleurs du Thème:',
                currencyLabelSettings: 'Devise:',
                exchangeRateLabel: 'Taux de Change:',
                systemSalesLabel: 'Ventes Système:',
                languageLabelSettings: 'Langue:',
                passwordToggleLabel: 'Activer la Protection par Mot de Passe',
                setPasswordBtn: 'Définir',
                vodafoneLabel: 'Vodafone Cash',
                instapayLabel: 'InstaPay',
                cashBreakdown: '💵 Espèces:',
                digitalBreakdown: '📱 Numérique:',
                historySummary: 'Total des Enregistrements:'
            }
        };

        function updateLanguage(lang) {
            if (!translations[lang]) return;
            document.documentElement.lang = lang;
            document.title = translations[lang].title;
            const appTitle = document.getElementById('app-title-text');
            if (appTitle) appTitle.textContent = translations[lang].h1;

            const totalDisplayH2 = document.querySelector('#total-display h2');
            if (totalDisplayH2) totalDisplayH2.textContent = translations[lang].totalTitle;

            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> ' + translations[lang].saveBtn;

            const shareBtn = document.getElementById('share-btn');
            if (shareBtn) shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> ' + translations[lang].shareBtn;

            const copyBtn = document.getElementById('copy-btn');
            if (copyBtn) copyBtn.innerHTML = '<i class="fas fa-copy"></i> ' + translations[lang].copyBtn;

            const clearBtn = document.getElementById('clear-btn');
            if (clearBtn) clearBtn.innerHTML = '<i class="fas fa-trash-restore"></i> ' + translations[lang].clearBtn;

            const modalTitle = document.getElementById('modal-title');
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-cog"></i> ' + translations[lang].settingsTitle;

            // تحديث عناوين الأقسام بأمان
            const historyCardH2 = document.querySelector('#history-card h2');
            if (historyCardH2) historyCardH2.innerHTML = lang === 'ar' ? '<i class="fas fa-history"></i> سجل البيانات اليومية' : '<i class="fas fa-history"></i> Daily Records';

            const statsBtn = document.querySelector('#stats-btn');
            if (statsBtn) statsBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-chart-bar"></i> الإحصائيات' : '<i class="fas fa-chart-bar"></i> Statistics';

            const pdfExportBtn = document.querySelector('#pdf-export-btn');
            if (pdfExportBtn) pdfExportBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-file-pdf"></i> تصدير PDF' : '<i class="fas fa-file-pdf"></i> Export PDF';

            const screenshotBtn = document.querySelector('#screenshot-btn');
            if (screenshotBtn) screenshotBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-camera"></i> لقطة شاشة 4K' : '<i class="fas fa-camera"></i> 4K Screenshot';

            const aboutAppBtn = document.querySelector('#about-app-btn');
            if (aboutAppBtn) aboutAppBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-info-circle"></i> عن التطبيق والميزات' : '<i class="fas fa-info-circle"></i> About App & Features';

            const digitalReportBtn = document.querySelector('#digital-report-btn');
            if (digitalReportBtn) digitalReportBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-wallet"></i> تقرير الرقمي' : '<i class="fas fa-wallet"></i> Digital Report';

            const modeToggleBtn = document.querySelector('#mode-toggle-btn');
            if (modeToggleBtn) modeToggleBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-moon"></i> تبديل الوضع (داكن/فاتح)' : '<i class="fas fa-moon"></i> Toggle Mode (Dark/Light)';

            const exportBtn = document.querySelector('#export-btn');
            if (exportBtn) exportBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-download"></i> تصدير البيانات' : '<i class="fas fa-download"></i> Export Data';

            const importBtn = document.querySelector('#import-btn');
            if (importBtn) importBtn.innerHTML = lang === 'ar' ? '<i class="fas fa-upload"></i> استيراد البيانات' : '<i class="fas fa-upload"></i> Import Data';

            // تحديث النصوص في الإعدادات والواجهة بأمان تام
            const setElemText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
            const setElemHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

            setElemHtml('tools-title', '<i class="fas fa-toolbox"></i> ' + translations[lang].toolsTitle);
            setElemHtml('appearance-title', '<i class="fas fa-sliders-h"></i> ' + translations[lang].appearanceTitle);
            setElemHtml('security-title', '<i class="fas fa-shield-alt"></i> ' + translations[lang].securityTitle);
            setElemText('sound-label-text', translations[lang].soundLabel);
            setElemText('theme-colors-label', translations[lang].themeColorsLabel);
            setElemText('currency-label-settings', translations[lang].currencyLabelSettings);
            setElemText('exchange-rate-label', translations[lang].exchangeRateLabel);
            setElemText('system-sales-label', translations[lang].systemSalesLabel);
            setElemText('language-label-settings', translations[lang].languageLabelSettings);
            setElemText('password-toggle-text', translations[lang].passwordToggleLabel);
            setElemText('set-password-btn', translations[lang].setPasswordBtn);
            setElemHtml('vodafone-label', '<i class="fas fa-mobile-alt"></i> ' + translations[lang].vodafoneLabel);
            setElemHtml('instapay-label', '<i class="fas fa-university"></i> ' + translations[lang].instapayLabel);
            setElemText('cash-breakdown-label', translations[lang].cashBreakdown);
            setElemText('digital-breakdown-label', translations[lang].digitalBreakdown);
            setElemText('history-summary-text', translations[lang].historySummary);

            // تحديث placeholder للحقول بأمان
            const setPlaceholder = (id, text) => { const el = document.getElementById(id); if (el) el.placeholder = text; };
            setPlaceholder('vodafone-cash', lang === 'ar' ? 'المبلغ' : 'Amount');
            setPlaceholder('instapay', lang === 'ar' ? 'المبلغ' : 'Amount');
            setPlaceholder('exchange-rate', lang === 'ar' ? '1 وحدة = ? جنيه' : '1 unit = ? EGP');
            setPlaceholder('system-total-input', lang === 'ar' ? 'للمطابقة (العهدة)' : 'For matching (safe)');
            setPlaceholder('password-input', lang === 'ar' ? 'كلمة مرور جديدة' : 'New password');
            setPlaceholder('search-input', lang === 'ar' ? 'البحث في السجلات...' : 'Search records...');

            // تحديث خيارات العملة
            const currencySelect = document.getElementById('currency-select');
            if (currencySelect && currencySelect.options.length >= 3) {
                currencySelect.options[0].text = lang === 'ar' ? 'جنيه مصري' : 'EGP Pound';
                currencySelect.options[1].text = lang === 'ar' ? 'دولار أمريكي' : 'US Dollar';
                currencySelect.options[2].text = lang === 'ar' ? 'يورو' : 'Euro';
            }

            // تحديث خيارات اللغة
            const languageSelect = document.getElementById('language-select');
            if (languageSelect && languageSelect.options.length >= 2) {
                languageSelect.options[0].text = lang === 'ar' ? 'العربية' : 'Arabic';
                languageSelect.options[1].text = lang === 'ar' ? 'English' : 'الإنجليزية';
            }

            // تحديث نصوص أزرار الإحصائيات
            setElemText('stats-today-btn', lang === 'ar' ? 'اليوم' : 'Today');
            setElemText('stats-week-btn', lang === 'ar' ? 'الأسبوع' : 'Week');
            setElemText('stats-month-btn', lang === 'ar' ? 'الشهر' : 'Month');

            // تحديث نصوص الإحصائيات
            const dailyTotal = document.getElementById('daily-total');
            if (dailyTotal && dailyTotal.previousElementSibling) dailyTotal.previousElementSibling.textContent = lang === 'ar' ? 'إجمالي اليوم' : 'Total Today';
            const dailyAverage = document.getElementById('daily-average');
            if (dailyAverage && dailyAverage.previousElementSibling) dailyAverage.previousElementSibling.textContent = lang === 'ar' ? 'متوسط اليوم' : 'Average';
            const highestRecord = document.getElementById('highest-record');
            if (highestRecord && highestRecord.previousElementSibling) highestRecord.previousElementSibling.textContent = lang === 'ar' ? 'أعلى قيمة' : 'Highest';
            const totalRecords = document.getElementById('total-records');
            if (totalRecords && totalRecords.previousElementSibling) totalRecords.previousElementSibling.textContent = lang === 'ar' ? 'عدد السجلات' : 'Records';

            // تحديث نص الفوتر
            setElemText('footer-credits', lang === 'ar' ? 'حقوق ©عمرو إيهاب — كل الحقوق محفوظة' : '© Amr Ehab — All Rights Reserved');
        }

        function updateCurrency(currency) {
            switch (currency) {
                case 'usd':
                    currencyDenominations = [100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05];
                    currencySymbol = 'دولار';
                    break;
                case 'eur':
                    currencyDenominations = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
                    currencySymbol = 'يورو';
                    break;
                default:
                    currencyDenominations = [200, 100, 50, 20, 10, 5, 1, 0.50, 0.25];
                    currencySymbol = 'جنيه';
            }
            document.getElementById('currency-label').textContent = currencySymbol;

            // إضافة أيقونة علم لتمييز العملة بشكل أفضل
            let flagIcon = '';
            if (currency === 'usd') flagIcon = '🇺🇸 ';
            else if (currency === 'eur') flagIcon = '🇪🇺 ';
            else flagIcon = '🇪🇬 ';

            // تحديث المربع الجديد بجوار زر الوضع (Dark/Light)
            const statusBadge = document.getElementById('currency-status-badge');
            if (statusBadge) {
                let statusColor = 'var(--secondary-color)';
                if (currency === 'usd') statusColor = '#198754';
                else if (currency === 'eur') statusColor = '#0d6efd';

                statusBadge.innerHTML = `<span style="font-size: 1.2em; margin-left: 5px;">${flagIcon.trim()}</span> ${currencySymbol}`;
                statusBadge.style.background = statusColor;
            }

            // Recreate UI
            const notesList = document.getElementById('notes-list');
            notesList.innerHTML = '';
            createUI();
            loadInputs();
            calculateTotal();
        }
        const notesListElement = document.getElementById('notes-list');
        const totalAmountElement = document.getElementById('total-amount');
        const historyList = document.getElementById('history-list');
        const dateFilterInput = document.getElementById('date-filter-input');
        const searchInput = document.getElementById('search-input');
        const settingsCard = document.getElementById('settings-card');
        const statsCard = document.getElementById('stats-card');

        // دالة موحدة لإنشاء صف العملة (Widget) فسيح وأنيق
        function createCurrencyRowHTML(value) {
            const displayValue = value.toFixed(value % 1 === 0 ? 0 : 2);
            const icon = icons[value] || '💰';
            const rowTotalId = `total-${value.toString().replace('.', '-')}`;

            // زر الرزم (100 ورقة/قطعة) لكافة الفئات النقدية والمعدنية
            const bundleBtnHTML = `
                <button class="bundle-quick-btn" onclick="addBundleToRow(this, 100)" title="إضافة 100 قطعة / ورقة">
                    <span class="bundle-num">100</span>
                    <span class="bundle-txt">رزمة</span>
                </button>
            `;

            return `
                <div class="currency-info" onclick="openQuickNumpadFor(this)" title="اضغط لفتح لوحة الأرقام الفورية">
                    <div class="note-icon">${icon}</div>
                    <div class="note-value">${displayValue}</div>
                </div>
                
                <button class="increment-btn" title="زيادة 1">+</button>
                
                <div class="input-wrapper">
                    <input type="number" class="cash-input" data-value="${value}"
                           placeholder="0" min="0" inputmode="numeric" pattern="[0-9]*">
                    <div class="row-total-display" id="${rowTotalId}">0.00</div>
                </div>
                
                <button class="decrement-btn" title="نقصان 1">−</button>

                <div class="row-quick-tools">
                    ${bundleBtnHTML}
                    <button class="lock-btn" onclick="toggleLock(this)" title="قفل الفئة">
                        <i class="fas fa-unlock"></i>
                    </button>
                </div>
            `;
        }

        function createUI() {
            notesListElement.innerHTML = ''; // تنظيف القائمة قبل الإنشاء
            
            const hide1 = AppStorage.getItem('hide_coin_1') === 'true';
            const hide05 = AppStorage.getItem('hide_coin_05') === 'true';
            const hide025 = AppStorage.getItem('hide_coin_025') === 'true';

            currencyDenominations.forEach(value => {
                if (value === 1 && hide1) return;
                if (value === 0.50 && hide05) return;
                if (value === 0.25 && hide025) return;

                const row = document.createElement('div');
                row.className = 'note-row';
                row.innerHTML = createCurrencyRowHTML(value);
                notesListElement.appendChild(row);
            });

            document.querySelectorAll('.cash-input').forEach(input => {
                input.addEventListener('input', calculateTotal);
            });

            // مستمعي الأحداث للخزينة الرقمية
            document.getElementById('vodafone-cash').addEventListener('input', calculateTotal);
            document.getElementById('instapay').addEventListener('input', calculateTotal);

            document.querySelectorAll('.increment-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = btn.closest('.note-row').querySelector('.cash-input');
                    input.value = parseInt(input.value || 0) + 1;
                    calculateTotal();
                });
            });

            document.querySelectorAll('.decrement-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = btn.closest('.note-row').querySelector('.cash-input');
                    const current = parseInt(input.value || 0);
                    if (current > 0) {
                        input.value = current - 1;
                        calculateTotal();
                    }
                });
            });
        }

        let saveInputsTimer = null;
        function debouncedSaveInputs(delay = 400) {
            clearTimeout(saveInputsTimer);
            saveInputsTimer = setTimeout(() => {
                saveInputs();
            }, delay);
        }

        function saveInputs() {
            clearTimeout(saveInputsTimer);
            if (AppStorage.getItem('autosaveEnabled') === 'false') return;

            const inputsData = {};
            document.querySelectorAll('.cash-input').forEach(input => {
                const value = input.getAttribute('data-value');
                inputsData[value] = input.value;
            });
            const vCash = document.getElementById('vodafone-cash')?.value || '';
            const iPay = document.getElementById('instapay')?.value || '';
            inputsData['vodafone'] = vCash;
            inputsData['instapay'] = iPay;
            
            // حفظ فوري في التخزين
            AppStorage.setItem('cashCalculatorInputs', JSON.stringify(inputsData));

            // إظهار مؤشر الحفظ التلقائي
            const indicator = document.getElementById('autosave-indicator');
            if (indicator) {
                indicator.style.display = 'block';
                clearTimeout(window.indicatorTimer);
                window.indicatorTimer = setTimeout(() => { indicator.style.display = 'none'; }, 1500);
            }
        }

        // --- ⚡ 1. وظائف الرزم السريعة وتصفير الصف الفردي (Bundles & Row Clear) ⚡ ---
        window.addBundleToRow = function (btn, countToAdd = 100) {
            const row = btn.closest('.note-row');
            const input = row.querySelector('.cash-input');
            if (row.classList.contains('locked-row')) {
                playSound('error');
                return;
            }
            const current = parseInt(input.value || 0);
            input.value = current + countToAdd;
            calculateTotal();
            playSound('cash');
            
            // أنيميشن وميض سريع للرقم
            input.classList.add('pulse-text');
            setTimeout(() => input.classList.remove('pulse-text'), 300);
        };

        window.clearSingleRow = function (btn) {
            const row = btn.closest('.note-row');
            const input = row.querySelector('.cash-input');
            if (row.classList.contains('locked-row')) {
                playSound('error');
                return;
            }
            if (input.value && parseInt(input.value) > 0) {
                input.value = '';
                calculateTotal();
                playSound('trash');
            }
        };

        // --- 📱 2. منطق لوحة الأرقام السريعة العائمة للهواتف (Quick Numpad Engine) 📱 ---
        let activeNumpadInput = null;

        window.openQuickNumpadFor = function (currencyInfoElem) {
            const row = currencyInfoElem.closest('.note-row');
            const input = row.querySelector('.cash-input');
            if (row.classList.contains('locked-row')) {
                playSound('error');
                return;
            }

            activeNumpadInput = input;
            const val = input.getAttribute('data-value');
            const count = input.value || '0';

            document.getElementById('numpad-currency-name').textContent = `فئة ${val} ${currencySymbol}`;
            document.getElementById('numpad-current-val').textContent = `${count} ورقة`;

            const overlay = document.getElementById('quick-numpad-overlay');
            if (overlay) overlay.style.display = 'flex';
            playSound('tick');
        };

        window.closeQuickNumpad = function () {
            const overlay = document.getElementById('quick-numpad-overlay');
            if (overlay) overlay.style.display = 'none';
            activeNumpadInput = null;
            playSound('tick');
        };

        window.numpadPress = function (key) {
            if (!activeNumpadInput) return;
            let currentVal = activeNumpadInput.value ? activeNumpadInput.value.toString() : '';

            if (key === 'C') {
                currentVal = '';
            } else if (key === 'DEL') {
                currentVal = currentVal.slice(0, -1);
            } else {
                if (currentVal === '0') currentVal = '';
                if (currentVal.length < 8) currentVal += key;
            }

            activeNumpadInput.value = currentVal;
            document.getElementById('numpad-current-val').textContent = `${currentVal || '0'} ورقة`;
            calculateTotal();
            playSound('tick');
        };

        window.numpadAddQuick = function (amount) {
            if (!activeNumpadInput) return;
            let currentNum = parseInt(activeNumpadInput.value || 0);
            currentNum += amount;
            activeNumpadInput.value = currentNum;
            document.getElementById('numpad-current-val').textContent = `${currentNum} ورقة`;
            calculateTotal();
            playSound('cash');
        };

        window.toggleLock = function (btn) {
            const row = btn.closest('.note-row');
            const input = row.querySelector('.cash-input');
            const isLocked = row.classList.toggle('locked-row');
            btn.classList.toggle('locked');

            if (isLocked) {
                btn.innerHTML = '<i class="fas fa-lock"></i>';
                playSound('error');
            } else {
                btn.innerHTML = '<i class="fas fa-unlock"></i>';
                playSound('tick');
            }
        };

        function loadInputs() {
            let savedInputs = {};
            try {
                savedInputs = JSON.parse(AppStorage.getItem('cashCalculatorInputs') || '{}');
            } catch (e) {
                console.error("Error loading inputs:", e);
            }
            document.querySelectorAll('.cash-input').forEach(input => {
                const value = input.getAttribute('data-value');
                if (savedInputs[value]) {
                    input.value = savedInputs[value];
                }
            });
            if (savedInputs['vodafone']) document.getElementById('vodafone-cash').value = savedInputs['vodafone'];
            if (savedInputs['instapay']) document.getElementById('instapay').value = savedInputs['instapay'];
            const now = new Date();
            const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            document.getElementById('entry-date').value = localDate;
        }

        // ==========================================
        // 🔤 محرك التفقيط المالي باللغة العربية (Arabic Financial Tafqeet)
        // ==========================================
        function numberToArabicWords(number) {
            if (isNaN(number) || number === 0) return 'صفر';
            number = Math.floor(Math.abs(number));

            const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
            const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
            const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
            const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

            function convertGroup(n) {
                let h = Math.floor(n / 100);
                let rem = n % 100;
                let parts = [];

                if (h > 0) parts.push(hundreds[h]);

                if (rem > 0) {
                    if (rem < 10) {
                        parts.push(ones[rem]);
                    } else if (rem >= 10 && rem < 20) {
                        parts.push(teens[rem - 10]);
                    } else {
                        let u = rem % 10;
                        let t = Math.floor(rem / 10);
                        if (u > 0) {
                            parts.push(ones[u] + ' و' + tens[t]);
                        } else {
                            parts.push(tens[t]);
                        }
                    }
                }
                return parts.join(' و');
            }

            const groups = [];
            let temp = number;
            while (temp > 0) {
                groups.push(temp % 1000);
                temp = Math.floor(temp / 1000);
            }

            const scaleNames = [
                { singular: '', dual: '', plural: '', accusative: '' },
                { singular: 'ألف', dual: 'ألفان', plural: 'آلاف', accusative: 'ألفاً' },
                { singular: 'مليون', dual: 'مليونان', plural: 'ملايين', accusative: 'مليوناً' },
                { singular: 'مليار', dual: 'ملياران', plural: 'مليارات', accusative: 'ملياراً' }
            ];

            let resultParts = [];
            for (let i = groups.length - 1; i >= 0; i--) {
                const g = groups[i];
                if (g === 0) continue;

                if (i === 0) {
                    resultParts.push(convertGroup(g));
                } else {
                    const scale = scaleNames[i];
                    if (g === 1) {
                        resultParts.push(scale.singular);
                    } else if (g === 2) {
                        resultParts.push(scale.dual);
                    } else if (g >= 3 && g <= 10) {
                        resultParts.push(convertGroup(g) + ' ' + scale.plural);
                    } else {
                        resultParts.push(convertGroup(g) + ' ' + scale.accusative);
                    }
                }
            }

            return resultParts.join(' و');
        }

        window.tafqeet = function (amount, currencyCode = 'egp') {
            const num = parseFloat(amount);
            if (isNaN(num) || num === 0) {
                const curName = currencyCode === 'usd' ? 'دولار أمريكي' : (currencyCode === 'eur' ? 'يورو' : 'جنيه مصري');
                return `فقط صفر ${curName} لا غير`;
            }

            const isNegative = num < 0;
            const absVal = Math.abs(num);
            const whole = Math.floor(absVal);
            const fraction = Math.round((absVal - whole) * 100);

            let mainUnit = 'جنيه مصري';
            let subUnit = 'قرش';
            if (currencyCode === 'usd') {
                mainUnit = 'دولار أمريكي';
                subUnit = 'سنت';
            } else if (currencyCode === 'eur') {
                mainUnit = 'يورو';
                subUnit = 'سنت';
            }

            let wholeText = '';
            if (whole > 0) {
                const words = numberToArabicWords(whole);
                const lastTwo = whole % 100;
                if (currencyCode === 'egp') {
                    if (whole === 1) wholeText = 'جنيه مصري واحد';
                    else if (whole === 2) wholeText = 'جنيهان مصريان';
                    else if (lastTwo >= 3 && lastTwo <= 10 && whole <= 10) wholeText = `${words} جنيهات مصرية`;
                    else if (lastTwo === 0 && whole >= 100) wholeText = `${words} جنيه مصري`;
                    else wholeText = `${words} جنيهاً مصرياً`;
                } else if (currencyCode === 'usd') {
                    if (whole === 1) wholeText = 'دولار أمريكي واحد';
                    else if (whole === 2) wholeText = 'دولاران أمريكيان';
                    else if (lastTwo >= 3 && lastTwo <= 10 && whole <= 10) wholeText = `${words} دولارات أمريكية`;
                    else if (lastTwo === 0 && whole >= 100) wholeText = `${words} دولار أمريكي`;
                    else wholeText = `${words} دولاراً أمريكياً`;
                } else {
                    wholeText = `${words} ${mainUnit}`;
                }
            }

            let fracText = '';
            if (fraction > 0) {
                const fracWords = numberToArabicWords(fraction);
                if (fraction === 1) fracText = `${subUnit} واحد`;
                else if (fraction === 2) fracText = `${subUnit}ان`;
                else if (fraction >= 3 && fraction <= 10) fracText = `${fracWords} ${subUnit === 'قرش' ? 'قروش' : 'سنتات'}`;
                else fracText = `${fracWords} ${subUnit}اً`;
            }

            let output = '';
            if (wholeText && fracText) {
                output = `${wholeText} و${fracText}`;
            } else if (wholeText) {
                output = wholeText;
            } else if (fracText) {
                output = fracText;
            }

            return `${isNegative ? 'سالب ' : ''}فقط ${output} لا غير`;
        };

        function updateTafqeet(amount) {
            const tafqeetEl = document.getElementById('tafqeet-display');
            if (!tafqeetEl) return;
            const curCode = document.getElementById('currency-select')?.value || 'egp';
            tafqeetEl.textContent = window.tafqeet(amount, curCode);
        }

        // ==========================================
        // ⚖️ محرك مطابقة العهدة ومبيعات النظام (Custody Reconciliation Engine)
        // ==========================================
        window.clearCustodyTarget = function () {
            const quickInp = document.getElementById('quick-system-target');
            const sysInp = document.getElementById('system-total-input');
            if (quickInp) quickInp.value = '';
            if (sysInp) sysInp.value = '';
            AppStorage.removeItem('systemTotal');
            calculateTotal();
            playSound('trash');
        };

        function updateCustodyReconciliation(actualGrandTotal) {
            const quickInp = document.getElementById('quick-system-target');
            const badge = document.getElementById('custody-badge');
            const targetValEl = document.getElementById('custody-target-val');
            const actualValEl = document.getElementById('custody-actual-val');
            const diffLabelEl = document.getElementById('custody-diff-label');
            const diffValEl = document.getElementById('custody-diff-val');

            if (!badge || !targetValEl || !actualValEl || !diffValEl) return;

            const curSymbol = document.getElementById('currency-label')?.textContent || 'ج.م';
            let target = parseFloat(quickInp?.value);
            if (isNaN(target)) {
                target = parseFloat(AppStorage.getItem('systemTotal'));
                if (!isNaN(target) && quickInp && !quickInp.value) {
                    quickInp.value = target;
                }
            }

            actualValEl.textContent = `${actualGrandTotal.toFixed(2)} ${curSymbol}`;

            if (isNaN(target) || target <= 0) {
                badge.className = 'custody-badge neutral';
                badge.textContent = 'أدخل مبيعات النظام';
                targetValEl.textContent = `0.00 ${curSymbol}`;
                diffLabelEl.textContent = 'الفارق:';
                diffValEl.textContent = `0.00 ${curSymbol}`;
                diffValEl.style.color = 'var(--text-color)';
                return;
            }

            targetValEl.textContent = `${target.toFixed(2)} ${curSymbol}`;
            const diff = actualGrandTotal - target;

            badge.classList.remove('neutral', 'match', 'surplus', 'deficit');

            if (Math.abs(diff) < 0.001) {
                badge.classList.add('match');
                badge.innerHTML = 'مطابقة تامة ✅';
                diffLabelEl.textContent = 'حالة المطابقة:';
                diffValEl.textContent = `0.00 ${curSymbol} (مطابق)`;
                diffValEl.style.color = '#10B981';
            } else if (diff > 0) {
                badge.classList.add('surplus');
                badge.innerHTML = `فائض بالدرج (+${diff.toFixed(2)}) 🟢`;
                diffLabelEl.textContent = 'زيادة (فائض):';
                diffValEl.textContent = `+${diff.toFixed(2)} ${curSymbol}`;
                diffValEl.style.color = '#0284C7';
            } else {
                badge.classList.add('deficit');
                badge.innerHTML = `عجز بالدرج (${diff.toFixed(2)}) 🔴`;
                diffLabelEl.textContent = 'عجز (نقص):';
                diffValEl.textContent = `${diff.toFixed(2)} ${curSymbol}`;
                diffValEl.style.color = '#EF4444';
            }
        }

        function calculateTotal() {
            let physicalTotal = 0;
            let totalPapers = 0;
            const inputs = document.querySelectorAll('.cash-input');
            
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const value = parseFloat(input.getAttribute('data-value'));
                const count = parseInt(input.value) || 0;
                const rowTotal = value * count;
                physicalTotal += rowTotal;
                totalPapers += count;
                const rowTotalElementId = `total-${value.toString().replace('.', '-')}`;
                const rowTotalElement = document.getElementById(rowTotalElementId);
                if (rowTotalElement) {
                    rowTotalElement.textContent = rowTotal.toFixed(2);
                }
            }

            // إضافة الخزينة الرقمية
            const vodafone = parseFloat(document.getElementById('vodafone-cash').value) || 0;
            const instapay = parseFloat(document.getElementById('instapay').value) || 0;
            const digitalTotal = vodafone + instapay;
            const grandTotal = physicalTotal + digitalTotal;

            totalAmountElement.textContent = grandTotal.toFixed(2);
            const totalPapersElement = document.getElementById('total-papers');
            if (totalPapersElement) {
                totalPapersElement.textContent = totalPapers;
            }

            // تحديث تفاصيل التقسيم (نقدي vs رقمي)
            const breakdownEl = document.getElementById('total-breakdown');
            if (digitalTotal > 0) {
                breakdownEl.style.display = 'inline-block';
                document.getElementById('cash-only-total').textContent = physicalTotal.toFixed(2);
                document.getElementById('digital-only-total').textContent = digitalTotal.toFixed(2);
            } else {
                breakdownEl.style.display = 'none';
            }

            // Calculate equivalent in EGP
            const currentCurrency = document.getElementById('currency-select').value;
            if (currentCurrency !== 'egp') {
                const rate = parseFloat(document.getElementById('exchange-rate').value) || 1;
                const equivalent = grandTotal * rate;
                document.getElementById('equivalent').textContent = ` (${equivalent.toFixed(2)} جنيه مصري)`;
            } else {
                document.getElementById('equivalent').textContent = '';
            }

            // تحديث التفقيط المالي بالعربية
            updateTafqeet(grandTotal);

            // تحديث مطابقة العهدة المباشرة
            updateCustodyReconciliation(grandTotal);

            // حفظ المدخلات تلقائيًا بتأخير ذكي لمنع ثقل الكتابة وتوفير المعالج
            debouncedSaveInputs(400);

            return grandTotal;
        }

        function getCalculationDetails() {
            let details = {};
            document.querySelectorAll('.cash-input').forEach(input => {
                const value = parseFloat(input.getAttribute('data-value'));
                const count = parseInt(input.value) || 0;
                if (count > 0) {
                    details[value.toString()] = count;
                }
            });
            return details;
        }

        function formatDetailsToText(details) {
            let text = '';
            for (const value in details) {
                const count = details[value];
                const noteValue = parseFloat(value);
                const rowTotal = (noteValue * count).toFixed(2);
                const displayValue = noteValue.toFixed(noteValue % 1 === 0 ? 0 : 2);
                text += `\n${count} × ${displayValue} = ${rowTotal}`;
            }
            return text.trim();
        }

        function showRecordDetails(details, total, totalPapers, title = '📄 تفاصيل عدد الأوراق') {
            if (Object.keys(details).length === 0 && total === 0) {
                Swal.fire({
                    title: 'لا توجد بيانات',
                    text: 'لا توجد عملات مسجلة لعرض تفاصيلها.',
                    icon: 'info',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    customClass: { popup: 'details-modal-white-popup' }
                });
                return;
            }

            let html = '<div style="text-align: right; direction: rtl;">';
            html += '<div class="details-table-wrapper">';
            html += '<table class="details-table">';
            html += '<thead><tr><th style="text-align: right; width: 40%;">الفئة</th><th style="text-align: center; width: 30%;">العدد</th><th style="text-align: left; width: 30%;">الإجمالي</th></tr></thead><tbody>';

            // ترتيب الفئات من الأكبر للأصغر
            const sortedKeys = Object.keys(details).sort((a, b) => parseFloat(b) - parseFloat(a));

            sortedKeys.forEach(value => {
                const count = details[value];
                const noteValue = parseFloat(value);
                const rowTotal = (noteValue * count).toFixed(2);
                const icon = icons[noteValue] || '💰';
                html += `<tr>
                    <td style="text-align: right; font-weight: 700;">${icon} ${noteValue} جنيه</td>
                    <td style="text-align: center; font-weight: bold; color: #4F46E5;">${count} ورقة</td>
                    <td style="text-align: left; font-weight: bold; color: #0F172A;">${rowTotal}</td>
                </tr>`;
            });

            html += `</tbody><tfoot><tr class="total-row">
                <td style="text-align: right; font-weight: 900;">الإجمالي الكلي</td>
                <td style="text-align: center; font-weight: 900; color: #6D28D9;">${totalPapers} ورقة</td>
                <td style="text-align: left; font-weight: 900; color: #6D28D9;">${total.toFixed(2)}</td>
            </tr></tfoot>`;

            html += '</table></div></div>';

            Swal.fire({
                title: title,
                html: html,
                confirmButtonText: 'إغلاق المعاينة',
                confirmButtonColor: '#8B5CF6',
                background: '#FFFFFF',
                color: '#0F172A',
                customClass: { popup: 'details-modal-white-popup' }
            });
        }

        function showPapersDetails() {
            const details = getCalculationDetails();
            const total = parseFloat(document.getElementById('total-amount').textContent);
            const totalPapers = Array.from(document.querySelectorAll('.cash-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
            showRecordDetails(details, total, totalPapers);
        }

        // دالة لعرض تفاصيل التعديل الحالية
        function showEditDetailsSummary() {
            const details = {};
            let total = 0;
            let totalPapers = 0;

            document.querySelectorAll('[id^="edit-input-"]').forEach(input => {
                const val = parseFloat(input.dataset.value);
                const count = parseInt(input.value) || 0;
                if (count > 0) {
                    details[val.toString()] = count;
                    total += val * count;
                    totalPapers += count;
                }
            });

            showRecordDetails(details, total, totalPapers, '📄 معاينة تفاصيل التعديل');
        }

        // --- ↩️ نظام التراجع الذكي عن التصفير لحماية بيانات الكاشير ↩️ ---
        let lastClearedSnapshot = null;
        let undoToastTimer = null;

        function saveSnapshotBeforeClear() {
            const inputs = {};
            document.querySelectorAll('.cash-input').forEach(input => {
                const val = input.value ? input.value.trim() : '';
                if (val && val !== '0') {
                    inputs[input.id] = val;
                }
            });
            const vf = document.getElementById('vodafone-cash')?.value ? document.getElementById('vodafone-cash').value.trim() : '';
            const ip = document.getElementById('instapay')?.value ? document.getElementById('instapay').value.trim() : '';

            if (Object.keys(inputs).length > 0 || (vf && vf !== '0') || (ip && ip !== '0')) {
                lastClearedSnapshot = { inputs, vf, ip };
                return true;
            }
            return false;
        }

        function showUndoToast() {
            const bar = document.getElementById('undo-toast-bar');
            if (!bar) return;
            bar.style.display = 'flex';
            setTimeout(() => bar.classList.add('show'), 15);

            if (undoToastTimer) clearTimeout(undoToastTimer);
            undoToastTimer = setTimeout(() => {
                hideUndoToast();
            }, 6000);
        }

        function hideUndoToast() {
            const bar = document.getElementById('undo-toast-bar');
            if (!bar) return;
            bar.classList.remove('show');
            setTimeout(() => {
                if (!bar.classList.contains('show')) {
                    bar.style.display = 'none';
                }
            }, 350);
            if (undoToastTimer) {
                clearTimeout(undoToastTimer);
                undoToastTimer = null;
            }
        }

        function restoreClearedSnapshot() {
            if (!lastClearedSnapshot) return;
            Object.keys(lastClearedSnapshot.inputs).forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = lastClearedSnapshot.inputs[id];
            });
            if (document.getElementById('vodafone-cash')) {
                document.getElementById('vodafone-cash').value = lastClearedSnapshot.vf;
            }
            if (document.getElementById('instapay')) {
                document.getElementById('instapay').value = lastClearedSnapshot.ip;
            }
            calculateTotal();
            playSound('success');
            hideUndoToast();
            lastClearedSnapshot = null;

            Swal.fire({
                icon: 'success',
                title: 'تم استعادة الأرقام السابقة بنجاح ↩️',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1800
            });
        }
        window.restoreClearedSnapshot = restoreClearedSnapshot;
        window.hideUndoToast = hideUndoToast;

        function resetInputs(resetFilters = true) {
            const hadData = saveSnapshotBeforeClear();

            document.querySelectorAll('.cash-input').forEach(input => { input.value = ''; });
            document.getElementById('vodafone-cash').value = '';
            document.getElementById('instapay').value = '';

            // فك قفل جميع الصفوف عند التصفير
            document.querySelectorAll('.note-row').forEach(row => {
                row.classList.remove('locked-row');
                const lockBtn = row.querySelector('.lock-btn');
                if (lockBtn) {
                    lockBtn.classList.remove('locked');
                    lockBtn.innerHTML = '<i class="fas fa-unlock"></i>';
                }
            });

            const now = new Date();
            const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            document.getElementById('entry-date').value = localDate;
            calculateTotal();

            document.getElementById('search-input').value = '';

            let allHistory = [];
            try { allHistory = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]'); } catch (e) {}
            const hasToday = allHistory.some(item => item.simpleDate === localDate);

            if (hasToday) {
                document.getElementById('date-filter-input').value = localDate;
                loadHistory(localDate);
            } else if (allHistory.length > 0) {
                document.getElementById('date-filter-input').value = '';
                loadHistory('ALL');
            } else {
                document.getElementById('date-filter-input').value = localDate;
                loadHistory(localDate);
            }

            if (hadData) {
                showUndoToast();
            }
        }

        // تم استعادة وظائف السجل بالكامل مع إضافة البحث وعرض آخر عملية
        // دالة جلب تاريخ اليوم المحلي بتنسيق YYYY-MM-DD متوافق مع المناطق الزمنية
        function getTodayLocalDate() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // نظام العرض التدريجي بالدفعات (Pagination / Chunking) لمنع تجمد الشاشة مع السجلات الضخمة
        const HISTORY_PAGE_SIZE = 25;
        let activeHistoryList = [];
        let renderedHistoryCount = 0;

        function renderNextHistoryChunk() {
            const existingBtn = document.getElementById('load-more-history-li');
            if (existingBtn) existingBtn.remove();

            const start = renderedHistoryCount;
            const end = Math.min(start + HISTORY_PAGE_SIZE, activeHistoryList.length);
            const fragment = document.createDocumentFragment();

            for (let i = start; i < end; i++) {
                const item = activeHistoryList[i];
                fragment.appendChild(renderHistoryItem(item, false));
            }

            historyList.appendChild(fragment);
            renderedHistoryCount = end;

            // إضافة زر عرض المزيد الأنيق في حال وجود متبقي
            if (renderedHistoryCount < activeHistoryList.length) {
                const remaining = activeHistoryList.length - renderedHistoryCount;
                const loadMoreLi = document.createElement('li');
                loadMoreLi.id = 'load-more-history-li';
                loadMoreLi.style.cssText = 'text-align: center; padding: 14px 10px; background: transparent; box-shadow: none; border: none; list-style: none;';
                loadMoreLi.innerHTML = `
                    <button id="load-more-history-btn" class="btn" style="width: auto; min-width: 180px; padding: 10px 22px; margin: 0 auto; font-size: 0.9em; font-weight: 800; background: var(--card-background); border: 1.5px solid var(--border-color); color: var(--primary-color); border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.06); transition: all 0.2s ease;">
                        <i class="fas fa-chevron-down" style="margin-left: 6px;"></i> عرض المزيد (${remaining} متبقي)
                    </button>
                `;
                historyList.appendChild(loadMoreLi);
            }
        }

        // دالة تحميل وسجل البيانات اليومية المتكاملة
        function loadHistory(filterDate = null, searchTerm = '') {
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history:", e);
            }
            historyList.innerHTML = '';

            const todayDate = getTodayLocalDate();
            const dateFilterElem = document.getElementById('date-filter-input');

            // 1. تعبئة التاريخ تلقائياً بتاريخ اليوم الحالي عند فتح الصفحة إذا لم يحدد المستخدم تاريخاً
            if (filterDate === 'TODAY' || (filterDate === null && !dateFilterElem)) {
                filterDate = todayDate;
            }
            
            if (dateFilterElem) {
                if (filterDate === 'ALL') {
                    dateFilterElem.value = '';
                } else if (filterDate) {
                    dateFilterElem.value = filterDate;
                }
            }

            let historyToDisplay = [];

            // 2. التصفية حسب التاريخ المختار
            if (filterDate && filterDate !== 'ALL') {
                const normFilter = filterDate.replace(/-0/g, '-');
                historyToDisplay = history.filter(item => {
                    if (!item.simpleDate) return false;
                    const normItem = item.simpleDate.replace(/-0/g, '-');
                    return item.simpleDate === filterDate || normItem === normFilter;
                });
            } else {
                historyToDisplay = history; // عرض الكل
            }

            // 3. التصفية حسب البحث
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                historyToDisplay = historyToDisplay.filter(item => {
                    return item.timestamp.toLowerCase().includes(searchLower) ||
                        item.total.toString().includes(searchTerm) ||
                        (item.note && item.note.toLowerCase().includes(searchLower)) ||
                        Object.keys(item.details).some(key => {
                            const count = item.details[key];
                            const value = parseFloat(key);
                            const rowTotal = (value * count).toFixed(2);
                            return count.toString().includes(searchTerm) ||
                                value.toString().includes(searchTerm) ||
                                rowTotal.includes(searchTerm);
                        });
                });
            }

            const totalSum = historyToDisplay.reduce((sum, item) => sum + item.total, 0);
            const summaryDiv = document.getElementById('history-summary');
            const summarySpan = document.getElementById('history-total-sum');

            // 4. إذا لم توجد سجلات في التاريخ المحدد، عرض بطاقة أنيقة واحترافية بدلاً من النص الجاف
            if (historyToDisplay.length === 0) {
                activeHistoryList = [];
                renderedHistoryCount = 0;
                const li = document.createElement('li');
                li.style.cssText = 'background: transparent; box-shadow: none; border: none; list-style: none; padding: 0;';
                
                let titleMsg = 'سجل العمليات فارغ حالياً';
                let subMsg = 'أدخل المبالغ في الحاسبة واضغط على "حفظ يومية" لتسجيل أول عملية';
                let actionBtnHtml = '';

                if (searchTerm) {
                    titleMsg = 'لا توجد نتائج تطابق كلمة البحث';
                    subMsg = 'تأكد من كتابة التاريخ أو المبلغ أو الملاحظة بشكل صحيح';
                } else if (filterDate && filterDate !== 'ALL') {
                    titleMsg = `لا توجد عمليات مسجلة بتاريخ ${filterDate}`;
                    subMsg = 'يمكنك اختيار تاريخ آخر من التقويم، أو الضغط أدناه لعرض العمليات السابقة';
                    actionBtnHtml = `
                        <button type="button" onclick="document.getElementById('show-all-btn').click()" class="btn" style="width: auto; min-width: 160px; margin: 10px auto 0; padding: 8px 18px; font-size: 0.85em; font-weight: 800; border-radius: 20px; background: transparent; border: 1.5px solid var(--primary-color); color: var(--primary-color); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-history"></i> عرض كافة السجلات
                        </button>
                    `;
                }

                li.innerHTML = `
                    <div class="empty-history-state" style="text-align: center; padding: 25px 15px; background: var(--input-bg); border-radius: 16px; border: 1.5px dashed var(--border-color); margin: 8px 0;">
                        <div style="font-size: 2em; margin-bottom: 6px; opacity: 0.85;">📋</div>
                        <div style="font-weight: 800; color: var(--text-color); font-size: 0.95em; margin-bottom: 4px;">${titleMsg}</div>
                        <div style="font-size: 0.82em; color: var(--text-muted); line-height: 1.5;">${subMsg}</div>
                        ${actionBtnHtml}
                    </div>
                `;
                historyList.appendChild(li);
                if (summaryDiv) summaryDiv.style.display = 'none';
            } else {
                if (summaryDiv) summaryDiv.style.display = 'grid';
                if (summarySpan) summarySpan.textContent = totalSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م';
                const countSpan = document.getElementById('history-count-stat');
                const maxSpan = document.getElementById('history-max-stat');
                if (countSpan) countSpan.textContent = historyToDisplay.length + ' عملية';
                if (maxSpan) {
                    const maxVal = Math.max(...historyToDisplay.map(item => item.total));
                    maxSpan.textContent = maxVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م';
                }

                // العرض السلس بالدفعات (Chunking) لتفادي تجميد المتصفح
                activeHistoryList = historyToDisplay;
                renderedHistoryCount = 0;
                renderNextHistoryChunk();
            }

            attachHistoryEventListeners();
        }

        function renderHistoryItem(item, isSpecialLastOp) {
            const listItem = document.createElement('li');
            listItem.dataset.id = item.id;

            let badgeHtml = '';
            if (isSpecialLastOp) {
                listItem.style.border = '2px dashed var(--accent-color)';
                listItem.style.position = 'relative';
                badgeHtml = '<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--accent-color); color: var(--text-color); padding: 2px 8px; border-radius: 10px; font-size: 0.75em; font-weight: bold;">آخر عملية مسجلة</div>';
            }

            let digitalBadges = '';
            if (item.vodafone > 0) digitalBadges += '<span class="badge vodafone">فودافون</span>';
            if (item.instapay > 0) digitalBadges += '<span class="badge instapay">إنستا</span>';

            listItem.innerHTML = `
                ${badgeHtml}
                <div class="history-info">
                    <span class="history-date">${item.timestamp}</span>
                    <span class="history-amount">${item.total.toFixed(2)}</span>
                    <span class="history-papers" style="font-size: 0.85em; color: var(--gold-light); font-weight: bold; margin-right: 10px;">📄 ${item.totalPapers || 0}</span>
                    ${item.note ? `<span class="history-note" style="font-size: 0.8em; color: #6c757d; display: block;">${item.note.length > 30 ? item.note.substring(0, 30) + '...' : item.note}</span>` : ''}
                </div>
                <div class="history-center-status">
                    ${digitalBadges}
                </div>
                <div class="history-actions">
                    <button class="receipt-btn-history" title="إيصال كاشير حراري" style="color: #FFD700;"><i class="fas fa-receipt"></i></button>
                    <button class="view-btn" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                    <button class="share-btn-history" title="مشاركة عبر واتساب"><i class="fab fa-whatsapp"></i></button>
                    <button class="edit-btn" title="تعديل السجل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="حذف السجل"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            return listItem;
        }

        // تفويض الأحداث الموحد (Event Delegation) على قائمة السجل لمنع تسريب الذاكرة وإلغاء آلاف الـ Listeners
        let isHistoryEventsDelegated = false;
        function attachHistoryEventListeners() {
            if (isHistoryEventsDelegated) return;
            isHistoryEventsDelegated = true;

            historyList.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                if (btn.id === 'load-more-history-btn') {
                    renderNextHistoryChunk();
                    return;
                }

                const li = btn.closest('li');
                if (!li || !li.dataset.id) return;
                const id = parseInt(li.dataset.id);

                if (btn.classList.contains('receipt-btn-history')) {
                    let history = [];
                    try { history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]'); } catch (err) {}
                    const record = history.find(r => r.id === id);
                    if (record) {
                        showThermalReceiptModal(record);
                    }
                } else if (btn.classList.contains('view-btn')) {
                    handleViewDetails(id);
                } else if (btn.classList.contains('share-btn-history')) {
                    handleShareRecord(id);
                } else if (btn.classList.contains('edit-btn')) {
                    handleEditRecord(id);
                } else if (btn.classList.contains('delete-btn')) {
                    handleDeleteRecord(id);
                }
            });
        }

        // تم استعادة وظائف SweetAlert2 (مطلوب وجود مكتبة SweetAlert2 في <head>)
        function handleViewDetails(event) {
            const id = typeof event === 'number' ? event : parseInt(event?.currentTarget?.closest('li')?.dataset?.id || event?.currentTarget?.dataset?.id || event);
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for view:", e);
            }
            const record = history.find(item => item.id === id);

            if (!record) return;

            const recCurrency = record.currency || currencySymbol;
            showRecordDetails(record.details, record.total, record.totalPapers || 0, `<i class="fas fa-eye"></i> تفاصيل سجل ${record.timestamp}`);
        }

        // ====== تم تعديل هذه الدالة لإضافة حقل "الزيادة/النقصان" ======
        async function handleEditRecord(event) {
            const id = typeof event === 'number' ? event : parseInt(event?.currentTarget?.closest('li')?.dataset?.id || event?.currentTarget?.dataset?.id || event);
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for edit:", e);
            }
            const recordIndex = history.findIndex(item => item.id === id);
            const record = history[recordIndex];

            if (!record) return;

            const recCurrency = record.currency || currencySymbol;
            const recCurrencyCode = record.currencyCode || (recCurrency === 'دولار' ? 'usd' : (recCurrency === 'يورو' ? 'eur' : 'egp'));

            // تحديد الفئات النقدية بناءً على عملة السجل وليس عملة التطبيق الحالية
            let recordDenominations = [200, 100, 50, 20, 10, 5, 1, 0.50, 0.25];
            if (recCurrencyCode === 'usd') recordDenominations = [100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05];
            else if (recCurrencyCode === 'eur') recordDenominations = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];

            // بناء واجهة التعديل بتصميم متجاوب 100% مع شاشات الهواتف والأندرويد
            let editHTML = '<div class="edit-record-modal-body">';

            // قسم الخزينة الرقمية
            editHTML += `
                <div class="edit-section-card">
                    <div class="edit-section-header"><i class="fas fa-wallet"></i> الخزينة الرقمية</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 0.8em; color: #FF4D4D; display: block; margin-bottom: 4px; font-weight: 800;">فودافون كاش</label>
                            <input type="number" id="edit-vodafone" class="edit-val-input" value="${record.vodafone || 0}" oninput="updateEditTotal()">
                        </div>
                        <div>
                            <label style="font-size: 0.8em; color: #A855F7; display: block; margin-bottom: 4px; font-weight: 800;">إنستا باي</label>
                            <input type="number" id="edit-instapay" class="edit-val-input" value="${record.instapay || 0}" oninput="updateEditTotal()">
                        </div>
                    </div>
                </div>
            `;

            // قسم الفئات النقدية (صفوف متناسقة 100% داخل الإطار وبدون أي بروز)
            editHTML += '<div class="edit-section-card" style="margin-bottom: 10px;">';
            editHTML += '<div class="edit-section-header"><i class="fas fa-money-bill-wave"></i> فئات النقدية</div>';
            editHTML += '<div id="edit-denominations-list" style="display: flex; flex-direction: column; gap: 6px;">';
            recordDenominations.forEach(value => {
                const count = record.details[value.toString()] || 0;
                const rowTotal = (value * count).toFixed(2);

                editHTML += `
                    <div class="edit-denomination-row">
                        <div class="edit-denom-badge">
                            <span class="denom-icon">${icons[value] || '💰'}</span>
                            <span class="denom-val">${value}</span>
                        </div>
                        
                        <div class="edit-controls-box">
                            <button type="button" class="edit-btn-step plus" onclick="adjustEditValue('${value}', 1)">+</button>
                            <input type="number" class="edit-count-field" id="edit-input-${value}" data-value="${value}" value="${count}" oninput="updateEditTotal()" inputmode="numeric">
                            <button type="button" class="edit-btn-step minus" onclick="adjustEditValue('${value}', -1)">−</button>
                        </div>
                        
                        <div class="edit-denom-total">
                            <span id="edit-row-total-${value}">${rowTotal}</span>
                        </div>
                    </div>
                `;
            });
            editHTML += '</div></div>';

            // بطاقة عرض الإجمالي وعدد الأوراق
            editHTML += `
                <div class="edit-summary-card">
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <span style="font-size: 0.95em; font-weight: 800; color: var(--text-color);">الإجمالي الجديد:</span>
                        <span id="current-edit-total" style="color: var(--primary-color); font-size: 1.35em; font-weight: 950;">${record.total.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 0.85em; color: var(--text-muted); font-weight: 700; margin-top: 4px;">
                        <span>📄 عدد الأوراق: <b id="current-edit-papers" style="color: var(--text-color);">${record.totalPapers || 0}</b></span>
                        <button type="button" id="reset-edit-btn" onclick="resetEditValues();" class="edit-reset-action" title="استعادة القيم الأصلية"><i class="fas fa-undo"></i> تراجع للأصل</button>
                    </div>
                </div>
            `;

            // حقل الملاحظة
            editHTML += `
                <div style="margin-top: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 800; font-size: 0.85em; color: var(--text-color);">ملاحظة على السجل:</label>
                    <textarea id="edit-note" class="edit-note-textarea" rows="2" placeholder="أضف ملاحظة (اختياري)...">${record.note || ''}</textarea>
                </div>
            </div>`;

            // دوال مساعدة للنافذة المنبثقة
            window.adjustEditValue = function (value, change) {
                const input = document.getElementById(`edit-input-${value}`);
                let newVal = parseInt(input.value || 0) + change;
                if (newVal < 0) newVal = 0;
                input.value = newVal;
                updateEditTotal();
            };

            window.updateEditTotal = function () {
                let total = 0;
                let totalPapers = 0;

                const vodafone = parseFloat(document.getElementById('edit-vodafone').value) || 0;
                const instapay = parseFloat(document.getElementById('edit-instapay').value) || 0;
                total += vodafone + instapay;

                document.querySelectorAll('[id^="edit-input-"]').forEach(input => {
                    const val = parseFloat(input.dataset.value);
                    const count = parseInt(input.value) || 0;
                    const rowTotal = val * count;
                    total += rowTotal;
                    totalPapers += count;

                    document.getElementById(`edit-row-total-${val}`).textContent = rowTotal.toFixed(2);
                });

                document.getElementById('current-edit-total').textContent = total.toFixed(2);
                const editPapersElement = document.getElementById('current-edit-papers');
                if (editPapersElement) {
                    editPapersElement.textContent = totalPapers;
                }
                return { total, totalPapers };
            };

            // دالة استرجاع القيم الأصلية
            window.resetEditValues = function () {
                // استعادة القيم الرقمية
                document.getElementById('edit-vodafone').value = record.vodafone || 0;
                document.getElementById('edit-instapay').value = record.instapay || 0;

                // استعادة الفئات النقدية
                document.querySelectorAll('[id^="edit-input-"]').forEach(input => {
                    const val = input.dataset.value;
                    input.value = record.details[val] || 0;
                });

                // استعادة الملاحظة
                document.getElementById('edit-note').value = record.note || '';

                updateEditTotal();

                // تأثير بصري للزر عند الضغط
                const btn = document.getElementById('reset-edit-btn');
                btn.style.transform = 'rotate(-360deg)';
                setTimeout(() => btn.style.transform = 'none', 500);
            };

            const { value: formValues } = await Swal.fire({
                title: `<i class="fas fa-edit"></i> تعديل سجل ${record.timestamp}`,
                html: editHTML,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'حفظ التعديلات ✅',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: 'var(--primary-color)',
                cancelButtonColor: '#6c757d',
                background: 'var(--card-background)',
                color: 'var(--text-color)',
                width: '95%',
                maxWidth: '480px',
                customClass: { popup: 'edit-modal-custom-popup' },
                preConfirm: () => {
                    const newDetails = {};
                    let newTotal = 0;
                    let newTotalPapers = 0;

                    // الحصول على القيم الرقمية الجديدة
                    const newVodafone = parseFloat(document.getElementById('edit-vodafone').value) || 0;
                    const newInstapay = parseFloat(document.getElementById('edit-instapay').value) || 0;

                    if (newVodafone < 0 || newInstapay < 0) {
                        Swal.showValidationMessage('قيم المحفظة الرقمية لا يمكن أن تكون سالبة.');
                        return false;
                    }
                    newTotal += newVodafone + newInstapay;

                    document.querySelectorAll('[id^="edit-input-"]').forEach(input => {
                        const val = parseFloat(input.dataset.value);
                        const count = parseInt(input.value) || 0;
                        if (count > 0) newDetails[val.toString()] = count;
                        newTotal += val * count;
                        newTotalPapers += count;
                    });

                    if (newTotal < 0) {
                        Swal.showValidationMessage('الإجمالي لا يمكن أن يكون سالباً.');
                        return false;
                    }
                    if (newTotal === 0 && (Object.keys(newDetails).length > 0 || newVodafone > 0 || newInstapay > 0)) {
                        Swal.showValidationMessage('الإجمالي صفراً، الرجاء إدخال بيانات أو الحذف.');
                        return false;
                    }

                    const newNote = document.getElementById('edit-note').value.trim();
                    if (newNote.length > 200) {
                        Swal.showValidationMessage('الملاحظة يجب أن تكون أقل من 200 حرف');
                        return false;
                    }

                    return { newDetails, newTotal, newNote, newVodafone, newInstapay, newTotalPapers };
                }
            });

            if (formValues) {
                if (formValues.newTotal === 0 && Object.keys(formValues.newDetails).length === 0 && formValues.newVodafone === 0 && formValues.newInstapay === 0) {
                    // إذا كان الإجمالي صفراً والتفاصيل فارغة، نحذف السجل
                    Swal.fire({
                        title: 'حذف السجل؟',
                        text: "نتيجة التعديل هي صفر. هل تريد حذف السجل بدلاً من حفظه كصفر؟",
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'نعم، احذفه',
                        cancelButtonText: 'إلغاء'
                    }).then((deleteResult) => {
                        if (deleteResult.isConfirmed) {
                            handleDeleteRecord({ currentTarget: { closest: () => ({ dataset: { id: id } }) } });
                        } else {
                            // إذا اختار عدم الحذف، يمكن أن نطلب منه إعادة التعديل
                            Swal.fire('تم إلغاء الحذف', 'الرجاء إعادة التعديل أو الحفظ بقيمة غير صفرية.', 'info');
                            handleEditRecord(event); // إعادة فتح نافذة التعديل
                        }
                    });
                    return;
                }

                const newRecord = {
                    ...record,
                    total: formValues.newTotal,
                    totalPapers: formValues.newTotalPapers,
                    details: formValues.newDetails,
                    note: formValues.newNote,
                    vodafone: formValues.newVodafone,
                    instapay: formValues.newInstapay,
                    currency: recCurrency,
                    currencyCode: recCurrencyCode,
                    timestamp: new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) + ' (مُعدَّل)'
                };

                history[recordIndex] = newRecord;
                AppStorage.setItem('cashCalculatorHistory', JSON.stringify(history));
                const searchTerm = searchInput.value.trim();
                loadHistory(dateFilterInput.value || null, searchTerm);

                playSound('success');
                Swal.fire('تم التعديل!', `تم تحديث السجل بالإجمالي الجديد: ${formValues.newTotal.toFixed(2)}`, 'success');
            }
        }
        // =========================================================

        function handleShareRecord(event) {
            const id = typeof event === 'number' ? event : parseInt(event?.currentTarget?.closest('li')?.dataset?.id || event?.currentTarget?.dataset?.id || event);
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for share:", e);
            }
            const record = history.find(item => item.id === id);

            if (!record) return;

            const recCurrency = record.currency || currencySymbol;
            const detailsText = formatDetailsToText(record.details);
            let message = `*📊 سجل النقدية (${record.timestamp})*\n\n*الإجمالي:* ${record.total.toFixed(2)} ${recCurrency}\n*📄 عدد الأوراق:* ${record.totalPapers || 0}\n\n*التفاصيل:*\n${detailsText}${record.note ? `\n\n*ملاحظة:* ${record.note}` : ''}`;

            if (record.vodafone > 0) message += `\n\n📱 *فودافون كاش:* ${record.vodafone}`;
            if (record.instapay > 0) message += `\n📱 *إنستا باي:* ${record.instapay}`;

            const userName = AppStorage.getItem('userName');
            const userPhone = AppStorage.getItem('userPhone');
            if (userName) message += `\n\n👤 *المستخدم:* ${userName}`;
            if (userPhone) message += `\n📞 *الهاتف:* ${userPhone}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        function handleDeleteRecord(event) {
            const id = typeof event === 'number' ? event : parseInt(event?.currentTarget?.closest('li')?.dataset?.id || event?.currentTarget?.dataset?.id || event);
            Swal.fire({
                title: 'هل أنت متأكد؟',
                text: "لن تتمكن من استعادة هذا السجل!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'نعم، احذفه!',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    let history = [];
                    try {
                        history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
                    } catch (e) {
                        console.error("Error loading history for delete:", e);
                    }
                    history = history.filter(item => item.id !== id);
                    AppStorage.setItem('cashCalculatorHistory', JSON.stringify(history));
                    const searchTerm = searchInput.value.trim();
                    loadHistory(dateFilterInput.value || null, searchTerm);
                    playSound('error');
                    Swal.fire('تم الحذف!', 'تم حذف السجل بنجاح.', 'success');
                }
            });
        }

        document.getElementById('save-btn').addEventListener('click', async () => {
            playSound('save');
            const grandTotal = calculateTotal();
            if (grandTotal <= 0) {
                Swal.fire({ icon: 'warning', title: 'لا يمكن حفظ سجل فارغ' });
                return;
            }

            // --- نظام المطابقة (العجز والزيادة) ---
            const systemTotal = parseFloat(AppStorage.getItem('systemTotal') || 0);
            if (systemTotal > 0) {
                const diff = grandTotal - systemTotal;
                let title = 'مطابقة العهدة';
                let html
                let icon = 'info';

                if (diff > 0) {
                    html = `<div style="font-size: 1.2em;">يوجد <span style="color: #28a745; font-weight: bold;">زيادة</span> بقيمة <strong>${diff.toFixed(2)}</strong></div>`;
                    icon = 'success';
                } else if (diff < 0) {
                    html = `<div style="font-size: 1.2em;">يوجد <span style="color: #dc3545; font-weight: bold;">عجز</span> بقيمة <strong>${Math.abs(diff).toFixed(2)}</strong></div>`;
                    icon = 'error';
                } else {
                    html = `<div style="font-size: 1.2em; color: #28a745;"><strong>مطابق تماماً!</strong> ✅</div>`;
                    icon = 'success';
                }

                html += `<br><small>الفعلي: ${grandTotal.toFixed(2)} | النظام: ${systemTotal.toFixed(2)}</small>`;

                const confirmResult = await Swal.fire({ title, html, icon, showCancelButton: true, confirmButtonText: 'متابعة للحفظ', cancelButtonText: 'إلغاء' });
                if (!confirmResult.isConfirmed) return;
            }
            // -------------------------------------

            const selectedDate = document.getElementById('entry-date').value || new Date().toISOString().slice(0, 10);
            AppStorage.setItem('entryDate', selectedDate);

            // Prompt for note
            const { value: note } = await Swal.fire({
                title: 'إضافة ملاحظة (اختياري)',
                input: 'textarea',
                inputPlaceholder: 'أدخل ملاحظة لهذا السجل...',
                inputAttributes: {
                    'aria-label': 'أدخل ملاحظة'
                },
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'تخطي',
                inputValidator: (value) => {
                    if (value && value.length > 200) {
                        return 'الملاحظة يجب أن تكون أقل من 200 حرف';
                    }
                }
            });

            const selectedDateObj = new Date(selectedDate);
            const day = selectedDateObj.getDate().toString().padStart(2, '0');
            const month = (selectedDateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDateObj.getFullYear();
            const timestamp = `${day}/${month}/${year}`;
            const simpleDate = selectedDate;

            const vodafoneVal = parseFloat(document.getElementById('vodafone-cash').value) || 0;
            const instapayVal = parseFloat(document.getElementById('instapay').value) || 0;

            const totalPapersInSave = Array.from(document.querySelectorAll('.cash-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);

            let currentReceiptCount = parseInt(AppStorage.getItem('lastReceiptCounter') || '0') + 1;
            AppStorage.setItem('lastReceiptCounter', currentReceiptCount.toString());

            const dayData = {
                id: Date.now(),
                receiptNumber: `REC-${currentReceiptCount}`,
                timestamp: timestamp,
                simpleDate: simpleDate,
                total: grandTotal,
                totalPapers: totalPapersInSave,
                currency: document.getElementById('currency-label').textContent,
                currencyCode: document.getElementById('currency-select').value,
                details: getCalculationDetails(),
                vodafone: vodafoneVal,
                instapay: instapayVal,
                note: note || ''
            };
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for save:", e);
            }
            history.unshift(dayData);
            // حفظ كافة السجلات التاريخية بأمان في IndexedDB دون تقييد بـ 100 عملية
            AppStorage.setItem('cashCalculatorHistory', JSON.stringify(history));

            // إظهار جميع السجلات والعملية الجديدة فوراً في بداية القائمة
            dateFilterInput.value = '';

            playSound('success');
            Swal.fire({ icon: 'success', title: 'تم الحفظ بنجاح!', text: `إجمالي: ${grandTotal.toFixed(2)}` });
            resetInputs();
            document.getElementById('history-card').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('share-btn').addEventListener('click', () => {
            const grandTotal = calculateTotal();
            if (grandTotal <= 0) {
                Swal.fire('خطأ', 'لا يمكن مشاركة تقرير فارغ.', 'error');
                return;
            }
            const date = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const totalPapersInMainShare = Array.from(document.querySelectorAll('.cash-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);

            const userName = AppStorage.getItem('userName') || 'مسؤول الخزينة';
            const userRole = AppStorage.getItem('userRole') || '';
            const roleText = userRole ? ` (${userRole})` : '';
            const userPhone = AppStorage.getItem('userPhone');
            const tafqeetText = document.getElementById('tafqeet-display')?.innerText || '';

            let message = `📊 *تقرير تقفيل الخزينة والجرد*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `👤 *المسؤول:* ${userName}${roleText}\n`;
            message += `📅 *التاريخ:* ${date}\n`;
            message += `⏰ *الوقت:* ${time}\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `💵 *إجمالي النقدية:* ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م\n`;
            if (tafqeetText && !tafqeetText.includes('صفر')) {
                message += `📝 *التفقيط:* ${tafqeetText}\n`;
            }
            message += `📄 *عدد الأوراق:* ${totalPapersInMainShare} ورقة\n\n`;

            const detailsText = formatDetailsToText(getCalculationDetails());
            if (detailsText) {
                message += `📋 *تفاصيل الفئات النقدية:*\n${detailsText}\n\n`;
            }

            const vodafone = parseFloat(document.getElementById('vodafone-cash')?.value || '0');
            const instapay = parseFloat(document.getElementById('instapay')?.value || '0');
            if (vodafone > 0 || instapay > 0) {
                message += `📱 *الخزينة الرقمية:*\n`;
                if (vodafone > 0) message += `• فودافون كاش: ${vodafone.toLocaleString()} ج.م\n`;
                if (instapay > 0) message += `• إنستا باي: ${instapay.toLocaleString()} ج.م\n`;
                message += `\n`;
            }

            const custodyTarget = parseFloat(document.getElementById('quick-system-target')?.value || '0');
            if (custodyTarget > 0) {
                const diff = grandTotal - custodyTarget;
                message += `🎯 *مطابقة العهدة (مبيعات السيستم):*\n`;
                message += `• المطلوب: ${custodyTarget.toLocaleString()} ج.م\n`;
                if (Math.abs(diff) < 0.01) {
                    message += `• الحالة: متطابق 100% بدون عجز أو زيادة ✅\n`;
                } else if (diff > 0) {
                    message += `• الحالة: زيادة نقدية بالدرج (+${diff.toLocaleString()} ج.م) 🟢\n`;
                } else {
                    message += `• الحالة: عجز بالدرج (${diff.toLocaleString()} ج.م) ⚠️\n`;
                }
                message += `\n`;
            }

            if (userPhone) message += `📞 *رقم التواصل:* ${userPhone}\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `⚡ تم الجرد والتقفيل عبر تطبيق حاسبة النقود الذكية`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            playSound('success');
        });

        // زر النسخ
        document.getElementById('copy-btn').addEventListener('click', () => {
            const grandTotal = calculateTotal();
            if (grandTotal <= 0) {
                Swal.fire('تنبيه', 'لا يوجد مبلغ لنسخه.', 'warning');
                return;
            }
            const details = formatDetailsToText(getCalculationDetails());
            const textToCopy = `*الإجمالي:* ${grandTotal.toFixed(2)}\n\n*التفاصيل:*\n${details}`;
            // يمكن إضافة الرقمي هنا أيضاً إذا رغبت

            navigator.clipboard.writeText(textToCopy).then(() => {
                Swal.fire({ icon: 'success', title: 'تم النسخ!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                playSound('success');
            }).catch(err => {
                Swal.fire('خطأ', 'فشل النسخ', 'error');
            });
        });

        // زر التصفير
        document.getElementById('clear-btn').addEventListener('click', () => {
            Swal.fire({
                title: 'تصفير العداد؟',
                text: "سيتم مسح جميع الأرقام الحالية. هل أنت متأكد؟",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'نعم، تصفير',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#dc3545'
            }).then((result) => {
                if (result.isConfirmed) {
                    resetInputs();
                    playSound('success');
                }
            });
        });

        const settingsModal = document.getElementById('settings-modal');
        function closeSettingsModal() {
            if (settingsModal) settingsModal.style.display = 'none';
            const homeNavBtn = document.querySelector(".nav-item[onclick*=\"'home'\"]");
            if (homeNavBtn) {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                homeNavBtn.classList.add('active');
            }
        }
        window.closeSettingsModal = closeSettingsModal;

        document.getElementById('settings-btn').addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });

        // جعل شارة العملة قابلة للضغط لفتح الإعدادات مباشرة والتركيز على العملة
        document.getElementById('currency-status-badge').addEventListener('click', () => {
            settingsModal.style.display = 'flex';

            // الانتقال لتبويب البيانات وتفعيل الزر الخاص به
            switchTab('data');
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const dataTabBtn = document.querySelector("button[onclick=\"switchTab('data')\"]");
            if (dataTabBtn) dataTabBtn.classList.add('active');

            const currencySelect = document.getElementById('currency-select');
            // التمرير إلى خيار العملة وتمييزه
            currencySelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
            currencySelect.focus();

            // وميض للفت الانتباه
            const originalShadow = currencySelect.style.boxShadow;
            currencySelect.style.transition = 'box-shadow 0.5s';
            currencySelect.style.boxShadow = '0 0 15px var(--accent-color)';
            setTimeout(() => { currencySelect.style.boxShadow = originalShadow; }, 1500);
        });

        document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });

        // إدارة التنقل داخل النافذة المنبثقة
        const backBtnSettings = document.getElementById('back-btn-settings');

        function showSection(sectionId, title) {
            const el = document.getElementById(sectionId);
            if (el) {
                document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                if (title && document.getElementById('modal-title')) {
                    document.getElementById('modal-title').innerHTML = title;
                }
            }
        }

        function resetSettingsView() {
            switchTab('general');
            const lang = document.documentElement.lang || 'ar';
            if (document.getElementById('modal-title')) {
                document.getElementById('modal-title').innerHTML = '<i class="fas fa-cog"></i> ' + (translations[lang]?.settingsTitle || 'الإعدادات');
            }
            if (backBtnSettings) backBtnSettings.style.display = 'none';
        }

        if (backBtnSettings) backBtnSettings.addEventListener('click', resetSettingsView);

        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                switchTab('stats');
                updateStats('today');
                renderChart('today');
            });
        }

        // زر "حول البرنامج"
        document.getElementById('about-app-btn')?.addEventListener('click', () => {
            switchTab('about');
        });

        // دالة موحدة لتبديل الوضع وتحديث الأيقونات في المكانين
        function toggleAppTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            AppStorage.setItem('theme', newTheme);

            // تحديث أيقونة الزر في الإعدادات والزر في الشاشة الرئيسية
            const iconClass = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if (document.querySelector('#mode-toggle-btn i')) document.querySelector('#mode-toggle-btn i').className = iconClass;
            if (document.querySelector('#header-mode-toggle i')) document.querySelector('#header-mode-toggle i').className = iconClass;

            // تحديث درجات السمة البصرية فوراً بناءً على الوضع الجديد
            const savedColorTheme = AppStorage.getItem('colorTheme') || 'purple';
            changeThemeColor(savedColorTheme);
        }

        document.getElementById('mode-toggle-btn').addEventListener('click', toggleAppTheme);
        document.getElementById('header-mode-toggle').addEventListener('click', toggleAppTheme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                changeThemeColor(theme);
                AppStorage.setItem('colorTheme', theme);
            });
        });

        document.getElementById('currency-select').addEventListener('change', (e) => {
            const currency = e.target.value;
            updateCurrency(currency);
            AppStorage.setItem('selectedCurrency', currency);
        });

        document.getElementById('exchange-rate').addEventListener('input', (e) => {
            AppStorage.setItem('exchangeRate', e.target.value);
            calculateTotal(); // Recalculate to update equivalent
        });

        // وظيفة جلب سعر الصرف تلقائياً من API
        document.getElementById('fetch-rate-btn').addEventListener('click', async () => {
            const currency = document.getElementById('currency-select').value.toUpperCase();
            if (currency === 'EGP') {
                Swal.fire('تنبيه', 'العملة الحالية هي الجنيه المصري. اختر دولار أو يورو لجلب السعر.', 'warning');
                return;
            }

            const btn = document.getElementById('fetch-rate-btn');
            const originalContent = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                // استخدام API عام وموثوق لجلب الأسعار
                const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
                const data = await response.json();
                const rate = data.rates.EGP;

                document.getElementById('exchange-rate').value = rate.toFixed(2);
                AppStorage.setItem('exchangeRate', rate);
                calculateTotal();

                Swal.fire({ icon: 'success', title: 'تم التحديث', text: `سعر ${currency} الحالي: ${rate} جنيه`, timer: 1500, showConfirmButton: false });
            } catch (error) {
                console.error(error);
                const cachedRate = AppStorage.getItem('exchangeRate');
                if (cachedRate) {
                    Swal.fire({ title: 'وضع أوفلاين 📡', text: `أنت غير متصل بالإنترنت. تم استخدام آخر سعر محفوظ: ${cachedRate} جنيه`, icon: 'info', background: 'var(--card-background)', color: 'var(--text-color)' });
                } else {
                    Swal.fire({ title: 'وضع أوفلاين 📡', text: 'لا يوجد اتصال بالإنترنت. يمكنك كتابة سعر الصرف يدوياً في الخانة.', icon: 'info', background: 'var(--card-background)', color: 'var(--text-color)' });
                }
            } finally {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        });

        document.getElementById('language-select').addEventListener('change', (e) => {
            const lang = e.target.value;
            updateLanguage(lang);
            AppStorage.setItem('selectedLanguage', lang);
        });

        // حفظ إجمالي النظام للمطابقة
        document.getElementById('system-total-input').addEventListener('input', (e) => {
            AppStorage.setItem('systemTotal', e.target.value);
        });

        document.getElementById('entry-date').addEventListener('change', (e) => {
            const date = e.target.value;
            document.getElementById('date-filter-input').value = date;
            loadHistory(date, document.getElementById('search-input').value.trim());
        });

        document.getElementById('set-password-btn').addEventListener('click', () => {
            const password = document.getElementById('password-input').value.trim();
            if (password) {
                AppStorage.setItem('appPassword', password);
                AppStorage.setItem('passwordEnabled', 'true');
                if (document.getElementById('enable-password')) {
                    document.getElementById('enable-password').checked = true;
                }
                playSound('success');
                Swal.fire({
                    icon: 'success',
                    title: 'تم تعيين كلمة المرور بنجاح ✅',
                    text: 'تم تفعيل حماية التطبيق بكلمة المرور.',
                    timer: 2000,
                    showConfirmButton: false,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
            } else {
                playSound('error');
                Swal.fire('خطأ', 'الرجاء كتابة كلمة مرور أولاً!', 'warning');
            }
        });

        document.getElementById('enable-password').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const currentPassword = AppStorage.getItem('appPassword');
            if (isChecked && !currentPassword) {
                e.target.checked = false;
                AppStorage.setItem('passwordEnabled', 'false');
                playSound('error');
                Swal.fire('تنبيه', 'يرجى كتابة كلمة المرور والضغط على "تعيين" أولاً لتفعيل الحماية.', 'info');
                document.getElementById('password-input').focus();
            } else {
                AppStorage.setItem('passwordEnabled', isChecked ? 'true' : 'false');
                playSound('tick');
            }
        });

        if (document.getElementById('lock-on-hide')) {
            document.getElementById('lock-on-hide').addEventListener('change', (e) => {
                AppStorage.setItem('lockOnHide', e.target.checked ? 'true' : 'false');
                playSound('tick');
            });
        }

        if (document.getElementById('auto-lock-timer')) {
            document.getElementById('auto-lock-timer').addEventListener('change', (e) => {
                AppStorage.setItem('autoLockTimer', e.target.value);
                resetIdleTimer();
                playSound('tick');
            });
        }

        if (document.getElementById('autosave-toggle')) {
            document.getElementById('autosave-toggle').addEventListener('change', (e) => {
                AppStorage.setItem('autosaveEnabled', e.target.checked ? 'true' : 'false');
                if (e.target.checked) playSound('success');
            });
        }

        function selectColorTheme(theme) {
            changeThemeColor(theme);
            AppStorage.setItem('colorTheme', theme);

            // تحديث الشكل النشط في الواجهة
            document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('active'));
            const activeCircle = document.querySelector(`.color-circle[onclick*="'${theme}'"]`);
            if (activeCircle) activeCircle.classList.add('active');

            playSound('tick');
        }

        function changeThemeColor(theme) {
            const root = document.documentElement;
            const isLight = root.getAttribute('data-theme') === 'light';

            if (isLight) {
                switch (theme) {
                    case 'gold':
                        root.style.setProperty('--primary-color', '#B8860B');
                        root.style.setProperty('--secondary-color', '#DAA520');
                        root.style.setProperty('--accent-color', '#D4AF37');
                        root.style.setProperty('--gold-primary', '#B8860B');
                        root.style.setProperty('--gold-light', '#DAA520');
                        root.style.setProperty('--gold-dark', '#8B6914');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #8B6914 0%, #B8860B 50%, #DAA520 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #8B6914, #DAA520, #B8860B, #F9E498, #DAA520)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #8B6914, #B8860B, #8B6914)');
                        root.style.setProperty('--gold-glow', '0 0 20px rgba(184, 134, 11, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 30px rgba(184, 134, 11, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(184, 134, 11, 0.2)');
                        root.style.setProperty('--border-color', 'rgba(184, 134, 11, 0.15)');
                        break;
                    case 'blue':
                        root.style.setProperty('--primary-color', '#1D4ED8');
                        root.style.setProperty('--secondary-color', '#3B82F6');
                        root.style.setProperty('--accent-color', '#60A5FA');
                        root.style.setProperty('--gold-primary', '#1D4ED8');
                        root.style.setProperty('--gold-light', '#3B82F6');
                        root.style.setProperty('--gold-dark', '#1E3A8A');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #3B82F6 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #1E3A8A, #3B82F6, #1D4ED8, #93C5FD, #3B82F6)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #1E3A8A, #1D4ED8, #1E3A8A)');
                        root.style.setProperty('--gold-glow', '0 0 20px rgba(29, 78, 216, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 30px rgba(29, 78, 216, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(29, 78, 216, 0.2)');
                        root.style.setProperty('--border-color', 'rgba(29, 78, 216, 0.15)');
                        break;
                    case 'green':
                        root.style.setProperty('--primary-color', '#047857');
                        root.style.setProperty('--secondary-color', '#10B981');
                        root.style.setProperty('--accent-color', '#34D399');
                        root.style.setProperty('--gold-primary', '#047857');
                        root.style.setProperty('--gold-light', '#10B981');
                        root.style.setProperty('--gold-dark', '#065F46');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #065F46 0%, #047857 50%, #10B981 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #065F46, #10B981, #047857, #6EE7B7, #10B981)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #065F46, #047857, #065F46)');
                        root.style.setProperty('--gold-glow', '0 0 20px rgba(4, 120, 87, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 30px rgba(4, 120, 87, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(4, 120, 87, 0.2)');
                        root.style.setProperty('--border-color', 'rgba(4, 120, 87, 0.15)');
                        break;
                    case 'purple':
                        root.style.setProperty('--primary-color', '#6D28D9');
                        root.style.setProperty('--secondary-color', '#8B5CF6');
                        root.style.setProperty('--accent-color', '#A78BFA');
                        root.style.setProperty('--gold-primary', '#6D28D9');
                        root.style.setProperty('--gold-light', '#8B5CF6');
                        root.style.setProperty('--gold-dark', '#4C1D95');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #4C1D95, #8B5CF6, #6D28D9, #C4B5FD, #8B5CF6)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #4C1D95, #6D28D9, #4C1D95)');
                        root.style.setProperty('--gold-glow', '0 0 20px rgba(109, 40, 217, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 30px rgba(109, 40, 217, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(109, 40, 217, 0.2)');
                        root.style.setProperty('--border-color', 'rgba(109, 40, 217, 0.15)');
                        break;
                    case 'red':
                        root.style.setProperty('--primary-color', '#B91C1C');
                        root.style.setProperty('--secondary-color', '#EF4444');
                        root.style.setProperty('--accent-color', '#F87171');
                        root.style.setProperty('--gold-primary', '#B91C1C');
                        root.style.setProperty('--gold-light', '#EF4444');
                        root.style.setProperty('--gold-dark', '#7F1D1D');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #7F1D1D, #EF4444, #B91C1C, #FCA5A5, #EF4444)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #7F1D1D, #B91C1C, #7F1D1D)');
                        root.style.setProperty('--gold-glow', '0 0 20px rgba(185, 28, 28, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 30px rgba(185, 28, 28, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(185, 28, 28, 0.2)');
                        root.style.setProperty('--border-color', 'rgba(185, 28, 28, 0.15)');
                        break;
                }
                root.style.removeProperty('--body-bg-image');
            } else {
                // Dark Mode
                switch (theme) {
                    case 'gold':
                        root.style.setProperty('--primary-color', '#FFD700');
                        root.style.setProperty('--secondary-color', '#FFA500');
                        root.style.setProperty('--accent-color', '#FFE55C');
                        root.style.setProperty('--gold-primary', '#D4AF37');
                        root.style.setProperty('--gold-light', '#F9E498');
                        root.style.setProperty('--gold-dark', '#996515');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #996515 0%, #D4AF37 50%, #F9E498 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #996515, #D4AF37, #996515)');
                        root.style.setProperty('--gold-glow', '0 0 25px rgba(212, 175, 55, 0.3), 0 0 50px rgba(212, 175, 55, 0.1)');
                        root.style.setProperty('--gold-glow-strong', '0 0 35px rgba(212, 175, 55, 0.5), 0 0 70px rgba(212, 175, 55, 0.2)');
                        root.style.setProperty('--glass-border', 'rgba(212, 175, 55, 0.25)');
                        root.style.setProperty('--border-color', 'rgba(212, 175, 55, 0.2)');
                        root.style.setProperty('--body-bg-image', `
                            radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.12) 0%, transparent 50%),
                            radial-gradient(circle at 0% 100%, rgba(153, 101, 21, 0.06) 0%, transparent 40%)
                        `);
                        break;
                    case 'blue':
                        root.style.setProperty('--primary-color', '#3B82F6');
                        root.style.setProperty('--secondary-color', '#60A5FA');
                        root.style.setProperty('--accent-color', '#93C5FD');
                        root.style.setProperty('--gold-primary', '#3B82F6');
                        root.style.setProperty('--gold-light', '#93C5FD');
                        root.style.setProperty('--gold-dark', '#1D4ED8');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #93C5FD 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #1E3A8A, #60A5FA, #1D4ED8, #BFDBFE, #2563EB)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #1D4ED8, #3B82F6, #1D4ED8)');
                        root.style.setProperty('--gold-glow', '0 0 25px rgba(59, 130, 246, 0.3), 0 0 50px rgba(59, 130, 246, 0.1)');
                        root.style.setProperty('--gold-glow-strong', '0 0 35px rgba(59, 130, 246, 0.5), 0 0 70px rgba(59, 130, 246, 0.2)');
                        root.style.setProperty('--glass-border', 'rgba(59, 130, 246, 0.25)');
                        root.style.setProperty('--border-color', 'rgba(59, 130, 246, 0.2)');
                        root.style.setProperty('--body-bg-image', `
                            radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
                            radial-gradient(circle at 0% 100%, rgba(29, 78, 246, 0.06) 0%, transparent 40%)
                        `);
                        break;
                    case 'green':
                        root.style.setProperty('--primary-color', '#10B981');
                        root.style.setProperty('--secondary-color', '#34D399');
                        root.style.setProperty('--accent-color', '#6EE7B7');
                        root.style.setProperty('--gold-primary', '#10B981');
                        root.style.setProperty('--gold-light', '#A7F3D0');
                        root.style.setProperty('--gold-dark', '#065F46');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #065F46 0%, #10B981 50%, #A7F3D0 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #064E3B, #34D399, #059669, #A7F3D0, #10B981)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #065F46, #10B981, #065F46)');
                        root.style.setProperty('--gold-glow', '0 0 25px rgba(16, 185, 129, 0.3), 0 0 50px rgba(16, 185, 129, 0.1)');
                        root.style.setProperty('--gold-glow-strong', '0 0 35px rgba(16, 185, 129, 0.5), 0 0 70px rgba(16, 185, 129, 0.2)');
                        root.style.setProperty('--glass-border', 'rgba(16, 185, 129, 0.25)');
                        root.style.setProperty('--border-color', 'rgba(16, 185, 129, 0.2)');
                        root.style.setProperty('--body-bg-image', `
                            radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
                            radial-gradient(circle at 0% 100%, rgba(6, 95, 70, 0.06) 0%, transparent 40%)
                        `);
                        break;
                    case 'purple':
                        root.style.setProperty('--primary-color', '#8B5CF6');
                        root.style.setProperty('--secondary-color', '#A78BFA');
                        root.style.setProperty('--accent-color', '#C4B5FD');
                        root.style.setProperty('--gold-primary', '#8B5CF6');
                        root.style.setProperty('--gold-light', '#DDD6FE');
                        root.style.setProperty('--gold-dark', '#5B21B6');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 50%, #DDD6FE 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #4C1D95, #A78BFA, #6D28D9, #C4B5FD, #8B5CF6)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #5B21B6, #8B5CF6, #5B21B6)');
                        root.style.setProperty('--gold-glow', '0 0 25px rgba(139, 92, 246, 0.3), 0 0 50px rgba(139, 92, 246, 0.1)');
                        root.style.setProperty('--gold-glow-strong', '0 0 35px rgba(139, 92, 246, 0.5), 0 0 70px rgba(139, 92, 246, 0.2)');
                        root.style.setProperty('--glass-border', 'rgba(139, 92, 246, 0.25)');
                        root.style.setProperty('--border-color', 'rgba(139, 92, 246, 0.2)');
                        root.style.setProperty('--body-bg-image', `
                            radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                            radial-gradient(circle at 0% 100%, rgba(91, 33, 182, 0.06) 0%, transparent 40%)
                        `);
                        break;
                    case 'red':
                        root.style.setProperty('--primary-color', '#FF334B');
                        root.style.setProperty('--secondary-color', '#FF6B7A');
                        root.style.setProperty('--accent-color', '#FFA3AC');
                        root.style.setProperty('--gold-primary', '#FF334B');
                        root.style.setProperty('--gold-light', '#FFA3AC');
                        root.style.setProperty('--gold-dark', '#B31428');
                        root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #B31428 0%, #FF334B 50%, #FF8591 100%)');
                        root.style.setProperty('--gold-gradient-metallic', 'linear-gradient(45deg, #8A0E1E, #FF6B7A, #FF334B, #FFCCD1, #FF334B)');
                        root.style.setProperty('--gold-gradient-simple', 'linear-gradient(135deg, #B31428 0%, #FF334B 50%, #B31428 100%)');
                        root.style.setProperty('--gold-glow', '0 0 25px rgba(255, 51, 75, 0.35), 0 0 50px rgba(255, 51, 75, 0.15)');
                        root.style.setProperty('--gold-glow-strong', '0 0 35px rgba(255, 51, 75, 0.55), 0 0 70px rgba(255, 51, 75, 0.25)');
                        root.style.setProperty('--glass-border', 'rgba(255, 51, 75, 0.28)');
                        root.style.setProperty('--border-color', 'rgba(255, 51, 75, 0.22)');
                        root.style.setProperty('--body-bg-image', `
                            radial-gradient(circle at 50% 0%, rgba(255, 51, 75, 0.14) 0%, transparent 50%),
                            radial-gradient(circle at 0% 100%, rgba(179, 20, 40, 0.08) 0%, transparent 40%)
                        `);
                        break;
                }
            }
        }

        document.getElementById('filter-btn').addEventListener('click', () => {
            const filterDate = dateFilterInput.value;
            const searchTerm = searchInput.value.trim();
            if (filterDate) {
                loadHistory(filterDate, searchTerm);
            } else {
                Swal.fire('تنبيه', 'الرجاء اختيار تاريخ للبحث.', 'warning');
            }
        });

        // التصفية والتحميل التلقائي الفوري بمجرد تعديل أو اختيار التاريخ من القائمة
        const handleDateFilterChange = () => {
            const filterDate = dateFilterInput.value || getTodayLocalDate();
            const searchTerm = searchInput.value.trim();
            loadHistory(filterDate, searchTerm);
        };

        dateFilterInput.addEventListener('change', handleDateFilterChange);
        dateFilterInput.addEventListener('input', handleDateFilterChange);

        document.getElementById('clear-filter-btn').addEventListener('click', () => {
            const now = new Date();
            const todayISO = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            dateFilterInput.value = todayISO;
            searchInput.value = '';
            loadHistory(todayISO);
        });

        document.getElementById('show-all-btn').addEventListener('click', () => {
            dateFilterInput.value = '';
            searchInput.value = '';
            loadHistory('ALL'); // عرض كل العمليات بالكامل وتفريغ حقل التاريخ
        });

        // إضافة البحث المباشر مع Debounce ذكي (250ms) لمنع تجميد الشاشة أثناء الكتابة
        let searchDebounceTimer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                const searchTerm = searchInput.value.trim();
                const filterDate = dateFilterInput.value;
                if (filterDate || searchTerm) {
                    loadHistory(filterDate || null, searchTerm);
                } else {
                    loadHistory();
                }
            }, 250);
        });

        // تصدير البيانات (JSON)
        document.getElementById('export-btn').addEventListener('click', () => {
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) { }

            const userName = AppStorage.getItem('userName') || 'user';
            const userPhone = AppStorage.getItem('userPhone') || '';
            const userRole = AppStorage.getItem('userRole') || '';
            const userAvatar = AppStorage.getItem('userAvatar') || '👤';
            const userAvatarImg = AppStorage.getItem('userAvatarImage') || '';

            // تجميع كل البيانات في نسخة احتياطية شاملة
            const fullBackup = {
                version: '4.0',
                exportDate: new Date().toISOString(),
                appName: 'حاسبة النقد الاحترافية',
                user: {
                    name: userName,
                    phone: userPhone,
                    role: userRole,
                    avatar: userAvatar,
                    avatarImage: userAvatarImg
                },
                settings: {
                    currency: AppStorage.getItem('selectedCurrency') || 'egp',
                    language: AppStorage.getItem('selectedLanguage') || 'ar',
                    theme: AppStorage.getItem('theme') || 'light',
                    exchangeRate: AppStorage.getItem('exchangeRate') || '',
                    soundEnabled: AppStorage.getItem('soundEnabled') || 'true'
                },
                history: history,
                totalRecords: history.length
            };

            const dataStr = JSON.stringify(fullBackup, null, 2);
            const now = new Date();
            const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const filename = `cash-backup-${userName}-${dateStamp}.json`;

            // تنزيل كملف JSON مباشر
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            Swal.fire({
                icon: 'success',
                title: 'تم تصدير النسخة الاحتياطية بنجاح ✅',
                text: `تم حفظ الملف: ${filename}`,
                timer: 2500,
                showConfirmButton: false,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
            playSound('success');
        });

        // ====================================================
        // 💾 منطق النسخ الاحتياطي التلقائي والمودال التفاعلي (مطابق للصورة) 💾
        // ====================================================
        window.generateFullBackupData = function () {
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) { }

            const userName = AppStorage.getItem('userName') || 'bayan';
            const userPhone = AppStorage.getItem('userPhone') || '';
            const userRole = AppStorage.getItem('userRole') || '';
            const userAvatar = AppStorage.getItem('userAvatar') || '👤';

            return {
                version: '4.2',
                exportDate: new Date().toISOString(),
                appName: 'حاسبة النقد الاحترافية',
                user: { name: userName, phone: userPhone, role: userRole, avatar: userAvatar },
                settings: {
                    currency: AppStorage.getItem('selectedCurrency') || 'egp',
                    language: AppStorage.getItem('selectedLanguage') || 'ar',
                    theme: AppStorage.getItem('theme') || 'light',
                    exchangeRate: AppStorage.getItem('exchangeRate') || '',
                    soundEnabled: AppStorage.getItem('soundEnabled') || 'true'
                },
                inputs: JSON.parse(AppStorage.getItem('cashCalculatorInputs') || '{}'),
                history: history,
                totalRecords: history.length
            };
        };

        window.triggerBackupModal = function (autoDownload = true) {
            const overlay = document.getElementById('backup-modal-overlay');
            if (overlay) overlay.style.display = 'flex';
            playSound('save');

            const backupData = generateFullBackupData();
            const dataStr = JSON.stringify(backupData, null, 2);
            AppStorage.setItem('bayan_last_auto_backup', dataStr);

            if (autoDownload) {
                const now = new Date();
                const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const filename = `bayan_backup_${dateStamp}.json`;

                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            }
        };

        window.closeBackupModal = function () {
            const overlay = document.getElementById('backup-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        // ربط أزرار النسخ الاحتياطي التلقائي ومستمع إغلاق التطبيق
        document.addEventListener('DOMContentLoaded', () => {
            const downloadBtn = document.getElementById('download-backup-now-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    triggerBackupModal(true);
                });
            }

            // حفظ نسخة احتياطية تلقائية عند الخروج من التطبيق أو إغلاق الصفحة
            window.addEventListener('beforeunload', () => {
                const backupData = generateFullBackupData();
                AppStorage.setItem('bayan_exit_auto_backup', JSON.stringify(backupData));
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    const backupData = generateFullBackupData();
                    AppStorage.setItem('bayan_exit_auto_backup', JSON.stringify(backupData));
                }
            });
        });


        document.getElementById('import-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    try {
                        const parsed = JSON.parse(event.target.result);

                        // دعم صيغتين: نسخة شاملة أو مصفوفة قديمة
                        let importedHistory = [];
                        let importedUser = null;
                        let importedSettings = null;
                        let isFullBackup = false;

                        if (parsed.version && parsed.history && Array.isArray(parsed.history)) {
                            importedHistory = parsed.history;
                            importedUser = parsed.user;
                            importedSettings = parsed.settings;
                            isFullBackup = true;
                        } else if (Array.isArray(parsed)) {
                            importedHistory = parsed;
                        } else {
                            throw new Error('صيغة الملف غير مدعومة.');
                        }

                        const existingHistory = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
                        const backupInfo = isFullBackup
                            ? `<br><b>👤 الاسم:</b> ${parsed.user?.name || '-'}<br><b>📅 تاريخ النسخة:</b> ${new Date(parsed.exportDate).toLocaleDateString('ar-EG')}`
                            : '';

                        Swal.fire({
                            title: '📥 استيراد البيانات',
                            html: `<div style="direction:rtl; text-align:right; color:var(--text-color);">
                                <b>📊 سجلات في الملف:</b> ${importedHistory.length}
                                <b>📊 سجلاتك الحالية:</b> ${existingHistory.length}${backupInfo}<br><br>
                                <b>كيف تريد الاستيراد؟</b>
                            </div>`,
                            icon: 'question',
                            showDenyButton: true,
                            showCancelButton: true,
                            confirmButtonText: 'دمج مع الحالية 🔄',
                            denyButtonText: 'استبدال كامل ⚠️',
                            cancelButtonText: 'إلغاء',
                            confirmButtonColor: '#B8860B',
                            denyButtonColor: '#dc3545',
                            background: 'var(--card-background)',
                            color: 'var(--text-color)'
                        }).then(result => {
                            if (result.isConfirmed || result.isDenied) {
                                let finalHistory;

                                if (result.isConfirmed) {
                                    // دمج - تجنب التكرار بناءً على id
                                    const existingIds = new Set(existingHistory.map(i => i.id));
                                    const newItems = importedHistory.filter(i => !existingIds.has(i.id));
                                    finalHistory = [...existingHistory, ...newItems];
                                    finalHistory.sort((a, b) => b.timestamp - a.timestamp);
                                } else {
                                    // استبدال كامل
                                    finalHistory = importedHistory;
                                }

                                AppStorage.setItem('cashCalculatorHistory', JSON.stringify(finalHistory));

                                // استرداد بيانات المستخدم والإعدادات من النسخة الشاملة (عند الاستبدال فقط)
                                if (isFullBackup && result.isDenied) {
                                    if (importedUser) {
                                        if (importedUser.name) AppStorage.setItem('userName', importedUser.name);
                                        if (importedUser.phone) AppStorage.setItem('userPhone', importedUser.phone);
                                        if (importedUser.role) AppStorage.setItem('userRole', importedUser.role);
                                        if (importedUser.avatar) AppStorage.setItem('userAvatar', importedUser.avatar);
                                        if (importedUser.avatarImage) AppStorage.setItem('userAvatarImage', importedUser.avatarImage);
                                    }
                                    if (importedSettings) {
                                        if (importedSettings.currency) AppStorage.setItem('selectedCurrency', importedSettings.currency);
                                        if (importedSettings.language) AppStorage.setItem('selectedLanguage', importedSettings.language);
                                        if (importedSettings.theme) AppStorage.setItem('theme', importedSettings.theme);
                                        if (importedSettings.exchangeRate) AppStorage.setItem('exchangeRate', importedSettings.exchangeRate);
                                    }
                                    loadTheme();
                                }

                                loadHistory(document.getElementById('date-filter-input')?.value || null);
                                calculateTotal();
                                playSound('success');
                                updateWelcomeMessage();

                                Swal.fire({
                                    icon: 'success',
                                    title: 'تم الاستيراد بنجاح ✅',
                                    html: `<div style="direction:rtl; color:var(--text-color);"><b>إجمالي السجلات الآن:</b> ${finalHistory.length}</div>`,
                                    background: 'var(--card-background)',
                                    color: 'var(--text-color)'
                                });
                            }
                        });
                    } catch (error) {
                        Swal.fire('خطأ', `فشل في قراءة الملف: ${error.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });


        // أزرار الإحصائيات بأمان
        document.getElementById('stats-today-btn')?.addEventListener('click', () => { updateStats('today'); renderChart('today'); });
        document.getElementById('stats-week-btn')?.addEventListener('click', () => { updateStats('week'); renderChart('week'); });
        document.getElementById('stats-month-btn')?.addEventListener('click', () => { updateStats('month'); renderChart('month'); });

        // تقرير واتساب/تيليغرام
        document.getElementById('pdf-export-btn')?.addEventListener('click', () => {
            Swal.fire({
                title: 'إرسال التقرير',
                text: 'اختر طريقة الإرسال',
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '<i class="fab fa-whatsapp"></i> واتساب',
                denyButtonText: '<i class="fab fa-telegram"></i> تيلغرام',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#25D366',
                denyButtonColor: '#229ED9',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            }).then(result => {
                if (result.isConfirmed) sendWhatsAppReport();
                else if (result.isDenied) sendTelegramReport();
            });
        });

        // لقطة الشاشة - تنزيل أو مشاركة
        document.getElementById('screenshot-btn')?.addEventListener('click', function () {
            Swal.fire({
                title: 'لقطة الشاشة',
                text: 'ماذا تريد أن تفعل بالصورة?',
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'تنزيل صورة',
                denyButtonText: 'مشاركة',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#B8860B',
                denyButtonColor: '#FFD700',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            }).then(result => {
                if (result.isConfirmed) downloadScreenshot();
                else if (result.isDenied) shareScreenshotVia();
            });
        });

        // تقرير الخزينة الرقمية الشهري
        document.getElementById('digital-report-btn').addEventListener('click', () => {
            let history = [];
            try { history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]'); } catch (e) { }
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const monthRecords = history.filter(item => {
                const date = new Date(item.simpleDate);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
            let totalVodafone = 0, totalInstapay = 0;
            monthRecords.forEach(r => { totalVodafone += (r.vodafone || 0); totalInstapay += (r.instapay || 0); });
            const monthName = now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            const userName = AppStorage.getItem('userName') || 'الموظف';
            const message = `*تقرير الخزينة الرقمية*\nالاسم: ${userName}\nالشهر: ${monthName}\n\nفودافون كاش: ${totalVodafone.toFixed(2)}\nانستا باي: ${totalInstapay.toFixed(2)}\nالاجمالي الرقمي: ${(totalVodafone + totalInstapay).toFixed(2)}\n---\nحاسبة النقد الاحترافية`;

            Swal.fire({
                title: 'إرسال تقرير الرقمي',
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '<i class="fab fa-whatsapp"></i> واتساب',
                denyButtonText: '<i class="fab fa-telegram"></i> تيلجرام',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#25D366',
                denyButtonColor: '#229ED9',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            }).then(result => {
                if (result.isConfirmed) {
                    const phone = AppStorage.getItem('userPhone') || '';
                    if (!phone) { Swal.fire('تنبيه', 'احفظ رقم هاتفك اولا', 'info'); return; }
                    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0/, '20');
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                } else if (result.isDenied) {
                    sendTelegramReport();
                }
            });
        });

        // ==========================================
        // 📊 محرك تصدير السجلات إلى إكسل (Excel / CSV UTF-8 Engine)
        // ==========================================
        window.exportHistoryToExcel = function () {
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for Excel export:", e);
            }

            if (!history || history.length === 0) {
                playSound('error');
                Swal.fire({
                    icon: 'info',
                    title: 'لا توجد سجلات',
                    text: 'لم يتم العثور على أي عمليات مسجلة في السجل لتصديرها.',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)',
                    confirmButtonColor: 'var(--primary-color)'
                });
                return;
            }

            const headers = [
                'رقم الإيصال',
                'التاريخ',
                'الوقت / الطابع الزمني',
                'العملة',
                'الإجمالي النهائي',
                'إجمالي عدد الأوراق',
                'النقدي (كاش)',
                'فودافون كاش',
                'إنستا باي',
                'مبيعات النظام (العهدة)',
                'الفارق',
                'الملاحظات',
                'تفاصيل الفئات النقدية'
            ];

            const escapeCsv = (str) => {
                if (str === undefined || str === null) return '""';
                const s = String(str).replace(/"/g, '""');
                return `"${s}"`;
            };

            const rows = [headers.map(escapeCsv).join(',')];

            history.forEach(item => {
                const grandTotal = item.grandTotal || item.total || 0;
                const vodafone = item.vodafone || 0;
                const instapay = item.instapay || 0;
                const cashOnly = (grandTotal - (vodafone + instapay)).toFixed(2);
                const sysTotal = item.systemTotal || '';
                let diffStr = '';
                if (sysTotal) {
                    const diff = grandTotal - parseFloat(sysTotal);
                    diffStr = diff.toFixed(2);
                }

                let detailsStr = '';
                if (item.details) {
                    detailsStr = Object.entries(item.details)
                        .map(([val, count]) => `${count}×${val}`)
                        .join(' | ');
                }

                const row = [
                    escapeCsv(item.receiptNumber || `REC-${item.id}`),
                    escapeCsv(item.simpleDate || item.timestamp || ''),
                    escapeCsv(item.timestamp || ''),
                    escapeCsv(item.currency || 'جنيه'),
                    escapeCsv(grandTotal.toFixed(2)),
                    escapeCsv(item.totalPapers || 0),
                    escapeCsv(cashOnly),
                    escapeCsv(vodafone.toFixed(2)),
                    escapeCsv(instapay.toFixed(2)),
                    escapeCsv(sysTotal),
                    escapeCsv(diffStr),
                    escapeCsv(item.note || ''),
                    escapeCsv(detailsStr)
                ];
                rows.push(row.join(','));
            });

            const csvContent = '\uFEFF' + rows.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const now = new Date();
            const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            link.href = url;
            link.download = `سجل_حاسبة_النقدية_${dateStr}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            playSound('success');
            Swal.fire({
                icon: 'success',
                title: 'تم تصدير ملف Excel بنجاح ✅',
                text: `تم تصدير ${history.length} سجل بنجاح بصيغة CSV المتوافقة تماماً مع Excel العربي.`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3500,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
        };

        // ==========================================
        // 🏪 إعدادات المتجر والفاتورة (Store Settings)
        // ==========================================
        window.saveStoreSettings = function () {
            const name = document.getElementById('store-name-input')?.value.trim() || '';
            const phone = document.getElementById('store-phone-input')?.value.trim() || '';
            const address = document.getElementById('store-address-input')?.value.trim() || '';
            const tax = document.getElementById('store-tax-input')?.value.trim() || '';

            AppStorage.setItem('storeName', name);
            AppStorage.setItem('storePhone', phone);
            AppStorage.setItem('storeAddress', address);
            AppStorage.setItem('storeTax', tax);

            playSound('success');
            Swal.fire({
                icon: 'success',
                title: 'تم حفظ بيانات المتجر بنجاح ✅',
                text: 'ستظهر هذه البيانات في رأس إيصالات الكاشير الحرارية.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
        };

        function loadStoreSettings() {
            const name = AppStorage.getItem('storeName') || '';
            const phone = AppStorage.getItem('storePhone') || '';
            const address = AppStorage.getItem('storeAddress') || '';
            const tax = AppStorage.getItem('storeTax') || '';

            const nameInp = document.getElementById('store-name-input');
            const phoneInp = document.getElementById('store-phone-input');
            const addressInp = document.getElementById('store-address-input');
            const taxInp = document.getElementById('store-tax-input');

            if (nameInp) nameInp.value = name;
            if (phoneInp) phoneInp.value = phone;
            if (addressInp) addressInp.value = address;
            if (taxInp) taxInp.value = tax;
        }

        // ==========================================
        // ⚡ تحويل ناتج الآلة الحاسبة المباشر (Math Result Quick Transfer)
        // ==========================================
        window.transferMathResult = function (target) {
            const resultElem = document.getElementById('math-result');
            let rawText = resultElem ? resultElem.textContent.trim() : (window.mathCurrentInput || '0');
            let cleaned = rawText.replace(/[^0-9.-]/g, '');
            let numVal = parseFloat(cleaned);

            if (isNaN(numVal) || numVal <= 0) {
                playSound('error');
                Swal.fire({
                    icon: 'warning',
                    title: 'لا يوجد ناتج للتحويل',
                    text: 'قم بإجراء عملية حسابية أولاً في الآلة الحاسبة للحصول على ناتج موجب.',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
                return;
            }

            let targetLabel = '';
            if (target === 'vodafone') {
                const vodafoneInp = document.getElementById('vodafone-cash');
                if (vodafoneInp) {
                    vodafoneInp.value = numVal;
                    targetLabel = 'فودافون كاش';
                }
            } else if (target === 'instapay') {
                const instapayInp = document.getElementById('instapay');
                if (instapayInp) {
                    instapayInp.value = numVal;
                    targetLabel = 'إنستا باي';
                }
            } else if (target === 'target') {
                const quickTarget = document.getElementById('quick-system-target');
                const sysInp = document.getElementById('system-total-input');
                if (quickTarget) quickTarget.value = numVal;
                if (sysInp) sysInp.value = numVal;
                AppStorage.setItem('systemTotal', numVal.toString());
                targetLabel = 'مبيعات النظام (العهدة)';

                // إذا كان كارت العهدة مخفياً، نقوم بإظهاره تلقائياً
                const card = document.getElementById('custody-card');
                if (card && (card.style.display === 'none' || getComputedStyle(card).display === 'none')) {
                    card.style.display = 'block';
                    AppStorage.setItem('showCustodyCard', 'true');
                    const t1 = document.getElementById('show-custody-card-toggle');
                    const t2 = document.getElementById('show-custody-card-toggle-data');
                    if (t1) t1.checked = true;
                    if (t2) t2.checked = true;
                }
            }

            // الرجوع للرئيسية والتحديث
            handleBottomNav('home', document.querySelector('.nav-item'));
            calculateTotal();
            playSound('cash');

            Swal.fire({
                icon: 'success',
                title: 'تم الترحيل بنجاح ⚡',
                text: `تم ترحيل مبلغ ${numVal.toFixed(2)} إلى ${targetLabel}.`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
        };

        // ==========================================
        // 🏁 باركود الإيصال الحراري المتجهي (Vector Barcode SVG)
        // ==========================================
        function generateBarcodeSvg(codeText) {
            let bars = '';
            let x = 10;
            const cleanStr = String(codeText).replace(/[^A-Za-z0-9_-]/g, '') || 'REC-1';

            bars += `<rect x="${x}" y="0" width="2" height="35" fill="#000"/>`;
            x += 3;
            bars += `<rect x="${x}" y="0" width="1" height="35" fill="#000"/>`;
            x += 3;

            for (let i = 0; i < cleanStr.length; i++) {
                const charCode = cleanStr.charCodeAt(i);
                const w1 = (charCode % 3) + 1;
                const s1 = ((charCode >> 1) % 2) + 1;
                const w2 = ((charCode >> 2) % 3) + 1;
                const s2 = ((charCode >> 3) % 2) + 1;

                bars += `<rect x="${x}" y="0" width="${w1}" height="35" fill="#000"/>`;
                x += w1 + s1;
                bars += `<rect x="${x}" y="0" width="${w2}" height="35" fill="#000"/>`;
                x += w2 + s2;
            }

            bars += `<rect x="${x}" y="0" width="2" height="35" fill="#000"/>`;
            x += 4;
            bars += `<rect x="${x}" y="0" width="1" height="35" fill="#000"/>`;
            x += 10;

            return `
                <div class="receipt-barcode">
                    <svg viewBox="0 0 ${x} 35" xmlns="http://www.w3.org/2000/svg" style="display:block; margin: 0 auto; height: 35px;">
                        ${bars}
                    </svg>
                    <div class="receipt-barcode-num">* ${cleanStr} *</div>
                </div>
            `;
        }

        // ==========================================
        // 🧾 نظام إيصال الكاشير الحراري المطور (Thermal POS Receipt v5.4.0)
        // ==========================================
        function showThermalReceiptModal(recordData = null) {
            let details = {}, grandTotal = 0, vodafone = 0, instapay = 0, entryDate = '', totalPapers = 0;
            const currencySymbol = AppStorage.getItem('selectedCurrency') === 'usd' ? '$' : (AppStorage.getItem('selectedCurrency') === 'eur' ? '€' : 'ج.م');

            if (recordData) {
                details = recordData.details || {};
                grandTotal = recordData.grandTotal || recordData.total || 0;
                vodafone = recordData.vodafone || 0;
                instapay = recordData.instapay || 0;
                entryDate = recordData.date || new Date().toLocaleString('ar-EG');
                totalPapers = recordData.totalPapers || Object.values(details).reduce((a, b) => a + b, 0);
            } else {
                grandTotal = calculateTotal();
                if (grandTotal <= 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'لا توجد بيانات حالية',
                        text: 'قم بإدخال عدد الفئات أولاً لتوليد إيصال الكاشير.',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                    });
                    return;
                }
                details = getCalculationDetails();
                vodafone = parseFloat(document.getElementById('vodafone-cash')?.value) || 0;
                instapay = parseFloat(document.getElementById('instapay')?.value) || 0;
                entryDate = (document.getElementById('entry-date')?.value || new Date().toLocaleDateString('ar-EG')) + ' ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                totalPapers = Array.from(document.querySelectorAll('.cash-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
            }

            const userName = AppStorage.getItem('userName') || 'مسؤول الخزينة';
            const userRole = AppStorage.getItem('userRole') || 'كاشير';
            const serial = AppStorage.getItem('deviceSerial') || 'POS-001';

            const storeName = AppStorage.getItem('storeName') || 'حاسبة النقد الاحترافية';
            const storePhone = AppStorage.getItem('storePhone') || '';
            const storeAddress = AppStorage.getItem('storeAddress') || '';
            const storeTax = AppStorage.getItem('storeTax') || '';

            // عداد تسلسلي تصاعدي يبدأ من 1 ثم 2 وهكذا
            let receiptNumCounter = parseInt(AppStorage.getItem('lastReceiptCounter') || '0') + 1;
            if (!recordData) {
                AppStorage.setItem('lastReceiptCounter', receiptNumCounter.toString());
            }
            const receiptNumber = recordData && recordData.receiptNumber ? recordData.receiptNumber : `REC-${receiptNumCounter}`;

            // توليد صفوف الفئات النقدية
            let rowsHtml = '';
            for (const value in details) {
                const count = details[value];
                const noteVal = parseFloat(value);
                const subtotal = (noteVal * count).toFixed(2);
                rowsHtml += `
                    <tr>
                        <td style="text-align: right; font-weight: bold; color: #000;">${noteVal} ${currencySymbol}</td>
                        <td style="text-align: center; font-weight: bold; color: #000;">${count}</td>
                        <td style="text-align: left; font-weight: bold; color: #000;">${subtotal}</td>
                    </tr>
                `;
            }

            if (!rowsHtml) {
                rowsHtml = `<tr><td colspan="3" style="text-align:center; color:#888;">لا توجد فئات نقدية معدودة</td></tr>`;
            }

            let digitalSection = '';
            if (vodafone > 0 || instapay > 0) {
                digitalSection = `
                    <div style="border-top: 1px dashed #777; margin: 8px 0; padding-top: 6px;">
                        <div style="font-weight: 800; font-size: 0.85em; margin-bottom: 4px;">📱 الخزينة والمحافظ الرقمية:</div>
                        ${vodafone > 0 ? `<div class="receipt-row-flex" style="font-size:0.82em;"><span>فودافون كاش:</span><b>${vodafone.toFixed(2)} ${currencySymbol}</b></div>` : ''}
                        ${instapay > 0 ? `<div class="receipt-row-flex" style="font-size:0.82em;"><span>إنستا باي:</span><b>${instapay.toFixed(2)} ${currencySymbol}</b></div>` : ''}
                    </div>
                `;
            }

            // قسم مطابقة العهدة في الإيصال إن وُجدت
            let custodyReceiptHtml = '';
            const sysTargetVal = parseFloat(document.getElementById('quick-system-target')?.value) || parseFloat(AppStorage.getItem('systemTotal')) || 0;
            if (sysTargetVal > 0) {
                const custodyDiff = grandTotal - sysTargetVal;
                const statusStr = Math.abs(custodyDiff) < 0.001 ? 'مطابقة تامة ✅' : (custodyDiff > 0 ? `زيادة (+${custodyDiff.toFixed(2)}) 🟢` : `عجز (${custodyDiff.toFixed(2)}) 🔴`);
                custodyReceiptHtml = `
                    <div class="receipt-custody-box">
                        <div class="receipt-row-flex" style="font-size: 0.82em;"><span>مبيعات النظام (العهدة):</span><b>${sysTargetVal.toFixed(2)} ${currencySymbol}</b></div>
                        <div class="receipt-row-flex" style="font-size: 0.82em;"><span>الفعلي بالدرج:</span><b>${grandTotal.toFixed(2)} ${currencySymbol}</b></div>
                        <div class="receipt-row-flex" style="font-size: 0.85em; font-weight: bold; border-top: 1px dashed #999; margin-top: 3px; padding-top: 3px;">
                            <span>الفارق والجرد:</span>
                            <span>${statusStr}</span>
                        </div>
                    </div>
                `;
            }

            const curCode = AppStorage.getItem('selectedCurrency') || 'egp';
            const tafqeetText = window.tafqeet ? window.tafqeet(grandTotal, curCode) : '';

            const receiptHtml = `
                <div id="thermal-print-area" class="receipt-paper-wrapper">
                    <div class="receipt-header">
                        <div style="font-size: 1.6em; margin-bottom: 2px;">🏪</div>
                        <h3 style="margin: 0; font-size: 1.25em; font-weight: 900;">${storeName}</h3>
                        <p style="margin: 2px 0 4px; font-size: 0.85em; opacity: 0.85;">إيصال جرد وردية وتسليم نقدية</p>
                        ${storeAddress ? `<div style="font-size: 0.8em; color: #333;">📍 ${storeAddress}</div>` : ''}
                        ${storePhone ? `<div style="font-size: 0.8em; color: #333;">📞 ${storePhone}</div>` : ''}
                        ${storeTax ? `<div style="font-size: 0.75em; color: #555;">س.ت / ضريبي: ${storeTax}</div>` : ''}
                    </div>

                    <div class="receipt-meta">
                        <div class="receipt-row-flex"><span>رقم الإيصال:</span><b>#${receiptNumber}</b></div>
                        <div class="receipt-row-flex"><span>التاريخ والوقت:</span><b>${entryDate}</b></div>
                        <div class="receipt-row-flex"><span>الموظف / الكاشير:</span><b>${userName} (${userRole})</b></div>
                        <div class="receipt-row-flex"><span>معرف الجهاز:</span><b>${serial}</b></div>
                    </div>

                    <table class="receipt-table">
                        <thead>
                            <tr>
                                <th style="text-align: right;">الفئة</th>
                                <th style="text-align: center;">العدد</th>
                                <th style="text-align: left;">المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    ${digitalSection}

                    <div class="receipt-total-box">
                        <div class="receipt-row-flex" style="font-size: 0.85em;">
                            <span>📄 إجمالي عدد الأوراق:</span>
                            <b>${totalPapers} ورقة</b>
                        </div>
                        <div class="receipt-row-flex receipt-grand-total">
                            <span>الإجمالي النهائي:</span>
                            <span>${grandTotal.toFixed(2)} ${currencySymbol}</span>
                        </div>
                    </div>

                    <div class="receipt-tafqeet">
                        ${tafqeetText}
                    </div>

                    ${custodyReceiptHtml}

                    ${generateBarcodeSvg(receiptNumber)}

                    <div class="receipt-footer">
                        <p style="margin: 0; font-weight: bold;">*** تم الاعتماد والمطابقة بنجاح ***</p>
                        <p style="margin: 3px 0 0; font-size: 0.85em; opacity: 0.75;">شكراً لتعاملكم - نظام الكاشير الذكي Pro</p>
                    </div>
                </div>
            `;

            Swal.fire({
                title: '🧾 إيصال الكاشير الحراري',
                html: receiptHtml,
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: '<i class="fas fa-print"></i> طباعة (80mm/58mm)',
                denyButtonText: '<i class="fas fa-image"></i> حفظ كصورة',
                cancelButtonText: 'إغلاق',
                confirmButtonColor: '#10B981',
                denyButtonColor: '#3B82F6',
                cancelButtonColor: '#64748B',
                background: 'var(--card-background)',
                color: 'var(--text-color)',
                width: '420px',
                customClass: {
                    popup: 'receipt-swal-popup'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    printThermalReceiptHtml(receiptHtml);
                } else if (result.isDenied) {
                    const printArea = document.getElementById('thermal-print-area');
                    if (printArea && typeof html2canvas !== 'undefined') {
                        html2canvas(printArea, { scale: 3, backgroundColor: '#FFFFFF' }).then(canvas => {
                            const link = document.createElement('a');
                            link.download = `Receipt_${receiptNumber}.png`;
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                            playSound('success');
                        });
                    }
                }
            });
        }

        // دالة طباعة معزولة ومضمونة 100% لطابعات الـ POS بدون صفحات بيضاء
        function printThermalReceiptHtml(htmlContent) {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>طباعة إيصال كاشير</title>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        body {
                            font-family: 'Tajawal', -apple-system, sans-serif;
                            margin: 0;
                            padding: 4mm;
                            background: #FFF;
                            color: #000;
                            direction: rtl;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .receipt-paper-wrapper {
                            width: 100%;
                            max-width: 78mm;
                            margin: 0 auto;
                            padding: 0;
                            box-shadow: none;
                            border: none;
                            letter-spacing: 0 !important;
                            word-spacing: 0 !important;
                            color: #000 !important;
                        }
                        .receipt-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                        .receipt-header h3 { margin: 0; font-size: 17px; font-weight: 950; color: #000; }
                        .receipt-header p { margin: 3px 0 0; font-size: 13px; font-weight: 900; color: #000 !important; }
                        .receipt-meta { font-size: 13px; font-weight: 700; line-height: 1.6; margin-bottom: 8px; border-bottom: 1.5px dashed #000; padding-bottom: 6px; color: #000; }
                        .receipt-row-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-size: 13px; color: #000; }
                        .receipt-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 6px 0; color: #000; }
                        .receipt-table th { border-bottom: 2px solid #000; padding: 5px 2px; text-align: right; font-weight: 950; color: #000; }
                        .receipt-table td { padding: 5px 2px; border-bottom: 1px dotted #555; color: #000; font-weight: 800; }
                        .receipt-total-box { border-top: 2px dashed #000; padding-top: 6px; margin-top: 6px; color: #000; }
                        .receipt-grand-total { font-size: 16px; font-weight: 950; border-top: 1.5px solid #000; padding-top: 5px; margin-top: 5px; color: #000; }
                        .receipt-footer { text-align: center; border-top: 1.5px dashed #000; padding-top: 8px; margin-top: 10px; font-size: 12px; font-weight: 800; color: #000 !important; }
                        .receipt-footer p { color: #000 !important; font-weight: 800 !important; }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `);
            doc.close();

            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 2000);
            }, 300);
        }

        // ربط أزرار الإيصال
        document.getElementById('header-receipt-btn')?.addEventListener('click', () => showThermalReceiptModal());
        document.getElementById('receipt-action-btn')?.addEventListener('click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.style.display = 'none';
            showThermalReceiptModal();
        });


        function updateStats(period = 'today') {

            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for stats:", e);
            }
            const now = new Date();
            let filteredHistory = [];

            if (period === 'today') {
                const today = now.toISOString().slice(0, 10);
                filteredHistory = history.filter(item => item.simpleDate === today);
            } else if (period === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                const weekAgoStr = weekAgo.toISOString().slice(0, 10);
                filteredHistory = history.filter(item => item.simpleDate >= weekAgoStr);
            } else if (period === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                const monthAgoStr = monthAgo.toISOString().slice(0, 10);
                filteredHistory = history.filter(item => item.simpleDate >= monthAgoStr);
            }

            // حساب الإحصائيات
            const total = filteredHistory.reduce((sum, item) => sum + item.total, 0);
            const average = filteredHistory.length > 0 ? total / filteredHistory.length : 0;
            const highest = filteredHistory.length > 0 ? Math.max(...filteredHistory.map(item => item.total)) : 0;

            // تحديث العرض
            document.getElementById('daily-total').textContent = total.toFixed(2);
            document.getElementById('daily-average').textContent = average.toFixed(2);
            document.getElementById('highest-record').textContent = highest.toFixed(2);
            document.getElementById('total-records').textContent = filteredHistory.length;
        }

        let statsChartInstance = null;

        function renderChart(period) {
            const ctx = document.getElementById('statsChart').getContext('2d');
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history for chart:", e);
            }

            // تجهيز البيانات
            let labels = [];
            let data = [];
            const now = new Date();

            if (period === 'today') {
                // رسم بياني دائري (Cash vs Digital) لليوم
                const today = now.toISOString().slice(0, 10);
                const todayRecords = history.filter(item => item.simpleDate === today);

                let totalCash = 0;
                let totalDigital = 0;

                todayRecords.forEach(item => {
                    const digital = (item.vodafone || 0) + (item.instapay || 0);
                    const cash = item.total - digital;
                    totalCash += cash;
                    totalDigital += digital;
                });

                labels = ['نقدي (Cash)', 'رقمي (Digital)'];
                data = [totalCash, totalDigital];

                // نوع الرسم دائري
                var chartType = 'doughnut';
                var bgColors = ['#28a745', '#6f42c1']; // أخضر للكاش، بنفسجي للرقمي

            } else if (period === 'week') {
                // عرض آخر 7 أيام
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    const dateStr = d.toISOString().slice(0, 10);
                    const dayRecords = history.filter(item => item.simpleDate === dateStr);
                    const dayTotal = dayRecords.reduce((sum, item) => sum + item.total, 0);
                    labels.push(d.toLocaleDateString('ar-EG', { weekday: 'short' }));
                    data.push(dayTotal);
                }
                var chartType = 'bar';
                var bgColors = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            } else if (period === 'month') {
                for (let i = 29; i >= 0; i -= 2) { // كل يومين لتقليل الزحام
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    const dateStr = d.toISOString().slice(0, 10);
                    const dayRecords = history.filter(item => item.simpleDate === dateStr);
                    const dayTotal = dayRecords.reduce((sum, item) => sum + item.total, 0);
                    labels.push(d.getDate() + '/' + (d.getMonth() + 1));
                    data.push(dayTotal);
                }
                var chartType = 'bar';
                var bgColors = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            }

            if (statsChartInstance) {
                statsChartInstance.destroy();
            }

            statsChartInstance = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'الإجمالي',
                        data: data,
                        backgroundColor: bgColors,
                        borderRadius: 5,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        let audioCtx = null;

        function playSound(type) {
            if (AppStorage.getItem('soundEnabled') === 'false') return;
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();

                const masterGain = audioCtx.createGain();
                masterGain.connect(audioCtx.destination);
                masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime);

                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(masterGain);

                switch (type) {
                    case 'tick': // نقرة ميكانيكية خفيفة
                        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.04);
                        osc.type = 'sine';
                        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
                        osc.start(); osc.stop(audioCtx.currentTime + 0.04);
                        break;
                    case 'success': // جرس ذهبي (Luxurious Chime)
                        [523.25, 659.25, 783.99].forEach((f, i) => {
                            const o = audioCtx.createOscillator();
                            const g = audioCtx.createGain();
                            o.connect(g); g.connect(masterGain);
                            o.frequency.setValueAtTime(f, audioCtx.currentTime + i * 0.1);
                            g.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.1);
                            g.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + i * 0.1 + 0.02);
                            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.5);
                            o.start(audioCtx.currentTime + i * 0.1); o.stop(audioCtx.currentTime + i * 0.1 + 0.5);
                        });
                        break;
                    case 'save': // صوت "كاشير" إلكتروني سريع
                        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(2400, audioCtx.currentTime + 0.1);
                        osc.type = 'square';
                        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
                        break;
                    case 'error': // صوت تحذيري عميق
                        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                        osc.type = 'triangle';
                        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
                        break;
                }
            } catch (e) { console.log('Audio error:', e); }
        }

        // نظام الأمان المطور وحماية القفل الذكي
        window._isAppUnlocked = false;
        let isCheckingPassword = false;

        let idleTimer;
        function resetIdleTimer() {
            clearTimeout(idleTimer);
            const minutes = parseInt(AppStorage.getItem('autoLockTimer') || '0');
            if (minutes > 0 && AppStorage.getItem('passwordEnabled') === 'true' && window._isAppUnlocked) {
                idleTimer = setTimeout(() => {
                    window._isAppUnlocked = false;
                    checkPassword();
                }, minutes * 60000);
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (AppStorage.getItem('lockOnHide') === 'true' && AppStorage.getItem('passwordEnabled') === 'true') {
                    window._isAppUnlocked = false;
                }
            } else if (document.visibilityState === 'visible') {
                if (AppStorage.getItem('lockOnHide') === 'true' && AppStorage.getItem('passwordEnabled') === 'true' && !window._isAppUnlocked) {
                    checkPassword();
                }
            }
        });

        // رصد النشاط لإعادة ضبط مؤقت الخمول
        ['mousedown', 'touchstart', 'keypress', 'scroll'].forEach(evt =>
            document.addEventListener(evt, resetIdleTimer, true)
        );

        function loadSettings() {
            // فرض الوضع الفاتح دائماً عند بدء التطبيق كخيار إجباري أساسي
            const savedTheme = 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            AppStorage.setItem('theme', 'light');

            const iconClass = 'fas fa-moon';
            if (document.querySelector('#mode-toggle-btn i')) document.querySelector('#mode-toggle-btn i').className = iconClass;
            if (document.querySelector('#header-mode-toggle i')) document.querySelector('#header-mode-toggle i').className = iconClass;

            const savedColorTheme = AppStorage.getItem('colorTheme') || 'blue';
            changeThemeColor(savedColorTheme);

            // تمييز اللون المختار في الإعدادات
            document.querySelectorAll('.color-circle').forEach(el => {
                if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${savedColorTheme}'`)) {
                    el.classList.add('active');
                }
            });

            const savedCurrency = AppStorage.getItem('selectedCurrency') || 'egp';
            if (document.getElementById('currency-select')) document.getElementById('currency-select').value = savedCurrency;
            updateCurrency(savedCurrency);

            if (document.getElementById('exchange-rate')) document.getElementById('exchange-rate').value = AppStorage.getItem('exchangeRate') || '';
            if (document.getElementById('system-total-input')) document.getElementById('system-total-input').value = AppStorage.getItem('systemTotal') || '';

            const savedLanguage = AppStorage.getItem('selectedLanguage') || 'ar';
            if (document.getElementById('language-select')) document.getElementById('language-select').value = savedLanguage;
            updateLanguage(savedLanguage);

            const soundEnabled = AppStorage.getItem('soundEnabled') !== 'false';
            if (document.getElementById('sound-toggle')) document.getElementById('sound-toggle').checked = soundEnabled;

            // 1. استعادة إعدادات إخفاء العملات وتثبيت الـ Checkbox
            if (document.getElementById('hide-coin-1')) {
                document.getElementById('hide-coin-1').checked = AppStorage.getItem('hide_coin_1') === 'true';
            }
            if (document.getElementById('hide-coin-05')) {
                document.getElementById('hide-coin-05').checked = AppStorage.getItem('hide_coin_05') === 'true';
            }
            if (document.getElementById('hide-coin-025')) {
                document.getElementById('hide-coin-025').checked = AppStorage.getItem('hide_coin_025') === 'true';
            }

            // 2. استعادة إعدادات الأمان وكلمة المرور
            const savedPassword = AppStorage.getItem('appPassword') || '';
            if (document.getElementById('password-input')) {
                document.getElementById('password-input').value = savedPassword;
            }
            if (document.getElementById('enable-password')) {
                document.getElementById('enable-password').checked = AppStorage.getItem('passwordEnabled') === 'true';
            }
            if (document.getElementById('lock-on-hide')) {
                document.getElementById('lock-on-hide').checked = AppStorage.getItem('lockOnHide') === 'true';
            }
            if (document.getElementById('auto-lock-timer')) {
                document.getElementById('auto-lock-timer').value = AppStorage.getItem('autoLockTimer') || '0';
            }

            // 3. الحفظ التلقائي الفوري
            const autosaveEnabled = AppStorage.getItem('autosaveEnabled') !== 'false';
            const autosaveEl = document.getElementById('autosave-toggle');
            if (autosaveEl) {
                autosaveEl.checked = autosaveEnabled;
                autosaveEl.onchange = (e) => {
                    AppStorage.setItem('autosaveEnabled', e.target.checked.toString());
                    if (e.target.checked) {
                        saveInputs();
                        playSound('success');
                    }
                };
            }

            // 4. استعادة حالة إظهار/إخفاء كارت العهدة ومبيعات النظام
            const showCustodyCard = AppStorage.getItem('showCustodyCard') === 'true';
            const custodyCardEl = document.getElementById('custody-card');
            if (custodyCardEl) {
                custodyCardEl.style.display = showCustodyCard ? 'block' : 'none';
            }
            const custodyToggle1 = document.getElementById('show-custody-card-toggle');
            const custodyToggle2 = document.getElementById('show-custody-card-toggle-data');
            if (custodyToggle1) custodyToggle1.checked = showCustodyCard;
            if (custodyToggle2) custodyToggle2.checked = showCustodyCard;
        }

        window.toggleCustodyCardVisibility = function (isVisible) {
            const card = document.getElementById('custody-card');
            if (card) {
                card.style.display = isVisible ? 'block' : 'none';
                if (isVisible) {
                    calculateTotal();
                }
            }
            AppStorage.setItem('showCustodyCard', isVisible ? 'true' : 'false');

            const toggle1 = document.getElementById('show-custody-card-toggle');
            const toggle2 = document.getElementById('show-custody-card-toggle-data');
            if (toggle1) toggle1.checked = isVisible;
            if (toggle2) toggle2.checked = isVisible;

            playSound(isVisible ? 'success' : 'trash');
            Swal.fire({
                icon: isVisible ? 'success' : 'info',
                title: isVisible ? 'تم تفعيل كارت العهدة ✅' : 'تم إخفاء كارت العهدة 👁️',
                text: isVisible ? 'يظهر كارت مطابقة العهدة (مبيعات السيستم) الآن في الشاشة الرئيسية.' : 'تم إخفاء كارت مطابقة العهدة من الشاشة الرئيسية، ويمكنك تفعيله في أي وقت من الإعدادات.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
        };
        function loadTheme() { loadSettings(); }

        // استدعاء دالة فحص كلمة المرور الموحدة في الأسفل

        // توليد سريال فريد للجهاز
        function generateDeviceSerial() {
            let serial = AppStorage.getItem('deviceSerial');
            if (!serial) {
                const chars = 'ABCDEF0123456789';
                const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                serial = `CASH-${part()}-${part()}-${part()}`;
                AppStorage.setItem('deviceSerial', serial);
            }
            return serial;
        }

        function copySerial() {
            const serialInput = document.getElementById('user-serial-display');
            const serial = AppStorage.getItem('deviceSerial') || (serialInput ? serialInput.value : '');
            if (!serial) return;

            const notifyCopied = () => {
                playSound('success');
                Swal.fire({
                    icon: 'success',
                    title: 'تم نسخ معرف الجهاز بنجاح ✅',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(serial).then(notifyCopied).catch(() => {
                    if (serialInput) {
                        serialInput.select();
                        document.execCommand('copy');
                        notifyCopied();
                    }
                });
            } else if (serialInput) {
                serialInput.select();
                document.execCommand('copy');
                notifyCopied();
            }
        }

        function checkUserProfile() {
            const userName = AppStorage.getItem('userName');
            const userPhone = AppStorage.getItem('userPhone');

            if (!AppStorage.getItem('joinDate')) {
                AppStorage.setItem('joinDate', new Date().toLocaleDateString('ar-EG'));
            }

            // إذا لم يكن الاسم أو الهاتف مسجلاً، اطلب كلاهما
            if (!userName || !userPhone) {
                Swal.fire({
                    title: 'مرحباً بك في حاسبة النقد! 👋',
                    html: `
                        <div style="text-align: right; direction: rtl; padding: 10px;">
                            <p style="font-size: 0.95em; color: var(--secondary-color); margin-bottom: 20px;">يرجى إدخال بياناتك الأساسية للبدء:</p>
                            
                            <label style="display:block; margin-bottom:5px; font-size:0.85em; color:#FFD700;">الاسم بالكامل:</label>
                            <input id="swal-input-name" class="swal2-input" style="width:100%; margin:0 0 15px 0;" placeholder="أدخل اسمك هنا..." value="${userName || ''}">
                            
                            <label style="display:block; margin-bottom:5px; font-size:0.85em; color:#FFD700;">رقم الهاتف (واتساب):</label>
                            <input id="swal-input-phone" class="swal2-input" type="tel" style="width:100%; margin:0; direction:ltr; text-align:right;" placeholder="01xxxxxxxxx" value="${userPhone || ''}">
                            
                            <p style="font-size: 0.75em; color: rgba(255,215,0,0.5); margin-top: 15px;">* سيتم استخدام هذه البيانات في التقارير والواتساب.</p>
                        </div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    confirmButtonText: 'بدء الاستخدام',
                    confirmButtonColor: 'var(--primary-color)',
                    preConfirm: () => {
                        const name = document.getElementById('swal-input-name').value;
                        const phone = document.getElementById('swal-input-phone').value;
                        if (!name || !phone) {
                            Swal.showValidationMessage('الرجاء إدخال الاسم ورقم الهاتف!');
                            return false;
                        }
                        return { name: name, phone: phone };
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        AppStorage.setItem('userName', result.value.name);
                        AppStorage.setItem('userPhone', result.value.phone);
                        updateWelcomeMessage();
                        Swal.fire('تم!', 'أهلاً بك في حاسبة النقد الاحترافية', 'success');
                    }
                });
            } else {
                updateWelcomeMessage();
            }
        }

        function updateWelcomeMessage() {
            const name = AppStorage.getItem('userName') || 'عمرو إيهاب';
            const role = AppStorage.getItem('userRole') || 'مدير الحسابات';
            const avatar = AppStorage.getItem('userAvatar') || '👑';
            const avatarImage = AppStorage.getItem('userAvatarImage');

            const avatarRender = avatarImage
                ? `<img src="${avatarImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                : avatar;

            const welcomeMsgElem = document.getElementById('welcome-msg');
            if (welcomeMsgElem) {
                welcomeMsgElem.innerHTML = `
                    <div class="user-greeting-avatar">${avatarRender}</div>
                    <div class="user-greeting-info">
                        <span class="user-greeting-name">مرحباً، ${name} 👋</span>
                        <span class="user-greeting-role">${role}</span>
                    </div>
                `;
                welcomeMsgElem.onclick = () => {
                    handleBottomNav('settings', document.querySelectorAll('.nav-item')[2]);
                    switchTabByName('profile');
                };
            }

            const nameInput = document.getElementById('user-name-input');
            if (nameInput) nameInput.value = name;
            const roleInput = document.getElementById('user-role-input');
            if (roleInput) roleInput.value = role;
            const phoneInput = document.getElementById('user-phone-input');
            if (phoneInput) phoneInput.value = AppStorage.getItem('userPhone') || '';
            const emailInput = document.getElementById('user-email-input');
            if (emailInput) emailInput.value = AppStorage.getItem('userEmail') || '';

            // تحديث السريال في الواجهة
            const serial = generateDeviceSerial();
            const serialEl = document.getElementById('user-serial-display');
            if (serialEl) serialEl.value = serial;

            const currentAvatarEl = document.getElementById('current-avatar');
            if (currentAvatarEl) currentAvatarEl.innerHTML = avatarRender;

            const joinDateEl = document.getElementById('join-date-display');
            if (joinDateEl) joinDateEl.textContent = AppStorage.getItem('joinDate') || new Date().toLocaleDateString('ar-EG');

            try {
                const history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
                const recordsCountEl = document.getElementById('user-records-count');
                if (recordsCountEl) recordsCountEl.textContent = history.length;
            } catch (e) { }
        }

        function showAvatarOptions() {
            const selector = document.getElementById('avatar-selector');
            if (selector) selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
        }

        // توافق مع الكود القديم إن وجد
        function toggleAvatarSelection() { showAvatarOptions(); }

        function selectAvatar(avatar) {
            AppStorage.setItem('userAvatar', avatar);
            AppStorage.removeItem('userAvatarImage'); // إزالة الصورة القديمة إن وُجدت
            updateWelcomeMessage();
            document.getElementById('avatar-selector').style.display = 'none';
        }

        function triggerImageUpload() {
            document.getElementById('avatar-upload-input').click();
        }

        // ربط حفظ بيانات الملف الشخصي والحساب التلقائي والفوري
        document.addEventListener('DOMContentLoaded', () => {
            const nameInp = document.getElementById('user-name-input');
            const roleInp = document.getElementById('user-role-input');
            const phoneInp = document.getElementById('user-phone-input');
            const emailInp = document.getElementById('user-email-input');
            const saveBtn = document.getElementById('save-account-btn');

            const saveProfileData = () => {
                if (nameInp && nameInp.value.trim()) AppStorage.setItem('userName', nameInp.value.trim());
                if (roleInp && roleInp.value.trim()) AppStorage.setItem('userRole', roleInp.value.trim());
                if (phoneInp && phoneInp.value.trim()) AppStorage.setItem('userPhone', phoneInp.value.trim());
                if (emailInp && emailInp.value.trim()) AppStorage.setItem('userEmail', emailInp.value.trim());
                updateWelcomeMessage();
            };

            [nameInp, roleInp, phoneInp, emailInp].forEach(inp => {
                if (inp) {
                    inp.addEventListener('input', saveProfileData);
                    inp.addEventListener('change', saveProfileData);
                }
            });

            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    saveProfileData();
                    Swal.fire({
                        icon: 'success',
                        title: 'تم حفظ البيانات بنجاح ✅',
                        timer: 1500,
                        showConfirmButton: false,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                    });
                    playSound('success');
                });
            }
        });

        // --- 📢 نظام مركز الإشعارات والتحديثات الشامل (Notification & Updates Center) 📢 ---
        const APP_UPDATES_HISTORY = [
            {
                version: "6.0.0",
                date: "2026/10/22",
                badge: "⭐ الإصدار الموحد الشامل",
                title: "الإصدار الموحد V6.0.0 الشامل لكافة الأجهزة والأنظمة",
                items: [
                    "توحيد رقم الإصدار الشامل V6.0.0 على مستوى النظام بالكامل.",
                    "تفعيل زر التراجع الذكي (Undo) لحماية بيانات الكاشير واستعادة الأرقام فوراً عند التصفير بالخطأ.",
                    "تقرير تقفيل الخزينة والوردية الفوري لواتساب بصيغة مالية رسمية وتفقيط عربي دقيق ومطابقة العهدة.",
                    "لوحة إحصائيات تقفيل اليوم والوردية في السجل (إجمالي المقبوضات، عدد العمليات، أعلى جرد).",
                    "زر ملء الشاشة الكامل (Fullscreen Mode) لتحويل التطبيق لتطبيق موبايل أصلي 100%.",
                    "مركز الإشعارات والتحديثات السحابية الشامل مع سجل تواريخ التحديثات والأحدث دائماً في الأعلى.",
                    "ضبط مسافات الأيقونات في الملف الشخصي وإلغاء أي تداخل للنصوص تماماً."
                ]
            },
            {
                version: "5.4.3",
                date: "2026/10/22",
                badge: "مستقر",
                title: "تحسينات واجهة المستخدم ولوحة الأرقام",
                items: [
                    "حل مشكلة ألوان لوحة الأرقام (Numpad) في الوضع الفاتح والداكن وضمان وضوح كامل.",
                    "إلغاء الإطارات المزدوجة في الملف الشخصي وفصل الأيقونات بمسافة كافية عن النصوص.",
                    "إعادة توزيع أزرار ترحيل الناتج في الحاسبة (فودافون كاش، إنستا باي، العهدة) لتناسب الهواتف دون أي خروج للكلام.",
                    "ضبط مربع معرف الجهاز (ID) وإظهار زر النسخ [نسخ] كاملاً بنسبة 100%."
                ]
            },
            {
                version: "5.4.2",
                date: "2026/10/22",
                badge: "مستقر",
                title: "ضبط شريط التحكم العلوي ومربع التاريخ",
                items: [
                    "حل مشكلة تآكل أطراف مربع التاريخ على الهواتف الذكية وضمان وضوح الأيقونة والحدود.",
                    "تضمين كافة المكتبات والخطوط محلياً ليعمل التطبيق بدون إنترنت 100% Offline."
                ]
            },
            {
                version: "5.4.1",
                date: "2026/10/21",
                badge: "مستقر",
                title: "تطوير الحماية والاستجابة اللمسية",
                items: [
                    "حل حلقة فحص كلمة المرور المتكررة ودعم كود الطوارئ (500).",
                    "إلغاء أي تأخير في الاستجابة اللمسية (0ms Tap Delay) وسلاسة النوافذ."
                ]
            },
            {
                version: "5.4.0",
                date: "2026/10/20",
                badge: "إصدار رئيسي",
                title: "إطلاق الثيم الملكي والآلة الحاسبة الاحترافية",
                items: [
                    "إطلاق الوضع الفاتح والداكن الملكي بتصميم بنكي عصري ومريح للعين.",
                    "إضافة الآلة الحاسبة المتقدمة وسجل العمليات الحسابية وإيصال الكاشير الحراري."
                ]
            }
        ];

        let currentCloudNotification = null;

        async function checkForCloudNotifications(isManualClick = false) {
            const badge = document.getElementById('notif-badge');
            try {
                const response = await fetch(`./notifications.json?_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.enabled) {
                        currentCloudNotification = data;
                        const lastSeenId = AppStorage.getItem('last_seen_notification_id');
                        const isNew = lastSeenId !== data.id;

                        if (badge) {
                            badge.style.display = isNew ? 'block' : 'none';
                        }

                        if (isManualClick || isNew) {
                            showNotificationCenterModal(data);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.log('[Notifications] وضع عدم الاتصال حالياً');
            }

            if (isManualClick) {
                showNotificationCenterModal(currentCloudNotification);
            }
        }

        function showNotificationCenterModal(cloudData = null) {
            const badge = document.getElementById('notif-badge');
            playSound('success');

            let announcementHTML = '';
            const activeNotif = cloudData || currentCloudNotification;
            if (activeNotif && activeNotif.enabled) {
                announcementHTML = `
                    <div class="notif-center-announcement">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="background: rgba(239, 68, 68, 0.15); color: #DC2626; padding: 3px 10px; border-radius: 8px; font-size: 0.82em; font-weight: 850; border: 1px solid rgba(239, 68, 68, 0.3);">
                                ${activeNotif.badge || '📢 تنبيه إداري عاجل'}
                            </span>
                            ${activeNotif.date ? `<span style="font-size: 0.8em; color: var(--text-muted); font-weight: 700;">📅 بتاريخ ${activeNotif.date}</span>` : ''}
                        </div>
                        <h4 style="margin: 0 0 6px 0; font-size: 1em; font-weight: 900; color: #DC2626;">${activeNotif.title || 'إشعار جديد'}</h4>
                        <p style="margin: 0; font-size: 0.9em; line-height: 1.6; color: var(--text-color); font-weight: 750;">
                            ${activeNotif.message}
                        </p>
                    </div>
                `;
            }

            const dynamicUpdates = (activeNotif && Array.isArray(activeNotif.updates)) ? activeNotif.updates : [];
            const allUpdates = [...dynamicUpdates, ...APP_UPDATES_HISTORY];

            const updatesHTML = allUpdates.map((up, index) => {
                // فتح أحدث إصدار افتراضياً وطي الإصدارات السابقة لتبقى النافذة أنيقة ومدمجة
                const isOpen = index === 0 ? 'open' : '';
                return `
                    <details class="update-history-card" ${isOpen}>
                        <summary class="update-card-summary">
                            <div class="update-card-top-row">
                                <span class="update-version-badge">الإصدار v${up.version} • ${up.badge || 'تحديث جديد'}</span>
                                <span class="update-date-badge">📅 ${up.date || 'اليوم'}</span>
                            </div>
                            <div class="update-card-title-row">
                                <h4 class="update-card-title">${up.title}</h4>
                                <span class="update-card-chevron"><i class="fas fa-chevron-down"></i></span>
                            </div>
                        </summary>
                        <div class="update-card-content">
                            <ul class="update-card-list">
                                ${(up.items || []).map(item => `
                                    <li>
                                        <span class="check-bullet">✅</span>
                                        <span class="item-text">${item}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </details>
                `;
            }).join('');

            Swal.fire({
                title: '🔔 مركز الإشعارات والتحديثات',
                customClass: {
                    popup: 'notif-center-swal-popup'
                },
                html: `
                    <div class="notif-center-container">
                        ${announcementHTML}
                        <div style="font-size: 0.82em; font-weight: 850; color: var(--text-muted); margin: 4px 0 10px; text-align: right; display: flex; align-items: center; justify-content: space-between;">
                            <span>📋 سجل التحديثات الرسمية:</span>
                            <span style="font-size: 0.85em; opacity: 0.8;">(اضغط على العنوان للفتح / الغلق)</span>
                        </div>
                        ${updatesHTML}
                    </div>
                `,
                confirmButtonText: 'إغلاق مركز الإشعارات ✅',
                confirmButtonColor: 'var(--primary-color)',
                background: 'var(--card-background)',
                color: 'var(--text-color)',
                showCloseButton: true
            }).then(() => {
                if (activeNotif && activeNotif.id) {
                    AppStorage.setItem('last_seen_notification_id', activeNotif.id);
                }
                if (badge) badge.style.display = 'none';
            });
        }

        // ربط زر الجرس في الهيدر العلوي
        document.getElementById('notifications-btn')?.addEventListener('click', () => {
            checkForCloudNotifications(true);
        });

        // --- ⛶ زر ووظيفة ملء الشاشة الكامل (Fullscreen Mode) ⛶ ---
        function toggleFullScreen() {
            try {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
                    const docEl = document.documentElement;
                    if (docEl.requestFullscreen) {
                        docEl.requestFullscreen().catch(() => {});
                    } else if (docEl.webkitRequestFullscreen) {
                        docEl.webkitRequestFullscreen();
                    } else if (docEl.mozRequestFullScreen) {
                        docEl.mozRequestFullScreen();
                    } else if (docEl.msRequestFullscreen) {
                        docEl.msRequestFullscreen();
                    }
                    updateFullscreenIcons(true);
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    updateFullscreenIcons(false);
                }
            } catch (err) {
                console.warn('Fullscreen not supported or blocked:', err);
            }
        }
        window.toggleFullScreen = toggleFullScreen;

        function updateFullscreenIcons(isFullscreen) {
            const btn = document.getElementById('fullscreen-btn');
            if (btn) {
                btn.innerHTML = isFullscreen ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
                btn.title = isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة الكامل';
            }
        }

        document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullScreen);
        document.addEventListener('fullscreenchange', () => {
            updateFullscreenIcons(!!document.fullscreenElement);
        });
        document.addEventListener('webkitfullscreenchange', () => {
            updateFullscreenIcons(!!document.webkitFullscreenElement);
        });

        // تشغيل التحقق التلقائي عند بدء التطبيق واستعادة الاتصال
        window.addEventListener('load', () => {
            setTimeout(() => checkForCloudNotifications(false), 1500);
        });
        window.addEventListener('online', () => {
            checkForCloudNotifications(false);
        });

        document.getElementById('avatar-upload-input')?.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imgData = e.target.result;
                    AppStorage.setItem('userAvatarImage', imgData);
                    AppStorage.setItem('userAvatar', ''); // تصفير الإيموجي
                    updateWelcomeMessage();
                    document.getElementById('avatar-selector').style.display = 'none';
                    Swal.fire({
                        icon: 'success',
                        title: 'تم تحديث الصورة الشخصية ✅',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000,
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        // منطق تبديل العين (إظهار/إخفاآ كلمة المرور)
        document.getElementById('toggle-password-eye')?.addEventListener('click', function () {
            const passInput = document.getElementById('password-input');
            const icon = this;
            if (passInput.type === 'password') {
                passInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                icon.style.color = '#FFD700';
            } else {
                passInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.style.color = 'rgba(255,215,0,0.5)';
            }
        });

        // دالة التحكم في شريط التنقل السفلي
        function handleBottomNav(target, btnElement) {
            // تحديث الحالة النشطة للأزرار
            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');

            const calcCard = document.getElementById('calculator-card');
            const historyCard = document.getElementById('history-card');
            const settingsModal = document.getElementById('settings-modal');

            // إعادة تعيين العرض الافتراضي (إظهار الكل مؤقتاً)
            calcCard.style.display = 'block';
            historyCard.style.display = 'block';

            switch (target) {
                case 'home':
                    settingsModal.style.display = 'none';
                    document.getElementById('math-calc-card').style.display = 'none';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'math':
                    calcCard.style.display = 'none';
                    historyCard.style.display = 'none';
                    settingsModal.style.display = 'none';
                    document.getElementById('math-calc-card').style.display = 'block';
                    updateMathHistoryUI();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'digital':
                    historyCard.style.display = 'none';
                    settingsModal.style.display = 'none';
                    document.getElementById('math-calc-card').style.display = 'none';
                    document.querySelector('.digital-wallet').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                case 'stats':
                    settingsModal.style.display = 'flex';
                    document.getElementById('math-calc-card').style.display = 'none';
                    switchTab('stats');
                    break;
                case 'profile':
                    settingsModal.style.display = 'flex';
                    document.getElementById('math-calc-card').style.display = 'none';
                    switchTab('account');
                    break;
                case 'settings':
                    settingsModal.style.display = 'flex';
                    document.getElementById('math-calc-card').style.display = 'none';
                    switchTab('general');
                    break;
            }
        }

        document.getElementById('save-account-btn').addEventListener('click', () => {
            const name = document.getElementById('user-name-input').value;
            const phone = document.getElementById('user-phone-input').value.trim();
            const role = document.getElementById('user-role-input').value;
            const email = document.getElementById('user-email-input').value;
            const avatar = document.getElementById('current-avatar').textContent;

            if (!name) {
                Swal.fire('تنبيه', 'الاسم مطلوب', 'warning');
                return;
            }

            // التحقق من صحة رقم الهاتف (11 رقم للمحلي، أو تنسيق دولي)
            if (phone) {
                // التحقق مما إذا كان الرقم دولياً (يبدأ بـ + أو 00)
                const isInternational = phone.startsWith('+') || phone.startsWith('00');
                // استخراج الأرقام فقط للتحقق من الطول
                const numericPhone = phone.replace(/[^\d]/g, '');

                if (isInternational) {
                    // الأرقام الدولية تتراوح عادة بين 7 إلى 15 رقم
                    if (numericPhone.length < 7 || numericPhone.length > 15) {
                        Swal.fire('تنبيه', 'رقم الهاتف الدولي يبدو غير صحيح (تأكد من كود الدولة والطول).', 'warning');
                        return;
                    }
                } else {
                    // للأرقام المحلية (مثل مصر)، يجب أن يكون 11 رقم بالضبط
                    if (numericPhone.length !== 11) {
                        Swal.fire('تنبيه', 'رقم الهاتف المحلي يجب أن يتكون من 11 رقم بالضبط.\nللأرقام الدولية استخدم كود الدولة (+).', 'warning');
                        return;
                    }
                }
            }

            AppStorage.setItem('userName', name);
            AppStorage.setItem('userPhone', phone);
            AppStorage.setItem('userRole', role);
            AppStorage.setItem('userEmail', email);
            AppStorage.setItem('userAvatar', avatar);

            updateWelcomeMessage();
            Swal.fire('تم الحفظ', 'تم تحديث الملف الشخصي بنجاح', 'success');
        });

        // عرض سجل الدخول عند الضغط مرتين على "سجلات"
        document.getElementById('login-history-trigger').addEventListener('dblclick', () => {
            let logs = JSON.parse(AppStorage.getItem('appLoginLogs') || '[]');
            if (logs.length === 0) {
                // إذا كان السجل فارغاً (لأول مرة)، نسجل الوقت الحالي فوراً لعرضه
                const now = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium' });
                logs.unshift(now);
                AppStorage.setItem('appLoginLogs', JSON.stringify(logs));
            }
            const logHtml = logs.map(log => `<div style="padding: 8px; border-bottom: 1px solid var(--border-color); text-align: right; font-size: 0.9em;">📅 ${log}</div>`).join('');
            Swal.fire({
                title: '🕒 سجل الدخول للتطبيق',
                html: `<div style="max-height: 300px; overflow-y: auto;">${logHtml}</div>`,
                showDenyButton: true,
                denyButtonText: 'مسح السجل',
                denyButtonColor: '#dc3545',
                confirmButtonText: 'إغلاق'
            }).then((result) => {
                if (result.isDenied) {
                    AppStorage.removeItem('appLoginLogs');
                    Swal.fire('تم', 'تم مسح سجل الدخول بنجاح', 'success');
                }
            });
        });
        ;

        // --- منطق الآلة الحاسبة الرياضية متطور (مع سجل) ---
        let mathCurrentInput = '0';
        let mathExpression = '';
        let mathHistory = [];

        // تحميل السجل عند البدء
        try {
            mathHistory = JSON.parse(AppStorage.getItem('mathCalculatorHistory') || '[]');
        } catch (e) { console.error('Error loading math history', e); }

        function updateMathHistoryUI() {
            const container = document.getElementById('math-history-container');
            const list = document.getElementById('math-history-list');

            if (mathHistory.length === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            list.innerHTML = '';

            mathHistory.forEach(item => {
                const li = document.createElement('li');
                li.style.cssText = "padding: 8px 0; border-bottom: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
                li.innerHTML = `
                    <span style="direction: ltr; font-family: monospace; opacity: 0.8;">${item.expr} =</span>
                    <span style="font-weight: bold; color: var(--primary-color);">${item.res}</span>
                `;
                li.onclick = () => {
                    // عند الضغط على سجل، يتم استدعاء النتيجة
                    mathCurrentInput = item.res;
                    document.getElementById('math-result').textContent = mathCurrentInput;
                    playSound('tick');
                };
                list.appendChild(li);
            });
        }

        function clearMathHistory() {
            mathHistory = [];
            AppStorage.removeItem('mathCalculatorHistory');
            updateMathHistoryUI();
            playSound('error'); // صوت المسح
        }

        function mathCalc(btnValue) {
            const display = document.getElementById('math-result');
            const expressionDisplay = document.getElementById('math-expression');

            if (btnValue === 'C') {
                mathCurrentInput = '0';
                mathExpression = '';
            } else if (btnValue === 'DEL') {
                if (mathCurrentInput.length > 1) {
                    mathCurrentInput = mathCurrentInput.slice(0, -1);
                } else {
                    mathCurrentInput = '0';
                }
            } else if (btnValue === '=') {
                try {
                    // تحسين بسيط للأمان: السماح فقط بالأرقام والعمليات الحسابية
                    const fullExpression = (mathExpression + mathCurrentInput).replace(/[^0-9+\-*/.%]/g, '');

                    if (!fullExpression) return;

                    const result = eval(fullExpression);

                    // إضافة للسجل
                    if (!isNaN(result)) {
                        const record = {
                            expr: fullExpression,
                            res: String(result),
                            time: new Date().getTime()
                        };
                        mathHistory.unshift(record);
                        if (mathHistory.length > 20) mathHistory.pop(); // الاحتفاظ بآخر 20 عملية فقط
                        AppStorage.setItem('mathCalculatorHistory', JSON.stringify(mathHistory));
                        updateMathHistoryUI();
                    }

                    mathCurrentInput = String(result);
                    mathExpression = '';
                } catch (e) {
                    mathCurrentInput = 'Error';
                    mathExpression = '';
                }
            } else if (['+', '-', '*', '/', '%'].includes(btnValue)) {
                mathExpression += mathCurrentInput + btnValue;
                mathCurrentInput = '0';
            } else {
                if (mathCurrentInput === '0' && btnValue !== '.') {
                    mathCurrentInput = btnValue;
                } else {
                    mathCurrentInput += btnValue;
                }
            }

            display.textContent = mathCurrentInput;
            expressionDisplay.textContent = mathExpression;
            playSound('tick');
        }

        async function checkPassword() {
            const isPasswordEnabled = AppStorage.getItem('passwordEnabled') === 'true';
            const appPassword = (AppStorage.getItem('appPassword') || '').trim();
            if (!isPasswordEnabled || !appPassword) {
                window._isAppUnlocked = true;
                return true;
            }

            if (window._isAppUnlocked) return true;
            if (isCheckingPassword) return true;
            isCheckingPassword = true;

            // التأكد من توفر مكتبة التنبيهات حتى في أصعب الظروف
            if (typeof Swal === 'undefined') {
                const entered = prompt('🔒 حماية التطبيق - يرجى إدخال كلمة المرور:');
                if (entered && entered.trim() === appPassword) {
                    window._isAppUnlocked = true;
                    isCheckingPassword = false;
                    AppStorage.removeItem('forceLock');
                    return true;
                }
                isCheckingPassword = false;
                return false;
            }

            while (true) {
                const result = await Swal.fire({
                    title: '🔒 حماية كلمة المرور',
                    html: `
                        <p style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 15px;">الرجاء إدخال كلمة المرور للمتابعة:</p>
                        <div style="position: relative; width: 100%; max-width: 300px; margin: 0 auto;">
                            <input id="swal-password-input" type="password" placeholder="أدخل كلمة المرور"
                                style="width: 100%; padding: 12px 42px 12px 15px; border-radius: 14px; border: 1.5px solid var(--border-color); background: var(--input-bg); color: var(--text-color); font-size: 1.1em; outline: none; box-sizing: border-box; text-align: center;">
                            <i id="swal-eye-btn" class="fas fa-eye"
                                style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--primary-color); cursor: pointer; font-size: 1.2em; transition: all 0.2s;"></i>
                        </div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showDenyButton: true,
                    denyButtonText: 'هل نسيت كلمة المرور؟',
                    denyButtonColor: '#6c757d',
                    confirmButtonText: 'دخول 🔓',
                    confirmButtonColor: 'var(--primary-color)',
                    background: 'var(--card-background)',
                    color: 'var(--text-color)',
                    didOpen: () => {
                        const passInput = document.getElementById('swal-password-input');
                        const eyeBtn = document.getElementById('swal-eye-btn');
                        if (passInput) passInput.focus();

                        if (eyeBtn && passInput) {
                            eyeBtn.addEventListener('click', () => {
                                if (passInput.type === 'password') {
                                    passInput.type = 'text';
                                    eyeBtn.classList.remove('fa-eye');
                                    eyeBtn.classList.add('fa-eye-slash');
                                } else {
                                    passInput.type = 'password';
                                    eyeBtn.classList.remove('fa-eye-slash');
                                    eyeBtn.classList.add('fa-eye');
                                }
                            });

                            passInput.addEventListener('keypress', (e) => {
                                if (e.key === 'Enter') {
                                    Swal.clickConfirm();
                                }
                            });
                        }
                    },
                    preConfirm: () => {
                        const passInput = document.getElementById('swal-password-input');
                        const entered = passInput ? passInput.value : '';
                        if (!entered) {
                            Swal.showValidationMessage('يرجى كتابة كلمة المرور');
                            return false;
                        }
                        return entered;
                    }
                });

                if (result.isConfirmed) {
                    const enteredPassword = (result.value || '').trim();
                    if (enteredPassword === appPassword) {
                        window._isAppUnlocked = true;
                        isCheckingPassword = false;
                        AppStorage.removeItem('forceLock');
                        playSound('success');
                        resetIdleTimer();
                        return true;
                    } else {
                        playSound('error');
                        await Swal.fire({
                            title: 'خطأ',
                            text: 'كلمة المرور غير صحيحة! يرجى إعادة المحاولة.',
                            icon: 'error',
                            confirmButtonText: 'حاول مجدداً',
                            confirmButtonColor: 'var(--primary-color)',
                            background: 'var(--card-background)',
                            color: 'var(--text-color)'
                        });
                        // يتابع داخل الحلقة التكرارية لفتح حقل الإدخال فوراً دون إعادة تحميل
                    }
                } else if (result.isDenied) {
                    const { value: code } = await Swal.fire({
                        title: 'استعادة الدخول 🔑',
                        text: 'أدخل كود الطوارئ لفتح التطبيق:',
                        input: 'text',
                        confirmButtonText: 'تحقق',
                        confirmButtonColor: 'var(--primary-color)',
                        showCancelButton: true,
                        cancelButtonText: 'رجوع',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                    });
                    if (code === '500') {
                        window._isAppUnlocked = true;
                        isCheckingPassword = false;
                        AppStorage.removeItem('forceLock');
                        playSound('success');
                        await Swal.fire({
                            title: 'تم بنجاح ✅',
                            text: 'تم الدخول بكود الطوارئ وإلغاء القفل مؤقتاً.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                            background: 'var(--card-background)',
                            color: 'var(--text-color)'
                        });
                        resetIdleTimer();
                        return true;
                    } else if (code) {
                        playSound('error');
                        await Swal.fire({
                            title: 'خطأ',
                            text: 'كود الطوارئ غير صحيح!',
                            icon: 'error',
                            confirmButtonText: 'حسناً',
                            background: 'var(--card-background)',
                            color: 'var(--text-color)'
                        });
                    }
                }
            }
        }



        document.addEventListener('DOMContentLoaded', async () => {
            updateWelcomeMessage(); // إظهار بيانات الترحيب فوراً بدون انتظار
            await AppStorage.init(); // Initialize IndexedDB Cache
            updateWelcomeMessage(); // تحديث بعد اكتمال قاعدة البيانات
            const accessGranted = await checkPassword();
            if (!accessGranted) return;

            loadSettings(); // تحميل كافة الإعدادات والسمات وحالة إخفاء العملات والأمان
            loadStoreSettings(); // تحميل بيانات المتجر والإيصال الحراري
            createUI(); // بناء جدول الفئات النقدية (200، 100، 50...)
            loadInputs(); // تحميل المدخلات المحفوظة
            checkUserProfile(); // التحقق من الملف الشخصي والترحيب عند البدء
            updateMathHistoryUI(); // تحميل سجل الحاسبة

            // تعبئة وتزامن تاريخ اليوم تلقائياً مع السجل لمنع أي مساحة فارغة
            const nowDate = new Date();
            const todayISO = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + String(nowDate.getDate()).padStart(2, '0');
            
            const entryDateElem = document.getElementById('entry-date');
            const dateFilterElem = document.getElementById('date-filter-input');
            
            if (entryDateElem && !entryDateElem.value) entryDateElem.value = todayISO;

            // فحص السجلات: إذا وُجدت سجلات لليوم نعرضها، وإن لم توجد لكن توجد سجلات سابقة، نعرض السجلات السابقة فوراً لتفادي الرسالة الفارغة
            let allHistory = [];
            try { allHistory = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]'); } catch (e) {}
            const hasToday = allHistory.some(item => item.simpleDate === todayISO);

            if (hasToday) {
                if (dateFilterElem) dateFilterElem.value = todayISO;
                loadHistory(todayISO);
            } else if (allHistory.length > 0) {
                if (dateFilterElem) dateFilterElem.value = '';
                loadHistory('ALL');
            } else {
                if (dateFilterElem) dateFilterElem.value = todayISO;
                loadHistory(todayISO);
            }

            // ربط تزامن تغيير التاريخ في الأعلى مع السجل
            if (entryDateElem) {
                entryDateElem.addEventListener('change', (e) => {
                    if (dateFilterElem) dateFilterElem.value = e.target.value;
                    loadHistory(e.target.value);
                });
            }

            // تهيئة وتزامن حقول العهدة ومبيعات النظام
            const quickTargetInp = document.getElementById('quick-system-target');
            const sysTotalInp = document.getElementById('system-total-input');
            const savedSysTotal = AppStorage.getItem('systemTotal');
            if (savedSysTotal) {
                if (quickTargetInp) quickTargetInp.value = savedSysTotal;
                if (sysTotalInp) sysTotalInp.value = savedSysTotal;
            }
            if (quickTargetInp) {
                quickTargetInp.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (sysTotalInp) sysTotalInp.value = val;
                    if (val) AppStorage.setItem('systemTotal', val);
                    else AppStorage.removeItem('systemTotal');
                    calculateTotal();
                });
            }
            if (sysTotalInp) {
                sysTotalInp.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (quickTargetInp) quickTargetInp.value = val;
                    if (val) AppStorage.setItem('systemTotal', val);
                    else AppStorage.removeItem('systemTotal');
                    calculateTotal();
                });
            }

            calculateTotal();

            // تسجيل وقت الدخول الحالي تلقائياً
            let loginLogs = JSON.parse(AppStorage.getItem('appLoginLogs') || '[]');

            // إشعار بآخر وقت دخول (Toast) قبل تسجيل الدخول الجديد
            if (loginLogs.length > 0) {
                const lastLogin = loginLogs[0];
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
                Toast.fire({ icon: 'info', title: 'مرحباً بعودتك 👋', text: `آخر دخول: ${lastLogin}` });
            }

            const currentLoginTime = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium' });
            loginLogs.unshift(currentLoginTime);
            if (loginLogs.length > 50) loginLogs = loginLogs.slice(0, 50); // الاحتفاظ بآخر 50 دخول فقط
            AppStorage.setItem('appLoginLogs', JSON.stringify(loginLogs));

            // تفعيل الوضع الافتراضي (الرئيسية)
            handleBottomNav('home', document.querySelector('.nav-item.active'));

            // Load password settings
            document.getElementById('enable-password').checked = AppStorage.getItem('passwordEnabled') === 'true';
            document.getElementById('lock-on-hide').checked = AppStorage.getItem('lockOnHide') === 'true';
            document.getElementById('auto-lock-timer').value = AppStorage.getItem('autoLockTimer') || '0';

            // تنظيف أي حالة قفل سابقة لمنع التكرار نهائياً
            AppStorage.removeItem('forceLock');

            // ضمان وصول دوال الواجهة للأزرار والتنقل
            window.switchTab = switchTab;
            window.switchTabByName = switchTabByName;
            window.handleBottomNav = handleBottomNav;
            window.showThermalReceiptModal = showThermalReceiptModal;

            // نافذة التحديث الجديد التلقائية الفخمة (تظهر مرة واحدة فقط عند كل تحديث جديد)
            const lastSeenVersion = AppStorage.getItem('last_seen_app_update_version');
            if (lastSeenVersion !== CURRENT_APP_VERSION) {
                setTimeout(() => {
                    playSound('success');
                    Swal.fire({
                        title: '🎉 تم إطلاق التحديث الجديد v' + CURRENT_APP_VERSION + '!',
                        html: `
                            <div style="text-align: right; direction: rtl; padding: 4px;">
                                <div style="text-align: center; margin-bottom: 12px;">
                                    <span style="display: inline-block; background: rgba(212,175,55,0.15); color: var(--gold-primary); padding: 5px 16px; border-radius: 14px; font-size: 0.9em; font-weight: 850; border: 1px solid var(--border-color);">
                                        ⭐ أهم مميزات وتحسينات الإصدار v${CURRENT_APP_VERSION}
                                    </span>
                                </div>
                                <div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 14px; margin-bottom: 12px;">
                                    <ul style="margin: 0; padding-right: 20px; font-size: 0.9em; line-height: 1.8; color: var(--text-color); font-weight: 750;">
                                        <li>🔢 <b>لوحة أرقام واضحة تماماً:</b> حل اختفاء الأرقام في الوضع الفاتح وتوفير تباين عالي ووضوح كامل لكل الفئات.</li>
                                        <li>📐 <b>ضبط الشريط العلوي:</b> حل مشكلة تآكل مربع التاريخ وملاءمة كل أحجام الهواتف.</li>
                                        <li>📶 <b>وضع أوفلاين 100%:</b> تشغيل كامل للتطبيق بدون إنترنت نهائياً مع حفظ جميع المكتبات محلياً.</li>
                                        <li>🔒 <b>حماية أمنية مطورة:</b> فك قفل فوري بكلمة المرور دون إعادة تحميل وكود طوارئ (500).</li>
                                        <li>🔔 <b>نظام الإشعارات السحابية:</b> زر جرس جديد لمتابعة أحدث التنبيهات والتحديثات.</li>
                                    </ul>
                                </div>
                                <p style="font-size: 0.85em; text-align: center; color: var(--text-muted); margin: 0; font-weight: 700;">
                                    بياناتك وحساباتك محفوظة دائماً بأمان في قاعدة البيانات 🛡️
                                </p>
                            </div>
                        `,
                        icon: 'success',
                        confirmButtonText: 'استكشف التحديث الآن 🚀',
                        confirmButtonColor: 'var(--primary-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)',
                        showCloseButton: true
                    }).then(() => {
                        AppStorage.setItem('last_seen_app_update_version', CURRENT_APP_VERSION);
                    });
                }, 1200);
            }
        });

        // ---------------------------------------------------------
        // 🔊 محرك الأصوات التفاعلية المطور (Web Audio API Synthesizer) 🔊
        // ---------------------------------------------------------
        window.playSound = function(type = 'tick') {
            const isEnabled = AppStorage.getItem('soundEnabled');
            if (isEnabled === 'false' || isEnabled === false) return;

            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                if (!window._appAudioCtx) window._appAudioCtx = new AudioCtx();
                const ctx = window._appAudioCtx;
                if (ctx.state === 'suspended') ctx.resume();

                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                if (type === 'tick') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1400, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                    osc.start(now);
                    osc.stop(now + 0.04);
                } else if (type === 'success') {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);

                    osc.type = 'triangle';
                    osc2.type = 'sine';

                    osc.frequency.setValueAtTime(523.25, now);
                    osc.frequency.setValueAtTime(659.25, now + 0.08);
                    osc.frequency.setValueAtTime(783.99, now + 0.16);

                    osc2.frequency.setValueAtTime(1046.5, now + 0.16);

                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    gain2.gain.setValueAtTime(0.12, now + 0.16);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                    osc.start(now);
                    osc.stop(now + 0.35);
                    osc2.start(now + 0.16);
                    osc2.stop(now + 0.35);
                } else if (type === 'error') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(280, now);
                    osc.frequency.linearRampToValueAtTime(120, now + 0.15);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now);
                    osc.stop(now + 0.15);
                }
            } catch (e) {
                console.warn('Audio engine notice', e);
            }
        };

        // تفعيل الصوت فور أول لمسة للشاشة
        document.addEventListener('touchstart', () => {
            if (window._appAudioCtx && window._appAudioCtx.state === 'suspended') {
                window._appAudioCtx.resume();
            }
        }, { once: true });
        document.addEventListener('click', () => {
            if (window._appAudioCtx && window._appAudioCtx.state === 'suspended') {
                window._appAudioCtx.resume();
            }
        }, { once: true });

        const soundToggleElem = document.getElementById('sound-toggle');
        if (soundToggleElem) {
            const isSoundOn = AppStorage.getItem('soundEnabled') !== 'false';
            soundToggleElem.checked = isSoundOn;
            soundToggleElem.addEventListener('change', (e) => {
                AppStorage.setItem('soundEnabled', e.target.checked ? 'true' : 'false');
                if (e.target.checked) playSound('success');
            });
        }

        // ---------------------------------------------------------
        // PWA Service Worker ونظام التحديث التلقائي الذكي للإصدارات
        // ---------------------------------------------------------
        const CURRENT_APP_VERSION = '6.0.0';

        // دالة فحص ومقارنة الإصدارات السحابية
        async function checkForAppUpdates() {
            if (!navigator.onLine || !window.location.protocol.startsWith('http')) return;
            try {
                const response = await fetch(`./version.json?_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log(`[UpdateChecker] 🔍 فحص الإصدار: المثبت (${CURRENT_APP_VERSION}) | المنشور (${data.version})`);
                    if (data && data.version && data.version !== CURRENT_APP_VERSION) {
                        console.log(`[UpdateChecker] 🚀 تم اكتشاف إصدار جديد (${data.version})! جاري تحديث Service Worker والبيانات فوراً...`);
                        if ('serviceWorker' in navigator) {
                            const reg = await navigator.serviceWorker.getRegistration();
                            if (reg) {
                                await reg.update();
                            }
                        }
                    }
                }
            } catch (err) {
                console.log('[UpdateChecker] تعذر الوصول لملف الإصدار حالياً:', err.message);
            }
        }

        // تسجيل Service Worker الخارجي (فقط عند التشغيل عبر HTTP/HTTPS)
        if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
                    .then(reg => {
                        console.log(`[PWA v${CURRENT_APP_VERSION}] 📶 Service Worker مسجل بنجاح بنطاق:`, reg.scope);

                        // التحقق المباشر من التحديثات فور تشغيل التطبيق
                        checkForAppUpdates();
                        reg.update();

                        // فحص دوري للتحديثات كل 5 دقائق
                        setInterval(() => {
                            console.log('[PWA] ⏳ فحص دوري للتحديثات الجديدة...');
                            checkForAppUpdates();
                            reg.update();
                        }, 5 * 60 * 1000);

                        // عند عودة اتصال الإنترنت
                        window.addEventListener('online', () => {
                            console.log('[PWA] 🌐 استعادة الاتصال بالإنترنت، فحص التحديثات...');
                            checkForAppUpdates();
                            reg.update();
                        });

                        // اكتشاف تثبيت نسخة جديدة وتفعيلها فوراً
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            console.log(`[PWA v${CURRENT_APP_VERSION}] 📥 جاري تنزيل وتثبيت كود وأيقونات الإصدار الجديد...`);
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log(`[PWA v${CURRENT_APP_VERSION}] ⚡ اكتمل تنزيل التحديث، إرسال أمر التفعيل الفوري SKIP_WAITING...`);
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    } else {
                                        console.log(`[PWA v${CURRENT_APP_VERSION}] ✅ تم تثبيت التطبيق وتخزين الملفات بالكامل للاستخدام Offline.`);
                                    }
                                }
                            });
                        });
                    })
                    .catch(e => console.log('[PWA] SW registration failed:', e));

                // تحديث تلقائي فوري وسلس عند تفعيل الإصدار الجديد
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                        refreshing = true;
                        console.log(`[PWA] 🔄 تم تفعيل الإصدار الجديد بنجاح، جاري إعادة تحميل التطبيق تلقائياً...`);
                        window.location.reload();
                    }
                });
            });
        }

        // ---------------------------------------------------------
        // تنزيل الصورة
        // ---------------------------------------------------------
        async function downloadScreenshot() {
            const card = document.getElementById('calculator-card');
            const hiddenEls = document.querySelectorAll('.hide-on-screenshot');
            hiddenEls.forEach(el => el.style.visibility = 'hidden');

            try {
                const canvas = await html2canvas(card, {
                    backgroundColor: '#050508',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                });

                const link = document.createElement('a');
                const now = new Date();
                const filename = `تقرير-النقد-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.png`;
                link.download = filename;
                link.href = canvas.toDataURL('image/png', 1.0);
                link.click();

                Swal.fire({ icon: 'success', title: 'تم حفظ الصورة ✅', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, background: 'var(--card-background)', color: 'var(--text-color)' });
            } catch (err) {
                console.error(err);
                Swal.fire('خطأ', 'تعذر حفظ الصورة', 'error');
            } finally {
                hiddenEls.forEach(el => el.style.visibility = '');
            }
        }

        // ---------------------------------------------------------
        // تشارك الصورة عبر واتساب / تيلغرام
        // ---------------------------------------------------------
        async function shareScreenshotVia(platform) {
            const card = document.getElementById('calculator-card');
            const hiddenEls = document.querySelectorAll('.hide-on-screenshot');
            hiddenEls.forEach(el => el.style.visibility = 'hidden');

            try {
                Swal.fire({ title: 'جاري تجهيز الصورة...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                const canvas = await html2canvas(card, { backgroundColor: '#050508', scale: 2, useCORS: true, allowTaint: true, logging: false });

                Swal.close();

                canvas.toBlob(async (blob) => {
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'cash-report.png', { type: 'image/png' })] })) {
                        await navigator.share({
                            title: 'تقرير حاسبة النقد',
                            files: [new File([blob], 'cash-report.png', { type: 'image/png' })]
                        });
                    } else {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'cash-report.png';
                        link.click();
                        URL.revokeObjectURL(url);
                        Swal.fire({ icon: 'success', title: 'تم تنزيل الصورة', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, background: 'var(--card-background)', color: 'var(--text-color)' });
                    }
                }, 'image/png', 1.0);

            } catch (err) {
                console.error(err);
                Swal.fire('تنبيه', 'حدث خطأ. جاري تنزيل الصورة مباشرة...', 'info');
                downloadScreenshot();
            } finally {
                hiddenEls.forEach(el => el.style.visibility = '');
            }
        }

        // ---------------------------------------------------------
        // تقرير واتساب
        // ---------------------------------------------------------
        function buildWhatsAppReport() {
            const total = parseFloat(document.getElementById('total-amount')?.textContent) || 0;
            const currencySymbol = document.getElementById('currency-label')?.textContent || 'ج.م';
            const systemTotal = parseFloat(document.getElementById('quick-system-target')?.value) || parseFloat(document.getElementById('system-total-input')?.value) || parseFloat(AppStorage.getItem('systemTotal')) || 0;
            const diff = total - systemTotal;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const userName = AppStorage.getItem('userName') || 'موظف';
            const userRole = AppStorage.getItem('userRole') || 'cashier';
            const storeName = AppStorage.getItem('storeName') || '';

            // جمع بيانات الفئات
            const noteRows = document.querySelectorAll('.note-row');
            let denomRows = '';
            noteRows.forEach(row => {
                const label = row.querySelector('.note-label')?.textContent?.trim();
                const qtyInput = row.querySelector('input[type="number"]');
                const qty = parseInt(qtyInput?.value) || 0;
                if (qty > 0 && label) {
                    const val = parseFloat(label.replace(/[^\d.]/g, ''));
                    if (!isNaN(val)) denomRows += `  • ${label}: ${qty} ورقة = ${(val * qty).toLocaleString('ar-EG')}\n`;
                }
            });

            const curCode = document.getElementById('currency-select')?.value || 'egp';
            const tafqeetStr = window.tafqeet ? window.tafqeet(total, curCode) : '';

            let report = `🟥 *تقرير عد الخزينة والعهدة ${storeName ? `(${storeName}) ` : ''}🟥*

📅 *التاريخ:* ${dateStr}
⏰ *الوقت:* ${timeStr}
👤 *الموظف:* ${userName} (${userRole})

💵 *تفاصيل الفئات:*
${denomRows || '  • لا توجد بيانات'}
📊 *إجمالي العد:* ${total.toLocaleString('ar-EG')} ${currencySymbol}
📝 *المبلغ تفقيطاً:* ${tafqeetStr}`;

            if (systemTotal > 0) {
                const diffIcon = Math.abs(diff) < 0.001 ? '✅' : (diff > 0 ? '🟢' : '🔴');
                report += `

🖥️ *مبيعات النظام (العهدة):* ${systemTotal.toLocaleString('ar-EG')} ${currencySymbol}
${diffIcon} *الفارق:* ${diff >= 0 ? '+' : ''}${diff.toLocaleString('ar-EG')} ${currencySymbol} (${Math.abs(diff) < 0.001 ? 'مطابقة تامة' : (diff > 0 ? 'زيادة' : 'عجز')})`;
            }

            // بيانات المحفظة الرقمية
            const vodafone = parseFloat(document.getElementById('vodafone-cash')?.value) || 0;
            const instapay = parseFloat(document.getElementById('instapay')?.value) || 0;
            if (vodafone > 0 || instapay > 0) {
                report += `

📱 *المحفظة الرقمية:*`;
                if (vodafone > 0) report += `
  🟠 فودافون كاش: ${vodafone.toLocaleString('ar-EG')} ${currencySymbol}`;
                if (instapay > 0) report += `
  💜 إنستا باي: ${instapay.toLocaleString('ar-EG')} ${currencySymbol}`;
            }

            report += `

————————————
📱 تم الإرسال عبر *حاسبة النقد الاحترافية* 💰`;
            return report;
        }

        function sendWhatsAppReport() {
            const phone = AppStorage.getItem('userPhone') || '';
            const report = buildWhatsAppReport();
            if (!phone) {
                Swal.fire('تنبيه', 'احفظ رقم هاتفك أولاً من إعدادات الحساب', 'info').then(() => {
                    document.getElementById('settings-modal').style.display = 'flex';
                    switchTabByName('account');
                });
                return;
            }
            const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^0/, '20');
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(report)}`, '_blank');
        }

        function sendTelegramReport() {
            const report = buildWhatsAppReport();
            Swal.fire({
                title: 'إرسال عبر تيلغرام',
                html: `
                    <p style="font-size:0.9em; color:var(--text-color);‫">أدخل يوزر ID أو رقم هاتف تيلجرام لإرسال التقرير:</u202b</p>
                    <input id="tg-id" class="swal2-input" placeholder="@username أو 12345678" value="${AppStorage.getItem('telegramId') || ''}">
                `,
                confirmButtonText: 'إرسال 📨',
                confirmButtonColor: '#229ED9',
                showCancelButton: true,
                cancelButtonText: 'إلغاء',
                background: 'var(--card-background)',
                color: 'var(--text-color)',
                preConfirm: () => {
                    const tgId = document.getElementById('tg-id').value.trim();
                    if (!tgId) { Swal.showValidationMessage('ادخل المستخدم أو الرقم'); return false; }
                    AppStorage.setItem('telegramId', tgId);
                    return tgId;
                }
            }).then(result => {
                if (result.isConfirmed) {
                    const tgId = result.value.replace('@', '');
                    // فتح تيلغرام مع الرسالة
                    window.open(`https://t.me/${tgId}`, '_blank');
                    // نسخ التقرير للحافظة
                    navigator.clipboard?.writeText(report).then(() => {
                        Swal.fire({ icon: 'info', title: 'تم نسخ التقرير 📋', text: 'الصق الرسالة في محادثة تيلغرام', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: 'var(--card-background)', color: 'var(--text-color)' });
                    });
                }
            });
        }

        function switchTabByName(tabName) {
            const target = tabName === 'profile' ? 'account' : tabName;
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            const selectedTab = document.getElementById('tab-' + target);
            if (selectedTab) selectedTab.classList.add('active');
            const tabBtn = document.querySelector(`.tab-btn[onclick*="'${target}'"]`);
            if (tabBtn) tabBtn.classList.add('active');
            if (target === 'account') {
                updateWelcomeMessage();
            }
        }

        // 3. مؤشر حالة الاتصال
        function updateOnlineStatus() {
            let badge = document.getElementById('offline-badge');
            if (!navigator.onLine) {
                if (!badge) {
                    badge = document.createElement('div');
                    badge.id = 'offline-badge';
                    badge.innerHTML = '<i class="fas fa-wifi"></i> وضع Offline';
                    badge.style.cssText = 'position:fixed; bottom:75px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#B8860B,#FFD700); color:#000; padding:6px 16px; border-radius:20px; font-size:0.8em; z-index:9999; font-weight:800; box-shadow: 0 4px 15px rgba(255,215,0,0.4);';
                    document.body.appendChild(badge);
                }
            } else {
                if (badge) badge.remove();
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        function switchTab(tabName) {
            // إخفاء كل المحتويات
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            // إزالة التنشيط من كل الأزرار
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

            // تفعيل التبويب المختار
            const selectedTab = document.getElementById('tab-' + tabName);
            if (selectedTab) selectedTab.classList.add('active');

            // تفعيل الزر المناسب
            const tabBtn = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
            if (tabBtn) tabBtn.classList.add('active');

            if (tabName === 'account' || tabName === 'profile') {
                updateWelcomeMessage();
            }
        }

        function handleLogout() {
            Swal.fire({
                title: 'تسجيل الخروج والنسخ الاحتياطي؟',
                text: "سيتم حفظ وتنزيل نسخة احتياطية من جميع بياناتك وقفل التطبيق بأمان.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: 'var(--primary-color)',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'نعم، حفظ وخروج',
                cancelButtonText: 'إلغاء',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            }).then((result) => {
                if (result.isConfirmed) {
                    // إظهار نافذة النسخ الاحتياطي التلقائي المطابقة للصورة عند الخروج
                    triggerBackupModal(true);
                    setTimeout(() => {
                        window.location.reload();
                    }, 2200);
                }
            });
        }

        // --- تهيئة خدمة البريد (EmailJS) ---
        // 1. اذهب إلى https://www.emailjs.com/ وأنشئ حساباً مجانياً
        // 2. استبدل "YOUR_PUBLIC_KEY" بمفتاحك العام من لوحة التحكم
        // emailjs.init("YOUR_PUBLIC_KEY");

        // --- منطق إرسال الملاحظات (Feedback Logic) ---
        document.getElementById('send-feedback-btn').addEventListener('click', async () => {
            const type = document.getElementById('feedback-type').value;
            const message = document.getElementById('feedback-text').value.trim();

            if (!message) {
                Swal.fire('تنبيه', 'الرجاء كتابة رسالة قبل الإرسال.', 'warning');
                return;
            }

            // تجهيز محتوى الرسالة
            const userName = AppStorage.getItem('userName') || 'مستخدم';
            const userPhone = AppStorage.getItem('userPhone') || 'غير محدد';
            const typeText = document.querySelector(`#feedback-type option[value="${type}"]`).text;

            const fullMessage = `*ملاحظة جديدة من تطبيق حاسبة النقد*\n\n*المرسل:* ${userName}\n*رقم الهاتف:* ${userPhone}\n*نوع الرسالة:* ${typeText}\n\n*نص الرسالة:*\n${message}`;

            // تخيير المستخدم بين واتساب أو البريد الإلكتروني
            Swal.fire({
                title: 'اختر طريقة الإرسال',
                text: 'كيف تود إرسال هذه الملاحظات للمطور؟',
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: '<i class="fab fa-whatsapp"></i> واتساب',
                denyButtonText: '<i class="fas fa-envelope"></i> بريد إلكتروني',
                cancelButtonText: 'إلغاء',
                confirmButtonColor: '#25D366',
                denyButtonColor: '#EA4335'
            }).then((result) => {
                if (result.isConfirmed) {
                    // إرسال عبر واتساب (رقم المطور)
                    const whatsappUrl = `https://wa.me/+201006825905?text=${encodeURIComponent(fullMessage)}`;
                    window.open(whatsappUrl, '_blank');
                    document.getElementById('feedback-text').value = '';
                } else if (result.isDenied) {
                    // إرسال عبر البريد الإلكتروني
                    const subject = `ملاحظات تطبيق حاسبة النقد - ${type}`;
                    const mailtoUrl = `mailto:ehabamr062@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;
                    window.location.href = mailtoUrl;
                    document.getElementById('feedback-text').value = '';
                }
            });
        });