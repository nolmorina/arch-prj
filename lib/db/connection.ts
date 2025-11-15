import mongoose from "mongoose";

const DEFAULT_DB_NAME = "studio_portfolio";

declare global {
  // eslint-disable-next-line no-var
  var __MONGOOSE_CACHE:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = globalThis.__MONGOOSE_CACHE ?? {
  conn: null,
  promise: null
};

globalThis.__MONGOOSE_CACHE = globalCache;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI ?? process.env.MONGO_URL;
  if (!uri) {
    throw new Error(
      "Missing MongoDB connection string. Set MONGODB_URI in your environment."
    );
  }
  return uri;
};

export const connectToDatabase = async () => {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const uri = getMongoUri();
    mongoose.set("strictQuery", true);

    globalCache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB ?? DEFAULT_DB_NAME,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
};

export const disconnectFromDatabase = async () => {
  if (!globalCache.conn) return;
  await mongoose.disconnect();
  globalCache.conn = null;
  globalCache.promise = null;
};


