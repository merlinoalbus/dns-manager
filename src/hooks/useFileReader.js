import { useState, useCallback } from 'react';

export const useFileReader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const readFile = useCallback(async (file, options = {}) => {
    const { 
      parseCSV = false, 
      skipHeader = false,
      delimiter = ',' 
    } = options;

    if (!file) {
      setError('Nessun file fornito');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      if (!parseCSV) {
        const lines = text.split('\n')
          .map(line => line.trim())
          .filter(Boolean);
        
        return skipHeader ? lines.slice(1) : lines;
      }

      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      const headers = lines[0].split(delimiter).map(h => h.trim());
      const data = skipHeader ? lines.slice(1) : lines;

      return data.map(line => {
        const values = line.split(delimiter);
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index]?.trim() || '';
          return obj;
        }, {});
      });

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { readFile, isLoading, error };
};

export default useFileReader;