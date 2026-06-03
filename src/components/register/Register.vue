<template>
  <div class="register-page">
    <div class="register-card">

      <div class="brand">
        <div class="logo">
          <img src="/public/logo.png" alt="AlCorte Logo"  />
        </div>

        <p>Crea tu cuenta y comienza a gestionar tu taller</p>
      </div>

      <form @submit.prevent="register">

        <div class="input-group">
          <label>Correo electrónico</label>

          <div class="input-wrapper">
            <Icon
              icon="mdi:email-outline"
              class="input-icon"
            />

            <input
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
        </div>

        <div class="input-group">
          <label>Contraseña</label>

          <div class="input-wrapper">
            <Icon
              icon="mdi:lock-outline"
              class="input-icon"
            />

            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="********"
              required
            />

            <button
              type="button"
              class="toggle-password"
              @click.prevent="showPassword = !showPassword"
            >
              <Icon
                :icon="
                  showPassword
                    ? 'mdi:eye-off'
                    : 'mdi:eye'
                "
              />
            </button>
          </div>
        </div>

        <div class="input-group">
          <label>Confirmar contraseña</label>

          <div class="input-wrapper">
            <Icon
              icon="mdi:lock-check-outline"
              class="input-icon"
            />

            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="********"
              required
            />

            <button
              type="button"
              class="toggle-password"
              @click.prevent="
                showConfirmPassword =
                !showConfirmPassword
              "
            >
              <Icon
                :icon="
                  showConfirmPassword
                    ? 'mdi:eye-off'
                    : 'mdi:eye'
                "
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="register-btn"
          :disabled="loading"
        >
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>

      </form>

      <p class="login-link">
        ¿Ya tienes cuenta?
        <router-link to="/">
          Iniciar sesión
        </router-link>
      </p>

    </div>

    <Transition name="fade">
      <div
        v-if="showSuccessModal"
        class="modal-overlay"
      >
        <div class="success-modal">
          <div class="success-icon">
            <Icon icon="mdi:check-circle" />
          </div>

          <h2>¡Bienvenido a AlCorte!</h2>

          <p>
            Tu cuenta fue creada correctamente.
            Ya puedes iniciar sesión y comenzar
            a configurar tu taller.
          </p>

          <button
            class="modal-btn"
            @click="goToLogin"
          >
            Ir al Login
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

const showSuccessModal = ref(false)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

const router = useRouter()
const loading = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const register = async () => {
  try {
    if (form.password !== form.confirmPassword) {
      alert('Las contraseñas no coinciden')
      form.password = ''
      form.confirmPassword = ''
      return
    }

    if (form.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    loading.value = true

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password
    })

    if (error) throw error

    if (!data.user) {
      throw new Error('No se pudo crear el usuario')
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        profile_completed: false
      })

    if (profileError) throw profileError

    // CORRECCIÓN: Se activa el modal, pero NO se redirige aquí.
    showSuccessModal.value = true

  } catch (error) {
    console.error(error)
    alert(error.message)
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  showSuccessModal.value = false
  router.push('/')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #003034 0%, #07141a 100%);
  font-family: sans-serif;
}

.register-card {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(0,0,0,.15);
}

.brand {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  margin: auto;
  border-radius: 20px;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 34px;
}
.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand h1 {
  margin-top: 15px;
  color: #003034;
  font-size: 2rem;
  font-weight: 800;
}

.brand p {
  margin-top: 8px;
  color: #64748b;
}

.input-group {
  margin-bottom: 18px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0 15px;
  background: white;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #003034;
}

.input-icon {
  color: #003034;
  font-size: 22px;
}

.input-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  padding: 16px 0;
  font-size: 15px;
  background: transparent;
}

/* Evita que el autocompletado de los navegadores rompa el diseño visual */
.input-wrapper input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
}

.toggle-password {
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003034;
  padding: 5px;
}

.toggle-password svg {
  font-size: 22px;
}

.register-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 16px;
  background: #003034;
  color: white;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}

.register-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.register-btn:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #64748b;
}

.login-link a {
  color: #003034;
  font-weight: 700;
  text-decoration: none;
  margin-left: 5px;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Transiciones del modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.success-modal {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 24px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,.2);
  animation: popup .3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.success-icon {
  font-size: 72px;
  color: #22c55e;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.success-modal h2 {
  color: #003034;
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.success-modal p {
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 25px;
  font-size: 14px;
}

.modal-btn {
  width: 100%;
  border: none;
  padding: 15px;
  border-radius: 14px;
  background: #003034;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.modal-btn:hover {
  opacity: .95;
}

@keyframes popup {
  from {
    opacity: 0;
    transform: scale(.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 24px;
  }

  .brand h1 {
    font-size: 1.7rem;
  }

  
}
</style>