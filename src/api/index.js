import axios from 'axios'
import { ElMessage } from 'element-plus'

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
  timeout: 10000
})

let adminSessionExpiredNoticeShown = false

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
      const loginPath = `${import.meta.env.BASE_URL}login`
      const currentPath = `${window.location.pathname}${window.location.search}`

      if (!adminSessionExpiredNoticeShown) {
        adminSessionExpiredNoticeShown = true
        ElMessage.warning('登录已失效，请重新登录')
        window.setTimeout(() => {
          adminSessionExpiredNoticeShown = false
        }, 3000)
      }

      if (window.location.pathname !== loginPath) {
        const redirect = encodeURIComponent(currentPath)
        window.setTimeout(() => {
          window.location.href = `${loginPath}?redirect=${redirect}`
        }, 300)
      }
    }
    return Promise.reject(error)
  }
)

export function adminLogin(payload) {
  return request.post('/api/admin/auth/login', payload)
}

export function getAdminMe() {
  return request.get('/api/admin/auth/me')
}

export function adminLogout() {
  return request.post('/api/admin/auth/logout')
}

export function getDashboard(range = '7d') {
  return request.get('/api/admin/dashboard', {
    params: { range }
  })
}

export function getPushBatches(params = {}) {
  return request.get('/api/admin/push-batches', {
    params
  })
}

export function getPushBatchDetail(id) {
  return request.get(`/api/admin/push-batches/${id}`)
}

export function createPushMessage(payload) {
  return request.post('/pushMessage', payload)
}

export function getLogs(params = {}) {
  return request.get('/api/logs', { params })
}

export function getUsers(params = {}) {
  return request.get('/api/admin/users', { params })
}

export function getUserDetail(id) {
  return request.get(`/api/admin/users/${id}`)
}

export function updateUserStatus(id, payload) {
  return request.post(`/api/admin/users/${id}/status`, payload)
}

export function getDevices(params = {}) {
  return request.get('/api/admin/devices', { params })
}

export function getDeviceDetail(id) {
  return request.get(`/api/admin/devices/${id}`)
}

export function removeDevice(id) {
  return request.delete(`/api/admin/devices/${id}`)
}

export function getSettings() {
  return request.get('/api/admin/settings')
}

export function saveSettings(payload) {
  return request.post('/api/admin/settings', payload)
}

export function getFeedbackList(params = {}) {
  return request.get('/api/admin/feedback', { params })
}

export function getFeedbackDetail(id) {
  return request.get(`/api/admin/feedback/${id}`)
}

export function replyFeedback(id, payload) {
  return request.post(`/api/admin/feedback/${id}/reply`, payload)
}

export function getAgreements(params = {}) {
  return request.get('/api/admin/agreements', { params })
}

export function getAgreementDetail(id) {
  return request.get(`/api/admin/agreements/${id}`)
}

export function saveAgreement(payload) {
  return request.post('/api/admin/agreements', payload)
}

export function publishAgreement(id) {
  return request.post(`/api/admin/agreements/${id}/publish`)
}

export function getVersions(params = {}) {
  return request.get('/api/admin/versions', { params })
}

export function getVersionDetail(id) {
  return request.get(`/api/admin/versions/${id}`)
}

export function saveVersion(payload) {
  return request.post('/api/admin/versions', payload)
}

export function uploadPackage(file, onProgress) {
  return request.post('/api/admin/upload/package', file, {
    headers: {
      'Content-Type': file?.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file?.name || 'package.bin')
    },
    timeout: 120000,
    onUploadProgress: (event) => {
      if (typeof onProgress === 'function') {
        onProgress(event)
      }
    }
  })
}

export function publishVersion(id) {
  return request.post(`/api/admin/versions/${id}/publish`)
}

export default request
