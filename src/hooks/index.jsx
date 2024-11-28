import { useState, useCallback } from 'react';

export const useFileReader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const readFile = useCallback(async (file) => {
    if (!file) {
      setError('Nessun file fornito');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const records = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('id\t') && !line.startsWith('Name\t'));
      
      return records;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { readFile, isLoading, error };
};