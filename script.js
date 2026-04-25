
// --- IndexedDB Wrapper for Seamless Migration ---
window.AppStorage = {
    cache: {},
    db: null,
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('BayanPOS_DB', 1);
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
                const req = store.getAll();
                const keysReq = store.getAllKeys();
                req.onsuccess = () => {
                    keysReq.onsuccess = () => {
                        const values = req.result;
                        const keys = keysReq.result;
                        keys.forEach((key, i) => {
                            this.cache[key] = values[i];
                        });
                        
                        // Migrate from localStorage if IndexedDB is empty
                        if (keys.length === 0 && localStorage.length > 0) {
                            for (let i = 0; i < localStorage.length; i++) {
                                const k = localStorage.key(i);
                                const v = localStorage.getItem(k);
                                this.setItem(k, v);
                            }
                        }
                        resolve();
                    };
                };
            };
            request.onerror = () => resolve(); // fallback to empty cache
        });
    },
    getItem(key) {
        return this.cache.hasOwnProperty(key) ? this.cache[key] : null;
    },
    setItem(key, value) {
        this.cache[key] = value;
        if(this.db) {
            const tx = this.db.transaction('store', 'readwrite');
            tx.objectStore('store').put(value, key);
        }
    },
    removeItem(key) {
        delete this.cache[key];
        if(this.db) {
            const tx = this.db.transaction('store', 'readwrite');
            tx.objectStore('store').delete(key);
        }
    },
    clear() {
        this.cache = {};
        if(this.db) {
            const tx = this.db.transaction('store', 'readwrite');
            tx.objectStore('store').clear();
        }
    }
};
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
            document.documentElement.lang = lang;
            document.title = translations[lang].title;
            document.getElementById('app-title-text').textContent = translations[lang].h1;
            document.querySelector('#total-display h2').textContent = translations[lang].totalTitle;
            document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> ' + translations[lang].saveBtn;
            document.getElementById('share-btn').innerHTML = '<i class="fab fa-whatsapp"></i> ' + translations[lang].shareBtn;
            document.getElementById('copy-btn').innerHTML = '<i class="fas fa-copy"></i> ' + translations[lang].copyBtn;
            document.getElementById('clear-btn').innerHTML = '<i class="fas fa-trash-restore"></i> ' + translations[lang].clearBtn;
            document.getElementById('modal-title').innerHTML = '<i class="fas fa-cog"></i> ' + translations[lang].settingsTitle;

            // تحديث عناوين الأقسام
            document.querySelector('#history-card h2').innerHTML = lang === 'ar' ? '<i class="fas fa-history"></i> سجل البيانات اليومية' : '<i class="fas fa-history"></i> Daily Records';
            document.querySelector('#stats-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-chart-bar"></i> الإحصائيات' : '<i class="fas fa-chart-bar"></i> Statistics';
            document.querySelector('#pdf-export-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-file-pdf"></i> تصدير PDF' : '<i class="fas fa-file-pdf"></i> Export PDF';
            document.querySelector('#screenshot-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-camera"></i> لقطة شاشة 4K' : '<i class="fas fa-camera"></i> 4K Screenshot';
            document.querySelector('#about-app-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-info-circle"></i> عن التطبيق والميزات' : '<i class="fas fa-info-circle"></i> About App & Features';
            document.querySelector('#digital-report-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-wallet"></i> تقرير الرقمي' : '<i class="fas fa-wallet"></i> Digital Report';
            document.querySelector('#mode-toggle-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-moon"></i> تبديل الوضع (داكن/فاتح)' : '<i class="fas fa-moon"></i> Toggle Mode (Dark/Light)';
            document.querySelector('#export-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-download"></i> تصدير البيانات' : '<i class="fas fa-download"></i> Export Data';
            document.querySelector('#import-btn').innerHTML = lang === 'ar' ? '<i class="fas fa-upload"></i> استيراد البيانات' : '<i class="fas fa-upload"></i> Import Data';

            // تحديث النصوص الجديدة في الإعدادات والواجهة
            document.getElementById('tools-title').innerHTML = '<i class="fas fa-toolbox"></i> ' + translations[lang].toolsTitle;
            document.getElementById('appearance-title').innerHTML = '<i class="fas fa-sliders-h"></i> ' + translations[lang].appearanceTitle;
            document.getElementById('security-title').innerHTML = '<i class="fas fa-shield-alt"></i> ' + translations[lang].securityTitle;
            document.getElementById('sound-label-text').textContent = translations[lang].soundLabel;
            document.getElementById('theme-colors-label').textContent = translations[lang].themeColorsLabel;
            document.getElementById('currency-label-settings').textContent = translations[lang].currencyLabelSettings;
            document.getElementById('exchange-rate-label').textContent = translations[lang].exchangeRateLabel;
            document.getElementById('system-sales-label').textContent = translations[lang].systemSalesLabel;
            document.getElementById('language-label-settings').textContent = translations[lang].languageLabelSettings;
            document.getElementById('password-toggle-text').textContent = translations[lang].passwordToggleLabel;
            document.getElementById('set-password-btn').textContent = translations[lang].setPasswordBtn;
            document.getElementById('vodafone-label').innerHTML = '<i class="fas fa-mobile-alt"></i> ' + translations[lang].vodafoneLabel;
            document.getElementById('instapay-label').innerHTML = '<i class="fas fa-university"></i> ' + translations[lang].instapayLabel;
            document.getElementById('cash-breakdown-label').textContent = translations[lang].cashBreakdown;
            document.getElementById('digital-breakdown-label').textContent = translations[lang].digitalBreakdown;
            document.getElementById('history-summary-text').textContent = translations[lang].historySummary;

            // تحديث placeholder للحقول
            document.getElementById('vodafone-cash').placeholder = lang === 'ar' ? 'المبلغ' : 'Amount';
            document.getElementById('instapay').placeholder = lang === 'ar' ? 'المبلغ' : 'Amount';
            document.getElementById('exchange-rate').placeholder = lang === 'ar' ? '1 وحدة = ? جنيه' : '1 unit = ? EGP';
            document.getElementById('system-total-input').placeholder = lang === 'ar' ? 'للمطابقة (العهدة)' : 'For matching (safe)';
            document.getElementById('password-input').placeholder = lang === 'ar' ? 'كلمة مرور جديدة' : 'New password';
            document.getElementById('search-input').placeholder = lang === 'ar' ? 'البحث في السجلات...' : 'Search records...';

            // تحديث خيارات العملة
            const currencySelect = document.getElementById('currency-select');
            currencySelect.options[0].text = lang === 'ar' ? 'جنيه مصري' : 'EGP Pound';
            currencySelect.options[1].text = lang === 'ar' ? 'دولار أمريكي' : 'US Dollar';
            currencySelect.options[2].text = lang === 'ar' ? 'يورو' : 'Euro';

            // تحديث خيارات اللغة
            const languageSelect = document.getElementById('language-select');
            languageSelect.options[0].text = lang === 'ar' ? 'العربية' : 'Arabic';
            languageSelect.options[1].text = lang === 'ar' ? 'English' : 'الإنجليزية';

            // تحديث نصوص أزرار الإحصائيات
            document.getElementById('stats-today-btn').textContent = lang === 'ar' ? 'اليوم' : 'Today';
            document.getElementById('stats-week-btn').textContent = lang === 'ar' ? 'الأسبوع' : 'Week';
            document.getElementById('stats-month-btn').textContent = lang === 'ar' ? 'الشهر' : 'Month';

            // تحديث نصوص الإحصائيات
            document.getElementById('daily-total').previousElementSibling.textContent = lang === 'ar' ? 'إجمالي اليوم' : 'Total Today';
            document.getElementById('daily-average').previousElementSibling.textContent = lang === 'ar' ? 'متوسط اليوم' : 'Average';
            document.getElementById('highest-record').previousElementSibling.textContent = lang === 'ar' ? 'أعلى قيمة' : 'Highest';
            document.getElementById('total-records').previousElementSibling.textContent = lang === 'ar' ? 'عدد السجلات' : 'Records';

            // تحديث نص الفوتر
            document.getElementById('footer-credits').textContent = lang === 'ar' ? 'حقوق ©عمرو إيهاب — كل الحقوق محفوظة' : '© Amr Ehab — All Rights Reserved';
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

        // دالة موحدة لإنشاء صف العملة (Widget)
        function createCurrencyRowHTML(value) {
            const displayValue = value.toFixed(value % 1 === 0 ? 0 : 2);
            const icon = icons[value] || '💰';
            const rowTotalId = `total-${value.toString().replace('.', '-')}`;

            return `
                <div class="currency-info">
                    <div class="note-icon">${icon}</div>
                    <div class="note-value">${displayValue}</div>
                </div>
                
                <button class="increment-btn">+</button>
                
                <div class="input-wrapper">
                    <input type="number" class="cash-input" data-value="${value}"
                           placeholder="0" min="0" inputmode="numeric" pattern="[0-9]*">
                    <div class="row-total-display" id="${rowTotalId}">0.00</div>
                </div>
                
                <button class="decrement-btn">-</button>
                
                <button class="lock-btn" onclick="toggleLock(this)" title="قفل هذه الفئة">
                    <i class="fas fa-unlock"></i>
                </button>
            `;
        }

        function createUI() {
            notesListElement.innerHTML = ''; // تنظيف القائمة قبل الإنشاء
            currencyDenominations.forEach(value => {
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

        let saveTimeout;
        function saveInputs() {
            if (AppStorage.getItem('autosaveEnabled') === 'false') return;

            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const inputsData = {};
                document.querySelectorAll('.cash-input').forEach(input => {
                    const value = input.getAttribute('data-value');
                    inputsData[value] = input.value;
                });
                const vCash = document.getElementById('vodafone-cash').value;
                const iPay = document.getElementById('instapay').value;
                inputsData['vodafone'] = vCash;
                inputsData['instapay'] = iPay;
                AppStorage.setItem('cashCalculatorInputs', JSON.stringify(inputsData));

                // إظهار مؤشر الحفظ التلقائي
                const indicator = document.getElementById('autosave-indicator');
                if (indicator) {
                    indicator.style.display = 'block';
                    setTimeout(() => { indicator.style.display = 'none'; }, 2000);
                }
            }, 1000);
        }

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

        function calculateTotal() {
            let physicalTotal = 0;
            let totalPapers = 0;
            document.querySelectorAll('.cash-input').forEach(input => {
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
            });

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

            // تأثير بصري عند التحديث
            totalAmountElement.classList.remove('pulse-text');
            void totalAmountElement.offsetWidth; // Trigger reflow
            totalAmountElement.classList.add('pulse-text');

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

            // حفظ المدخلات تلقائيًا
            saveInputs();

            // تشغيل صوت عند تغيير الإجمالي
            if (grandTotal > 0) {
                playSound('tick');
            }

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
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
                return;
            }

            let html = '<div style="text-align: right; direction: rtl;">';
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += '<tr style="border-bottom: 2px solid var(--primary-color); color: var(--primary-color);"><th style="padding: 10px; text-align: right;">الفئة</th><th style="padding: 10px; text-align: center;">العدد</th><th style="padding: 10px; text-align: left;">الإجمالي</th></tr>';

            // ترتيب الفئات من الأكبر للأصغر
            const sortedKeys = Object.keys(details).sort((a, b) => parseFloat(b) - parseFloat(a));

            sortedKeys.forEach(value => {
                const count = details[value];
                const noteValue = parseFloat(value);
                const rowTotal = (noteValue * count).toFixed(2);
                const icon = icons[noteValue] || '💰';
                html += `<tr style="border-bottom: 1px solid rgba(255,215,0,0.1);">
                    <td style="padding: 12px 10px;">${icon} ${noteValue} جنيه</td>
                    <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: var(--gold-light);">${count} ورقة</td>
                    <td style="padding: 12px 10px; text-align: left; font-weight: bold;">${rowTotal}</td>
                </tr>`;
            });

            html += `<tr style="background: rgba(255,215,0,0.05); font-weight: 900; font-size: 1.1em;">
                <td style="padding: 15px 10px;">الإجمالي</td>
                <td style="padding: 15px 10px; text-align: center; color: var(--gold-primary);">${totalPapers} ورقة</td>
                <td style="padding: 15px 10px; text-align: left; color: var(--gold-primary);">${total.toFixed(2)}</td>
            </tr>`;

            html += '</table></div>';

            Swal.fire({
                title: title,
                html: html,
                confirmButtonText: 'إغلاق',
                confirmButtonColor: 'var(--primary-color)',
                background: 'var(--card-background)',
                color: 'var(--text-color)',
                customClass: { popup: 'swal2-popup' }
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

        function resetInputs(resetFilters = true) {
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

            if (resetFilters) {
                document.getElementById('date-filter-input').value = localDate;
                document.getElementById('search-input').value = '';
                loadHistory(localDate);
            } else {
                document.getElementById('search-input').value = '';
                loadHistory(document.getElementById('date-filter-input').value);
            }
        }

        // تم استعادة وظائف السجل بالكامل مع إضافة البحث وعرض آخر عملية
        function loadHistory(filterDate = null, searchTerm = '') {
            let history = [];
            try {
                history = JSON.parse(AppStorage.getItem('cashCalculatorHistory') || '[]');
            } catch (e) {
                console.error("Error loading history:", e);
            }
            historyList.innerHTML = '';

            let historyToDisplay = [];

            // 1. تحديد السجلات المطابقة للفلتر
            if (filterDate) {
                historyToDisplay = history.filter(item => item.simpleDate === filterDate);
            } else {
                historyToDisplay = history;
            }

            // 2. تطبيق البحث
            if (searchTerm) {
                historyToDisplay = historyToDisplay.filter(item => {
                    const searchLower = searchTerm.toLowerCase();
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

            // 3. المنطق الجديد: جلب "آخر عملية مسجلة" بغض النظر عن التاريخ
            // شرط: إذا كان هناك سجلات أصلاً، السجل الأول في المصفوفة هو الأحدث دائماً (لأننا نستخدم unshift)
            let lastOperation = null;
            if (history.length > 0) {
                lastOperation = history[0];
            }

            // هل آخر عملية موجودة بالفعل ضمن القائمة المعروضة؟
            const isLastOpInList = lastOperation && historyToDisplay.some(item => item.id === lastOperation.id);

            // إذا لم تكن موجودة، وكان المستخدم يفلتر، نعرضها في الأعلى كـ "آخر عملية"
            if (lastOperation && !isLastOpInList && filterDate && !searchTerm) {
                // نعرضها مميزة
                renderHistoryItem(lastOperation, true); // true تعني "مميز كآخر عملية"

                // فاصل
                const separator = document.createElement('div');
                separator.innerHTML = `<div style="text-align: center; margin: 10px 0; font-size: 0.8em; color: var(--secondary-color); opacity: 0.7;">--- سجلات ${filterDate} ---</div>`;
                historyList.appendChild(separator);
            }

            // حساب وعرض مجموع السجلات المعروضة (فقط المطابقة للفلتر)
            const totalSum = historyToDisplay.reduce((sum, item) => sum + item.total, 0);
            const summaryDiv = document.getElementById('history-summary');
            const summarySpan = document.getElementById('history-total-sum');

            if (historyToDisplay.length === 0) {
                // إذا لم تكن هناك سجلات مطابقة، ولكن عرضنا آخر عملية، لا داعي لرسالة "لا توجد بيانات" بشكل مزعج
                // لكن سنعرضها تحت الفاصل إذا تم عرض آخر عملية
                if (!lastOperation || isLastOpInList) {
                    const noDataMessage = filterDate ?
                        (searchTerm ? 'لا توجد بيانات تطابق معايير البحث لهذا التاريخ.' : 'لا توجد بيانات لهذا التاريخ.') :
                        (searchTerm ? 'لا توجد بيانات تطابق معايير البحث.' : 'لا توجد سجلات محفوظة بعد.');
                    const li = document.createElement('li');
                    li.innerHTML = noDataMessage;
                    li.style.background = 'transparent';
                    li.style.boxShadow = 'none';
                    historyList.appendChild(li);
                }
                // إذا كانت هناك عملية أخيرة معروضة، لا نعرض "لا توجد بيانات" بل نكتفي بالفاصل أو لا شيء
                summaryDiv.style.display = 'none';
            } else {
                summaryDiv.style.display = 'block';
                summarySpan.textContent = totalSum.toFixed(2);

                // عرض السجلات المطابقة
                historyToDisplay.forEach(item => {
                    renderHistoryItem(item, false);
                });
            }

            attachHistoryEventListeners();
        }

        function renderHistoryItem(item, isSpecialLastOp) {
            const listItem = document.createElement('li');
            listItem.dataset.id = item.id;

            // تمييز خاص لآخر عملية إذا كانت خارج التاريخ المحدد
            if (isSpecialLastOp) {
                listItem.style.border = '2px dashed var(--accent-color)';
                listItem.style.position = 'relative';
                const badge = document.createElement('div');
                badge.textContent = 'آخر عملية مسجلة';
                badge.style.position = 'absolute';
                badge.style.top = '-10px';
                badge.style.left = '50%';
                badge.style.transform = 'translateX(-50%)';
                badge.style.background = 'var(--accent-color)';
                badge.style.color = 'var(--text-color)';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '10px';
                badge.style.fontSize = '0.75em';
                badge.style.fontWeight = 'bold';
                listItem.appendChild(badge);
            }

            let digitalBadges = '';
            if (item.vodafone > 0) digitalBadges += '<span class="badge vodafone">فودافون</span>';
            if (item.instapay > 0) digitalBadges += '<span class="badge instapay">إنستا</span>';

            listItem.innerHTML += `
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
                    <button class="view-btn" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                    <button class="share-btn-history" title="مشاركة عبر واتساب"><i class="fab fa-whatsapp"></i></button>
                    <button class="edit-btn" title="تعديل السجل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="حذف السجل"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            historyList.appendChild(listItem);
        }

        function attachHistoryEventListeners() {
            historyList.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', handleViewDetails));
            historyList.querySelectorAll('.share-btn-history').forEach(btn => btn.addEventListener('click', handleShareRecord));
            historyList.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditRecord));
            historyList.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteRecord));
        }

        // تم استعادة وظائف SweetAlert2 (مطلوب وجود مكتبة SweetAlert2 في <head>)
        function handleViewDetails(event) {
            const id = parseInt(event.currentTarget.closest('li').dataset.id);
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
            const id = parseInt(event.currentTarget.closest('li').dataset.id);
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

            // بناء واجهة التعديل بتصميم البطاقات (Clean UI)
            let editHTML = '<div style="max-height: 60vh; overflow-y: auto; padding: 5px;">';

            // قسم الخزينة الرقمية
            editHTML += `
                <div style="background: var(--card-background); padding: 15px; border-radius: 15px; margin-bottom: 15px; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.05);">
                    <h4 style="margin: 0 0 10px 0; color: var(--primary-color); text-align: center;"><i class="fas fa-wallet"></i> الخزينة الرقمية</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 0.9em; color: #e60000; display: block; margin-bottom: 5px;">فودافون كاش</label>
                            <input type="number" id="edit-vodafone" value="${record.vodafone || 0}" oninput="updateEditTotal()" class="digital-input" style="font-size: 1em; padding: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="font-size: 0.9em; color: #6f42c1; display: block; margin-bottom: 5px;">إنستا باي</label>
                            <input type="number" id="edit-instapay" value="${record.instapay || 0}" oninput="updateEditTotal()" class="digital-input" style="font-size: 1em; padding: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                    </div>
                </div>
            `;

            // قسم الفئات النقدية
            editHTML += '<div id="edit-denominations-list">';
            recordDenominations.forEach(value => {
                const count = record.details[value.toString()] || 0;
                const rowTotal = (value * count).toFixed(2);

                editHTML += `
                    <div class="edit-row" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 10px; background: var(--input-bg); border-radius: 12px; gap: 5px;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 90px;">
                            <span style="font-size: 1.1em;">${icons[value] || '💰'}</span>
                            <span style="font-weight: bold; font-size: 0.9em;">${value}</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 5px; justify-content: center;">
                            <button type="button" onclick="adjustEditValue('${value}', 1)" style="width: 32px; height: 32px; border-radius: 50%; border: none; background: #28a745; color: white; cursor: pointer; font-size: 1.2em; display: flex; align-items: center; justify-content: center;">+</button>
                            <input type="number" id="edit-input-${value}" data-value="${value}" value="${count}" oninput="updateEditTotal()" style="width: 50px; text-align: center; border: none; background: transparent; font-weight: bold; font-size: 1.2em; color: var(--text-color);">
                            <button type="button" onclick="adjustEditValue('${value}', -1)" style="width: 32px; height: 32px; border-radius: 50%; border: none; background: #dc3545; color: white; cursor: pointer; font-size: 1.2em; display: flex; align-items: center; justify-content: center;">-</button>
                        </div>
                        
                        <div style="flex: 1; min-width: 60px; text-align: left; font-weight: bold; color: var(--secondary-color); font-size: 0.9em;">
                            <span id="edit-row-total-${value}">${rowTotal}</span>
                        </div>
                    </div>
                `;
            });
            editHTML += '</div>';

            // عرض الإجمالي
            editHTML += `
                <div onclick="showEditDetailsSummary()" style="text-align: center; margin-top: 15px; padding: 15px; background: var(--total-bg); border-radius: 15px; border: 1px solid var(--primary-color); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                        <button type="button" id="reset-edit-btn" onclick="event.stopPropagation(); resetEditValues();" style="background: var(--input-bg); border: 1px solid var(--secondary-color); color: var(--text-color); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1em; display: flex; align-items: center; justify-content: center; transition: all 0.3s;" title="استعادة القيم الأصلية (تراجع)"><i class="fas fa-undo"></i></button>
                        <h3 style="margin: 0; font-size: 1.2em;">الإجمالي الجديد: <span id="current-edit-total" style="color: var(--primary-color); font-size: 1.3em;">${record.total.toFixed(2)}</span></h3>
                    </div>
                    <div style="font-size: 1em; color: var(--gold-light); font-weight: bold;">
                        📄 عدد الأوراق الجديد: <span id="current-edit-papers">${record.totalPapers || 0}</span>
                    </div>
                    <p style="font-size: 0.7em; color: var(--secondary-color); margin: 0;">(اضغط للمعاينة التفصيلية)</p>
                </div>
            `;

            // الملاحظة
            editHTML += `
                <div style="margin-top: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">ملاحظة:</label>
                    <textarea id="edit-note" style="width: 100%; padding: 10px; border-radius: 10px; border: none; background: var(--input-bg); color: var(--text-color);" rows="2">${record.note || ''}</textarea>
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
                confirmButtonText: 'حفظ التعديلات',
                cancelButtonText: 'إلغاء',
                customClass: { popup: 'edit-modal-popup' },
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
            const id = parseInt(event.currentTarget.closest('li').dataset.id);
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
            const id = parseInt(event.currentTarget.closest('li').dataset.id);
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

            const dayData = {
                id: Date.now(),
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
            AppStorage.setItem('cashCalculatorHistory', JSON.stringify(history.slice(0, 100)));

            // تحديث فلتر التاريخ ليطابق تاريخ العملية المحفوظة
            dateFilterInput.value = dayData.simpleDate;

            playSound('success');
            Swal.fire({ icon: 'success', title: 'تم الحفظ بنجاح!', text: `إجمالي: ${grandTotal.toFixed(2)}` });
            resetInputs(false);
            document.getElementById('history-card').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('share-btn').addEventListener('click', () => {
            const grandTotal = calculateTotal();
            if (grandTotal <= 0) {
                Swal.fire('خطأ', 'لا يمكن مشاركة تقرير فارغ.', 'error');
                return;
            }
            const date = new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' });
            const totalPapersInMainShare = Array.from(document.querySelectorAll('.cash-input')).reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);
            let message = `*📊 تقرير النقدية:*\nتاريخ: ${date}\n\n*الإجمالي الكلي:* ${grandTotal.toFixed(2)}\n*📄 عدد الأوراق:* ${totalPapersInMainShare}\n\n`;
            const detailsText = formatDetailsToText(getCalculationDetails());
            const vodafone = document.getElementById('vodafone-cash').value || 0;
            const instapay = document.getElementById('instapay').value || 0;

            if (detailsText) { message += `*التفاصيل:*\n${detailsText}`; }
            if (vodafone > 0 || instapay > 0) { message += `*الخزينة الرقمية:*\nفودافون: ${vodafone}\nإنستا باي: ${instapay}`; }

            const userName = AppStorage.getItem('userName');
            const userPhone = AppStorage.getItem('userPhone');
            if (userName) message += `\n\n👤 *المستخدم:* ${userName}`;
            if (userPhone) message += `\n📞 *الهاتف:* ${userPhone}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
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
        document.getElementById('settings-btn').addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            // Ensure close button works
            document.getElementById('close-settings-modal').addEventListener('click', () => {
                settingsModal.style.display = 'none';
            });
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

        document.getElementById('close-settings-modal').addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        // إدارة التنقل داخل النافذة المنبثقة
        const backBtnSettings = document.getElementById('back-btn-settings');

        function showSection(sectionId, title) {
            document.getElementById('settings-menu').style.display = 'none';
            document.getElementById('stats-content').style.display = 'none';
            document.getElementById('about-content').style.display = 'none';

            document.getElementById(sectionId).style.display = 'block';
            document.getElementById('modal-title').innerHTML = title;
            backBtnSettings.style.display = 'block';
        }

        function resetSettingsView() {
            document.getElementById('settings-menu').style.display = 'block';
            document.getElementById('stats-content').style.display = 'none';
            document.getElementById('about-content').style.display = 'none';

            const lang = document.documentElement.lang || 'ar';
            document.getElementById('modal-title').innerHTML = '<i class="fas fa-cog"></i> ' + translations[lang].settingsTitle;
            backBtnSettings.style.display = 'none';
        }

        backBtnSettings.addEventListener('click', resetSettingsView);

        document.getElementById('stats-btn').addEventListener('click', () => {
            showSection('stats-content', '<i class="fas fa-chart-bar"></i> الإحصائيات');
            updateStats('today'); // تحديث الإحصائيات عند الفتح
            renderChart('today'); // رسم الرسم البياني الافتراضي (اليوم = دائري)
        });

        // زر "عن التطبيق"
        document.getElementById('about-app-btn').addEventListener('click', () => {
            showSection('about-content', '<i class="fas fa-info-circle"></i> عن التطبيق');
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
            document.querySelector('#mode-toggle-btn i').className = iconClass;
            document.querySelector('#header-mode-toggle i').className = iconClass;
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
                Swal.fire('خطأ', 'تعذر جلب السعر تلقائياً. تأكد من الاتصال بالإنترنت.', 'error');
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
            const password = document.getElementById('password-input').value;
            if (password) {
                AppStorage.setItem('appPassword', password);
                Swal.fire('تم!', 'تم تعيين كلمة المرور.', 'success');
            } else {
                Swal.fire('خطأ', 'الرجاء إدخال كلمة مرور.', 'error');
            }
        });

        document.getElementById('enable-password').addEventListener('change', (e) => {
            AppStorage.setItem('passwordEnabled', e.target.checked);
        });

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
            switch (theme) {
                case 'gold':
                    root.style.setProperty('--primary-color', '#FFD700');
                    root.style.setProperty('--secondary-color', '#FFA500');
                    root.style.setProperty('--accent-color', '#FFE55C');
                    break;
                case 'blue':
                    root.style.setProperty('--primary-color', '#007bff');
                    root.style.setProperty('--secondary-color', '#28a745');
                    root.style.setProperty('--accent-color', '#ffc107');
                    break;
                case 'green':
                    root.style.setProperty('--primary-color', '#28a745');
                    root.style.setProperty('--secondary-color', '#007bff');
                    root.style.setProperty('--accent-color', '#ffc107');
                    break;
                case 'red':
                    root.style.setProperty('--primary-color', '#dc3545');
                    root.style.setProperty('--secondary-color', '#FF4444');
                    root.style.setProperty('--accent-color', '#ffc107');
                    break;
                case 'purple':
                    root.style.setProperty('--primary-color', '#6f42c1');
                    root.style.setProperty('--secondary-color', '#8e44ad');
                    root.style.setProperty('--accent-color', '#ffc107');
                    break;
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

        // Auto filter on date change
        dateFilterInput.addEventListener('change', () => {
            const filterDate = dateFilterInput.value;
            const searchTerm = searchInput.value.trim();
            if (filterDate) {
                loadHistory(filterDate, searchTerm);
            } else {
                loadHistory(null, searchTerm);
            }
        });

        document.getElementById('clear-filter-btn').addEventListener('click', () => {
            dateFilterInput.value = '';
            searchInput.value = '';
            loadHistory();
        });

        document.getElementById('show-all-btn').addEventListener('click', () => {
            dateFilterInput.value = '';
            searchInput.value = '';
            loadHistory();
        });

        // إضافة البحث المباشر
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim();
            const filterDate = dateFilterInput.value;
            if (filterDate || searchTerm) {
                loadHistory(filterDate || null, searchTerm);
            } else {
                loadHistory();
            }
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
                    theme: AppStorage.getItem('theme') || 'dark',
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

            // تنزيل كملف JSON
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            Swal.fire({
                icon: 'success',
                title: 'تم حفظ النسخة الاحتياطية ✅',
                html: `<div style="direction:rtl; text-align:right; color:var(--text-color);">
                    <b>📁 الملف:</b> ${filename}<br>
                    <b>📊 عدد السجلات:</b> ${history.length}<br>
                    <b>📅 التاريخ:</b> ${now.toLocaleDateString('ar-EG')}
                </div>`,
                confirmButtonText: 'تمام',
                background: 'var(--card-background)',
                color: 'var(--text-color)'
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


        // أزرار الإحصائيات
        document.getElementById('stats-today-btn').addEventListener('click', () => { updateStats('today'); renderChart('today'); });
        document.getElementById('stats-week-btn').addEventListener('click', () => { updateStats('week'); renderChart('week'); });
        document.getElementById('stats-month-btn').addEventListener('click', () => { updateStats('month'); renderChart('month'); });

        // تقرير واتساب/تيليغرام
        document.getElementById('pdf-export-btn').addEventListener('click', () => {
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
        document.getElementById('screenshot-btn').addEventListener('click', function () {
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

        // نظام الأمان المطور
        let idleTimer;
        function resetIdleTimer() {
            clearTimeout(idleTimer);
            const minutes = parseInt(AppStorage.getItem('autoLockTimer') || '0');
            if (minutes > 0 && AppStorage.getItem('passwordEnabled') === 'true') {
                idleTimer = setTimeout(() => {
                    if (document.getElementById('settings-modal').style.display !== 'flex') {
                        location.reload();
                    }
                }, minutes * 60000);
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && AppStorage.getItem('lockOnHide') === 'true' && AppStorage.getItem('passwordEnabled') === 'true') {
                AppStorage.setItem('forceLock', 'true');
            }
        });

        // رصد النشاط لإعادة ضبط مؤقت الخمول
        ['mousedown', 'touchstart', 'keypress', 'scroll'].forEach(evt =>
            document.addEventListener(evt, resetIdleTimer, true)
        );

        function loadTheme() {
            const savedTheme = AppStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);

            const iconClass = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if (document.querySelector('#mode-toggle-btn i')) document.querySelector('#mode-toggle-btn i').className = iconClass;
            if (document.querySelector('#header-mode-toggle i')) document.querySelector('#header-mode-toggle i').className = iconClass;

            const savedColorTheme = AppStorage.getItem('colorTheme') || 'gold';
            changeThemeColor(savedColorTheme);

            // تمييز اللون المختار في الإعدادات
            document.querySelectorAll('.color-circle').forEach(el => {
                if (el.getAttribute('onclick').includes(`'${savedColorTheme}'`)) {
                    el.classList.add('active');
                }
            });

            const savedCurrency = AppStorage.getItem('selectedCurrency') || 'egp';
            document.getElementById('currency-select').value = savedCurrency;
            updateCurrency(savedCurrency);

            document.getElementById('exchange-rate').value = AppStorage.getItem('exchangeRate') || '';
            document.getElementById('system-total-input').value = AppStorage.getItem('systemTotal') || '';

            const savedLanguage = AppStorage.getItem('selectedLanguage') || 'ar';
            document.getElementById('language-select').value = savedLanguage;
            updateLanguage(savedLanguage);

            const soundEnabled = AppStorage.getItem('soundEnabled') !== 'false';
            if (document.getElementById('sound-toggle')) document.getElementById('sound-toggle').checked = soundEnabled;

            const autosaveEnabled = AppStorage.getItem('autosaveEnabled') !== 'false';
            if (document.getElementById('autosave-toggle')) {
                document.getElementById('autosave-toggle').checked = autosaveEnabled;
                document.getElementById('autosave-toggle').addEventListener('change', (e) => {
                    AppStorage.setItem('autosaveEnabled', e.target.checked);
                    if (e.target.checked) playSound('success');
                });
            }
        }

        async function checkPassword() {
            const enabled = AppStorage.getItem('passwordEnabled') === 'true';
            const password = AppStorage.getItem('appPassword');
            if (enabled && password) {
                while (true) {
                    const result = await Swal.fire({
                        title: 'أدخل كلمة المرور',
                        input: 'password',
                        inputPlaceholder: 'كلمة المرور',
                        showCancelButton: false,
                        showDenyButton: true,
                        denyButtonText: 'هل نسيت كلمة المرور؟',
                        denyButtonColor: '#6c757d',
                        confirmButtonText: 'دخول',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            // إضافة زر العين لشاشة الدخول تلقائياً
                            const input = Swal.getInput();
                            const container = input.parentElement;
                            container.style.position = 'relative';

                            const eye = document.createElement('i');
                            eye.className = 'fas fa-eye';
                            eye.style.cssText = 'position: absolute; left: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #B8860B; z-index: 10;';

                            eye.onclick = () => {
                                if (input.type === 'password') {
                                    input.type = 'text';
                                    eye.className = 'fas fa-eye-slash';
                                } else {
                                    input.type = 'password';
                                    eye.className = 'fas fa-eye';
                                }
                            };
                            container.appendChild(eye);
                            input.style.paddingLeft = '35px';
                        },
                        inputValidator: (value) => {
                            if (!value) return 'الرجاء إدخال كلمة المرور!';
                        }
                    });

                    if (result.isConfirmed) {
                        if (result.value === password) break;
                        await Swal.fire('خطأ', 'كلمة المرور غير صحيحة!', 'error');
                    } else if (result.isDenied) {
                        const { value: code } = await Swal.fire({
                            title: 'استعادة الدخول',
                            text: 'أدخل كود الطوارئ',
                            input: 'text',
                            confirmButtonText: 'تحقق',
                            showCancelButton: true,
                            cancelButtonText: 'إلغاء'
                        });
                        if (code === '500') {
                            await Swal.fire('تم', 'تم فتح التطبيق', 'success');
                            break;
                        } else if (code) {
                            await Swal.fire('خطأ', 'الكود غير صحيح', 'error');
                        }
                    }
                }
            }
            return true;
        }

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
            const serial = AppStorage.getItem('deviceSerial');
            navigator.clipboard.writeText(serial).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'تم نسخ السريال بنجاح ✅',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
            });
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
            const name = AppStorage.getItem('userName') || '';
            const avatar = AppStorage.getItem('userAvatar') || '👤';
            const avatarImage = AppStorage.getItem('userAvatarImage');

            const avatarHTML = avatarImage
                ? `<img src="${avatarImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
                : avatar;

            const welcomeAvatarHTML = avatarImage
                ? `<img src="${avatarImage}" style="width:1em; height:1em; object-fit:cover; border-radius:50%; vertical-align:middle; display:inline-block;">`
                : `<span style="font-size:1.2em">${avatar}</span>`;

            if (name) {
                document.getElementById('welcome-msg').innerHTML = `${welcomeAvatarHTML} مرحباً، ${name} 👋`;
                document.getElementById('user-name-input').value = name;
            }
            document.getElementById('user-phone-input').value = AppStorage.getItem('userPhone') || '';
            document.getElementById('user-role-input').value = AppStorage.getItem('userRole') || '';
            document.getElementById('user-email-input').value = AppStorage.getItem('userEmail') || '';

            // تحديث السريال في الواجهة
            const serial = generateDeviceSerial();
            const serialEl = document.getElementById('user-serial-display');
            if (serialEl) serialEl.value = serial;

            const currentAvatarEl = document.getElementById('current-avatar');
            if (currentAvatarEl) currentAvatarEl.innerHTML = avatarHTML;

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

        document.getElementById('avatar-upload-input').addEventListener('change', function (event) {
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
                        title: 'تم تحديث الصورة السخصية ✅',
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

        document.addEventListener('DOMContentLoaded', async () => {
            await AppStorage.init(); // Initialize IndexedDB Cache
            const accessGranted = await checkPassword();
            if (!accessGranted) return;

            checkUserProfile(); // التحقق من الاسم عند البدء
            createUI();
            loadInputs();
            loadTheme();
            updateMathHistoryUI(); // تحميل سجل الحاسبة

            // تعيين تاريخ اليوم تلقائياً للفلتر (بالتوقيت المحلي)
            const nowLocal = new Date();
            const todayDate = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
            document.getElementById('date-filter-input').value = todayDate;

            // تحميل السجل بتاريخ اليوم
            loadHistory(todayDate);
            calculateTotal();

            // إعلام سريع بأن التاريخ تم تحديثه
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: false,
                background: 'var(--card-background)',
                color: 'var(--text-color)'
            });
            Toast.fire({ icon: 'success', title: 'تم تحميل سجلات اليوم' });

            // تسجيل وقت الدخول الحالي تلقائياً
            let loginLogs = JSON.parse(AppStorage.getItem('appLoginLogs') || '[]');

            // إشعار بآخر وقت دخول (Toast) قبل تسجيل الدخول الجديد
            if (loginLogs.length > 0) {
                const lastLogin = loginLogs[0];
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true,
                    background: 'var(--card-background)',
                    color: 'var(--text-color)'
                });
                Toast.fire({ icon: 'info', title: 'مرحباً بعودتك 👋', text: `آخر دخول: ${lastLogin}` });
            }

            const now = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium' });
            loginLogs.unshift(now);
            if (loginLogs.length > 50) loginLogs = loginLogs.slice(0, 50); // الاحتفاظ بآخر 50 دخول فقط
            AppStorage.setItem('appLoginLogs', JSON.stringify(loginLogs));

            // تفعيل الوضع الافتراضي (الرئيسية)
            handleBottomNav('home', document.querySelector('.nav-item.active'));

            // إعلان المميزات الجديدة (تظهر مرة واحدة فقط)
            if (!AppStorage.getItem('announcement_v4_2_seen')) {
                setTimeout(() => {
                    const announcement = document.getElementById('new-features-announcement');
                    if (announcement) {
                        announcement.style.display = 'flex';
                        playSound('success');
                    }
                }, 1000);
            }

            // Load password settings
            document.getElementById('enable-password').checked = AppStorage.getItem('passwordEnabled') === 'true';
            document.getElementById('lock-on-hide').checked = AppStorage.getItem('lockOnHide') === 'true';
            document.getElementById('auto-lock-timer').value = AppStorage.getItem('autoLockTimer') || '0';

            // تفعيل القفل القسري إذا كان مفعلاً من الخبء
            if (AppStorage.getItem('forceLock') === 'true') {
                AppStorage.removeItem('forceLock');
                location.reload();
            }

            // رسالة الميزة الجديدة (تظهر مرة واحدة فقط)
            if (!AppStorage.getItem('feature_papers_announced')) {
                setTimeout(() => {
                    Swal.fire({
                        title: '✨ ميزة جديدة رائعة!',
                        html: `
                            <div style="text-align: center; direction: rtl;">
                                <p style="font-size: 1.1em; color: var(--gold-primary); font-weight: bold;">تم إضافة خاصية "إجمالي عدد الأوراق" 📄</p>
                                <ul style="text-align: right; font-size: 0.9em; line-height: 1.6; color: var(--text-color);">
                                    <li>✅ عرض إجمالي عدد الأوراق في الشاشة الرئيسية.</li>
                                    <li>✅ إمكانية الضغط على منطقة الإجمالي لرؤية تفاصيل الأوراق لكل فئة.</li>
                                    <li>✅ حفظ عدد الأوراق تلقائياً مع كل يومية.</li>
                                    <li>✅ عرض وتعديل عدد الأوراق في السجلات القديمة.</li>
                                </ul>
                                <p style="font-size: 0.85em; color: var(--secondary-color); margin-top: 10px;">جرب الميزة الآن بالضغط على الإجمالي! 💰</p>
                            </div>
                        `,
                        icon: 'info',
                        confirmButtonText: 'رائع، فهمت!',
                        confirmButtonColor: 'var(--primary-color)',
                        background: 'var(--card-background)',
                        color: 'var(--text-color)'
                    });
                    AppStorage.setItem('feature_papers_announced', 'true');
                }, 2000);
            }
        });

        document.getElementById('lock-on-hide').addEventListener('change', (e) => {
            AppStorage.setItem('lockOnHide', e.target.checked);
        });

        document.getElementById('auto-lock-timer').addEventListener('change', (e) => {
            AppStorage.setItem('autoLockTimer', e.target.value);
            resetIdleTimer();
        });

        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            AppStorage.setItem('soundEnabled', e.target.checked);
        });

        // ---------------------------------------------------------
        // PWA Service Worker و العمل بدون إنترنت
        // ---------------------------------------------------------

        // تسجيل Service Worker الخارجي
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        console.log('[App] Service Worker registered:', reg.scope);
                        // تحديث تلقائي إذا توفر إصدار جديد
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: true, timer: 6000, background: 'var(--card-background)', color: 'var(--text-color)', confirmButtonText: 'تحديث' });
                                    Toast.fire({ icon: 'info', title: 'إصدار جديد متاح! اضغط للتحديث' }).then(r => { if (r.isConfirmed) window.location.reload(); });
                                }
                            });
                        });
                    })
                    .catch(e => console.log('[App] SW registration failed:', e));
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

        function closeAnnouncement() {
            const announcement = document.getElementById('new-features-announcement');
            if (announcement) {
                announcement.style.opacity = '0';
                announcement.style.transition = '0.3s';
                setTimeout(() => {
                    announcement.style.display = 'none';
                    AppStorage.setItem('announcement_v4_2_seen', 'true');
                }, 300);
            }
            playSound('tick');
        }

        // ---------------------------------------------------------
        // تقرير واتساب
        // ---------------------------------------------------------
        function buildWhatsAppReport() {
            const total = parseFloat(document.getElementById('total-amount')?.textContent) || 0;
            const currencySymbol = document.getElementById('currency-symbol')?.textContent || 'ج.م';
            const systemTotal = parseFloat(document.getElementById('system-total-input')?.value) || 0;
            const diff = total - systemTotal;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const userName = AppStorage.getItem('userName') || 'موظف';
            const userRole = AppStorage.getItem('userRole') || 'cashier';

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

            let report = `🟥 *تقرير عد العهدة 🟥*

📅 *التاريخ:* ${dateStr}
⏰ *الوقت:* ${timeStr}
👤 *الموظف:* ${userName} (${userRole})

💵 *تفاصيل الفئات:*
${denomRows || '  • لا توجد بيانات'}
📊 *إجمالي العد:* ${total.toLocaleString('ar-EG')} ${currencySymbol}`;

            if (systemTotal > 0) {
                const diffIcon = diff > 0 ? '✅' : diff < 0 ? '❌' : '🔵';
                report += `
🖥️ *مبيعات النظام:* ${systemTotal.toLocaleString('ar-EG')} ${currencySymbol}
${diffIcon} *الفرق:* ${diff >= 0 ? '+' : ''}${diff.toLocaleString('ar-EG')} ${currencySymbol}`;
            }

            // بيانات المحفظة الرقمية
            const vodafone = parseFloat(document.getElementById('vodafone-cash')?.value) || 0;
            const instapay = parseFloat(document.getElementById('instapay-amount')?.value) || 0;
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
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            const selectedTab = document.getElementById('tab-' + tabName);
            if (selectedTab) selectedTab.classList.add('active');
            const tabBtn = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
            if (tabBtn) tabBtn.classList.add('active');
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

        // --- دوال التبويب الجديدة ---
        function switchTab(tabName) {
            // إخفاء كل المحتويات
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            // إزالة التنشيط من كل الأزرار
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

            // تفعيل التبويب المختار
            const selectedTab = document.getElementById('tab-' + tabName);
            if (selectedTab) selectedTab.classList.add('active');

            // تفعيل الزر (باستخدام event.currentTarget)
            if (event && event.currentTarget) event.currentTarget.classList.add('active');
        }

        function handleLogout() {
            Swal.fire({
                title: 'تسجيل الخروج؟',
                text: "سيتم قفل التطبيق وإعادة تحميل الصفحة.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'نعم، خروج',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
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