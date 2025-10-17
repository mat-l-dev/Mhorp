// src/components/shared/Searchbar.tsx
'use client';

import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function Searchbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar productos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        className="pl-9"
      />
    </form>
  );
}
