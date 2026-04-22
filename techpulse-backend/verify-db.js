import prisma from './src/config/prisma.js';

async function verify() {
  try {
    const count = await prisma.newsCache.count();
    console.log(`✅ NewsCache table exists. Count: ${count}`);
    const analysisCount = await prisma.techAnalysis.count();
    console.log(`✅ TechAnalysis table exists. Count: ${analysisCount}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Verification failed: ${err.message}`);
    process.exit(1);
  }
}

verify();
