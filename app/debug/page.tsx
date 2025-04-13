export default function EnvDebug() { return <pre>{JSON.stringify({
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_REGION: process.env.AWS_REGION,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY).project_id : 'MISSING'
}, null, 2)}</pre> }
