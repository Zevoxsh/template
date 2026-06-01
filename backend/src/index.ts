import "dotenv/config";
import app from "./app";
import { config } from "./config";
import { prisma } from "./lib/prisma";

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
