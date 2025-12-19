import crypto from 'crypto';

const key = crypto.randomBytes(32).toString('hex');
console.log(`\nGenerated Encryption Key (AES-256):`);
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log(`Add this line to your .env.local file.`);
