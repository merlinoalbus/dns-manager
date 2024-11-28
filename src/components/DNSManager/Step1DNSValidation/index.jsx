import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Upload, Plus, X } from 'lucide-react';
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
  const { readFile, isLoading } = useFileReader();

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
      onError('Errore nel salvataggio dell\'eccezione');
    }
  }, [newException, exceptions, onError]);

  const removeException = useCallback(async (exceptionToRemove) => {
    const updatedExceptions = exceptions.filter(exc => exc !== exceptionToRemove).sort();
    try {
      const result = await saveExceptions(updatedExceptions);
      if (result) {
        setExceptions(updatedExceptions);
      } else {
        onError('Errore nella rimozione dell\'eccezione');
      }
    } catch (err) {
      onError('Errore nella rimozione dell\'eccezione');
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

  const validateRecords = useCallback(() => {
    if (!publicDNS.length && !privateDNS.length) {
      onError('Carica almeno una lista DNS prima di procedere');
      return;
    }

    const validPublic = publicDNS
      .map(record => validatePublicDNS(record))
      .filter(validation => validation.isValid && checkDNSExceptions(validation.name, exceptions));

    const validPrivate = privateDNS
      .map(record => validatePrivateDNS(record))
      .filter(validation => validation.isValid && checkDNSExceptions(validation.name, exceptions));

    setValidatedRecords({
      public: validPublic,
      private: validPrivate,
    });
    setShowResults(true);
  }, [publicDNS, privateDNS, exceptions]);

  const handleContinue = () => {
    if (validatedRecords.public.length || validatedRecords.private.length) {
      onComplete(validatedRecords);
    }
  };

  return (
    <div className="space-y-8">
      <div className="h-1 bg-gray-200 rounded-full">
        <div className="h-full bg-blue-600 rounded-full w-1/3" />
      </div>

      <div className="space-y-4">
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
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Esporta Eccezioni
          </Button>

          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer">
            Importa Eccezioni
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportExceptions}
            />
          </label>
        </div>

        <div className="space-y-2">
          {[...exceptions].sort().map((exception, index) => (
            <ExceptionItem
              key={index}
              exception={exception}
              onDelete={removeException}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="font-medium mb-2">DNS Pubblici</h4>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('publicDNS').click()}
            >
              <Upload className="h-4 w-4" />
              Carica File
            </Button>
            <span className="text-sm text-gray-600">{publicDNS.length} records caricati</span>
            <input
              type="file"
              id="publicDNS"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files[0], 'public')}
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">DNS Privati</h4>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('privateDNS').click()}
            >
              <Upload className="h-4 w-4" />
              Carica File
            </Button>
            <span className="text-sm text-gray-600">{privateDNS.length} records caricati</span>
            <input
              type="file"
              id="privateDNS"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files[0], 'private')}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={validateRecords}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
        disabled={isLoading || (!publicDNS.length && !privateDNS.length)}
      >
        Valida Records DNS
      </Button>

      {showResults && (validatedRecords.public.length > 0 || validatedRecords.private.length > 0) && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Records DNS Validi</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium mb-2">DNS Pubblici Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                {validatedRecords.public.map((record, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-0">
                    {record.name} - {record.type} - {record.value}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {validatedRecords.public.length} record validi
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">DNS Privati Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                {validatedRecords.private.map((record, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-0">
                    {record.name} - {record.type} - {record.value}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {validatedRecords.private.length} record validi
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
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
