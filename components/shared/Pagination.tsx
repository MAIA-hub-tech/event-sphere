"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { Button } from '../ui/button'
import { formUrlQuery } from '@/lib/utils'

type PaginationProps = {
  page: number | string
  totalPages: number
  urlParamName?: string
}

const Pagination = ({ page, totalPages, urlParamName = 'page' }: PaginationProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleNavigation = (direction: 'prev' | 'next') => {
    const currentPage = Number(page)
    const nextPage = direction === 'prev' ? currentPage - 1 : currentPage + 1

    // Don't navigate beyond page limits
    if ((direction === 'prev' && currentPage <= 1) || 
        (direction === 'next' && currentPage >= totalPages)) {
      return
    }

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: urlParamName,
      value: nextPage.toString()
    })

    router.push(newUrl, { scroll: false })
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleNavigation('prev')}
        disabled={Number(page) <= 1}
        className="min-w-32 hover:bg-blue-50"
      >
        Previous
      </Button>
      
      <div className="px-4 py-2 rounded-md bg-gray-50 text-sm font-medium">
        Page {page} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={() => handleNavigation('next')}
        disabled={Number(page) >= totalPages}
        className="min-w-32 hover:bg-blue-50"
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination