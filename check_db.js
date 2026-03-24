import Database from 'better-sqlite3';
const db = new Database('voiceit.db');
const docs = db.prepare("SELECT id, title FROM documents").all();
console.log("Documents:", JSON.stringify(docs, null, 2));
const projects = db.prepare("SELECT id, title FROM projects").all();
console.log("Projects:", JSON.stringify(projects, null, 2));
const accounts = db.prepare("SELECT id, name FROM accounts").all();
console.log("Accounts:", JSON.stringify(accounts, null, 2));
db.close();
