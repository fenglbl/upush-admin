<template>
  <aside
    class="sidebar"
    :class="{
      'is-mobile': mobile,
      'is-mobile-open': mobile && mobileOpen
    }"
  >
    <div class="sidebar__inner">
      <div class="sidebar-brand">
        <div class="brand-badge">UP</div>
        <div class="sidebar-brand__text">
          <div class="brand-title">UPUSH Admin</div>
          <div class="brand-subtitle">运营与推送后台</div>
        </div>

        <button
          v-if="mobile"
          class="sidebar-close-btn"
          type="button"
          aria-label="关闭菜单"
          @click="$emit('close-mobile')"
        >
          <span>×</span>
        </button>
      </div>

      <button class="sidebar-quick-create" type="button" @click="go('/push-records?create=1')">
        <span class="sidebar-quick-create__icon">✦</span>
        <span>新建推送</span>
      </button>

      <nav class="sidebar-nav" aria-label="后台导航">
        <section v-for="group in navGroups" :key="group.title" class="sidebar-group">
          <div class="sidebar-group__header">
            <div class="sidebar-group__title">{{ group.title }}</div>
            <span class="sidebar-group__line"></span>
          </div>

          <button
            v-for="item in group.items"
            :key="item.label"
            type="button"
            class="sidebar-link"
            :class="{ 'is-active': isActive(item) }"
            @click="go(item.to)"
          >
            <span class="sidebar-link__icon" aria-hidden="true">
              <svg v-if="item.icon === 'grid'" viewBox="0 0 24 24" class="sidebar-link__svg"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>
              <svg v-else-if="item.icon === 'send'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M4 11.5L19 4l-4.2 16-3.1-5.4L4 11.5Z" /><path d="M11.7 14.6 19 4" /></svg>
              <svg v-else-if="item.icon === 'logs'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M6 6h12" /><path d="M6 12h12" /><path d="M6 18h8" /></svg>
              <svg v-else-if="item.icon === 'users'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
              <svg v-else-if="item.icon === 'devices'" viewBox="0 0 24 24" class="sidebar-link__svg"><rect x="7" y="3.5" width="10" height="17" rx="2.5" /><path d="M10 7h4" /><path d="M11 17h2" /></svg>
              <svg v-else-if="item.icon === 'feedback'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 4v-4H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" /></svg>
              <svg v-else-if="item.icon === 'doc'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M8 4.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V6A1.5 1.5 0 0 1 8.5 4.5Z" /><path d="M14 4.5V9h4" /></svg>
              <svg v-else-if="item.icon === 'layers'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>
              <svg v-else-if="item.icon === 'settings'" viewBox="0 0 24 24" class="sidebar-link__svg"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="M19 12a7.6 7.6 0 0 0-.08-1l2.02-1.58-1.92-3.32-2.42.82a7.8 7.8 0 0 0-1.74-1l-.4-2.54H10.5l-.4 2.54a7.8 7.8 0 0 0-1.74 1l-2.42-.82-1.92 3.32L6.04 11a7.6 7.6 0 0 0 0 2l-2.02 1.58 1.92 3.32 2.42-.82c.54.42 1.12.76 1.74 1l.4 2.54h3.96l.4-2.54c.62-.24 1.2-.58 1.74-1l2.42.82 1.92-3.32L18.92 13c.05-.33.08-.66.08-1Z" /></svg>
            </span>
            <span class="sidebar-link__text">{{ item.label }}</span>
            <span v-if="isActive(item)" class="sidebar-link__badge">当前</span>
          </button>
        </section>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-footer__label">工作区</div>
        <div class="sidebar-footer__value">UPUSH</div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineEmits(['close-mobile'])

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false
  },
  mobileOpen: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()

const navGroups = computed(() => [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'grid' },
      { label: '推送记录', to: '/push-records', icon: 'send' },
      { label: '日志中心', to: '/logs', icon: 'logs' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: '用户管理', to: '/users', icon: 'users' },
      { label: '设备管理', to: '/devices', icon: 'devices' },
      { label: '反馈中心', to: '/feedback', icon: 'feedback' }
    ]
  },
  {
    title: 'Content',
    items: [
      { label: '协议管理', to: '/agreements', icon: 'doc' },
      { label: '版本管理', to: '/versions', icon: 'layers' },
      { label: '系统设置', to: '/settings', icon: 'settings' }
    ]
  }
])

function go(to) {
  router.push(to)
  if (props.mobile) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('admin-sidebar-close-mobile'))
    }, 0)
  }
}

function isActive(item) {
  if (item.to === '/push-records' && route.path.startsWith('/push-records')) return true
  return route.path === item.to
}
</script>

<style scoped>
.sidebar {
  min-width: 0;
  background: var(--admin-nav-bg, linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%));
  border-right: 1px solid var(--admin-nav-border, #e6edf5);
  padding: 18px 16px;
}

.sidebar__inner {
  position: sticky;
  top: 18px;
  height: calc(100vh - 36px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.sidebar.is-mobile {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 60;
  width: 268px;
  transform: translateX(-100%);
  transition: transform 0.22s ease;
  box-shadow: 18px 0 40px rgba(15, 23, 42, 0.16);
}

.sidebar.is-mobile .sidebar__inner {
  top: 18px;
  width: 100%;
}

.sidebar.is-mobile.is-mobile-open {
  transform: translateX(0);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 6px;
}

.sidebar-brand__text {
  min-width: 0;
  flex: 1;
}

.brand-badge {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
  flex: 0 0 auto;
}

.brand-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

.sidebar-close-btn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--admin-chip-border, #e8edf3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.84);
  color: #64748b;
  cursor: pointer;
  flex: 0 0 auto;
}

.sidebar-quick-create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--admin-primary-start, #2563eb), var(--admin-primary-end, #4f46e5));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 24px rgba(79, 70, 229, 0.2);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.sidebar-quick-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 28px rgba(79, 70, 229, 0.24);
  filter: saturate(1.05);
}

.sidebar-quick-create__icon {
  font-size: 15px;
  line-height: 1;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
}

.sidebar-group + .sidebar-group {
  margin-top: 18px;
}

.sidebar-group__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 10px;
  min-height: 21px;
}

.sidebar-group__title {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sidebar-group__line {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, rgba(203, 213, 225, 0.72), rgba(203, 213, 225, 0));
}

.sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 15px;
  background: transparent;
  color: var(--admin-nav-text, #334155);
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.sidebar-link + .sidebar-link {
  margin-top: 5px;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.82);
  color: #0f172a;
  transform: translateX(1px);
}

.sidebar-link::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  width: 3px;
  height: 0;
  border-radius: 999px;
  transform: translateY(-50%);
  background: linear-gradient(180deg, #2563eb, #4f46e5);
  transition: height 0.18s ease;
}

.sidebar-link.is-active {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), #f8fbff);
  color: #0f172a;
  box-shadow: inset 0 0 0 1px #dbe7ff, 0 10px 20px rgba(15, 23, 42, 0.08);
}

.sidebar-link.is-active::before {
  height: 24px;
}

.sidebar-link.is-active .sidebar-link__icon {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 18px rgba(79, 70, 229, 0.24);
}

.sidebar-link__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #edf3f9;
  color: #64748b;
  border: 1px solid #e1e9f2;
  flex: 0 0 auto;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.sidebar-link__svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sidebar-link__svg rect {
  fill: currentColor;
  stroke: none;
}

.sidebar-link__text {
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.sidebar-link__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef4ff;
  color: #335cce;
  font-size: 11px;
  font-weight: 700;
}

.sidebar-footer {
  margin-top: auto;
  padding: 14px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid #e6edf5;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.sidebar-footer__label {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-footer__value {
  margin-top: 6px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .sidebar {
    padding: 14px 12px;
  }

  .sidebar.is-mobile .sidebar__inner {
    top: 14px;
    height: calc(100vh - 28px);
  }
}
</style>
