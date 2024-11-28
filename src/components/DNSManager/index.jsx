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

  // Handler per tornare allo step precedente
  const handleStepBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
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
            onBack={handleStepBack}
            onError={setError}
          />
        );
      case 3:
        return (
          <Step3Processing
            dnsData={validatedDNS}
            certificateData={validatedCertificates}
            onBack={handleStepBack}
            onError={setError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4">
      <Card>
        <div className="p-6">
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