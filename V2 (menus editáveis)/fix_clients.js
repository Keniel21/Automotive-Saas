const data = [
  "  VIANA VEICULOS LTDA 46723522000112",
  "ANDRECAR VEICULOS LTDA 59771389000111",
  "Jailson Samuel Schirmer 03399515081",
  "ANDRECAR VEICULOS LTDA  59771389000111",
  "GILIAN LODI 02341998062",
  "Elite Comercio de veículos -17.042.015/0001-15",
  "Dieison Lopes Liska -  028.927.540-70",
  "MARCELO OSORIO RODRIGUES 58810536053",
  "Vinicius Fonseca",
  "William Silva dos Santos 98102492008",
  "GRAMADOCAR VEICULOS COMERCIO LTDA 22.818.475/0001-22",
  "MAICON BORGES MANIQUE- 033.491.110-92",
  "26651495000102 AR VEICULOS LTDA",
  "Vinicius de Souza Wermuth 03122429055",
  "Thiago Pacheco da Silva 00119346036",
  "Alexandre Prass Vargas 50664840000",
  " MAIKE WILLI ABREU DO COUTO 825.966.700-20",
  "JONATHAN CORNEO 031.070.470-74 ",
  "VIANA VEICULOS LTDA  46.723.522/0001-12",
  "MICHELLE MENEZES DIEDRICH 94178224034",
  " BLUE OCEAN PARTICIPAÇÕES 45.236.393/0001-75"
];

let sql = '';
const docRegex = /((?:\d{2,3}[\.\-]?\d{3}[\.\-]?\d{3}[\.\/]?\d{4}[\.\-]?\d{2})|(?:\d{11,14}))/g;

data.forEach(item => {
    const original = item;
    const cleanOriginal = item.trim();
    let name = cleanOriginal;
    let doc = '';

    const matches = [...cleanOriginal.matchAll(docRegex)];
    if (matches.length > 0) {
        doc = matches[0][0];
        name = cleanOriginal.replace(doc, '').replace(/[\-\:]/g, '').replace(/\s+/g, ' ').trim();
    }

    if (doc) {
        sql += `UPDATE clientes SET name = '${name.replace(/'/g, "''")}', document = '${doc}' WHERE name = '${cleanOriginal.replace(/'/g, "''")}';\n`;
        sql += `UPDATE vendas SET client = '${name.replace(/'/g, "''")}', client_document = '${doc}' WHERE TRIM(client) = '${cleanOriginal.replace(/'/g, "''")}';\n`;
    } else {
        // If no doc, we still might want to trim spaces for vendas
        sql += `UPDATE clientes SET name = '${name.replace(/'/g, "''")}' WHERE name = '${cleanOriginal.replace(/'/g, "''")}';\n`;
        sql += `UPDATE vendas SET client = '${name.replace(/'/g, "''")}' WHERE TRIM(client) = '${cleanOriginal.replace(/'/g, "''")}';\n`;
    }
});

console.log(sql);
