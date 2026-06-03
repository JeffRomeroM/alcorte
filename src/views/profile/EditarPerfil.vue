<template>
  <div class="setup-page">
    <div class="setup-card">

      <div class="header">
        <div class="logo-box">
          <Icon icon="mdi:store-edit-outline" />
        </div>
        <h1>Editar Perfil del Taller</h1>
        <p>Actualiza la información comercial y de contacto de tu negocio.</p>
      </div>

      <div v-if="loadingProfile" class="loading-state">
        <Icon icon="mdi:loading" class="spin-icon" />
        <p>Cargando información del taller...</p>
      </div>

      <form v-else @submit.prevent="actualizarPerfil">

        <div class="form-group">
          <label>Nombre del propietario</label>
          <div class="input-wrapper">
            <Icon icon="mdi:account-outline" />
            <input
              v-model="form.nombre_propietario"
              type="text"
              placeholder="Juan Pérez"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Nombre del taller</label>
          <div class="input-wrapper">
            <Icon icon="mdi:store-outline" />
            <input
              v-model="form.nombre_negocio"
              type="text"
              placeholder="Taller El Rápido"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <div class="input-wrapper">
            <Icon icon="mdi:phone-outline" />
            <input
              v-model="form.telefono"
              type="tel"
              placeholder="8888 8888"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>WhatsApp</label>
          <div class="input-wrapper">
            <Icon icon="mdi:whatsapp" />
            <input
              v-model="form.whatsapp"
              type="tel"
              placeholder="8888 8888"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Dirección</label>
          <div class="input-wrapper textarea">
            <textarea
              v-model="form.direccion"
              rows="3"
              placeholder="Dirección del taller"
              required
            />
          </div>
        </div>

        <div class="form-group" v-if="currentLogoUrl">
          <label>Logo actual de la aplicación</label>
          <div class="current-logo-preview">
            <img :src="currentLogoUrl" alt="Logo actual" />
            <span class="badge-active">Activo</span>
          </div>
        </div>

        <div class="form-group">
          <label>{{ currentLogoUrl ? 'Reemplazar logo del taller (Opcional)' : 'Logo del taller' }}</label>
          <label class="upload-box" :class="{ 'has-file': logoName }">
            <input
              type="file"
              accept="image/*"
              @change="handleFile"
            />
            <Icon :icon="logoName ? 'mdi:image-check' : 'mdi:image-plus'" />
            <span>
              {{ logoName ? `${logoName} (Optimizado a WebP)` : 'Seleccionar nuevo logo' }}
            </span>
          </label>
        </div>

        <div class="actions-wrapper">
          <button
            type="button"
            class="cancel-btn"
            :disabled="loading"
            @click="router.push('/dashboard')"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            class="save-btn"
            :disabled="loading"
          >
            {{ loading ? 'Optimizando y guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const router = useRouter()
const loading = ref(false)
const loadingProfile = ref(true)
const logoFile = ref(null)
const logoName = ref('')
const currentLogoUrl = ref(null)

const form = reactive({
  nombre_propietario: '',
  nombre_negocio: '',
  telefono: '',
  whatsapp: '',
  direccion: ''
})

// Cargar la información existente del perfil
const cargarDatosPerfil = async () => {
  try {
    loadingProfile.value = true
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      router.push('/')
      return
    }

    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('nombre_propietario, nombre_negocio, telefono, whatsapp, direccion, logo_url')
      .eq('user_id', user.id)
      .single()

    if (dbError) throw dbError

    if (profile) {
      form.nombre_propietario = profile.nombre_propietario || ''
      form.nombre_negocio = profile.nombre_negocio || ''
      form.telefono = profile.telefono || ''
      form.whatsapp = profile.whatsapp || ''
      form.direccion = profile.direccion || ''
      currentLogoUrl.value = profile.logo_url || null
    }
  } catch (error) {
    console.error('Error al descargar el perfil:', error.message)
    alert('No se pudo cargar la información del perfil.')
  } finally {
    loadingProfile.value = false
  }
}

const handleFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    logoFile.value = file
    logoName.value = file.name
  }
}

const optimizarImagenAWebp = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Error al procesar el archivo WebP.'))
          }
        }, 'image/webp', 0.8)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

const actualizarPerfil = async () => {
  try {
    loading.value = true

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Usuario no autenticado')

    let logoUrl = currentLogoUrl.value

    // Solo ejecuta lógica de Storage si el usuario seleccionó un nuevo archivo
    if (logoFile.value) {
      const webpBlob = await optimizarImagenAWebp(logoFile.value)

      const folderName = form.nombre_negocio
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-zA-Z0-9 ]/g, "")   
        .replace(/\s+/g, "_")            

      const fileName = `${folderName}/${Date.now()}-logo.webp`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      logoUrl = data.publicUrl
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        nombre_propietario: form.nombre_propietario.trim(),
        nombre_negocio: form.nombre_negocio.trim(),
        telefono: form.telefono.trim(),
        whatsapp: form.whatsapp.trim(),
        direccion: form.direccion.trim(),
        logo_url: logoUrl,
        profile_completed: true
      })
      .eq('user_id', user.id)

    if (dbError) throw dbError

    router.push('/dashboard')

  } catch (error) {
    console.error(error)
    alert(error.message || 'Ocurrió un error al actualizar los datos.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarDatosPerfil()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.setup-page {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #003034, #07141a);
  font-family: sans-serif;
}

.setup-card {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-box {
  width: 80px;
  height: 80px;
  margin: auto;
  border-radius: 20px;
  background: #003034;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.header h1 {
  margin-top: 15px;
  color: #003034;
  font-size: 1.8rem;
  font-weight: 800;
}

.header p {
  margin-top: 10px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

.spin-icon {
  font-size: 40px;
  color: #003034;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #334155;
  font-size: 14px;
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

.input-wrapper svg {
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

.textarea {
  padding: 12px;
}

.textarea textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  font-family: sans-serif;
}

/* Estilo para la previsualización del logo existente */
.current-logo-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.current-logo-preview img {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #003034;
}

.badge-active {
  background: #e0f5ee;
  color: #00a87e;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 20px;
  font-weight: 700;
}

.upload-box {
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 22px;
  text-align: center;
  cursor: pointer;
  display: block;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.upload-box:hover {
  border-color: #003034;
  background: #f1f5f9;
}

.upload-box.has-file {
  border-style: solid;
  border-color: #00c896;
  background: #f0fdf4;
}

.upload-box input {
  display: none;
}

.upload-box svg {
  font-size: 36px;
  color: #003034;
}

.upload-box.has-file svg {
  color: #00c896;
}

.upload-box span {
  display: block;
  margin-top: 10px;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

/* Contenedor bicolumna para acciones inferiores */
.actions-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.cancel-btn {
  flex: 1;
  background: #e2e8f0;
  color: #475569;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

.save-btn {
  flex: 2;
  background: #003034;
  color: white;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.95;
}

.cancel-btn:disabled, .save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media(max-width:480px){
  .setup-card { padding: 20px; }
  .header h1 { font-size: 1.5rem; }
  .actions-wrapper { flex-direction: column-reverse; }
}
</style>