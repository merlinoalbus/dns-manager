export const StepProgress = ({ currentStep, totalSteps }) => {
    return (
      <div className="w-full">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span>Validazione DNS</span>
          <span>Aggiornamento Scan Digicert</span>
          <span>Scadenza Certificati</span>
        </div>
      </div>
    );
  };