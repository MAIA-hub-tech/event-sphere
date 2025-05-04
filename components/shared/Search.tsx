'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';

const Search = ({ placeholder = 'Search title...' }: { placeholder?: string }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialQuery = searchParams.get('query') || '';
  const [localQuery, setLocalQuery] = useState('');

  // Sync localQuery with searchParams only on mount
  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  // Update URL when localQuery changes, but only on the homepage
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let newUrl = '';

      if (localQuery) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'query',
          value: localQuery,
        });
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['query'],
        });
      }

      // Only update the URL if on the homepage
      if (pathname === '/') {
        router.push(`/${newUrl}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [localQuery, searchParams, router, pathname]);

  return (
    <div className="flex justify-center items-center min-h-[54px] w-full overflow-hidden rounded-full bg-white/90 px-4 py-2">
      <Image 
        src="/assets/icons/search.svg" 
        alt="search" 
        width={24} 
        height={24} 
        className="filter brightness-0 opacity-60"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className="text-[16px] font-normal leading-[24px] border-0 bg-transparent outline-offset-0 placeholder:text-gray-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-3"
      />
    </div>
  );
};

export default Search;