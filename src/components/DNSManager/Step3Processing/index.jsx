// Step3Processing.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { ChevronDown, ChevronUp, RefreshCcw, Download } from 'lucide-react';

const Step3Processing = ({ 
  certificates, 
  onReset // Modificato da onBack a onReset
}) => {
  // Impostiamo il valore predefinito a '30'
  const [daysThreshold, setDaysThreshold] = useState('30');
  const [processedCertificates, setProcessedCertificates] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const publicCertificates = useMemo(() => certificates?.public || [], [certificates]);
  const privateCertificates = useMemo(() => certificates?.private || [], [certificates]);

  const certificatesMap = useMemo(() => {
    const map = new Map();

    // Combina certificati pubblici e privati
    const allCertificates = [...publicCertificates, ...privateCertificates];

    allCertificates.forEach(cert => {
      const serialNumber = cert['Serial number'];
      if (!serialNumber) return; // Salta se 'Serial number' manca

      if (!map.has(serialNumber)) {
        map.set(serialNumber, {
          ...cert,
          dnsNames: new Set(cert.dnsNames || [])
        });
      } else {
        const existingCert = map.get(serialNumber);
        existingCert.dnsNames = new Set([
          ...existingCert.dnsNames,
          ...(cert.dnsNames || [])
        ]);
      }
    });

    return map;
  }, [publicCertificates, privateCertificates]);

  const processCertificates = useCallback(() => {
    setIsProcessing(true);
    const threshold = parseInt(daysThreshold);
    if (isNaN(threshold) || threshold < 0) {
      setIsProcessing(false);
      return;
    }

    const currentDate = new Date();

    const uniqueCertificates = Array.from(certificatesMap.values());

    const processedCerts = uniqueCertificates.map(cert => {
      const expiryDate = new Date(cert['Expires on']);
      const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
      const isExpired = expiryDate < currentDate;

      return {
        ...cert,
        expiryDate,
        daysUntilExpiry,
        isExpired,
        dnsNames: Array.from(cert.dnsNames),
        isExpiringSoon: !isExpired && daysUntilExpiry <= 3
      };
    });

    // Filtra i certificati in base alla soglia
    const filteredCertificates = processedCerts.filter(cert => cert.isExpired || cert.daysUntilExpiry <= threshold);

    // Ordina i certificati: prima quelli scaduti, poi per data di scadenza
    const sortedCertificates = filteredCertificates.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      return a.expiryDate - b.expiryDate;
    });

    setProcessedCertificates(sortedCertificates);
    setShowResults(true);
    setIsProcessing(false);
  }, [daysThreshold, certificatesMap]);

  const handleExport = useCallback(() => {
    if (!processedCertificates.length) return;

    const headers = [
      'Serial number',
      'Common name',
      'Scan name',
      'Expires on',
      'Certificate Status',
      'Days Until Expiry',
      'DNS Names'
    ];

    const csvRows = [
      headers.join(','),
      ...processedCertificates.map(cert => {
        const row = [
          cert['Serial number'],
          cert['Common name'],
          cert['Scan name'],
          cert['Expires on'],
          cert['Certificate Status'],
          cert.daysUntilExpiry.toString(),
          cert.dnsNames.join('; ')
        ];
        return row.map(value => `"${value || ''}"`).join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expiring-certificates.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [processedCertificates]);

  // Gestione dello stato di espansione delle card
  const toggleCardExpansion = (serialNumber) => {
    setExpandedCards(prev => ({
      ...prev,
      [serialNumber]: !prev[serialNumber]
    }));
  };

  // Eseguiamo l'elaborazione iniziale al caricamento del componente
  useEffect(() => {
    processCertificates();
  }, [processCertificates]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Step 3: Analisi Scadenze Certificati</h2>
      
      {/* Riepilogo dei certificati ricevuti */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-semibold mb-2">Certificati Pubblici</h4>
          <div className="text-xs text-gray-600">
            {publicCertificates.length} certificati
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Certificati Privati</h4>
          <div className="text-xs text-gray-600">
            {privateCertificates.length} certificati
          </div>
        </div>
      </div>

      {/* Input per la soglia dei giorni */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold">Numero Giorni Scadenze:</h4>
        <div className="flex gap-4 items-center">
          <Input
            type="number"
            min="0"
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(e.target.value)}
            placeholder="Inserisci il numero di giorni"
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Risultati */}
      {showResults && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Certificati in Scadenza o Scaduti</h3>
          {processedCertificates.length > 0 ? (
            <div className="space-y-4">
              {processedCertificates.map((cert) => {
                const isExpired = cert.isExpired;
                const isExpiringSoon = cert.isExpiringSoon;
                const cardColorClass = isExpired
                  ? 'bg-red-50 border-red-200'
                  : isExpiringSoon
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white border-gray-200';

                return (
                  <div
                    key={cert['Serial number']}
                    className={`border p-4 rounded-md shadow-md ${cardColorClass}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-lg font-semibold">{cert['Common name']}</h5>
                        <p className="text-sm text-gray-700">Serial Number: {cert['Serial number']}</p>
                        <p className="text-sm text-gray-700">Scan Name: {cert['Scan name']}</p>
                        <p className="text-sm text-gray-700">Status: {cert['Certificate Status']}</p>
                        <p className="text-sm text-gray-700">
                          Expires On: {cert['Expires on']} ({cert.isExpired ? 'Scaduto' : `${cert.daysUntilExpiry} giorni rimasti`})
                        </p>
                      </div>
                      <button
                        onClick={() => toggleCardExpansion(cert['Serial number'])}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                        aria-label="Toggle DNS Names"
                      >
                        <span className="mr-2 text-sm">DNS Names</span>
                        {expandedCards[cert['Serial number']] ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>
                    {expandedCards[cert['Serial number']] && (
                      <div className="mt-4">
                        <h6 className="font-medium">DNS Names:</h6>
                        <div className="max-h-32 overflow-y-auto mt-2 border rounded-md p-2 bg-gray-50">
                          {cert.dnsNames.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {cert.dnsNames.map((dnsName, idx) => (
                                <li key={idx}>{dnsName}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-700">Nessun DNS associato</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Nessun certificato trovato per il periodo indicato.</p>
          )}
        </div>
      )}

      {/* Pulsanti di azione */}
      <div className="flex justify-between">
        <Button
          onClick={onReset} // Modificato da onBack a onReset
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Nuova Ricerca
        </Button>
        {showResults && (
          <Button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta Risultati
          </Button>
        )}
      </div>
    </div>
  );
};

export default Step3Processing;
