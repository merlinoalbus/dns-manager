export const validateCertificate = (certificate, dnsRecord) => {
    // Implementeremo qui la logica di validazione dei certificati
    // basata sui requisiti specifici per i DNS pubblici e privati
    return {
      isValid: true,
      details: {}
    };
  };
  
  export const processCertificateData = (certificates) => {
    return certificates.reduce((acc, cert) => {
      const domain = cert['IP address/FQDN'].toLowerCase();
      acc[domain] = cert;
      return acc;
    }, {});
  };