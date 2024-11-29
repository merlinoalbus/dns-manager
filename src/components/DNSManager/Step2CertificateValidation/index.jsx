// Step2CertificateValidation.jsx

import React, { useState, useCallback } from 'react';
import { Button } from '../../shared/ui/Button';
import { Upload, Download, RefreshCcw } from 'lucide-react';
import { useFileReader } from '../../../hooks';

// Utility per il matching dei DNS
const isDNSMatch = (dnsName, commonName) => {
  dnsName = dnsName.toLowerCase();
  commonName = commonName.toLowerCase();

  if (commonName === dnsName) return true;

  if (commonName.startsWith('*.')) {
    const domain = commonName.slice(2);
    return dnsName.endsWith(domain) && dnsName.split('.').length > domain.split('.').length;
  }

  return false;
};

const Step2CertificateValidation = ({
  dnsData,
  onComplete,
  onReset, // Changed from onBack to onReset
  onError
}) => {
  const [scanData, setScanData] = useState([]);
  const [processedResults, setProcessedResults] = useState({
    add: { public: [], private: [] },
    remove: { public: [], private: [] },
    validCertificates: { public: [], private: [] }
  });
  const [showResults, setShowResults] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({
    step: '',
    currentOperation: '',
    percentage: 0
  });

  const { isLoading } = useFileReader();

  const handleFileUpload = useCallback(async (file) => {
    try {
      const text = await file.text();
      const [header, ...rows] = text.split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      const headers = header.split(',').map(h => h.trim().replace(/"/g, ''));

      const processedData = rows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      setScanData(processedData);
      setShowResults(false);
    } catch (err) {
      onError('Errore nel caricamento del file Scan: ' + err.message);
    }
  }, [onError]);

  const processData = useCallback(async () => {
    if (!scanData.length) {
      onError('Carica il file Scan prima di procedere');
      return;
    }

    setProcessing(true);

    try {
      const publicScans = scanData.filter(scan => scan['Scan name'].includes('Public'));
      const internalScans = scanData.filter(scan => scan['Scan name'].includes('Internal'));

      const totalOperations = dnsData.public.length + dnsData.private.length +
        publicScans.length + internalScans.length;
      let completedOperations = 0;

      const validPublicCertificates = new Map();
      const validPrivateCertificates = new Map();
      const publicToAdd = [];
      const privateToAdd = [];
      const publicToRemove = [];
      const privateToRemove = [];

      // ADD - DNS pubblici
      setProgress({
        step: 'Analisi DNS pubblici',
        currentOperation: 'Verifica certificati esistenti per DNS pubblici',
        percentage: 0
      });

      for (const dns of dnsData.public) {
        const matchingScans = publicScans.filter(scan => isDNSMatch(dns.name, scan['Common name']));
        if (matchingScans.length === 0) {
          publicToAdd.push({
            type: 'ADD',
            scope: 'public',
            name: dns.name
          });
        } else {
          matchingScans.forEach(scan => {
            const serialNumber = scan['Serial number'];
            if (!serialNumber) return;

            if (!validPublicCertificates.has(serialNumber)) {
              validPublicCertificates.set(serialNumber, {
                ...scan,
                dnsNames: new Set([dns.name])
              });
            } else {
              const cert = validPublicCertificates.get(serialNumber);
              cert.dnsNames.add(dns.name);
            }
          });
        }
        completedOperations++;
        setProgress(prev => ({
          ...prev,
          percentage: Math.floor((completedOperations / totalOperations) * 100)
        }));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // ADD - DNS privati
      setProgress({
        step: 'Analisi DNS privati',
        currentOperation: 'Verifica certificati esistenti per DNS privati',
        percentage: Math.floor((completedOperations / totalOperations) * 100)
      });

      for (const dns of dnsData.private) {
        const matchingScans = internalScans.filter(scan => isDNSMatch(dns.name, scan['Common name']));
        if (matchingScans.length === 0) {
          privateToAdd.push({
            type: 'ADD',
            scope: 'private',
            name: dns.name
          });
        } else {
          matchingScans.forEach(scan => {
            const serialNumber = scan['Serial number'];
            if (!serialNumber) return;

            if (!validPrivateCertificates.has(serialNumber)) {
              validPrivateCertificates.set(serialNumber, {
                ...scan,
                dnsNames: new Set([dns.name])
              });
            } else {
              const cert = validPrivateCertificates.get(serialNumber);
              cert.dnsNames.add(dns.name);
            }
          });
        }
        completedOperations++;
        setProgress(prev => ({
          ...prev,
          percentage: Math.floor((completedOperations / totalOperations) * 100)
        }));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // REMOVE - Scan pubblici
      setProgress({
        step: 'Analisi certificati pubblici',
        currentOperation: 'Verifica certificati pubblici da rimuovere',
        percentage: Math.floor((completedOperations / totalOperations) * 100)
      });

      for (const scan of publicScans) {
        if (!dnsData.public.some(dns => isDNSMatch(dns.name, scan['Common name']))) {
          publicToRemove.push({
            type: 'REMOVE',
            scope: 'public',
            name: scan['Common name'],
            details: {
              'IP/FQDN': scan['IP address/FQDN'],
              'Expires on': scan['Expires on'],
              'Status': scan['Certificate Status']
            }
          });
        }
        completedOperations++;
        setProgress(prev => ({
          ...prev,
          percentage: Math.floor((completedOperations / totalOperations) * 100)
        }));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // REMOVE - Scan interni
      setProgress({
        step: 'Analisi certificati privati',
        currentOperation: 'Verifica certificati privati da rimuovere',
        percentage: Math.floor((completedOperations / totalOperations) * 100)
      });

      for (const scan of internalScans) {
        if (!dnsData.private.some(dns => isDNSMatch(dns.name, scan['Common name']))) {
          privateToRemove.push({
            type: 'REMOVE',
            scope: 'private',
            name: scan['Common name'],
            details: {
              'IP/FQDN': scan['IP address/FQDN'],
              'Expires on': scan['Expires on'],
              'Status': scan['Certificate Status']
            }
          });
        }
        completedOperations++;
        setProgress(prev => ({
          ...prev,
          percentage: Math.floor((completedOperations / totalOperations) * 100)
        }));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Converti le Map in Array e prepara i certificati per lo Step 3
      const validPublicCertificatesArray = Array.from(validPublicCertificates.values()).map(cert => ({
        ...cert,
        dnsNames: Array.from(cert.dnsNames)
      }));

      const validPrivateCertificatesArray = Array.from(validPrivateCertificates.values()).map(cert => ({
        ...cert,
        dnsNames: Array.from(cert.dnsNames)
      }));

      setProcessedResults({
        add: { public: publicToAdd, private: privateToAdd },
        remove: { public: publicToRemove, private: privateToRemove },
        validCertificates: { public: validPublicCertificatesArray, private: validPrivateCertificatesArray }
      });

      setShowResults(true);
    } catch (error) {
      onError('Errore durante l\'elaborazione: ' + error.message);
    } finally {
      setProcessing(false);
      setProgress({
        step: '',
        currentOperation: '',
        percentage: 0
      });
    }
  }, [dnsData, scanData, onError]);

  const handleExportResults = useCallback(() => {
    const results = [
      ...processedResults.add.public.map(r => ({ ...r, category: 'Public' })),
      ...processedResults.add.private.map(r => ({ ...r, category: 'Private' })),
      ...processedResults.remove.public.map(r => ({ ...r, category: 'Public' })),
      ...processedResults.remove.private.map(r => ({ ...r, category: 'Private' }))
    ];

    const csv = [
      ['Action', 'Category', 'Name', 'IP/FQDN', 'Expires on', 'Status'].join(','),
      ...results.map(r => [
        r.type,
        r.category,
        r.name,
        r.details?.['IP/FQDN'] || '',
        r.details?.['Expires on'] || '',
        r.details?.['Status'] || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'certificate-changes.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [processedResults]);

  const handleContinue = useCallback(() => {
    if (showResults) {
      onComplete({
        public: processedResults.validCertificates.public,
        private: processedResults.validCertificates.private
      });
    }
  }, [showResults, processedResults, onComplete]);

  return (
    <div className="space-y-8">
      {/* Riepilogo dati Step 1 */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-semibold mb-2">DNS Pubblici validati</h4>
          <div className="text-sm text-gray-600">
            {dnsData.public.length} record
          </div>
        </div>
        <div>
          <h4 className="text-xl font-semibold mb-2">DNS Privati validati</h4>
          <div className="text-sm text-gray-600">
            {dnsData.private.length} record
          </div>
        </div>
      </div>

      {/* Caricamento Scan */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold">Carica il File Scan</h4>
        <div className="flex items-center gap-4">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Carica File
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
          </label>
          <span className="text-sm text-gray-600">
            {scanData.length} scan caricati
          </span>
        </div>
      </div>

      {/* Pulsante Elabora con Progress Bar */}
      <Button
        onClick={processData}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
        disabled={isLoading || !scanData.length || processing}
      >
        {processing ? 'Elaborazione in corso...' : 'Elabora'}
      </Button>

      {/* Progress Indicator */}
      {processing && (
        <div className="mt-4">
          <p className="text-sm text-gray-700 mb-2">{progress.step}</p>
          <p className="text-sm text-gray-600 mb-2">{progress.currentOperation}</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress.percentage}% completato</p>
        </div>
      )}

      {/* Risultati dell'elaborazione */}
      {showResults && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Risultati Elaborazione</h3>

          {/* Sezione ADD */}
          <div className="space-y-4">
            <h4 className="font-medium">Certificati da Aggiungere (ADD)</h4>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h5 className="text-sm font-medium mb-2">
                  Public ({processedResults.add.public.length})
                </h5>
                <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {processedResults.add.public.length > 0 ? (
                    processedResults.add.public.map((item, index) => (
                      <div key={index} className="text-sm py-1 border-b last:border-0">
                        {item.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">Nessun elemento da aggiungere.</p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">
                  Private ({processedResults.add.private.length})
                </h5>
                <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {processedResults.add.private.length > 0 ? (
                    processedResults.add.private.map((item, index) => (
                      <div key={index} className="text-sm py-1 border-b last:border-0">
                        {item.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">Nessun elemento da aggiungere.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sezione REMOVE */}
          <div className="space-y-4">
            <h4 className="font-medium">Certificati da Rimuovere (REMOVE)</h4>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h5 className="text-sm font-medium mb-2">
                  Public ({processedResults.remove.public.length})
                </h5>
                <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {processedResults.remove.public.length > 0 ? (
                    processedResults.remove.public.map((item, index) => (
                      <div key={index} className="text-sm py-1 border-b last:border-0">
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          IP/FQDN: {item.details['IP/FQDN']}<br />
                          Scadenza: {item.details['Expires on']}<br />
                          Stato: {item.details['Status']}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">Nessun elemento da rimuovere.</p>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">
                  Private ({processedResults.remove.private.length})
                </h5>
                <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {processedResults.remove.private.length > 0 ? (
                    processedResults.remove.private.map((item, index) => (
                      <div key={index} className="text-sm py-1 border-b last:border-0">
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          IP/FQDN: {item.details['IP/FQDN']}<br />
                          Scadenza: {item.details['Expires on']}<br />
                          Stato: {item.details['Status']}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">Nessun elemento da rimuovere.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pulsanti di azione */}
          <div className="flex justify-between">
            <Button
              onClick={handleExportResults}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta Risultati
            </Button>
            <div className="space-x-4">
              <Button
                onClick={onReset} // Changed from onBack to onReset
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Nuova Ricerca
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Continua
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2CertificateValidation;
