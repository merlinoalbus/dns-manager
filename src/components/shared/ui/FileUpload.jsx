import React from 'react';
import { Button } from './Button';
import { Upload } from 'lucide-react';

export const FileUpload = ({ 
  id, 
  accept, 
  onChange, 
  label, 
  disabled = false,
  count = 0 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files[0])}
          className="hidden"
          id={id}
        />
        <Button 
          variant="outline" 
          onClick={() => document.getElementById(id).click()}
          disabled={disabled}
        >
          <Upload className="w-4 h-4 mr-2" />
          Carica File
        </Button>
        <span className="text-sm text-gray-500">
          {count} record{count !== 1 ? 'i' : ''} caricat{count !== 1 ? 'i' : 'o'}
        </span>
      </div>
    </div>
  );
};