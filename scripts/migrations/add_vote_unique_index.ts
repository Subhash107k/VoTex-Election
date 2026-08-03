import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/votex_db";

async function run() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const votes = db.collection("votes");

    console.log("Creating unique index on votes (electionId, anonymousVoterHash)");
    await votes.createIndex({ electionId: 1, anonymousVoterHash: 1 }, { unique: true, name: "votes_unique_per_election" });

    console.log("Index created (or already exists).");
  } catch (err: any) {
    console.error("Migration failed:", err?.message || err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  void run();
}

export default run;
