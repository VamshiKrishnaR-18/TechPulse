import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectWithRetry() {
  let retries = 5;

  while (retries) {
    try {
      await prisma.$connect();
      console.log("✅ Connected to DB");
      break;
    } catch (err) {
      console.log("⏳ DB waking up... retrying");
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

// ✅ Only connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
  connectWithRetry();
}

export default prisma;