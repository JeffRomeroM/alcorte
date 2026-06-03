<template>
  <div class="login-page">
    <div class="login-card">

      <div class="brand">
        <div class="logo">
          <img src="/public/logoSinFondo.png" alt="" width="150">
        </div>

        <p>Ingresa tus credenciales para gestionar tu taller</p>
      </div>

      <form @submit.prevent="login">

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

        <button
          type="submit"
          class="login-btn"
          :disabled="loading"
        >
          {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>

      </form>

      <p class="register-link">
        ¿No tienes una cuenta?
        <router-link to="/registro">
          Regístrate aquí
        </router-link>
      </p>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const login = async () => {
  try {

    loading.value = true

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password
      })

    if (error) throw error

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('user_id', data.user.id)
        .single()

    if (profileError) throw profileError

    if (!profile.profile_completed) {

      router.push('/completar-perfil')

    } else {

      router.push('/dashboard')

    }

  } catch (error) {

    console.error(error)

    alert(
      error.message ||
      'Correo o contraseña incorrectos'
    )

    form.password = ''

  } finally {

    loading.value = false

  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #003034 0%, #07141a 100%);
  font-family: sans-serif;
}

.login-card {
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
  width: 75px;
  height: 75px;
  margin: auto;
  border-radius: 20px;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 34px;
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
  font-size: 14px;
  line-height: 1.4;
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

/* Evita color de fondo extraño en el autocompletado */
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

.login-btn {
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

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #64748b;
}

.register-link a {
  color: #003034;
  font-weight: 700;
  text-decoration: none;
  margin-left: 5px;
}

.register-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }

  .brand h1 {
    font-size: 1.7rem;
  }

  .logo {
    width: 65px;
    height: 65px;
    font-size: 28px;
  }
}
</style>