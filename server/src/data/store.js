/**
 * Hybrid Resilient Storage Engine
 * Provides in-memory / local JSON persistence fallback when MongoDB is unavailable,
 * guaranteeing 100% uptime for hackathon demos.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'db_dump.json');

const initialDatabase = {
  users: [],
  studentProfiles: [],
  subjects: [],
  topics: [],
  studyPlans: [],
  revisions: [],
  quizzes: [],
  quizAttempts: [],
  performances: [],
  notifications: [],
  recommendations: []
};

class LocalStore {
  constructor() {
    this.data = initialDatabase;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read existing local store, using fresh store.', e.message);
      this.data = initialDatabase;
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Could not persist local store to disk:', e.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, query = {}) {
    const list = this.getCollection(collectionName);
    return list.filter(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(collectionName, query = {}) {
    const results = this.find(collectionName, query);
    return results.length > 0 ? results[0] : null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, { _id: id });
  }

  insert(collectionName, item) {
    const list = this.getCollection(collectionName);
    const enriched = {
      _id: item._id || `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    list.push(enriched);
    this.save();
    return enriched;
  }

  update(collectionName, query, updates) {
    const list = this.getCollection(collectionName);
    let updatedCount = 0;
    list.forEach(item => {
      let matches = true;
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        Object.assign(item, updates, { updatedAt: new Date().toISOString() });
        updatedCount++;
      }
    });
    this.save();
    return updatedCount;
  }

  delete(collectionName, query) {
    let list = this.getCollection(collectionName);
    const initialLen = list.length;
    list = list.filter(item => {
      // Remove item only if ALL query conditions match (AND logic)
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return true; // At least one condition doesn't match → keep item
        }
      }
      return false; // All conditions matched → remove item
    });
    this.data[collectionName] = list;
    this.save();
    return initialLen - list.length;
  }

  clear() {
    this.data = {
      users: [],
      studentProfiles: [],
      subjects: [],
      topics: [],
      studyPlans: [],
      revisions: [],
      quizzes: [],
      quizAttempts: [],
      performances: [],
      notifications: [],
      recommendations: []
    };
    this.save();
  }
}

const localStore = new LocalStore();
module.exports = localStore;
