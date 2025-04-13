"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "../ui/input"
import { useState, useEffect, useCallback } from "react"
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore"
import { db } from "@/firebaseConfig"
import { toast } from "sonner"
import { debounce } from "lodash"

type Category = {
  id: string
  name: string
}

type DropdownProps = {
  value?: string
  onChangeHandler?: (value: string) => void
  disabled?: boolean
}

const Dropdown = ({ value, onChangeHandler, disabled }: DropdownProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = query(collection(db, "categories"), orderBy("name"))
      const querySnapshot = await getDocs(q)
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Category[]
      setCategories(categoriesData)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories")
      toast.error("Could not load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce the fetch function
  useEffect(() => {
    const debouncedFetch = debounce(fetchCategories, 300)
    debouncedFetch()
    return () => debouncedFetch.cancel()
  }, [fetchCategories])

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.warning("Please enter a category name")
      return
    }

    if (newCategory.trim().length > 50) {
      toast.warning("Category name too long (max 50 characters)")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategory.trim(),
        createdAt: new Date().toISOString()
      })
      
      setCategories(prev => [...prev, {
        id: docRef.id,
        name: newCategory.trim()
      }])
      
      setNewCategory('')
      toast.success("Category added successfully")
      
      // Automatically select the new category
      if (onChangeHandler) {
        onChangeHandler(docRef.id)
      }
    } catch (err) {
      console.error("Error adding category:", err)
      setError("Failed to add category")
      toast.error("Could not add category")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Select 
        value={value} 
        onValueChange={onChangeHandler}
        disabled={loading || disabled}
      >
        <SelectTrigger className="w-full bg-gray-50 h-[54px] placeholder:text-gray-500 rounded-full text-[16px] font-normal leading-[24px] px-5 py-3 border-none focus-visible:ring-transparent focus:ring-transparent">
          <SelectValue 
            placeholder={loading ? "Loading..." : error ? "Error loading" : "Select category"} 
          />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {categories.length > 0 ? (
            categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="w-full hover:bg-gray-100 h-[54px] rounded-full px-5 py-3 text-[14px] font-normal leading-[20px]"
              >
                {category.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {loading ? "Loading..." : "No categories found"}
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger 
              className="text-[14px] font-medium leading-[20px] flex w-full rounded-sm py-3 pl-8 text-blue-500 hover:bg-blue-50 focus:text-blue-500"
              disabled={loading}
            >
              {loading ? "Processing..." : "Add new category"}
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white max-w-md mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle>New Category</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  Enter a name for the new category
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4">
                <Input 
                  type="text" 
                  placeholder="Category name" 
                  className="bg-gray-50 h-[54px] focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-full text-[16px] font-normal leading-[24px] px-4 py-3 border-none focus-visible:ring-transparent" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  disabled={loading}
                  maxLength={50}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <p className="text-xs text-gray-500 mt-1 ml-2">
                  {newCategory.length}/50 characters
                </p>
              </div>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleAddCategory}
                  disabled={loading || !newCategory.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Adding..." : "Add Category"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SelectContent>
      </Select>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export default Dropdown