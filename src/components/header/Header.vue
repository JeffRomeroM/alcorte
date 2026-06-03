<template>
  <header class="header">
    <div class="brand">
      <div class="brand-logo">
        <img src="/logo.png" alt="AlCorte Logo" />
      </div>
    </div>

    <div 
      v-if="!loading" 
      class="mobile-trigger-identity mobile-only" 
      @click="mobileMenu = !mobileMenu"
      :class="{ 'trigger-active': mobileMenu }"
    >
      <div class="avatar mini-avatar">
        <img v-if="userLogo" :src="userLogo" alt="Logo Taller" class="avatar-img" />
        <span v-else>{{ initials }}</span>
      </div>
      <div class="mobile-trigger-info">
        <span class="trigger-title">Taller {{ userName }}</span>
        <span class="trigger-sub">
          Mi Cuenta <Icon :icon="mobileMenu ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
        </span>
      </div>
    </div>
    <div v-else class="loading-user mobile-only">Cargando...</div>

    <div class="desktop-actions desktop-only">
      <div 
        v-if="!loading" 
        class="user-card" 
        @click="router.push('/editar-perfil')"
        title="Editar perfil"
      >
        <div class="avatar">
          <img v-if="userLogo" :src="userLogo" alt="Logo Taller" class="avatar-img" />
          <span v-else>{{ initials }}</span>
        </div>

        <div class="user-info">
          <strong>Taller {{ userName }}</strong>
          <small class="info-row">
            <Icon icon="mdi:email-outline" /> {{ userEmail }}
          </small>
          <small v-if="userPhone" class="info-row">
            <Icon icon="mdi:phone-outline" /> {{ userPhone }}
          </small>
        </div>
      </div>
      <div v-else class="loading-user">Cargando...</div>

      <div class="actions-group">
        <button class="logout-btn" @click="showLogoutModal = true">
          <Icon icon="mdi:logout" />
          Salir
        </button>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="mobileMenu" class="mobile-menu">
        <div class="mobile-menu-inner">
          
          <div class="mobile-extended-info">
            <div class="avatar large-avatar">
              <img v-if="userLogo" :src="userLogo" alt="Logo Taller" class="avatar-img" />
              <span v-else>{{ initials }}</span>
            </div>
            <h3>Taller {{ userName }}</h3>
            <p class="meta-row"><Icon icon="mdi:email-outline" /> {{ userEmail }}</p>
            <p v-if="userPhone" class="meta-row"><Icon icon="mdi:phone-outline" /> {{ userPhone }}</p>
          </div>

          <div class="mobile-menu-actions">
            <button class="menu-action-btn edit-profile-btn" @click="mobileMenu = false; router.push('/editar-perfil')">
              <Icon icon="mdi:account-edit-outline" />
              Editar Perfil del Taller
            </button>
            
            <button class="menu-action-btn close-session-btn" @click="showLogoutModal = true">
              <Icon icon="mdi:logout" />
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="modal">
          <div class="modal-icon">
            <Icon icon="mdi:logout-variant" />
          </div>
          <h3>Cerrar sesión</h3>
          <p>¿Deseas cerrar tu sesión activa?</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showLogoutModal = false">Cancelar</button>
            <button class="confirm-btn" @click="logout">Sí, salir</button>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

const router = useRouter()

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const mobileMenu = ref(false)
const showLogoutModal = ref(false)
const loading = ref(true)

const userName = ref('Mi Negocio')
const userEmail = ref('cargando@email.com')
const userPhone = ref('')
const userLogo = ref(null)

const initials = computed(() => {
  return userName.value
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AC'
})

const fetchUserProfile = async () => {
  try {
    loading.value = true
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      router.push('/')
      return
    }

    userEmail.value = user.email

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nombre_negocio, telefono, logo_url')
      .eq('user_id', user.id)
      .single()

    if (profileError) throw profileError

    if (profile) {
      if (profile.nombre_negocio) userName.value = profile.nombre_negocio
      if (profile.telefono) userPhone.value = profile.telefono
      if (profile.logo_url) userLogo.value = profile.logo_url
    }
  } catch (error) {
    console.error('Error al cargar el perfil del taller:', error.message)
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  showLogoutModal = false
  mobileMenu = false
  router.push('/')
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 70px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .03);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Identidad de Marca (Izquierda siempre) */
.brand { display: flex; align-items: center; gap: 12px; }
.brand-logo { height: 40px; display: flex; align-items: center; }
.brand-logo img { height: 100%; object-fit: contain; }

/* Disparador Móvil (Derecha) */
.mobile-trigger-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px 6px 8px;
  border-radius: 30px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 60%;
}
.mobile-trigger-identity:hover,
.mobile-trigger-identity.trigger-active {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.mobile-trigger-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.trigger-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.trigger-sub {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 1px;
}

/* Escritorio */
.desktop-actions { display: flex; align-items: center; gap: 24px; }
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: background 0.2s;
}
.user-card:hover { background: #f1f5f9; }

/* Avatares */
.avatar {
  width: 42px;
  height: 42px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  overflow: hidden;
  flex-shrink: 0;
}
.mini-avatar { width: 32px; height: 32px; font-size: 11px; }
.large-avatar { width: 70px; height: 70px; font-size: 22px; margin: 0 auto 12px auto; border-color: #003034; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-info strong { font-size: .95rem; color: #0f172a; }
.info-row { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 12px; }

.logout-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  background: #003034;
  color: white;
  transition: opacity 0.2s;
}
.logout-btn:hover { opacity: .9; }
.loading-user { font-size: 13px; color: #64748b; font-weight: 500; }

/* Menú Desplegable en Móvil */
.mobile-menu {
  position: absolute;
  top: 76px;
  left: 16px;
  right: 16px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.mobile-extended-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e2e8f0;
}
.mobile-extended-info h3 {
  margin: 0 0 6px 0;
  font-size: 18px;
  color: #0f172a;
  font-weight: 800;
}
.meta-row {
  margin: 4px 0;
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mobile-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.menu-action-btn {
  width: 100%;
  border: none;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.edit-profile-btn { background: #f1f5f9; color: #334155; }
.edit-profile-btn:active { background: #e2e8f0; }

.close-session-btn { background: #fee2e2; color: #ef4444; }
.close-session-btn:active { background: #fca5a5; }

/* Modales globales de salida */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 10000;
}
.modal {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.modal-icon { font-size: 48px; color: #ef4444; margin-bottom: 8px; }
.modal h3 { color: #0f172a; margin: 0 0 8px 0; font-size: 18px; }
.modal p { color: #64748b; font-size: 14px; margin: 0 0 20px 0; }
.modal-actions { display: flex; gap: 10px; }
.cancel-btn, .confirm-btn { flex: 1; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
.cancel-btn { background: #f1f5f9; color: #475569; }
.confirm-btn { background: #ef4444; color: white; }

/* Transiciones de Renderizado Vue */
.fade-enter-active, .fade-leave-active { transition: .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* Clases de Visibilidad Selectiva */
.desktop-only { display: flex !important; }
.mobile-only { display: none !important; }

@media(max-width:768px){
  .desktop-only { display: none !important; }
  .mobile-only { display: flex !important; }
}
</style>