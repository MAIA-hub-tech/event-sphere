'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

// These are helpers you'll need in `lib/utils.ts`
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils'

const Search = ({ placeholder = 'Search title...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      let newUrl = ''

      if (query) {
        newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: 'query',
          value: query
        })
      } else {
        newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ['query']
        })
      }

      router.push(newUrl, { scroll: false })
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, searchParams, router])

  return (
    <div className="flex justify-center items-center min-h-[54px] w-full overflow-hidden rounded-full bg-gray-50 px-4 py-2">
      <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} />
      <Input
        type="text"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        className="text-[16px] font-normal leading-[24px] border-0 bg-gray-50 outline-offset-0 placeholder:text-gray-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}

export default Search
