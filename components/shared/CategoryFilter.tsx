'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

interface ICategory {
  id: string;
  name: string;
}

const CategoryFilter = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get('category') || 'All';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const fetchedCategories: ICategory[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const onSelectCategory = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (categoryName && categoryName !== 'All') {
      params.set('category', categoryName);
      params.delete('page'); // Reset to first page when changing category
    } else {
      params.delete('category');
    }
    
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-gray-700 font-semibold flex items-center gap-1">
        <Filter className="h-5 w-5 text-cyan-600" />
        Filter by Category
      </Label>
      <Select 
        onValueChange={onSelectCategory}
        value={currentCategory}
      >
        <SelectTrigger className="w-[200px] bg-white h-[54px] rounded-full text-[16px] font-normal leading-[24px] px-5 py-3 border border-gray-200 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 shadow-sm hover:shadow-md transition-shadow">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
          <SelectItem value="All" className="py-3 px-4 cursor-pointer text-[16px] font-normal leading-[24px] hover:bg-cyan-50 hover:text-cyan-700 focus:bg-cyan-50 focus:text-cyan-700 transition-colors">
            All
          </SelectItem>
          {categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.name}
              className="py-3 px-4 cursor-pointer text-[16px] font-normal leading-[24px] hover:bg-cyan-50 hover:text-cyan-700 focus:bg-cyan-50 focus:text-cyan-700 transition-colors"
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;