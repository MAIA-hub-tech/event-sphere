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

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
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
      key: urlParamName || 'page',
      value: nextPage.toString(),
    })

    router.push(newUrl, { scroll: false })
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        size="lg"
        variant="outline"
        className="w-28 min-w-28"
        onClick={() => handleNavigation('prev')}
        disabled={Number(page) <= 1}
      >
        Previous
      </Button>
      
      <div className="text-sm font-medium text-gray-600">
        Page {page} of {totalPages}
      </div>

      <Button
        size="lg"
        variant="outline"
        className="w-28 min-w-28"
        onClick={() => handleNavigation('next')}
        disabled={Number(page) >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination