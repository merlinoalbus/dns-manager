import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Alert } from '../../shared/ui/Alert';
import { Upload, Plus, X } from 'lucide-react';
import { useFileReader } from '../../../hooks/useFileReader';
import { validatePublicDNS, validatePrivateDNS, checkDNSExceptions } from '../../../utils/dnsValidation';

// Componente per visualizzare una singola eccezione con possibilità di rimozione
const ExceptionItem = ({ exception, onDelete }) => (
  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
    <span className="flex-1">{exception}</span>
    <Button variant="ghost" size="sm" onClick={() => onDelete(exception)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
);

const Step1DNSValidation = ({ onComplete, onError }) => {
  // Stati per gestire i dati dei DNS e le eccezioni
  const [publicDNS, setPublicDNS] = useState([]);
  const [privateDNS, setPrivateDNS] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [newException, setNewException] = useState('');
  const [validatedRecords, setValidatedRecords] = useState({ public: [], private: [] });

  const { readFile, isLoading } = useFileReader();

  // Carica le eccezioni salvate al montaggio del componente
  useEffect(() => {
    const savedExceptions = localStorage.getItem('dnsExceptions');
    if (savedExceptions) {
      try {
        setExceptions(JSON.parse(savedExceptions));
      } catch (err) {
        console.error('Errore nel caricamento delle eccezioni:', err);
      }
    }
  }, []);

  // Salva le eccezioni quando vengono modificate
  useEffect(() => {
    localStorage.setItem('dnsExceptions', JSON.stringify(exceptions));
  }, [exceptions]);

  // Gestione del caricamento dei file DNS
  const handleFileUpload = useCallback(async (file, type) => {
    try {
      const records = await readFile(file);
      if (type === 'public') {
        setPublicDNS(records);
      } else {
        setPrivateDNS(records);
      }
    } catch (err) {
      onError(`Errore nel caricamento del file ${type}: ${err.message}`);
    }
  }, [readFile, onError]);

  // Gestione delle eccezioni
  const addException = useCallback(() => {
    if (!newException.trim()) {
      onError('L\'eccezione non può essere vuota');
      return;
    }

    if (exceptions.includes(newException.trim())) {
      onError('Questa eccezione esiste già');
      return;
    }

    setExceptions(prev => [...prev, newException.trim()]);
    setNewException('');
  }, [newException, exceptions, onError]);

  // Validazione dei record DNS
  const validateRecords = useCallback(() => {
    if (!publicDNS.length && !privateDNS.length) {
      onError('Carica almeno una lista DNS prima di procedere');
      return;
    }

    // Validazione DNS pubblici
    const validPublicRecords = publicDNS
      .map(record => {
        const validation = validatePublicDNS(record);
        if (!validation.isValid) return null;
        if (!checkDNSExceptions(validation.name, exceptions)) return null;
        return record;
      })
      .filter(Boolean);

    // Validazione DNS privati
    const validPrivateRecords = privateDNS
      .map(record => {
        const validation = validatePrivateDNS(record);
        if (!validation.isValid) return null;
        if (!checkDNSExceptions(validation.name, exceptions)) return null;
        return record;
      })
      .filter(Boolean);

    setValidatedRecords({
      public: validPublicRecords,
      private: validPrivateRecords
    });

    // Se abbiamo record validi, procediamo al prossimo step
    if (validPublicRecords.length || validPrivateRecords.length) {
      onComplete({
        public: validPublicRecords,
        private: validPrivateRecords
      });
    } else {
      onError('Nessun record DNS valido trovato dopo la validazione');
    }
  }, [publicDNS, privateDNS, exceptions, onComplete, onError]);

  return (
    <div className="space-y-6">
      {/* Sezione Eccezioni */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Gestione Eccezioni</h3>
        <div className="flex gap-2">
          <Input
            value={newException}
            onChange={(e) => setNewException(e.target.value)}
            placeholder="Inserisci una nuova eccezione"
            onKeyPress={(e) => e.key === 'Enter' && addException()}
          />
          <Button onClick={addException}>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
        <div className="space-y-2">
          {exceptions.map((exception, index) => (
            <ExceptionItem
              key={index}
              exception={exception}
              onDelete={(exc) => setExceptions(prev => prev.filter(e => e !== exc))}
            />
          ))}
        </div>
      </div>

      {/* Sezione Caricamento File */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DNS Pubblici */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">DNS Pubblici</label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e.target.files[0], 'public')}
              className="hidden"
              id="publicDNS"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('publicDNS').click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Carica File
            </Button>
            <span className="text-sm text-gray-500">
              {publicDNS.length} records caricati
            </span>
          </div>
        </div>

        {/* DNS Privati */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">DNS Privati</label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileUpload(e.target.files[0], 'private')}
              className="hidden"
              id="privateDNS"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('privateDNS').click()}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Carica File
            </Button>
            <span className="text-sm text-gray-500">
              {privateDNS.length} records caricati
            </span>
          </div>
        </div>
      </div>

      {/* Pulsante di Validazione */}
      <Button 
        onClick={validateRecords}
        disabled={isLoading || (!publicDNS.length && !privateDNS.length)}
        className="w-full"
      >
        Valida Records DNS
      </Button>

      {/* Risultati della Validazione */}
      {(validatedRecords.public.length > 0 || validatedRecords.private.length > 0) && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Records DNS Validi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">DNS Pubblici Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">
                  {validatedRecords.public.join('\n')}
                </pre>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">DNS Privati Validi</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">
                  {validatedRecords.private.join('\n')}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1DNSValidation;