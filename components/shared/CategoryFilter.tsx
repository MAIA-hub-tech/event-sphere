'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase' // your Firestore client instance
import { collection, getDocs } from 'firebase/firestore'
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils'

interface ICategory {
  id: string
  name: string
}

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'))
        const fetchedCategories: ICategory[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setCategories(fetchedCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const onSelectCategory = (category: string) => {
    let newUrl = ''

    if (category && category !== 'All') {
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'category',
        value: category,
      })
    } else {
      newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['category'],
      })
    }

    router.push(newUrl, { scroll: false })
  }

  return (
    <Select onValueChange={(value: string) => onSelectCategory(value)}>
      <SelectTrigger className="select-field">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All" className="select-item p-regular-14">
          All
        </SelectItem>

        {categories.map((category) => (
          <SelectItem
            key={category.id}
            value={category.name}
            className="select-item p-regular-14"
          >
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default CategoryFilter
