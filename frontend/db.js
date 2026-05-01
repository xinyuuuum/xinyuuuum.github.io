// IndexedDB wrapper for Interview Tracker
const DB_NAME = 'InterviewTrackerDB';
const DB_VERSION = 2;
const STORE_NAME = 'interviews';

class InterviewDB {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    // Initialize database and return promise
    init() {
        return new Promise((resolve, reject) => {
            if (this.initialized && this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.initialized = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('company', 'company', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('phase', 'phase', { unique: false });
                    console.log(`Object store '${STORE_NAME}' created with phase index.`);
                } else {
                    // Upgrade existing store: add phase index if not exists
                    const transaction = event.target.transaction;
                    const store = transaction.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('phase')) {
                        store.createIndex('phase', 'phase', { unique: false });
                        console.log('Phase index added to existing store.');
                    }
                    // Update existing records to have default phase value
                    const cursorRequest = store.openCursor();
                    cursorRequest.onsuccess = function(event) {
                        const cursor = event.target.result;
                        if (cursor) {
                            const record = cursor.value;
                            if (!record.phase) {
                                // Set default phase based on status
                                let defaultPhase = '已投递';
                                if (record.status === 'upcoming' || record.status === 'completed') {
                                    defaultPhase = '面试中';
                                } else if (record.status === 'cancelled' || record.status === 'failed') {
                                    defaultPhase = '已结束';
                                }
                                record.phase = defaultPhase;
                                cursor.update(record);
                            }
                            cursor.continue();
                        } else {
                            console.log('Existing records updated with phase field.');
                        }
                    };
                }
            };
        });
    }

    // Add or update an interview
    async saveInterview(interview) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(interview);

            request.onerror = (event) => {
                reject(event.target.error);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    // Get all interviews
    async getAllInterviews() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = (event) => {
                reject(event.target.error);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    // Get interview by ID
    async getInterview(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onerror = (event) => {
                reject(event.target.error);
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    // Delete interview by ID
    async deleteInterview(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onerror = (event) => {
                reject(event.target.error);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    // Clear all interviews
    async clearAll() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = (event) => {
                reject(event.target.error);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    // Get interviews by status
    async getInterviewsByStatus(status) {
        const all = await this.getAllInterviews();
        return all.filter(i => i.status === status);
    }

    // Get interviews by date range
    async getInterviewsByDateRange(startDate, endDate) {
        const all = await this.getAllInterviews();
        return all.filter(i => {
            const date = i.date;
            return date >= startDate && date <= endDate;
        });
    }
}

// Create a singleton instance
const interviewDB = new InterviewDB();

// Export for use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = interviewDB;
} else {
    // Attach to window for global access
    window.interviewDB = interviewDB;
}