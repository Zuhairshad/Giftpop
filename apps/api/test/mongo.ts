import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll } from "vitest";

import { connectDb, disconnectDb } from "../src/db";

export interface TestMongo {
  uri: string;
  stop: () => Promise<void>;
}

/**
 * Start an in-memory single-node replica set (so transactions work).
 * Fails loudly if the mongod binary is missing or cannot start; it never skips.
 */
export async function startTestMongo(dbName = "giftpop_test"): Promise<TestMongo> {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  return { uri: replSet.getUri(dbName), stop: async () => void (await replSet.stop()) };
}

/** Delete every document in every collection, keeping indexes. Call in `beforeEach`. */
export async function clearDatabase(): Promise<void> {
  const collections = await mongoose.connection.listCollections();
  await Promise.all(
    collections.map(({ name }) => mongoose.connection.collection(name).deleteMany({})),
  );
}

/**
 * Register `beforeAll`/`afterAll` hooks that start a replica set and connect mongoose
 * to it. Call once at the top of a test file that needs Mongo:
 *
 *   const mongo = useTestMongo();
 *   beforeEach(clearDatabase);
 */
export function useTestMongo(): { readonly uri: string } {
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startTestMongo();
    await connectDb({ uri: mongo.uri, maxAttempts: 1, baseDelayMs: 10 });
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo?.stop();
  });

  return {
    get uri() {
      if (!mongo) throw new Error("useTestMongo: replica set is not started yet");
      return mongo.uri;
    },
  };
}
