export type FoodSubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface AdminFoodSubmission {
  id: string
  name: string
  brand?: string | null
  barcode?: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number | null
  sugar_per_100g?: number | null
  status: FoodSubmissionStatus
  submitted_by: number
  reviewed_by?: number | null
  reviewed_at?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
}

export interface UpdateFoodSubmissionPayload {
  name?: string
  brand?: string | null
  barcode?: string | null
  calories_per_100g?: number
  protein_per_100g?: number
  carbs_per_100g?: number
  fat_per_100g?: number
  fiber_per_100g?: number | null
  sugar_per_100g?: number | null
  status?: FoodSubmissionStatus
  rejection_reason?: string | null
}

export function useAdminFoodSubmissions() {
  async function listSubmissions(status?: FoodSubmissionStatus): Promise<AdminFoodSubmission[]> {
    const { get } = useApi()
    const response = await get<{ data: AdminFoodSubmission[] }>('/admin/food-submissions', status ? { status } : undefined)
    return response.data ?? []
  }

  async function updateSubmission(id: string, payload: UpdateFoodSubmissionPayload): Promise<AdminFoodSubmission> {
    const { patch } = useApi()
    const response = await patch<{ data: AdminFoodSubmission }>(`/admin/food-submissions/${id}`, payload)
    return response.data
  }

  async function deleteSubmission(id: string): Promise<void> {
    const { delete: del } = useApi()
    await del(`/admin/food-submissions/${id}`)
  }

  return { listSubmissions, updateSubmission, deleteSubmission }
}
