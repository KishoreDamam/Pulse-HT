import fs from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

// Ensure data folder exists for local database fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'db.json');

// MongoDB Setup
const MONGODB_URI = process.env.MONGODB_URI;
let mongoClient = null;
let mongoDb = null;

async function getMongoClient() {
  if (!MONGODB_URI) return null;
  if (mongoClient) return mongoClient;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log('Connected to MongoDB successfully!');
    return mongoClient;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    mongoClient = null;
    mongoDb = null;
    return null;
  }
}

// Ensure local DB file exists
function initLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ users: [], userdata: [] }, null, 2), 'utf-8');
  }
}

// Local File Helper Functions (Async)
async function readLocalDb() {
  initLocalDb();
  try {
    const data = await fs.promises.readFile(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local db:', err);
    return { users: [], userdata: [] };
  }
}

async function writeLocalDb(data) {
  initLocalDb();
  try {
    await fs.promises.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local db:', err);
  }
}

// DATABASE LAYER APIS

/**
 * Find user by email
 */
export async function getUserByEmail(email) {
  const normEmail = email.toLowerCase().trim();
  
  const client = await getMongoClient();
  if (client && mongoDb) {
    const user = await mongoDb.collection('users').findOne({ email: normEmail });
    if (user) {
      user.id = user._id.toString();
    }
    return user;
  } else {
    // Local fallback
    const db = await readLocalDb();
    const user = db.users.find(u => u.email === normEmail);
    return user ? { ...user } : null;
  }
}

/**
 * Create a new user
 */
export async function createUser(email, passwordHash) {
  const normEmail = email.toLowerCase().trim();
  const newUser = {
    email: normEmail,
    password: passwordHash,
    createdAt: new Date().toISOString()
  };

  const client = await getMongoClient();
  if (client && mongoDb) {
    const result = await mongoDb.collection('users').insertOne(newUser);
    return { id: result.insertedId.toString(), ...newUser };
  } else {
    // Local fallback
    const db = await readLocalDb();
    const id = 'u_' + Date.now() + Math.random().toString(36).substring(2, 7);
    const userWithId = { id, ...newUser };
    db.users.push(userWithId);
    await writeLocalDb(db);
    return userWithId;
  }
}

/**
 * Save user habit, logs, and quote data
 */
export async function saveUserData(userId, data) {
  const payload = {
    habits: data.habits || [],
    logs: data.logs || {},
    quote: data.quote || 'Discipline equals freedom.',
    updatedAt: new Date().toISOString()
  };

  const client = await getMongoClient();
  if (client && mongoDb) {
    await mongoDb.collection('userdata').updateOne(
      { userId },
      { $set: { userId, ...payload } },
      { upsert: true }
    );
  } else {
    // Local fallback
    const db = await readLocalDb();
    const index = db.userdata.findIndex(d => d.userId === userId);
    const record = { userId, ...payload };
    if (index !== -1) {
      db.userdata[index] = record;
    } else {
      db.userdata.push(record);
    }
    await writeLocalDb(db);
  }
}

/**
 * Fetch user habits, logs, and quote data
 */
export async function getUserData(userId) {
  const client = await getMongoClient();
  if (client && mongoDb) {
    const data = await mongoDb.collection('userdata').findOne({ userId });
    return data || null;
  } else {
    // Local fallback
    const db = await readLocalDb();
    const data = db.userdata.find(d => d.userId === userId);
    return data ? { ...data } : null;
  }
}
