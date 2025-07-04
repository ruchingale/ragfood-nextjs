'use server'

import { FoodItemSchema, type FoodItem } from '@/lib/types'

// Load foods.json data
export async function loadFoodsData(): Promise<FoodItem[]> {
  try {
    // Use HTTP fetch to get foods.json from public directory
    let url = ''
    if (typeof window === 'undefined') {
      // On server, use NEXT_PUBLIC_BASE_URL if available
      url = process.env.NEXT_PUBLIC_BASE_URL
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/foods.json`
        : 'http://localhost:3000/foods.json'
    } else {
      // On client, use relative path
      url = '/foods.json'
    }
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch foods.json')
    const rawData = await res.json()
    
    // Validate each food item
    const validatedData = rawData.map((item: unknown) => {
      const result = FoodItemSchema.safeParse(item)
      if (!result.success) {
        console.warn('Invalid food item:', item, result.error)
        return null
      }
      return result.data
    }).filter(Boolean)

    console.log(`✅ Loaded ${validatedData.length} food items`)
    return validatedData
  } catch (error) {
    console.error(
      '❌ Failed to load foods data:',
      error,
      error instanceof Error ? error.stack : undefined
    )
    throw new Error('Failed to load foods data')
  }
}

// Get food item by ID
export async function getFoodById(id: string): Promise<FoodItem | null> {
  try {
    const foods = await loadFoodsData()
    return foods.find(food => food.id === id) || null
  } catch (error) {
    console.error('❌ Failed to get food by ID:', error)
    return null
  }
}

// Get food statistics
export async function getFoodStats() {
  try {
    const foods = await loadFoodsData()
    const stats = {
      total: foods.length,
      regions: new Set(foods.map(f => f.region).filter(Boolean)).size,
      types: new Set(foods.map(f => f.type).filter(Boolean)).size,
      withRegion: foods.filter(f => f.region).length,
      withType: foods.filter(f => f.type).length,
    }
    
    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('❌ Failed to get food stats:', error)
    return {
      success: false,
      error: 'Failed to get food statistics',
    }
  }
}
