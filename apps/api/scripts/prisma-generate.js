const { execSync } = require('child_process');
const path = require('path');

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/crm?schema=public';
}

const apiDir = path.resolve(__dirname, '..');
execSync('npx prisma generate', { 
  stdio: 'inherit', 
  cwd: apiDir,
  env: process.env 
});
