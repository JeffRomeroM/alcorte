<template>
  <div class="setup-page">
    <div class="setup-card">

      <div class="header">
        <div class="logo-box">
          <Icon icon="mdi:store-cog-outline" />
        </div>
        <h1>Completa tu perfil</h1>
        <p>Configura los datos de tu taller para comenzar a usar AlCorte.</p>
      </div>

      <form @submit.prevent="guardarPerfil">

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

        <div class="form-group">
          <label>Logo del taller</label>
          <label class="upload-box" :class="{ 'has-file': logoName }">
            <input
              type="file"
               Harlow
              accept="image/*"
              @change="handleFile"
            />
            <Icon :icon="logoName ? 'mdi:image-check' : 'mdi:image-plus'" />
            <span>
              {{ logoName ? `${logoName} (Optimizado a WebP)` : 'Seleccionar logo' }}
            </span>
          </label>
        </div>

        <button
          class="save-btn"
          :disabled="loading"
        >
          {{ loading ? 'Optimizando y guardando...' : 'Guardar y continuar' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const router = useRouter()
const loading = ref(false)
const logoFile = ref(null)
const logoName = ref('')

const form = reactive({
  nombre_propietario: '',
  nombre_negocio: '',
  telefono: '',
  whatsapp: '',
  direccion: ''
})

const handleFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    logoFile.value = file
    logoName.value = file.name
  }
}

// Función crítica: Redimensiona, comprime y convierte a WebP en el cliente usando Canvas
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

        // Configuración de dimensiones máximas para el logo
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
        
        // Dibujar la imagen en el lienzo escalado
        ctx.drawImage(img, 0, 0, width, height)

        // Exportar a BLOB como WebP con calidad del 80%
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

const guardarPerfil = async () => {
  try {
    loading.value = true

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Usuario no autenticado')

    let logoUrl = null

    if (logoFile.value) {
      // 1. Convertir y optimizar localmente a WebP
      const webpBlob = await optimizarImagenAWebp(logoFile.value)

      // 2. Sanitizar el nombre del taller para la ruta de la carpeta (Elimina acentos, eñes y caracteres raros)
      const folderName = form.nombre_negocio
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
        .replace(/[^a-zA-Z0-9 ]/g, "")   // Remueve caracteres especiales menos espacios
        .replace(/\s+/g, "_")            // Reemplaza espacios por guiones bajos para Storage seguro

      const fileName = `${folderName}/${Date.now()}-logo.webp`

      // 3. Subir el archivo procesado a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 4. Extraer URL pública
      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      logoUrl = data.publicUrl
    }

    // 5. Guardar el registro en la base de datos
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        nombre_propietario: form.nombre_propietario.trim(),
        nombre_negocio: form.nombre_negocio.trim(),
        telefono: form.telefono.trim(),
        whatsapp: form.whatsapp.trim(),
        direccion: form.direccion.trim(),
        ...(logoUrl && { logo_url: logoUrl }), // Solo actualiza si se subió una nueva foto
        profile_completed: true
      })
      .eq('user_id', user.id)

    if (dbError) throw dbError

    router.push('/dashboard')

  } catch (error) {
    console.error(error)
    alert(error.message || 'Ocurrió un error inesperado al guardar.')
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

.save-btn {
  width: 100%;
  border: none;
  padding: 16px;
  border-radius: 14px;
  background: #003034;
  color: white;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  font-size: 16px;
  transition: opacity 0.2s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.95;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media(max-width:480px){
  .setup-card {
    padding: 20px;
  }
  .header h1 {
    font-size: 1.5rem;
  }
}
</style>