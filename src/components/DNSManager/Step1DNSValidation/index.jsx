// Step1DNSValidation.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Upload, Plus, X, Save, Download } from 'lucide-react';
import { useFileReader } from '../../../hooks';
import { validatePublicDNS, validatePrivateDNS, checkDNSExceptions } from '../../../utils/dnsValidation';
import { readExceptions, saveExceptions } from '../../../services/exceptionsService';

const ExceptionItem = ({ exception, onDelete }) => (
  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
    <span className="flex-1 text-blue-900">{exception}</span>
    <button
      onClick={() => onDelete(exception)}
      className="text-blue-500 hover:text-blue-700"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

const Step1DNSValidation = ({ onComplete, onError }) => {
  const [publicDNS, setPublicDNS] = useState([]);
  const [privateDNS, setPrivateDNS] = useState([]);
  const [newException, setNewException] = useState('');
  const [validatedRecords, setValidatedRecords] = useState({ public: [], private: [] });
  const [showResults, setShowResults] = useState(false);
  const [exceptions, setExceptions] = useState([]);
  const { isLoading } = useFileReader();

  // New states for progress
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    const loadExceptions = async () => {
      try {
        const loadedExceptions = await readExceptions();
        setExceptions(Array.isArray(loadedExceptions) ? loadedExceptions.sort() : []);
      } catch (err) {
        setExceptions([]);
      }
    };
    loadExceptions();
  }, []);

  const addException = useCallback(() => {
    if (!newException.trim()) return;
    if (exceptions.includes(newException.trim())) {
      onError('Questa eccezione esiste già');
      return;
    }

    const updatedExceptions = [...exceptions, newException.trim()].sort();
    if (saveExceptions(updatedExceptions)) {
      setExceptions(updatedExceptions);
      setNewException('');
    } else {
      onError("Errore nel salvataggio dell'eccezione");
    }
  }, [newException, exceptions, onError]);

  const removeException = useCallback(async (exceptionToRemove) => {
    const updatedExceptions = exceptions.filter(exc => exc !== exceptionToRemove).sort();
    try {
      const result = await saveExceptions(updatedExceptions);
      if (result) {
        setExceptions(updatedExceptions);
      } else {
        onError("Errore nella rimozione dell'eccezione");
      }
    } catch (err) {
      onError("Errore nella rimozione dell'eccezione");
    }
  }, [exceptions, onError]);

  const handleExportExceptions = useCallback(() => {
    const sortedExceptions = [...exceptions].sort();
    const blob = new Blob([JSON.stringify(sortedExceptions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exceptions.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [exceptions]);

  const handleImportExceptions = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedExceptions = JSON.parse(text);

      if (!Array.isArray(importedExceptions)) {
        onError('Il file importato non è valido. Deve essere un array di stringhe.');
        return;
      }

      const mergedExceptions = Array.from(new Set([...exceptions, ...importedExceptions])).sort();
      setExceptions(mergedExceptions);

      if (saveExceptions(mergedExceptions)) {
        onError('Eccezioni importate con successo!');
      } else {
        onError('Errore durante il salvataggio delle eccezioni.');
      }
    } catch (err) {
      onError(`Errore durante l'importazione: ${err.message}`);
    }
  }, [exceptions, onError]);

  const handleFileUpload = useCallback(async (file, type) => {
    try {
      const text = await file.text();
      const records = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('id\t') && !line.startsWith('Name\t'));
      if (type === 'public') {
        setPublicDNS(records);
      } else {
        setPrivateDNS(records);
      }
      setShowResults(false);
    } catch (err) {
      onError(`Errore nel caricamento del file ${type}: ${err.message}`);
    }
  }, [onError]);

  const validateRecords = useCallback(async () => {
    if (!publicDNS.length && !privateDNS.length) {
      onError('Carica almeno una lista DNS prima di procedere');
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);
    setValidationMessage('Inizio validazione dei record DNS...');

    try {
      const totalRecords = publicDNS.length + privateDNS.length;
      let processedRecords = 0;

      const validPublic = [];
      const validPrivate = [];

      // Validate Public DNS Records
      if (publicDNS.length > 0) {
        setValidationMessage('Validazione dei DNS Pubblici...');
        for (let i = 0; i < publicDNS.length; i++) {
          const record = publicDNS[i];
          const validation = validatePublicDNS(record);
          if (validation.isValid && checkDNSExceptions(validation.name, exceptions)) {
            validPublic.push(validation);
          }
          processedRecords++;
          setValidationProgress(Math.floor((processedRecords / totalRecords) * 100));

          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Validate Private DNS Records
      if (privateDNS.length > 0) {
        setValidationMessage('Validazione dei DNS Privati...');
        for (let i = 0; i < privateDNS.length; i++) {
          const record = privateDNS[i];
          const validation = validatePrivateDNS(record);
          if (validation.isValid && checkDNSExceptions(validation.name, exceptions)) {
            validPrivate.push(validation);
          }
          processedRecords++;
          setValidationProgress(Math.floor((processedRecords / totalRecords) * 100));

          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setValidatedRecords({
        public: validPublic,
        private: validPrivate,
      });
      setShowResults(true);
      setValidationMessage('Validazione completata.');
    } catch (error) {
      onError('Errore durante la validazione: ' + error.message);
    } finally {
      setIsValidating(false);
      setValidationProgress(100);
    }
  }, [publicDNS, privateDNS, exceptions, onError]);

  const handleExportPublicCSV = useCallback(() => {
    const generateCSV = (records) => {
      const header = ['Name', 'Type', 'Value', 'ID', 'Zone Name', 'TTL'];
      const rows = records.map(record => [
        record.name,
        record.type,
        record.value,
        record.id || 'N/A',
        record.zone_name || 'N/A',
        record.ttl || 'N/A',
      ]);
      return [header, ...rows].map(row => row.join(',')).join('\n');
    };

    const csvContent = generateCSV(validatedRecords.public);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'valid-public-dns.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [validatedRecords.public]);

  const handleExportPrivateCSV = useCallback(() => {
    const generateCSV = (records) => {
      const header = ['Name', 'Type', 'Value'];
      const rows = records.map(record => [
        record.name,
        record.type,
        record.value,
      ]);
      return [header, ...rows].map(row => row.join(',')).join('\n');
    };

    const csvContent = generateCSV(validatedRecords.private);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'valid-private-dns.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [validatedRecords.private]);

  const handleContinue = () => {
    if (validatedRecords.public.length || validatedRecords.private.length) {
      onComplete(validatedRecords);
    } else {
      onError('Non ci sono record DNS validi da procedere.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Exception Management */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Step 1: Gestione e Validazione DNS</h2>
        <h3 className="text-lg font-semibold">Gestione Eccezioni</h3>
        <div className="flex gap-2">
          <Input
            value={newException}
            onChange={(e) => setNewException(e.target.value)}
            placeholder="Inserisci una nuova eccezione"
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && addException()}
          />
          <Button
            onClick={addException}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportExceptions}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta Eccezioni
          </Button>

          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Importa Eccezioni
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportExceptions}
            />
          </label>
        </div>

        {/* Scrollable Exceptions List */}
        <div className="mt-8 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
          {exceptions.length > 0 ? (
            exceptions.map((exception, index) => (
              <ExceptionItem
                key={index}
                exception={exception}
                onDelete={removeException}
              />
            ))
          ) : (
            <p className="text-sm text-gray-600">Nessuna eccezione presente.</p>
          )}
        </div>
      </div>

      {/* DNS Records Upload and Validation */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="font-medium mb-2">DNS Pubblici</h4>
          <div className="flex items-center gap-4">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Carica File
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0], 'public')}
              />
            </label>
            <span className="text-sm text-gray-600">{publicDNS.length} record(s) caricati</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">DNS Privati</h4>
          <div className="flex items-center gap-4">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Carica File
              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0], 'private')}
              />
            </label>
            <span className="text-sm text-gray-600">{privateDNS.length} record(s) caricati</span>
          </div>
        </div>
      </div>

      <Button
        onClick={validateRecords}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
        disabled={isLoading || (!publicDNS.length && !privateDNS.length) || isValidating}
      >
        {isValidating ? 'Validazione in corso...' : 'Valida Records DNS'}
      </Button>

      {/* Progress Indicator */}
      {isValidating && (
        <div className="mt-4">
          <p className="text-sm text-gray-700 mb-2">{validationMessage}</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${validationProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{validationProgress}% completato</p>
        </div>
      )}

      {showResults && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Records DNS Validi</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium mb-2">DNS Pubblici Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                {validatedRecords.public.length > 0 ? (
                  validatedRecords.public.map((record, index) => (
                    <div key={index} className="text-sm py-1 border-b last:border-0">
                      {record.name} - {record.type} - {record.value}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Nessun record valido trovato.</p>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {validatedRecords.public.length} record(s) validi
              </div>
              {validatedRecords.public.length > 0 && (
                <Button
                  onClick={handleExportPublicCSV}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta DNS Pubblici in CSV
                </Button>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">DNS Privati Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                {validatedRecords.private.length > 0 ? (
                  validatedRecords.private.map((record, index) => (
                    <div key={index} className="text-xs py-1 border-b last:border-0">
                      {record.name} - {record.type} - {record.value}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Nessun record valido trovato.</p>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {validatedRecords.private.length} record(s) validi
              </div>
              {validatedRecords.private.length > 0 && (
                <Button
                  onClick={handleExportPrivateCSV}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta DNS Privati in CSV
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Continua
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1DNSValidation;
