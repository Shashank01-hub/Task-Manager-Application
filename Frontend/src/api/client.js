const API_BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  let data = null
  try {
    data = await response.json()
  } catch (_) {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}

export const api = {
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resendOtp: (payload) =>
    request('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request('/api/auth/logout', {
      method: 'POST'
    }),
  verifyEmail: ({ email, otp }) =>
    request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    }),
  createTask: (payload) =>
    request('/api/task/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getTasks: () => request('/api/task/get'),
  updateTask: (id, payload) =>
    request(`/api/task/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  markTaskComplete: (id) =>
    request(`/api/task/complete/${id}`, {
      method: 'PUT'
    }),
  deleteTask: (id) =>
    request(`/api/task/delete/${id}`, {
      method: 'DELETE'
    }),
  searchAndFilterTasks: (params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        searchParams.set(key, value)
      }
    })
    return request(`/api/task/searchAndFilter?${searchParams.toString()}`)
  },
  adminGetAllUsers: () => request('/api/admin/getAllUsers'),
  adminDeleteUser: (id) =>
    request(`/api/admin/deleteUser/${id}`, {
      method: 'DELETE'
    }),
  adminGetUserTasks: (id) => request(`/api/admin/getAllTaskOfAUser/${id}`),
  adminGetDashboardData: () => request('/api/admin/getDashboardData')
}