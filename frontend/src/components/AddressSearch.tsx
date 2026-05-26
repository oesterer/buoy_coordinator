import { Search } from 'lucide-react';
import { useState } from 'react';

interface GeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  onSelect: (position: [number, number]) => void;
  onError: (message: string) => void;
}

export function AddressSearch({ onSelect, onError }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setResults([]);
    try {
      const params = new URLSearchParams({
        q: trimmedQuery,
        format: 'jsonv2',
        limit: '5'
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const matches = (await response.json()) as GeocodeResult[];
      if (matches.length === 0) {
        onError('No address results found.');
      }
      setResults(matches);
    } catch {
      onError('Unable to search for that address.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelect(result: GeocodeResult) {
    setQuery(result.display_name);
    setResults([]);
    onSelect([Number(result.lat), Number(result.lon)]);
  }

  return (
    <div className="absolute left-14 top-3 z-[500] w-[min(420px,calc(100%-7rem))]">
      <form className="flex rounded-md bg-white shadow" onSubmit={handleSearch}>
        <input
          className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-sm outline-none"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search address"
          type="search"
        />
        <button className="icon-button rounded-l-none border-y-0 border-r-0" disabled={isSearching || !query.trim()} title="Search address">
          <Search size={16} />
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow">
          {results.map((result) => (
            <button
              key={result.place_id}
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
              onClick={() => handleSelect(result)}
              type="button"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
