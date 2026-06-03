<template>
  <div class="bloqueo-page">
    <div class="bloqueo-card">
      <div class="icon-box">
        <Icon icon="mdi:credit-card-off-outline" />
      </div>
      <h1>Acceso Restringido</h1>
      <p>Tu cuenta se encuentra temporalmente inactiva por falta de pago.</p>
      <p class="subtext">Por favor, ponte en contacto con soporte para registrar tu pago mensual y reactivar tu taller.</p>
      
      <div class="actions">
        <a href="https://wa.me/+50577146128" target="_blank" class="ws-btn">
          <Icon icon="mdi:whatsapp" />
          Contactar Soporte
        </a>
        <button class="logout-btn" @click="logout">
          Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

const router = useRouter()
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}
</script>

<style scoped>
.bloqueo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #003034, #07141a);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: sans-serif;
}
.bloqueo-card {
  background: white;
  max-width: 450px;
  width: 100%;
  padding: 40px 30px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}
.icon-box {
  font-size: 64px;
  color: #ef4444;
  margin-bottom: 20px;
}
h1 { color: #0f172a; font-size: 24px; margin-bottom: 12px; font-weight: 800; }
p { color: #64748b; font-size: 15px; line-height: 1.6; }
.subtext { font-size: 13px; margin-top: 8px; color: #94a3b8; }
.actions { display: flex; flex-direction: column; gap: 12px; margin-top: 30px; }
.ws-btn, .logout-btn { padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; border: none; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
.ws-btn { background: #25d366; color: white; }
.logout-btn { background: #f1f5f9; color: #475569; }
</style>