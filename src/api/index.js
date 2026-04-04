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

export default request
