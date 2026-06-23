const fs = require('fs');

const path = 'supabase/migrations/20260623060000_gamification_tables.sql';
let content = fs.readFileSync(path, 'utf8');

// Replace CREATE POLICY with DROP + CREATE
content = content.replace(/CREATE POLICY "([^"]+)" ON ([a-zA-Z0-9_.]+)/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2');

// Also replace trigger
content = content.replace(/CREATE TRIGGER (\w+)\nAFTER INSERT ON ([a-zA-Z0-9_.]+)/g, 'DROP TRIGGER IF EXISTS $1 ON $2;\nCREATE TRIGGER $1\nAFTER INSERT ON $2');

fs.writeFileSync(path, content);
console.log('Fixed policies to be idempotent');
