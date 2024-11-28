import React, { useState, useCallback } from 'react';
import { Button } from '../../shared/ui/Button';
import { Upload } from 'lucide-react';
import { useFileReader } from '../../../hooks/useFileReader';
import { validateCertificate, processCertificateData } from '../../../utils/certificateValidation';

const Step2CertificateValidation = ({ 
  dnsData, 
  onComplete, 
  onBack, 
  onError 
}) => {
  const [certificates, setCertificates] = useState([]);
  const [validationResults, setValidationResults] = useState({ public: [], private: [] });
  const { readFile, isLoading } = useFileReader();

  // Gestione del caricamento del file dei certificati
  const handleCertificateUpload = useCallback(async (file) => {
    try {
      const data = await readFile(file, { 
        parseCSV: true, 
        delimiter: ',', 
        skipHeader: true 
      });
      setCertificates(data);
    } catch (err) {
      onError('Errore nel caricamento dei certificati: ' + err.message);
    }
  }, [readFile, onError]);

  // Validazione dei certificati per i DNS
  const validateCertificates = useCallback(() => {
    if (!certificates.length) {
      onError('Carica il file dei certificati prima di procedere');
      return;
    }

    // Processiamo i certificati per un accesso più efficiente
    const certificateMap = processCertificateData(certificates);

    // Validazione per i DNS pubblici
    const validPublicResults = dnsData.public.map(record => {
      const validation = validateCertificate(certificateMap, record);
      return {
        record,
        ...validation
      };
    });

    // Validazione per i DNS privati
    const validPrivateResults = dnsData.private.map(record => {
      const validation = validateCertificate(certificateMap, record);
      return {
        record,
        ...validation
      };
    });

    setValidationResults({
      public: validPublicResults,
      private: validPrivateResults
    });

    // Procediamo al prossimo step con i risultati
    onComplete({
      public: validPublicResults,
      private: validPrivateResults
    });
  }, [certificates, dnsData, onComplete, onError]);

  return (
    <div className="space-y-6">
      {/* Sezione Caricamento Certificati */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Caricamento Certificati</h3>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleCertificateUpload(e.target.files[0])}
            className="hidden"
            id="certificateFile"
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('certificateFile').click()}
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Carica Certificati
          </Button>
          <span className="text-sm text-gray-500">
            {certificates.length} certificati caricati
          </span>
        </div>
      </div>

      {/* Risultati della Validazione */}
      {(validationResults.public.length > 0 || validationResults.private.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Risultati Validazione Certificati</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DNS Pubblici */}
            <div>
              <h4 className="text-sm font-medium mb-2">DNS Pubblici</h4>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                {validationResults.public.map((result, index) => (
                  <div key={index} className="text-sm">
                    <div className={`p-2 rounded ${result.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                      <p className="font-medium">{result.record}</p>
                      {result.details && (
                        <p className="text-gray-600 mt-1">
                          {result.details.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DNS Privati */}
            <div>
              <h4 className="text-sm font-medium mb-2">DNS Privati</h4>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                {validationResults.private.map((result, index) => (
                  <div key={index} className="text-sm">
                    <div className={`p-2 rounded ${result.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                      <p className="font-medium">{result.record}</p>
                      {result.details && (
                        <p className="text-gray-600 mt-1">
                          {result.details.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pulsanti di Navigazione */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Indietro
        </Button>
        <Button 
          onClick={validateCertificates}
          disabled={isLoading || !certificates.length}
        >
          Procedi
        </Button>
      </div>
    </div>
  );
};

export default Step2CertificateValidation;