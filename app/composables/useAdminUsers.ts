export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: 'admin' | 'user'
}

export function useAdminUsers() {
  async function listUsers(): Promise<AdminUser[]> {
    const { get } = useApi()
    const response = await get<{ data: AdminUser[] }>('/admin/users')
    return response.data ?? []
  }

  async function createUser(payload: CreateUserPayload): Promise<AdminUser> {
    const { post } = useApi()
    const response = await post<{ data: AdminUser }>('/admin/users', payload)
    return response.data
  }

  async function updateUser(id: number, payload: UpdateUserPayload): Promise<AdminUser> {
    const { patch } = useApi()
    const response = await patch<{ data: AdminUser }>(`/admin/users/${id}`, payload)
    return response.data
  }

  async function deleteUser(id: number): Promise<void> {
    const { delete: del } = useApi()
    await del(`/admin/users/${id}`)
  }

  return { listUsers, createUser, updateUser, deleteUser }
}
