// DNSManager.jsx

import React, { useState, useCallback } from 'react';
import Step1DNSValidation from './Step1DNSValidation';
import Step2CertificateValidation from './Step2CertificateValidation';
import Step3Processing from './Step3Processing';
import { StepProgress } from '../shared/ui/StepProgress';
import { Card } from '../shared/ui/Card';

const DNSManager = () => {
  // Stato globale dell'applicazione
  const [currentStep, setCurrentStep] = useState(1);
  const [validatedDNS, setValidatedDNS] = useState({ public: [], private: [] });
  const [validatedCertificates, setValidatedCertificates] = useState({ public: [], private: [] });
  const [error, setError] = useState('');

  // Handler per il completamento dello Step 1
  const handleStep1Complete = useCallback((dnsResults) => {
    setValidatedDNS(dnsResults);
    setCurrentStep(2);
  }, []);

  // Handler per il completamento dello Step 2
  const handleStep2Complete = useCallback((certificateResults) => {
    setValidatedCertificates(certificateResults);
    setCurrentStep(3);
  }, []);

  // Handler per reimpostare l'applicazione
  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setValidatedDNS({ public: [], private: [] });
    setValidatedCertificates({ public: [], private: [] });
    setError('');
  }, []);

  // Renderizza il contenuto dello step corrente
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1DNSValidation 
            onComplete={handleStep1Complete}
            onError={setError}
          />
        );
      case 2:
        return (
          <Step2CertificateValidation
            dnsData={validatedDNS}
            onComplete={handleStep2Complete}
            onReset={handleReset} // Passiamo la funzione di reset
            onError={setError}
          />
        );
      case 3:
        return (
          <Step3Processing
            certificates={validatedCertificates}
            onReset={handleReset} // Passiamo la funzione di reset
            onError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-200"
      style={{
        backgroundImage: `url('/assets/background.png')`, // Assicurati che il percorso sia corretto
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right top',
        backgroundSize: 'contain',
      }}
    >
      <Card>
        <div className="p-6">
          {/* Logo Centrato */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://courtesy.prada.com/stylesheets/images/logo-prada.png" 
              alt="Prada Logo" 
              className="h-16"
            />
          </div>
          <h1 className="text-2xl font-bold mb-6">DNS Manager</h1>
          <StepProgress currentStep={currentStep} totalSteps={3} />
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mt-4">
              {error}
            </div>
          )}
          <div className="mt-6">
            {renderStepContent()}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DNSManager;
