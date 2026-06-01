import "dotenv/config";
import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Backend running on http://0.0.0.0:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
