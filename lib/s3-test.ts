import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config'; // Add to top of file

console.log("🟡 Starting S3 connection test...");

import 'dotenv/config'; // Add to top of file

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function testConnection() {
  try {
    console.log("🟡 Attempting to list buckets...");
    const data = await s3.send(new ListBucketsCommand({}));
    console.log("✅ Success! Available buckets:", 
      data.Buckets?.map(b => b.Name).join(", ") || "(None)");
    return true;
  } catch (err) {
    console.error("❌ Full error details:", JSON.stringify(err, null, 2));
    return false;
  }
}

testConnection()
  .then(success => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));