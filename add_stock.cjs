const fs = require('fs');
const content = fs.readFileSync('src/data/mockData.ts', 'utf8');
const updated = content.replace(/inStock: true,/g, () => `inStock: true,\n    stock: ${Math.floor(Math.random() * 50) + 1},`);
fs.writeFileSync('src/data/mockData.ts', updated);
console.log('Updated mockData.ts');
