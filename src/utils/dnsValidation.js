// Funzione per validare i DNS pubblici
export const validatePublicDNS = (record) => {
  const parts = record.split('\t');
  if (parts.length < 6) return false;

  // Estrarre i dati dal record
  const recordType = parts[3].trim().toUpperCase();
  if (recordType !== 'A' && recordType !== 'CNAME') return false;

  return {
    isValid: true,
    name: parts[2].trim().toLowerCase(),
    type: recordType,
    value: parts[4].trim(),
    id: parts[0].trim(), // ID
    zone_name: parts[1].trim(), // Zone Name
    ttl: parts[5].trim(), // TTL
  };
};

// Funzione per validare i DNS privati
export const validatePrivateDNS = (record) => {
  const parts = record.split('\t').filter(p => p.trim());
  if (parts.length < 2) return false;

  const recordType = parts[1].toLowerCase();
  const isValid = recordType === 'host (a)' || recordType === 'alias (cname)';

  if (!isValid) return false;

  return {
    isValid: true,
    name: parts[0].trim().toLowerCase(),
    type: recordType === 'host (a)' ? 'A' : 'CNAME',
    value: parts[2]?.trim() || 'N/A', // Aggiunge valore se disponibile
  };
};

// Funzione per verificare se un nome DNS è tra le eccezioni
export const checkDNSExceptions = (name, exceptions) => {
  return !exceptions.some(exception => {
    const normalizedException = exception.trim().toLowerCase();
    return name.includes(normalizedException);
  });
};
