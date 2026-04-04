import axios from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  timeout: 10000
})

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

export function getDevices(params = {}) {
  return request.get('/admin/devices', { params })
}

export function getDeviceDetail(id) {
  return request.get(`/admin/devices/${id}`)
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
