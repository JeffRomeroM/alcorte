<template>
  <div class="motos-container">
    <div class="header-actions">
      <h1 class="page-title">Motocicletas</h1>
      <button @click="abrirModalNuevo" class="btn-primary">
        <Icon icon="mdi:motorbike" class="icon" /> Nueva Moto
      </button>
    </div>

    <div class="search-bar">
      <Icon icon="mdi:magnify" class="search-icon" />
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Buscar por placa, marca o modelo..." 
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-state">
      <Icon icon="mdi:loading" class="spin" /> Cargando motos...
    </div>
    
    <div v-else-if="filteredMotos.length === 0" class="empty-state">
      <Icon icon="mdi:motorbike-off" class="empty-icon" />
      <p>No se encontraron motocicletas registradas.</p>
    </div>

    <div v-else class="motos-grid">
      <div v-for="moto in filteredMotos" :key="moto.id" class="moto-card">
        <div class="moto-info">
          <div class="moto-header">
            <h3 class="moto-marca">{{ moto.marca }} {{ moto.modelo }}</h3>
            <span class="moto-placa">{{ moto.placa || 'SIN PLACA' }}</span>
          </div>
          <p class="moto-dato" v-if="moto.clientes">
            <Icon icon="mdi:account" class="text-slate-400" /> {{ moto.clientes.nombre }}
          </p>
          <p class="moto-dato text-sm">
            <Icon icon="mdi:speedometer" class="text-slate-400" /> {{ moto.kilometraje || 0 }} km
          </p>
          <p class="moto-dato text-sm">
            <Icon icon="mdi:note-text" class="text-slate-400" /> {{ moto.observaciones || 'Sin observaciones' }}
          </p>
        </div>
        
        <div class="moto-actions">
          <button @click="abrirModalEditar(moto)" class="btn-icon edit-btn" title="Editar Moto">
            <Icon icon="mdi:pencil" />
          </button>
          <button @click="confirmarEliminar(moto.id)" class="btn-icon delete-btn" title="Eliminar Moto">
            <Icon icon="mdi:trash-can-outline" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content">
        <h2>{{ isEditing ? 'Editar Moto' : 'Registrar Moto' }}</h2>
        <form @submit.prevent="guardarMoto">
          
          <div class="form-group" v-if="!isEditing">
            <label>Propietario (Cliente) *</label>
            
            <div class="custom-select-container">
              <div v-if="clienteSeleccionado" class="selected-client">
                <div class="selected-info">
                  <strong>{{ clienteSeleccionado.nombre }}</strong>
                  <span>{{ clienteSeleccionado.telefono }}</span>
                </div>
                <button type="button" @click="limpiarCliente" class="btn-clear"><Icon icon="mdi:close" /></button>
              </div>
              
              <div v-else>
                <input 
                  type="text" 
                  v-model="busquedaCliente" 
                  placeholder="Buscar nombre o teléfono..." 
                  class="client-search-input"
                />
                <ul v-if="clientesFiltradosParaSelect.length > 0" class="client-dropdown">
                  <li 
                    v-for="cliente in clientesFiltradosParaSelect" 
                    :key="cliente.id" 
                    @click="seleccionarCliente(cliente)"
                  >
                    <strong>{{ cliente.nombre }}</strong>
                    <span>{{ cliente.telefono }}</span>
                  </li>
                </ul>
                <div v-else-if="busquedaCliente.length > 0" class="client-dropdown-empty">
                  No se encontró el cliente.
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Placa</label>
              <input v-model="form.placa" type="text" placeholder="Opcional" style="text-transform: uppercase;" />
            </div>
            
            <div class="form-group">
              <label>Kilometraje</label>
              <input v-model="form.kilometraje" type="number" min="0" placeholder="Opcional" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Marca *</label>
              <input v-model="form.marca" type="text" required placeholder="Ej. Yamaha" />
            </div>
            
            <div class="form-group">
              <label>Modelo *</label>
              <input v-model="form.modelo" type="text" required placeholder="Ej. FZ16" />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Año</label>
              <input v-model="form.anio" type="number" min="1950" max="2030" placeholder="Opcional" />
            </div>
            
            <div class="form-group">
              <label>Color</label>
              <input v-model="form.color" type="text" placeholder="Opcional" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="form.observaciones" rows="2" placeholder="Detalles, abolladuras, accesorios..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving || (!isEditing && !form.cliente_id)">
              <Icon v-if="saving" icon="mdi:loading" class="spin" />
              {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content text-center">
        <Icon icon="mdi:alert-circle-outline" class="delete-warning-icon" />
        <h2>¿Eliminar Moto?</h2>
        <p class="text-slate-500 mb-6">Esta acción no se puede deshacer.</p>
        <div class="modal-actions justify-center">
          <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button type="button" class="btn-danger" @click="eliminarMoto" :disabled="deleting">
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

const motos = ref([])
const clientesList = ref([]) 
const searchQuery = ref('')
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const motoIdActiva = ref(null)

// Variables para el buscador de clientes
const busquedaCliente = ref('')
const clienteSeleccionado = ref(null)

const form = ref({
  cliente_id: '',
  placa: '',
  marca: '',
  modelo: '',
  anio: null,
  color: '',
  kilometraje: null,
  observaciones: ''
})

const fetchMotos = async () => {
  try {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('motos')
      .select('*, clientes(nombre)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    motos.value = data
  } catch (error) {
    console.error('Error cargando motos:', error.message)
  } finally {
    loading.value = false
  }
}

const fetchClientesList = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, telefono') // Ahora traemos el teléfono también
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (error) throw error
    clientesList.value = data
  } catch (error) {
    console.error('Error cargando clientes:', error.message)
  }
}

// Filtro de motos (tabla principal)
const filteredMotos = computed(() => {
  if (!searchQuery.value) return motos.value
  const query = searchQuery.value.toLowerCase()
  return motos.value.filter(m => 
    (m.placa && m.placa.toLowerCase().includes(query)) || 
    m.marca.toLowerCase().includes(query) ||
    m.modelo.toLowerCase().includes(query)
  )
})

// Filtro de clientes (para el modal)
const clientesFiltradosParaSelect = computed(() => {
  if (!busquedaCliente.value) return clientesList.value.slice(0, 5) // Muestra 5 por defecto si no busca
  const query = busquedaCliente.value.toLowerCase()
  return clientesList.value.filter(c => 
    c.nombre.toLowerCase().includes(query) || 
    c.telefono.includes(query)
  ).slice(0, 5) // Limita a 5 resultados para no desbordar la pantalla
})

const seleccionarCliente = (cliente) => {
  clienteSeleccionado.value = cliente
  form.value.cliente_id = cliente.id
  busquedaCliente.value = ''
}

const limpiarCliente = () => {
  clienteSeleccionado.value = null
  form.value.cliente_id = ''
}

const guardarMoto = async () => {
  if (!isEditing.value && !form.value.cliente_id) {
    alert("Debes seleccionar un cliente.")
    return
  }

  try {
    saving.value = true
    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      ...form.value,
      user_id: user.id,
      placa: form.value.placa ? form.value.placa.toUpperCase() : null, // Si está vacío, manda null
      kilometraje: form.value.kilometraje ? form.value.kilometraje : 0,
      anio: form.value.anio ? form.value.anio : null
    }

    if (isEditing.value) {
      delete payload.cliente_id
      delete payload.clientes
      const { error } = await supabase.from('motos').update(payload).eq('id', motoIdActiva.value).eq('user_id', user.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('motos').insert([payload])
      if (error) throw error
    }
    
    fetchMotos()
    cerrarModal()
  } catch (error) {
    console.error('Error al guardar:', error.message)
    alert('Hubo un error al guardar la motocicleta.')
  } finally {
    saving.value = false
  }
}

const eliminarMoto = async () => {
  try {
    deleting.value = true
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('motos').delete().eq('id', motoIdActiva.value).eq('user_id', user.id)
    if (error) throw error

    motos.value = motos.value.filter(m => m.id !== motoIdActiva.value)
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error al eliminar:', error.message)
  } finally {
    deleting.value = false
  }
}

const abrirModalNuevo = () => {
  isEditing.value = false
  motoIdActiva.value = null
  clienteSeleccionado.value = null
  busquedaCliente.value = ''
  form.value = { cliente_id: '', placa: '', marca: '', modelo: '', anio: null, color: '', kilometraje: null, observaciones: '' }
  showModal.value = true
}

const abrirModalEditar = (moto) => {
  isEditing.value = true
  motoIdActiva.value = moto.id
  form.value = { ...moto }
  showModal.value = true
}

const confirmarEliminar = (id) => {
  motoIdActiva.value = id
  showDeleteModal.value = true
}

const cerrarModal = () => { showModal.value = false }

onMounted(() => {
  fetchMotos()
  fetchClientesList()
})
</script>

<style scoped>
/* Agrega estos estilos a los que ya tenías */
.custom-select-container { position: relative; }
.client-search-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 15px; box-sizing: border-box; outline: none; }
.client-search-input:focus { border-color: #003034; }
.client-dropdown { position: absolute; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 4px; padding: 0; list-style: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 100; max-height: 200px; overflow-y: auto; }
.client-dropdown li { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; flex-direction: column; }
.client-dropdown li:hover { background: #f8fafc; }
.client-dropdown li strong { color: #0f172a; font-size: 14px; }
.client-dropdown li span { color: #64748b; font-size: 12px; }
.client-dropdown-empty { position: absolute; width: 100%; background: white; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 4px; padding: 12px; color: #64748b; font-size: 13px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 100; }
.selected-client { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; }
.selected-info { display: flex; flex-direction: column; }
.selected-info strong { color: #003034; font-size: 14px; }
.selected-info span { color: #64748b; font-size: 12px; }
.btn-clear { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 4px; display: flex; align-items: center; justify-content: center; }
.btn-clear:hover { color: #ef4444; }

/* El resto de estilos se mantienen igual (Motos-container, cabeceras, botones, modales, grids) */
.motos-container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; color: #0f172a; }
.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #003034; }
.search-bar { display: flex; align-items: center; background: white; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.search-icon { font-size: 20px; color: #94a3b8; margin-right: 12px; }
.search-input { border: none; outline: none; width: 100%; font-size: 15px; color: #334155; }
.motos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.moto-card { background: white; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.moto-info { flex: 1; }
.moto-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.moto-marca { font-size: 18px; font-weight: 800; color: #003034; text-transform: uppercase; margin: 0; }
.moto-placa { font-size: 11px; color: #64748b; font-weight: 600; }
.moto-dato { font-size: 14px; color: #64748b; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.moto-actions { display: flex; gap: 8px; }
.btn-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-size: 20px; transition: all 0.2s; }
.edit-btn { background: #f1f5f9; color: #64748b; }
.edit-btn:hover { background: #003034; color: white; }
.delete-btn { background: #fee2e2; color: #ef4444; }
.delete-btn:hover { background: #ef4444; color: white; }
.btn-primary { background: #003034; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-primary:hover { background: #07141a; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }
.modal-overlay { position: fixed; top: 60px; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 15px; }

.modal-content { background: white; width: 100%; max-width: 500px; border-radius: 20px; padding: 30px; max-height: 94vh; overflow-y: auto; }
.modal-content h2 { margin-bottom: 20px; color: #003034; margin-top: 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
.form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 15px; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #003034; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.justify-center { justify-content: center; }
.text-center { text-align: center; }
.mb-6 { margin-bottom: 24px; }
.text-slate-500 { color: #64748b; font-size: 14px; line-height: 1.5; }
.delete-warning-icon { font-size: 56px; color: #ef4444; margin-bottom: 16px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.empty-state, .loading-state { text-align: center; padding: 40px; color: #64748b; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

@media (max-width: 600px) {
  .header-actions { flex-direction: column; align-items: stretch; gap: 16px; }
  .btn-primary { justify-content: center; }
  .form-grid { grid-template-columns: 1fr; gap: 0; }
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 15px; }

  .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 20px; padding: 30px; max-height: 83vh; overflow-y: auto; }
  
}
</style>