<template>
  <header class="header">

    <div class="brand">
      <div class="brand-logo">
        <img src="/logoSinFondo.png" alt="AlCorte Logo" />
      </div>
      <div class="brand-info">
      </div>
    </div>

    <div class="desktop-actions">

      <!-- Toda la tarjeta ahora redirige a editar perfil -->
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

    <button class="menu-btn" @click="mobileMenu = !mobileMenu">
      <Icon :icon="mobileMenu ? 'mdi:close' : 'mdi:menu'" />
    </button>

    <Transition name="slide">
      <div v-if="mobileMenu" class="mobile-menu">

        <!-- En móvil también se vuelve interactivo todo el bloque superior -->
        <div 
          v-if="!loading" 
          class="mobile-user" 
          @click="mobileMenu = false; router.push('/editar-perfil')"
        >
          <div class="avatar">
            <img v-if="userLogo" :src="userLogo" alt="Logo Taller" class="avatar-img" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="user-info">
            <strong>Taller {{ userName }}</strong>
            <small class="info-row"><Icon icon="mdi:email-outline" /> {{ userEmail }}</small>
            <small v-if="userPhone" class="info-row"><Icon icon="mdi:phone-outline" /> {{ userPhone }}</small>
          </div>
          <Icon icon="mdi:chevron-right" class="mobile-arrow-icon" />
        </div>

        <div class="mobile-actions">
          <button class="mobile-logout" @click="showLogoutModal = true">
            <Icon icon="mdi:logout" />
            Cerrar sesión
          </button>
        </div>

      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showLogoutModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-icon">
            <Icon icon="mdi:logout-variant" />
          </div>
          <h3>Cerrar sesión</h3>
          <p>¿Deseas cerrar tu sesión?</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showLogoutModal = false">
              Cancelar
            </button>
            <button class="confirm-btn" @click="logout">
              Sí, salir
            </button>
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
  showLogoutModal.value = false
  router.push('/')
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<style scoped>
:root{
  --primary:#003034;
  --secondary:#07141a;
  --accent:#00c896;
  --white:#ffffff;
  --gray:#64748b;
  --light:#f8fafc;
}

.header{
  position:sticky;
  top:0;
  z-index:1000;
  height:70px;
  background:white;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 20px;
  border-bottom:1px solid #e2e8f0;
  box-shadow: 0 5px 20px rgba(0,0,0,.05);
  font-family: sans-serif;
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
}

.brand-logo{
  height:40px;
  display:flex;
  align-items:center;
}

.brand-logo img{
  height:100%;
  object-fit:contain;
}

.brand-info span{
  color:#64748b;
  font-size:.85rem;
  font-weight: 600;
}

.desktop-actions{
  display:flex;
  align-items:center;
  gap:24px;
}

/* Tarjeta interactiva de escritorio */
.user-card{
  display:flex;
  align-items:center;
  gap:12px;
  cursor:pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.user-card:hover {
  background: #f1f5f9;
  opacity: 0.9;
}

.loading-user {
  font-size: 14px;
  color: #64748b;
}

.avatar{
  width:44px;
  height:44px;
  color:white;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  overflow:hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info{
  display:flex;
  flex-direction:column;
  gap:2px;
}

.user-info strong{
  font-size:.95rem;
  color:#0f172a;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  color:#64748b;
  font-size: 12px;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-btn {
  border:none;
  padding:10px 14px;
  border-radius:10px;
  display:flex;
  align-items:center;
  gap:6px;
  cursor:pointer;
  font-weight:600;
  font-size: 14px;
  transition: all 0.2s;
  background:#003034;
  color:white;
}

.logout-btn:hover{
  opacity:.9;
}

.menu-btn{
  display:none;
  border:none;
  background:none;
  font-size:28px;
  color:#003034;
  cursor:pointer;
}

.mobile-menu{
  position:absolute;
  top:70px;
  left:0;
  right:0;
  background:white;
  border-bottom:1px solid #e2e8f0;
  padding:20px;
  box-shadow: 0 10px 15px rgba(0,0,0,.05);
  display: flex;
  flex-direction: column;
  gap:16px;
}

/* Bloque interactivo de móvil */
.mobile-user{
  display:flex;
  gap:12px;
  align-items:center;
  cursor:pointer;
  padding: 10px;
  border-radius: 12px;
  background: #f8fafc;
  transition: background 0.2s ease;
}

.mobile-user:active {
  background: #f1f5f9;
}

.mobile-arrow-icon {
  margin-left: auto;
  font-size: 20px;
  color: #64748b;
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-logout {
  width:100%;
  border:none;
  padding:12px;
  border-radius:10px;
  display:flex;
  justify-content:center;
  align-items:center;
  gap:8px;
  cursor:pointer;
  font-weight:600;
  font-size: 14px;
  background:#003034;
  color:white;
}

/* MODAL */
.modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.6);
  display:flex;
  justify-content:center;
  align-items:center;
  padding:20px;
}

.modal{
  width:100%;
  max-width:400px;
  background:white;
  border-radius:24px;
  padding:30px;
  text-align:center;
}

.modal-icon{
  font-size:54px;
  color:#ef4444;
  margin-bottom:10px;
}

.modal h3{
  color:#0f172a;
  margin-bottom:10px;
}

.modal p{
  color:#64748b;
  font-size: 14px;
}

.modal-actions{
  display:flex;
  gap:10px;
  margin-top:25px;
}

.cancel-btn, .confirm-btn{
  flex:1;
  border:none;
  padding:12px;
  border-radius:10px;
  cursor:pointer;
  font-weight:600;
}

.cancel-btn{
  background:#e2e8f0;
  color: #334155;
}

.confirm-btn{
  background:#ef4444;
  color:white;
}

/* ANIMATIONS */
.fade-enter-active, .fade-leave-active{ transition:.25s; }
.fade-enter-from, .fade-leave-to{ opacity:0; }

.slide-enter-active, .slide-leave-active{ transition:.25s; }
.slide-enter-from, .slide-leave-to{ opacity:0; transform:translateY(-10px); }

@media(max-width:768px){
  .desktop-actions{ display:none; }
  .menu-btn{ display:block; }
}
</style>