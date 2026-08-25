import { categoryApi } from '@/lib/api-client';

export interface CategoryType {
  _id: string;
  id: string; // Frontend compatibility field
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  image?: string;
}

/**
 * Get all categories with optional filtering
 * @param options - Optional parameters to filter categories
 * @returns Promise with array of categories
 */
export const getCategories = async (options: {
  active?: boolean;
  format?: 'simple';
  language?: 'hindi' | 'english';
  withCount?: boolean;
} = {}): Promise<CategoryType[]> => {
  try {
    const params: Record<string, string | number | boolean | undefined> = {};

    if (options.active !== undefined) {
      params.active = options.active.toString();
    }

    // Request simple format for dropdown menus etc.
    if (options.format === 'simple') {
      params.format = 'simple';
    }

    if (options.withCount !== undefined) {
      params.withCount = options.withCount.toString();
    }

    const response = await categoryApi.getCategories(params);

    // If the response is a direct array
    if (response.success && Array.isArray(response.data)) {
      return response.data.map((cat: any) => ({
        ...cat,
        id: cat._id, // Ensure id field exists for frontend compatibility
      }));
    }
    // If the response is wrapped in a data property
    else if (response.success && response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((cat: any) => ({
        ...cat,
        id: cat._id,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get a single category by ID
 * @param id - Category ID
 * @returns Promise with category data
 */
export const getCategoryById = async (id: string): Promise<CategoryType | null> => {
  try {
    const response = await categoryApi.getCategory(id);

    if (response.success && response.data) {
      const category = response.data;
      return {
        ...category,
        id: category._id, // Ensure id field exists for frontend compatibility
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
};

/**
 * Get a single category by slug
 * @param slug - Category slug
 * @returns Promise with category data
 */
export const getCategoryBySlug = async (slug: string): Promise<CategoryType | null> => {
  try {
    const response = await categoryApi.getCategoryBySlug(slug);

    if (response.success && response.data) {
      const category = response.data;
      return {
        ...category,
        id: category._id,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    throw error;
  }
};