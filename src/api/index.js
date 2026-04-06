import axios from 'axios'

const ADMIN_TOKEN_KEY = 'upush_admin_token'
const ADMIN_USER_KEY = 'upush_admin_user'
const ADMIN_LAST_USERNAME_KEY = 'upush_admin_last_username'

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminSession(token, user) {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
  }
  if (user) {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function setLastAdminUsername(username) {
  const value = String(username || '').trim()
  if (value) {
    localStorage.setItem(ADMIN_LAST_USERNAME_KEY, value)
  } else {
    localStorage.removeItem(ADMIN_LAST_USERNAME_KEY)
  }
}

export function getLastAdminUsername() {
  return localStorage.getItem(ADMIN_LAST_USERNAME_KEY) || ''
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

const request = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.response && error.response.status === 401) {
      clearAdminSession()
      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${redirect}`
      }
    }
    return Promise.reject(error)
  }
)

export function adminLogin(payload) {
  return request.post('/admin/auth/login', payload)
}

export function getAdminMe() {
  return request.get('/admin/auth/me')
}

export function adminLogout() {
  return request.post('/admin/auth/logout')
}

export function getDashboard(range = '7d') {
  return request.get('/admin/dashboard', {
    params: { range }
  })
}

export function getPushBatches(params = {}) {
  return request.get('/admin/push-batches', {
    params
  })
}

export function getPushBatchDetail(id) {
  return request.get(`/admin/push-batches/${id}`)
}

export function createPushMessage(payload) {
  return request.post('/pushMessage', payload)
}

export function getLogs(params = {}) {
  return request.get('/logs', { params })
}

export function getUsers(params = {}) {
  return request.get('/admin/users', { params })
}

export function getUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

export function updateUserStatus(id, payload) {
  return request.post(`/admin/users/${id}/status`, payload)
}

export function getDevices(params = {}) {
  return request.get('/admin/devices', { params })
}

export function getDeviceDetail(id) {
  return request.get(`/admin/devices/${id}`)
}

export function removeDevice(id) {
  return request.delete(`/admin/devices/${id}`)
}

export function getSettings() {
  return request.get('/admin/settings')
}

export function saveSettings(payload) {
  return request.post('/admin/settings', payload)
}

export function getFeedbackList(params = {}) {
  return request.get('/admin/feedback', { params })
}

export function getFeedbackDetail(id) {
  return request.get(`/admin/feedback/${id}`)
}

export function replyFeedback(id, payload) {
  return request.post(`/admin/feedback/${id}/reply`, payload)
}

export function getAgreements(params = {}) {
  return request.get('/admin/agreements', { params })
}

export function getAgreementDetail(id) {
  return request.get(`/admin/agreements/${id}`)
}

export function saveAgreement(payload) {
  return request.post('/admin/agreements', payload)
}

export function publishAgreement(id) {
  return request.post(`/admin/agreements/${id}/publish`)
}

export function getVersions(params = {}) {
  return request.get('/admin/versions', { params })
}

export function getVersionDetail(id) {
  return request.get(`/admin/versions/${id}`)
}

export function saveVersion(payload) {
  return request.post('/admin/versions', payload)
}

export function publishVersion(id) {
  return request.post(`/admin/versions/${id}/publish`)
}

export default request
