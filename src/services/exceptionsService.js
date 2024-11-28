const fs = require('fs');
const path = require('path');

const EXCEPTIONS_FILE = path.join(__dirname, '../config/defaultExceptions.js');

export const readExceptions = () => {
  try {
    const fileContent = fs.readFileSync(EXCEPTIONS_FILE, 'utf8');
    // Estrae l'array di eccezioni dal file
    const matches = fileContent.match(/=\s*\[([\s\S]*?)\]/);
    if (matches && matches[1]) {
      return matches[1]
        .split(',')
        .map(item => item.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Errore nella lettura delle eccezioni:', error);
    return [];
  }
};

export const saveExceptions = (exceptions) => {
  try {
    const content = `export const defaultExceptions = [\n  ${
      exceptions.map(exc => `'${exc}'`).join(',\n  ')
    }\n];`;
    fs.writeFileSync(EXCEPTIONS_FILE, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Errore nel salvataggio delle eccezioni:', error);
    return false;
  }
};