<template>
  <div class="clientes-container">
    <div class="header-actions">
      <h1 class="page-title">Clientes</h1>
      <button @click="abrirModalNuevo" class="btn-primary">
        <Icon icon="mdi:account-plus" class="icon" /> Nuevo Cliente
      </button>
    </div>

    <div class="search-bar">
      <Icon icon="mdi:magnify" class="search-icon" />
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Buscar por nombre o teléfono..." 
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <Icon icon="mdi:loading" class="spin" /> Cargando clientes...
    </div>
    
    <div v-else-if="filteredClientes.length === 0" class="empty-state">
      <Icon icon="mdi:account-off-outline" class="empty-icon" />
      <p>No se encontraron clientes registrados.</p>
    </div>

    <div v-else class="clientes-grid">
      <div v-for="cliente in filteredClientes" :key="cliente.id" class="cliente-card">
        <div class="cliente-info">
          <h3 class="cliente-nombre">{{ cliente.nombre }}</h3>
          <p class="cliente-dato">
            <Icon icon="mdi:phone" class="text-slate-400" /> {{ cliente.telefono }}
          </p>
          <p v-if="cliente.direccion" class="cliente-dato text-sm">
            <Icon icon="mdi:map-marker" class="text-slate-400" /> {{ cliente.direccion }}
          </p>
          <p v-if="cliente.notas" class="cliente-dato text-sm">
            <Icon icon="mdi:note-text" class="text-slate-400" /> {{ cliente.notas }}
          </p>
          
          <div v-if="cliente.motos && cliente.motos.length > 0" class="motos-list">
            <div v-for="moto in cliente.motos" :key="moto.id" class="moto-badge">
              
                <p>
                    <Icon icon="mdi:motorbike" /> 
                    {{ moto.marca }} {{ moto.modelo  }}
                    <Icon v-if="moto.placa" icon="mdi:card-text-outline" class="text-slate-400" />
                    {{ moto.placa || 'S/P' }} 

                </p>
                <p>
                    <Icon icon="mdi:speedometer" class="text-slate-400" />
                    {{ moto.kilometraje || 0 }} km
                </p>
                <p>
                    <Icon icon="mdi:note-text" class="text-slate-400" />
                    {{ moto.observaciones || 'Sin observaciones' }} 
                </p>
            </div>

          </div>
        </div>
        
        <div class="cliente-actions">
          <a :href="'https://wa.me/' + cleanPhone(cliente.telefono)" target="_blank" class="btn-icon ws-btn" title="Enviar WhatsApp">
            <Icon icon="mdi:whatsapp" />
          </a>
          <button @click="abrirModalEditar(cliente)" class="btn-icon edit-btn" title="Editar Cliente">
            <Icon icon="mdi:pencil" />
          </button>
          <button @click="confirmarEliminar(cliente.id)" class="btn-icon delete-btn" title="Eliminar Cliente">
            <Icon icon="mdi:trash-can-outline" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Editar Cliente' : 'Registrar Cliente' }}</h2>
        <form @submit.prevent="guardarCliente">
          
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input v-model="form.nombre" type="text" required placeholder="Ej. Juan Pérez" />
          </div>
          
          <div class="form-group">
            <label>Teléfono (WhatsApp) *</label>
            <input v-model="form.telefono" type="tel" required placeholder="Ej. +505 8888 0000" />
          </div>
          
          <div class="form-group">
            <label>Dirección</label>
            <input v-model="form.direccion" type="text" placeholder="Opcional" />
          </div>
          
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="form.notas" rows="2" placeholder="Cliente exigente, pagos de contado..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Icon v-if="saving" icon="mdi:loading" class="spin" />
              {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Guardar Cliente') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content text-center">
        <Icon icon="mdi:alert-circle-outline" class="delete-warning-icon" />
        <h2>¿Eliminar Cliente?</h2>
        <p class="text-slate-500 mb-6">Esta acción no se puede deshacer. Las motos y el historial asociado a este cliente también podrían verse afectados.</p>
        <div class="modal-actions justify-center">
          <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button type="button" class="btn-danger" @click="eliminarCliente" :disabled="deleting">
            <Icon v-if="deleting" icon="mdi:loading" class="spin" />
            {{ deleting ? 'Eliminando...' : 'Sí, Eliminar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)

// Estado
const clientes = ref([])
const searchQuery = ref('')
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Estado de Modales
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const clienteIdActivo = ref(null)

// Formulario reactivo
const form = ref({
  nombre: '',
  telefono: '',
  direccion: '',
  notas: ''
})

// Cargar datos
const fetchClientes = async () => {
  try {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('clientes')
      .select('*, motos(id, placa, marca, modelo)') // JOIN inverso integrado
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    clientes.value = data
  } catch (error) {
    console.error('Error cargando clientes:', error.message)
  } finally {
    loading.value = false
  }
}

// Búsqueda en tiempo real
const filteredClientes = computed(() => {
  if (!searchQuery.value) return clientes.value
  const query = searchQuery.value.toLowerCase()
  return clientes.value.filter(c => 
    c.nombre.toLowerCase().includes(query) || 
    c.telefono.includes(query)
  )
})

// Guardar (Insertar o Actualizar)
const guardarCliente = async () => {
  try {
    saving.value = true
    const { data: { user } } = await supabase.auth.getUser()

    if (isEditing.value) {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: form.value.nombre,
          telefono: form.value.telefono,
          direccion: form.value.direccion,
          notas: form.value.notas
        })
        .eq('id', clienteIdActivo.value)
        .eq('user_id', user.id)

      if (error) throw error

      // Actualizar vista local (manteniendo las motos)
      const index = clientes.value.findIndex(c => c.id === clienteIdActivo.value)
      if (index !== -1) {
        clientes.value[index] = { ...clientes.value[index], ...form.value }
      }
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          user_id: user.id,
          nombre: form.value.nombre,
          telefono: form.value.telefono,
          direccion: form.value.direccion,
          notas: form.value.notas
        }])
        .select('*, motos(id, placa, marca, modelo)') // Asegura traer estructura correcta
        .single()

      if (error) throw error
      clientes.value.unshift(data)
    }

    cerrarModal()
  } catch (error) {
    console.error('Error al guardar:', error.message)
    alert('Hubo un error al guardar el cliente.')
  } finally {
    saving.value = false
  }
}

// Eliminar
const eliminarCliente = async () => {
  try {
    deleting.value = true
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteIdActivo.value)
      .eq('user_id', user.id)

    if (error) throw error

    clientes.value = clientes.value.filter(c => c.id !== clienteIdActivo.value)
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error al eliminar:', error.message)
    alert('Hubo un error al eliminar el cliente.')
  } finally {
    deleting.value = false
  }
}

// Utilidades de Interfaz
const abrirModalNuevo = () => {
  isEditing.value = false
  clienteIdActivo.value = null
  form.value = { nombre: '', telefono: '', direccion: '', notas: '' }
  showModal.value = true
}

const abrirModalEditar = (cliente) => {
  isEditing.value = true
  clienteIdActivo.value = cliente.id
  form.value = { 
    nombre: cliente.nombre, 
    telefono: cliente.telefono, 
    direccion: cliente.direccion, 
    notas: cliente.notas 
  }
  showModal.value = true
}

const confirmarEliminar = (id) => {
  clienteIdActivo.value = id
  showDeleteModal.value = true
}

const cerrarModal = () => {
  showModal.value = false
  setTimeout(() => {
    form.value = { nombre: '', telefono: '', direccion: '', notas: '' }
  }, 200)
}

const cleanPhone = (phone) => phone.replace(/\D/g, '')

onMounted(() => {
  fetchClientes()
})
</script>

<style scoped>
/* Contenedor Principal */
.clientes-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: sans-serif;
  color: #0f172a;
}

/* Cabecera */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #003034;
}

/* Buscador */
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}
.search-icon {
  font-size: 20px;
  color: #94a3b8;
  margin-right: 12px;
}
.search-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 15px;
  color: #334155;
}

/* Grid de Tarjetas */
.clientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.cliente-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}
.cliente-info {
  flex: 1;
}
.cliente-nombre {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #0f172a;
}
.cliente-dato {
  font-size: 14px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

/* Estilos de las motos anidadas */
.motos-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.moto-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid #e2e8f0;
}
.moto-badge p {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%   ;
}

/* Acciones en la tarjeta */
.cliente-actions {
  display: flex;
  gap: 8px;
}
.btn-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
}
.ws-btn { background: #dcfce7; color: #16a34a; text-decoration: none; }
.ws-btn:hover { background: #25d366; color: white; }

.edit-btn { background: #f1f5f9; color: #64748b; }
.edit-btn:hover { background: #003034; color: white; }

.delete-btn { background: #fee2e2; color: #ef4444; }
.delete-btn:hover { background: #ef4444; color: white; }

/* Botones Generales */
.btn-primary {
  background: #003034;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover { background: #07141a; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;

}
.modal-content {
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 20px;
  padding: 30px;
}
.modal-content h2 {
  margin-bottom: 20px;
  color: #003034;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
}
.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #003034;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.justify-center { justify-content: center; }
.text-center { text-align: center; }
.mb-6 { margin-bottom: 24px; }
.text-slate-500 { color: #64748b; font-size: 14px; line-height: 1.5; }
.delete-warning-icon { font-size: 56px; color: #ef4444; margin-bottom: 16px; }

/* Utilidades */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.empty-state, .loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

/* Responsive */
@media (max-width: 600px) {
  .header-actions { flex-direction: column; align-items: stretch; gap: 16px; }
  .btn-primary { justify-content: center; }
}
</style>