// Starts an in-memory single-node replica set on 127.0.0.1:27017 for machines without
// Docker. Leave it running, then run `pnpm e2e`. Stop it with Ctrl+C.
const { MongoMemoryReplSet } = require("../apps/api/node_modules/mongodb-memory-server");

(async () => {
  const rs = await MongoMemoryReplSet.create({
    replSet: { name: "rs0", count: 1 },
    instanceOpts: [{ port: 27017, ip: "127.0.0.1" }],
  });
  console.log("MongoDB ready:", rs.getUri());
  process.on("SIGINT", async () => {
    await rs.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
})();
