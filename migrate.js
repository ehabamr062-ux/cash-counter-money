const fs = require('fs');

const file = 'c:/Users/Test/Desktop/موبايل/script.js';
let content = fs.readFileSync(file, 'utf8');

const appStorageCode = `
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

`;

content = appStorageCode + content.replace(/localStorage/g, 'AppStorage');

content = content.replace(
    "document.addEventListener('DOMContentLoaded', async () => {",
    "document.addEventListener('DOMContentLoaded', async () => {\n            await AppStorage.init(); // Initialize IndexedDB Cache"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Migration to IndexedDB successful!');
