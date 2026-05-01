// 基于localStorage的简单数据存储，无需IndexedDB
const STORAGE_KEY = 'interview_tracker_data';

class InterviewDB {
    constructor() {
        this.initialized = true;
        this.storageMode = 'localstorage';
        this.localStorageKey = STORAGE_KEY;
    }

    // 初始化数据库 - localStorage不需要初始化，直接返回成功
    init() {
        return Promise.resolve({ _localStorage: true });
    }

    // 获取所有面试记录
    async getAllInterviews() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    // 根据ID获取面试记录
    async getInterview(id) {
        const interviews = await this.getAllInterviews();
        return interviews.find(interview => interview.id === id);
    }

    // 保存或更新面试记录
    async saveInterview(interview) {
        try {
            const interviews = await this.getAllInterviews();
            const existingIndex = interviews.findIndex(i => i.id === interview.id);
            
            if (existingIndex >= 0) {
                // 更新现有记录
                interviews[existingIndex] = {
                    ...interviews[existingIndex],
                    ...interview,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // 添加新记录
                interviews.push({
                    ...interview,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
            return interview.id;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    // 根据ID删除面试记录
    async deleteInterview(id) {
        try {
            const interviews = await this.getAllInterviews();
            const filtered = interviews.filter(interview => interview.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            throw error;
        }
    }

    // 清除所有面试记录
    async clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            throw error;
        }
    }

    // 根据状态获取面试记录
    async getInterviewsByStatus(status) {
        const interviews = await this.getAllInterviews();
        return interviews.filter(i => i.status === status);
    }

    // 根据日期范围获取面试记录
    async getInterviewsByDateRange(startDate, endDate) {
        const interviews = await this.getAllInterviews();
        return interviews.filter(i => {
            const date = i.date;
            return date >= startDate && date <= endDate;
        });
    }
}

// 创建单例实例
const interviewDB = new InterviewDB();

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = interviewDB;
} else {
    // 挂载到window对象以便全局访问
    window.interviewDB = interviewDB;
}