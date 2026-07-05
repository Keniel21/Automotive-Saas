const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf-8');
// Fix title - match any garbled version of "Veículo"
c = c.replace(/"Detalhes do [^"]*culo"/g, '"Detalhes do Ve\u00edculo"');
// Fix subtitle - match any garbled version of "técnica"
c = c.replace(/"Ficha [^"]*cnica, financeiro e imagens"/g, '"Ficha t\u00e9cnica, financeiro e imagens"');
fs.writeFileSync('app.js', c, 'utf-8');
console.log('Title fixed!');
