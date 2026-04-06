import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { clearAdminSession, getAdminMe, getAdminToken, setAdminSession } from './api'
import './styles/index.css'
import './styles/admin-ui.css'

async function bootstrapAdminSession() {
  const token = getAdminToken()
  if (!token) {
    return
  }

  try {
    const { data } = await getAdminMe()
    if (data.code === 200 && data.data && data.data.user) {
      setAdminSession(token, data.data.user)
      return
    }
    clearAdminSession()
  } catch (error) {
    clearAdminSession()
  }
}

await bootstrapAdminSession()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
