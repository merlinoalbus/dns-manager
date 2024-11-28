export const validatePublicDNS = (record) => {
  const parts = record.split('\t');
  if (parts.length < 6) return {
    isValid: false,
    name: '',
    type: ''
  };
  
  // Verifica del tipo di record (A o CNAME)
  const recordType = parts[3].trim().toUpperCase();
  if (recordType !== 'A' && recordType !== 'CNAME') return {
    isValid: false,
    name: '',
    type: ''
  };

  // Estrai il nome per verificare le eccezioni
  const name = parts[2].trim().toLowerCase();
  return {
    isValid: true,
    name,
    type: recordType
  };
};

export const validatePrivateDNS = (record) => {
  const parts = record.split('\t').filter(p => p.trim());
  if (parts.length < 2) return {
    isValid: false,
    name: '',
    type: ''
  };

  // Verifica del tipo di record
  const recordType = parts[1].toLowerCase();
  const isValid = recordType === 'host (a)' || recordType === 'alias (cname)';
  
  if (!isValid) return {
    isValid: false,
    name: '',
    type: ''
  };

  return {
    isValid: true,
    name: parts[0].trim().toLowerCase(),
    type: recordType === 'host (a)' ? 'A' : 'CNAME'
  };
};

export const checkDNSExceptions = (name, exceptions) => {
  return exceptions.some(exception => {
    const normalizedException = exception.trim().toLowerCase();
    return name.includes(normalizedException);
  });
};