import React from 'react';

export const ProgressIndicator = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-4">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center ${
              index < steps.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index + 1 <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div
                  className={`h-full bg-blue-600 transition-all duration-300 ${
                    index + 1 < currentStep ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-4">
        {steps.map((step, index) => (
          <span
            key={index}
            className={`text-sm ${
              index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
};