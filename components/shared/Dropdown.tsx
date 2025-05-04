'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { debounce } from "lodash";

type Category = {
  id: string;
  name: string;
};

type DropdownProps = {
  value?: string;
  onChangeHandler?: (value: string) => void;
  disabled?: boolean;
  className?: string; // Add className prop
};

const Dropdown = ({ value, onChangeHandler, disabled, className = '' }: DropdownProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "categories"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      })) as Category[];
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
      toast.error("Could not load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debouncedFetch = debounce(fetchCategories, 300);
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.warning("Please enter a category name");
      return;
    }

    if (newCategory.trim().length > 50) {
      toast.warning("Category name too long (max 50 characters)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategory.trim(),
        createdAt: new Date().toISOString(),
      });

      setCategories(prev => [...prev, {
        id: docRef.id,
        name: newCategory.trim(),
      }]);

      setNewCategory('');
      toast.success("Category added successfully");

      if (onChangeHandler) {
        onChangeHandler(docRef.id);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category");
      toast.error("Could not add category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        value={value}
        onValueChange={onChangeHandler}
        disabled={loading || disabled}
      >
        <SelectTrigger className="w-full h-12 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl shadow-sm border-none focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors duration-300">
          <SelectValue
            placeholder={loading ? "Loading..." : error ? "Error loading" : "Select category"}
          />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
          {categories.length > 0 ? (
            categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer transition-colors duration-200"
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
              className="text-sm font-medium flex w-full rounded-sm py-3 pl-8 text-cyan-500 hover:bg-cyan-50 focus:text-cyan-600 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? "Processing..." : "Add new category"}
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white max-w-md mx-4 rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">New Category</AlertDialogTitle>
                <AlertDialogDescription className="mt-2 text-gray-600">
                  Enter a name for the new category
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Category name"
                  className="bg-gray-50 h-12 focus-visible:ring-offset-0 placeholder:text-gray-500 rounded-xl text-base font-normal px-4 py-3 border-none focus-visible:ring-cyan-500"
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
                <AlertDialogCancel disabled={loading} className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAddCategory}
                  disabled={loading || !newCategory.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 rounded-full text-white"
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
  );
};

export default Dropdown;