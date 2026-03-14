require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index.js');

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

pool.query(sql)
  .then(() => {
    console.log('Database initialized.');
    pool.end();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
