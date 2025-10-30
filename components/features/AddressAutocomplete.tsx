'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface Props {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
}

export function AddressAutocomplete({ onLocationSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Debounce the query value
  const debouncedQuery = useDebounce(query, 800);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: debouncedQuery }),
        });

        if (response.ok) {
          const result = await response.json();
          setSuggestions(result ? [result] : []);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Failed to fetch geocode suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSelect = (item: GeocodingResult) => {
    onLocationSelect(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
    setQuery(item.display_name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Enter an address..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {loading && <div className="absolute right-3 top-3">Loading...</div>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-xs text-gray-500">
        <a href="https://locationiq.com" target="_blank" rel="noopener noreferrer">
          Search by LocationIQ.com
        </a>
      </div>
    </div>
  );
}

