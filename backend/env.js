// env.js
const fs = require('fs');
const dotenv = require('dotenv');

module.exports = () => {
  const env = dotenv.parse(fs.readFileSync('.env.local'));
  return {
    FIREBASE_SERVICE_ACCOUNT_KEY: env.FIREBASE_SERVICE_ACCOUNT_KEY
  };
};