import api from './api';

export interface CategoryType {
  _id: string;
  id: string; // Frontend compatibility field
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
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
} = {}): Promise<CategoryType[]> => {
  try {
    const params = new URLSearchParams();
    
    if (options.active !== undefined) {
      params.append('active', options.active.toString());
    }
    
    // Request simple format for dropdown menus etc.
    if (options.format === 'simple') {
      params.append('format', 'simple');
    }
    
    const response = await api.get<CategoryType[]>('/categories', { 
      params,
      timeout: 5000 // 5 second timeout
    });
    
    // If the response is a direct array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } 
    // If the response is wrapped in a data property (like { success: true, data: [...] })
    else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((cat: any) => ({
        ...cat,
        id: cat._id // Ensure id field exists for frontend compatibility
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
    const response = await api.get<{ success: boolean; data: CategoryType }>(`/categories/${id}`);
    
    if (response.data && response.data.data) {
      const category = response.data.data;
      return {
        ...category,
        id: category._id // Ensure id field exists for frontend compatibility
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    throw error;
  }
};
