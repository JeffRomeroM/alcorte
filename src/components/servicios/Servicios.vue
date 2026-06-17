<template>
  <div class="ordenes-container">
    <div class="header-actions no-print">
      <h1 class="page-title">Órdenes de Trabajo</h1>
      <button @click="abrirModalNueva" class="btn-primary">
        <Icon icon="mdi:file-plus" class="icon-btn" /> Nueva Orden
      </button>
    </div>

    <div class="filter-tabs no-print">
      <button 
        v-for="est in ['Todas', 'Mantenimientos', 'Recibida', 'En proceso', 'Lista para entregar', 'Reparaciones']" 
        :key="est"
        @click="estadoFiltro = est"
        :class="['tab-btn', { active: estadoFiltro === est }]"
      >
        {{ est }}
      </button>
    </div>

    <div v-if="loading" class="loading-state no-print">
      <Icon icon="mdi:loading" class="spin" /> Cargando órdenes de trabajo...
    </div>

    <div v-else-if="ordenesFiltradas.length === 0" class="empty-state no-print">
      <Icon icon="mdi:clipboard-text-off-outline" class="empty-icon" />
      <p>No se encontraron órdenes en esta categoría.</p>
    </div>

    <div v-else class="ordenes-grid">
      <div 
        v-for="orden in ordenesFiltradas" 
        :key="orden.id" 
        class="orden-card"
        :id="'print-orden-' + orden.id"
        @click="verDetallesOrden(orden)"
      >
        <div class="card-header-meta">
          <span class="orden-fecha">
            <Icon icon="mdi:calendar-clock" class="no-print" />
            <span class="print-only">Fecha: </span>{{ formatFecha(orden.fecha_ingreso) }}
          </span>
          <div class="orden-badge-estado" :class="orden.estado?.toLowerCase().replace(/ /g, '-')">
            {{ orden.estado }}
          </div>
        </div>

        <div class="orden-main-info">
          <div class="moto-header">
            <h3 v-if="orden.motos">{{ orden.motos.marca }} {{ orden.motos.modelo }}</h3>
            <span class="moto-placa">{{ orden.motos?.placa || 'SIN PLACA' }}</span>
          </div>
          <div class="tipo-servicio-tag" :class="orden.tipo_servicio?.toLowerCase().replace(/ /g, '-')">
            <Icon :icon="orden.tipo_servicio === 'Mantenimiento' ? 'mdi:tools' : 'mdi:wrench'" class="no-print" />
            {{ orden.tipo_servicio || 'Reparación General' }}
          </div>

          <div class="falla-block">
            <strong>Falla/Detalle:</strong> {{ orden.falla_reportada }}
          </div>
          <div class="cliente-mini-info" v-if="orden.motos?.clientes">
            <Icon icon="mdi:account-circle" class="no-print" />
            <strong>Cliente:</strong> {{ orden.motos.clientes.nombre }}
          </div>
          <div class="orden-proximo-mantenimiento" v-if="orden.proximo_mantenimiento">
            Próximo mantenimiento: {{ formatFecha(orden.proximo_mantenimiento) }}
          </div>
        </div>

        <div class="print-details print-only" v-if="orden.detallesImpresion">
          <hr />
          <h4>Detalle de Servicios / Mano de Obra</h4>
          <ul>
            <li v-for="(s, i) in orden.detallesImpresion.servicios" :key="i">
              {{ s.descripcion }} — ${{ parseFloat(s.precio).toFixed(2) }}
            </li>
          </ul>
          <h4 v-if="orden.detallesImpresion.repuestos?.length">Repuestos Aplicados</h4>
          <ul>
            <li v-for="(r, i) in orden.detallesImpresion.repuestos" :key="i">
              {{ r.cantidad }}x {{ r.repuesto_nombre }} — ${{ (r.cantidad * r.precio_unitario).toFixed(2) }}
            </li>
          </ul>
        </div>

        <div class="orden-footer" @click.stop>
          <div class="orden-total">
            <span class="total-label">Total:</span> ${{ orden.total_general }}
          </div>

          <div class="orden-actions no-print">
            <button @click="abrirModalEditar(orden)" class="btn-icon edit-btn" title="Editar Orden">
              <Icon icon="mdi:pencil" />
            </button>
            <!-- <button @click="prepararImpresion(orden)" class="btn-icon print-btn" title="Imprimir / PDF">
              <Icon icon="mdi:printer" />
            </button>
            <button @click="compartirWhatsApp(ordenSeleccionada)" class="btn-icon whatsapp-btn" title="Enviar por WhatsApp">
              <Icon icon="mdi:whatsapp" />
            </button> -->
            <button @click="confirmarEliminar(orden)" class="btn-icon delete-btn" title="Eliminar Orden">
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDetallesModal" class="modal-overlay" @click.self="showDetallesModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>Detalles de Orden #{{ ordenSeleccionada?.id?.toString().slice(-4).toUpperCase() }}</h2>
          <button type="button" class="btn-close-modal" @click="showDetallesModal = false">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div class="modal-form-body">
          <div class="info-detalles-grid">
            <div><strong>Cliente:</strong> {{ ordenSeleccionada?.motos?.clientes?.nombre || 'N/A' }}</div>
            <div><strong>Teléfono:</strong> {{ ordenSeleccionada?.motos?.clientes?.telefono || 'N/A' }}</div>
            <div><strong>Unidad:</strong> {{ ordenSeleccionada?.motos?.marca }} {{ ordenSeleccionada?.motos?.modelo }}</div>
            <div><strong>Placa:</strong> {{ ordenSeleccionada?.motos?.placa || 'SIN PLACA' }}</div>
            <div><strong>Fecha Ingreso:</strong> {{ formatFecha(ordenSeleccionada?.fecha_ingreso) }}</div>
            <div><strong>Tipo Servicio:</strong> {{ ordenSeleccionada?.tipo_servicio }}</div>
          </div>
          <div class="falla-block-detalles">
            <strong>Diagnóstico / Falla Reportada:</strong>
            <p>{{ ordenSeleccionada?.falla_reportada }}</p>
          </div>
          <div class="proximo-mantenimiento">
            <strong>Próximo Mantenimiento:</strong>
            <span v-if="ordenSeleccionada?.proximo_mantenimiento">{{ formatFecha(ordenSeleccionada.proximo_mantenimiento) }}</span>
            <span v-else class="text-muted">No se ha sugerido una fecha para el próximo mantenimiento.</span>
          </div>

          <div v-if="loadingDetalles" class="loading-state-mini">
            <Icon icon="mdi:loading" class="spin" /> Cargando datos...
          </div>
          <div v-else>
            <h3 class="sub-title-detalles">Mano de Obra & Servicios</h3>
            <div v-if="detallesCargados.servicios.length === 0" class="text-muted">No hay tareas registradas.</div>
            <table class="tabla-detalles" v-else>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th class="text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in detallesCargados.servicios" :key="i">
                  <td>{{ s.descripcion }}</td>
                  <td class="text-right">${{ parseFloat(s.precio).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>

            <h3 class="sub-title-detalles">Repuestos & Materiales</h3>
            <div v-if="detallesCargados.repuestos.length === 0" class="text-muted">No se aplicaron repuestos.</div>
            <table class="tabla-detalles" v-else>
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">P. Unitario</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in detallesCargados.repuestos" :key="i">
                  <td>{{ r.repuesto_nombre }}</td>
                  <td class="text-center">{{ r.cantidad }}</td>
                  <td class="text-right">${{ parseFloat(r.precio_unitario).toFixed(2) }}</td>
                  <td class="text-right">${{ (r.cantidad * r.precio_unitario).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="totales-resumen">
              <div class="total-line">Mano de Obra: <span>${{ ordenSeleccionada?.total_mano_obra }}</span></div>
              <div class="total-line">Repuestos / Fluidos: <span>${{ ordenSeleccionada?.total_repuestos }}</span></div>
              <div class="total-line grand-total">Total Facturado: <span>${{ ordenSeleccionada?.total_general }}</span></div>
            </div>
          </div>
        </div>
        <div class="modal-actions padding-actions">
          <button type="button" class="btn-primary" @click="convertirDetalleAImpresion(ordenSeleccionada)">
            <Icon icon="mdi:printer" /> Imprimir Orden
          </button>
          <button type="button" class="btn-whatsapp" @click="compartirWhatsApp(ordenSeleccionada)">
            <Icon icon="mdi:whatsapp" /> Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Gestionar Orden de Trabajo' : 'Nueva Orden de Trabajo' }}</h2>
          <button type="button" class="btn-close-modal" @click="cerrarModal">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <form @submit.prevent="guardarOrden" class="modal-form-body">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Fecha de Ingreso *</label>
              <input v-model="form.fecha_ingreso" type="date" required />
            </div>
            <div class="form-group">
              <label>Tipo de Servicio Principal *</label>
              <select v-model="form.tipo_servicio" required>
                <option value="Reparación General">Reparación General</option>
                <option value="Mantenimiento">Mantenimiento Periódico </option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group" v-if="!isEditing">
              <label>Moto (Unidad) *</label>
              <div class="custom-select-container">
                <div v-if="motoSeleccionada" class="selected-client">
                  <div class="selected-info">
                    <strong>{{ motoSeleccionada.placa }}</strong>
                    <span>{{ motoSeleccionada.marca }} {{ motoSeleccionada.modelo }}</span>
                  </div>
                  <button type="button" @click="limpiarMotoSeleccionada" class="btn-clear">
                    <Icon icon="mdi:close" />
                  </button>
                </div>

                <div v-else>
                  <input
                    type="text"
                    v-model="busquedaMoto"
                    placeholder="Buscar placa o modelo de moto..."
                    class="client-search-input"
                  />
                  <ul v-if="motosFiltradas.length > 0" class="client-dropdown">
                    <li v-for="moto in motosFiltradas" :key="moto.id" @click="seleccionarMoto(moto)">
                      
                      <strong>{{ moto.marca }} {{ moto.modelo }}</strong>
                      <span>{{ moto.placa }}</span>
                    </li>
                  </ul>
                  <div v-else-if="busquedaMoto.length > 0" class="client-dropdown-empty">
                    No se encontró la moto.
                  </div>
                </div>
              </div>
            </div>

            <!-- <div class="form-group" v-if="!isEditing">
              <label>Seleccionar Motocicleta Directamente *</label>
              <select v-model="form.moto_id" required @change="onMotoSelectChange">
                <option value="" disabled>Seleccione una unidad...</option>
                <option v-for="moto in motosList" :key="moto.id" :value="moto.id">
                  {{ moto.placa || 'S/P' }} - {{ moto.marca }} {{ moto.modelo }} ({{ moto.clientes?.nombre }})
                </option>
              </select>
            </div> -->

            <div class="form-group" v-else>
              <label>Motocicleta</label>
              <input type="text" :value="`${form.moto_display_txt}`" disabled class="input-disabled" />
            </div>

            <div class="form-group">
              <label>Estado de la Reparación</label>
              <select v-model="form.estado" class="select-estado-form">
                <option value="Recibida">Recibida 📥</option>
                <option value="En proceso">En proceso 🛠️</option>
                <option value="Lista para entregar">Lista para entregar ✅</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Falla Reportada / Diagnóstico *</label>
            <textarea v-model="form.falla_reportada" required rows="2" placeholder="Ej. Cambio de kit de arrastre..."></textarea>
          </div>

          <hr class="divider" />
          <div class="section-title-actions">
            <h3>Mano de Obra & Servicios Cobrables</h3>
            <button type="button" @click="agregarServicioFila" class="btn-link">
              <Icon icon="mdi:plus-circle" /> Añadir Tarea
            </button>
          </div>

          <div v-for="(serv, idx) in form.servicios" :key="'s-' + idx" class="dinamic-row">
            <input v-model="serv.descripcion" type="text" placeholder="Descripción de la mano de obra" required class="flex-3" />
            <div class="currency-input flex-1">
              <span>$</span>
              <input v-model.number="serv.precio" type="number" min="0" step="0.01" placeholder="0.00" required />
            </div>
            <button type="button" @click="removerServicioFila(idx)" class="btn-row-delete" title="Remover">
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>

          <hr class="divider" />
          <div class="section-title-actions">
            <h3>Repuestos & Materiales Aplicados</h3>
            <button type="button" @click="agregarRepuestoFila" class="btn-link">
              <Icon icon="mdi:plus-circle" /> Añadir Repuesto
            </button>
          </div>

          <div v-for="(rep, idx) in form.repuestos" :key="'r-' + idx" class="dinamic-row">
            <input v-model="rep.repuesto_nombre" type="text" placeholder="Nombre de la pieza" required class="flex-3" />
            <input v-model.number="rep.cantidad" type="number" min="1" placeholder="Cant" required class="flex-0-5 text-center" />
            <div class="currency-input flex-1">
              <span>$</span>
              <input v-model.number="rep.precio_unitario" type="number" min="0" step="0.01" placeholder="U. $" required />
            </div>
            <button type="button" @click="removerRepuestoFila(idx)" class="btn-row-delete" title="Remover">
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </div>

          <div class="form-group">
            <label>Próximo mantenimiento</label>
            <input type="date" v-model="form.proximo_mantenimiento" placeholder="Fecha sugerida" />
          </div>

          <div class="totales-resumen">
            <div class="total-line">Mano de Obra: <span>${{ totals.manoObra }}</span></div>
            <div class="total-line">Repuestos / Fluidos: <span>${{ totals.repuestos }}</span></div>
            <div class="total-line grand-total">Total Facturado: <span>${{ totals.general }}</span></div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Icon v-if="saving" icon="mdi:loading" class="spin" />
              {{ saving ? 'Guardando cambios...' : 'Guardar Orden' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header header-danger">
          <h2>¿Eliminar Orden de Trabajo?</h2>
        </div>
        <div class="modal-body-padding">
          <p>Esta acción no se puede deshacer. Se removerán los registros vinculados.</p>
          <div class="target-delete-info" v-if="ordenAEliminar">
            <strong>Moto:</strong> {{ ordenAEliminar.motos?.marca }} {{ ordenAEliminar.motos?.modelo }} <br />
            <strong>Placa:</strong> {{ ordenAEliminar.motos?.placa || 'S/P' }}
          </div>
        </div>
        <div class="modal-actions padding-actions">
          <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button type="button" class="btn-danger" @click="eliminarOrdenEjecutar" :disabled="deleting">
            <Icon v-if="deleting" icon="mdi:loading" class="spin" />
            {{ deleting ? 'Eliminando...' : 'Sí, Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)

// Estados Reactivos
const ordenes = ref([])
const motosList = ref([])
const estadoFiltro = ref('Todas')
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const ordenIdActiva = ref(null)
const ordenAEliminar = ref(null)
const busquedaMoto = ref('')
const motoSeleccionada = ref(null)

const showDetallesModal = ref(false)
const loadingDetalles = ref(false)
const ordenSeleccionada = ref(null)
const detallesCargados = ref({ servicios: [], repuestos: [] })

const form = ref({
  moto_id: '',
  moto_display_txt: '',
  estado: 'Recibida',
  tipo_servicio: 'Reparación General',
  fecha_ingreso: '',
  proximo_mantenimiento: '',
  falla_reportada: '',
  servicios: [],
  repuestos: []
})

// Computados
const totals = computed(() => {
  const manoObra = form.value.servicios.reduce((acc, s) => acc + (parseFloat(s.precio) || 0), 0)
  const repuestos = form.value.repuestos.reduce((acc, r) => acc + ((parseFloat(r.precio_unitario) || 0) * (parseInt(r.cantidad) || 1)), 0)
  return {
    manoObra: manoObra.toFixed(2),
    repuestos: repuestos.toFixed(2),
    general: (manoObra + repuestos).toFixed(2)
  }
})

const motosFiltradas = computed(() => {
  if (!busquedaMoto.value) return motosList.value.slice(0, 5)
  const query = busquedaMoto.value.toLowerCase()
  return motosList.value.filter(m =>
    (m.placa || '').toLowerCase().includes(query) ||
    (m.modelo || '').toLowerCase().includes(query) ||
    (m.marca || '').toLowerCase().includes(query)
  ).slice(0, 5)
})

const ordenesFiltradas = computed(() => {
  if (estadoFiltro.value === 'Todas') return ordenes.value
  if (estadoFiltro.value === 'Mantenimientos') return ordenes.value.filter(o => o.tipo_servicio === 'Mantenimiento')
  if (estadoFiltro.value === 'Reparaciones') return ordenes.value.filter(o => o.tipo_servicio === 'Reparación General')
  return ordenes.value.filter(o => o.estado === estadoFiltro.value)
})

const formatFecha = (fechaStr) => {
  if (!fechaStr) return 'N/A'
  const partes = fechaStr.split('-')
  if (partes.length !== 3) return fechaStr
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

const seleccionarMoto = (moto) => {
  motoSeleccionada.value = moto
  form.value.moto_id = moto.id
  busquedaMoto.value = ''
}

const limpiarMotoSeleccionada = () => {
  motoSeleccionada.value = null
  form.value.moto_id = ''
}

const onMotoSelectChange = () => {
  const encontrada = motosList.value.find(m => m.id === form.value.moto_id)
  if (encontrada) {
    motoSeleccionada.value = encontrada
  }
}

const agregarServicioFila = () => form.value.servicios.push({ descripcion: '', precio: '' })
const removerServicioFila = (index) => form.value.servicios.splice(index, 1)
const agregarRepuestoFila = () => form.value.repuestos.push({ repuesto_nombre: '', cantidad: 1, precio_unitario: '' })
const removerRepuestoFila = (index) => form.value.repuestos.splice(index, 1)

// Fetch inicial
const fetchOrdenes = async () => {
  try {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select('*, motos(marca, modelo, placa, clientes(nombre, telefono))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    ordenes.value = data.map(o => ({ ...o, detallesImpresion: null }))
  } catch (error) {
    console.error('Error fetchOrdenes:', error.message)
  } finally {
    loading.value = false
  }
}

const fetchMotosList = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase
    .from('motos')
    .select('id, marca, modelo, placa, clientes(nombre, telefono)')
    .eq('user_id', user.id)
  motosList.value = data || []
}

const verDetallesOrden = async (orden) => {
  ordenSeleccionada.value = orden
  showDetallesModal.value = true
  loadingDetalles.value = true
  try {
    const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
    const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
    detallesCargados.value = { servicios: servs || [], repuestos: reps || [] }
  } catch (err) {
    console.error("Error al cargar detalles del modal", err)
  } finally {
    loadingDetalles.value = false
  }
}

const abrirModalNueva = () => {
  isEditing.value = false
  ordenIdActiva.value = null
  motoSeleccionada.value = null
  busquedaMoto.value = ''
  form.value = {
    moto_id: '',
    moto_display_txt: '',
    estado: 'Recibida',
    tipo_servicio: 'Reparación General',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    proximo_mantenimiento: '',
    falla_reportada: '',
    servicios: [],
    repuestos: []
  }
  showModal.value = true
}

const abrirModalEditar = async (orden) => {
  isEditing.value = true
  ordenIdActiva.value = orden.id
  showModal.value = true
  try {
    const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
    const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
    const placaTxt = orden.motos?.placa ? `[${orden.motos.placa}]` : '[S/P]'
    
    form.value = {
      moto_id: orden.moto_id,
      moto_display_txt: `${placaTxt} ${orden.motos?.marca || ''} ${orden.motos?.modelo || ''}`,
      estado: orden.estado,
      tipo_servicio: orden.tipo_servicio || 'Reparación General',
      fecha_ingreso: orden.fecha_ingreso,
      proximo_mantenimiento: orden.proximo_mantenimiento || '',
      falla_reportada: orden.falla_reportada,
      servicios: servs || [],
      repuestos: reps || []
    }
  } catch (err) {
    console.error("Error al cargar datos para edición", err)
  }
}

const cerrarModal = () => {
  showModal.value = false
  motoSeleccionada.value = null
  busquedaMoto.value = ''
}

const guardarOrden = async () => {
  try {
    saving.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const maestroPayload = {
      user_id: user.id,
      moto_id: form.value.moto_id,
      estado: form.value.estado,
      tipo_servicio: form.value.tipo_servicio,
      fecha_ingreso: form.value.fecha_ingreso,
      proximo_mantenimiento: form.value.proximo_mantenimiento || null,
      falla_reportada: form.value.falla_reportada,
      total_mano_obra: parseFloat(totals.value.manoObra),
      total_repuestos: parseFloat(totals.value.repuestos),
      total_general: parseFloat(totals.value.general)
    }

    let ordenId = ordenIdActiva.value

    if (isEditing.value && ordenId) {
      const { error } = await supabase.from('ordenes_trabajo').update(maestroPayload).eq('id', ordenId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('ordenes_trabajo').insert(maestroPayload).select().single()
      if (error) throw error
      ordenId = data.id
    }

    await supabase.from('orden_servicios').delete().eq('orden_id', ordenId)
    if (form.value.servicios.length > 0) {
      const servsPayload = form.value.servicios.map(s => ({
        orden_id: ordenId,
        descripcion: s.descripcion,
        precio: parseFloat(s.precio) || 0
      }))
      await supabase.from('orden_servicios').insert(servsPayload)
    }

    await supabase.from('orden_repuestos').delete().eq('orden_id', ordenId)
    if (form.value.repuestos.length > 0) {
      const repsPayload = form.value.repuestos.map(r => ({
        orden_id: ordenId,
        repuesto_nombre: r.repuesto_nombre,
        cantidad: parseInt(r.cantidad) || 1,
        precio_unitario: parseFloat(r.precio_unitario) || 0
      }))
      await supabase.from('orden_repuestos').insert(repsPayload)
    }

    cerrarModal()
    await fetchOrdenes()
  } catch (err) {
    console.error("Error al guardar la orden de trabajo:", err.message)
  } finally {
    saving.value = false
  }
}

const confirmarEliminar = (orden) => {
  ordenAEliminar.value = orden
  showDeleteModal.value = true
}

const eliminarOrdenEjecutar = async () => {
  try {
    if (!ordenAEliminar.value) return
    deleting.value = true
    await supabase.from('orden_servicios').delete().eq('orden_id', ordenAEliminar.value.id)
    await supabase.from('orden_repuestos').delete().eq('orden_id', ordenAEliminar.value.id)
    
    const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', ordenAEliminar.value.id)
    if (error) throw error

    showDeleteModal.value = false
    ordenAEliminar.value = null
    await fetchOrdenes()
  } catch (err) {
    console.error("Error al eliminar orden:", err.message)
  } finally {
    deleting.value = false
  }
}

const prepararImpresion = async (orden) => {
  try {
    const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
    const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
    orden.detallesImpresion = { servicios: servs || [], repuestos: reps || [] }
    await nextTick()
    window.print()
  } catch (err) {
    console.error("Error preparando la vista de impresión:", err)
  }
}

const convertirDetalleAImpresion = (orden) => {
  if (!orden) return
  showDetallesModal.value = false
  const target = ordenes.value.find(o => o.id === orden.id)
  if (target) prepararImpresion(target)
}



const compartirWhatsApp = async (orden) => {
  if (!orden) return
  try {
    let servs = detallesCargados.value.servicios
    let reps = detallesCargados.value.repuestos
    let profile = null

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {

      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id) 
        .maybeSingle()  

      if (!pError && pData) {
        profile = pData
      }
    }

    // Cargar servicios y repuestos si la orden no coincide con la seleccionada
    if (ordenSeleccionada.value?.id !== orden.id) {
      const { data: s } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
      const { data: r } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
      
      servs = s || []
      reps = r || []
    }

    // Definición correcta de variables para el mensaje
    const clienteNombre = orden.motos?.clientes?.nombre || 'Cliente'
    const motoInfo = `${orden.motos?.marca || ''} ${orden.motos?.modelo || ''} [${orden.motos?.placa || 'S/P'}]`
    
    // Si 'profile' o 'nombre_negocio' es null en tu base de datos, usará 'ALCORTE'
    const nombreTaller = profile?.nombre_negocio || profile?.nombre || 'ALCORTE'
    
    let mensaje = `*Taller ${nombreTaller}*🛠\n\n`
    
    mensaje += `Hola ${clienteNombre}, te compartimos el detalle del servicio en su motocicleta *${motoInfo}*.\n`
    mensaje += `*Servicio:* ${orden.tipo_servicio}\n`
    mensaje += `*Diagnóstico:* ${orden.falla_reportada}\n\n`

    if (servs.length > 0) {
      mensaje += `*Servicios y Mano de Obra:*\n`
      servs.forEach(s => mensaje += `- ${s.descripcion}: $${parseFloat(s.precio).toFixed(2)}\n`)
      mensaje += `\n`
    }

    if (reps.length > 0) {
      mensaje += `*Repuestos Aplicados:*\n`
      reps.forEach(r => mensaje += `- ${r.cantidad}x ${r.repuesto_nombre}: $${(r.cantidad * r.precio_unitario).toFixed(2)}\n`)
      mensaje += `\n`
    }

    mensaje += `*Total General:* $${orden.total_general}\n`
    mensaje += `*Gracias por su confianza*\n`
    

    const telefono = orden.motos?.clientes?.telefono ? orden.motos.clientes.telefono.replace(/\s+/g, '') : ''
    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`
    
    window.open(url, '_blank')
  } catch (err) {
    console.error("Error al enviar mensaje por WhatsApp:")
  }
}

onMounted(async () => {
  await fetchOrdenes()
  await fetchMotosList()
})
</script>

<style scoped>
/* Contenedor Base */
.ordenes-container { 
  padding: 24px; 
  max-width: 1300px; 
  margin: 0 auto; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Encabezado */
.header-actions { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 28px; 
}
.page-title { 
  font-size: 26px; 
  font-weight: 800; 
  color: #003034; 
  margin: 0;
}

/* Tabs de Filtrado Modernas */
.filter-tabs { 
  display: flex; 
  gap: 10px; 
  margin-bottom: 28px; 
  overflow-x: auto; 
  padding-bottom: 6px; 
}
.filter-tabs::-webkit-scrollbar { height: 4px; }
.filter-tabs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.tab-btn { 
  background: #f1f5f9; 
  border: 1px solid #e2e8f0; 
  padding: 10px 18px; 
  border-radius: 24px; 
  font-weight: 600; 
  color: #475569; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  white-space: nowrap; 
}
.tab-btn:hover { background: #e2e8f0; color: #0f172a; }
.tab-btn.active { background: #003034; color: white; border-color: #003034; }

/* Grid de Tarjetas */
.ordenes-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); 
  gap: 20px; 
}

/* Tarjeta Estilo Premium Interactiva */
.orden-card { 
  background: white; 
  border: 1px solid #e2e8f0; 
  border-radius: 16px; 
  padding: 20px; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); 
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.orden-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06); 
}

.card-header-meta { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 14px; 
}
.orden-fecha { 
  font-size: 13px; 
  color: #64748b; 
  display: flex; 
  align-items: center; 
  gap: 4px; 
  font-weight: 500;
}
.orden-badge-estado { 
  font-size: 12px; 
  font-weight: 700; 
  padding: 6px 14px; 
  border-radius: 20px; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
}
.orden-badge-estado.recibida { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
.orden-badge-estado.en-proceso { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.orden-badge-estado.lista-para-entregar { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

.moto-header h3 { 
  margin: 0 0 4px 0; 
  font-size: 18px; 
  color: #0f172a; 
  font-weight: 700; 
}
.moto-placa { 
  display: inline-block; 
  background: #f8fafc; 
  border: 1px solid #cbd5e1; 
  padding: 3px 8px; 
  border-radius: 6px; 
  font-size: 12px; 
  font-weight: 800; 
  color: #334155; 
  letter-spacing: 0.5px; 
  margin-bottom: 12px;
}

.tipo-servicio-tag { 
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  font-size: 13px; 
  font-weight: 600; 
  padding: 4px 10px; 
  border-radius: 8px; 
  margin-bottom: 14px;
}
.tipo-servicio-tag.mantenimiento { background: #f5f3ff; color: #5b21b6; }
.tipo-servicio-tag.reparación-general { background: #fff7ed; color: #c2410c; }

.falla-block { 
  background: #f8fafc; 
  border-radius: 10px; 
  padding: 12px; 
  font-size: 13.5px; 
  color: #475569; 
  line-height: 1.5; 
  margin-bottom: 12px; 
  border-left: 3px solid #cbd5e1;
}
.falla-block strong { color: #1e293b; }

.cliente-mini-info { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  font-size: 13px; 
  color: #475569; 
  margin-bottom: 8px;
}
.cliente-mini-info strong { color: #0f172a; font-weight: 600; }

.orden-proximo-mantenimiento { 
  font-size: 12px; 
  color: #7c3aed; 
  background: #f5f3ff; 
  padding: 6px 10px; 
  border-radius: 6px; 
  font-weight: 600; 
  display: inline-block;
}

.orden-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 18px; 
  padding-top: 14px; 
  border-top: 1px solid #f1f5f9; 
}
.orden-total { 
  font-size: 18px; 
  font-weight: 800; 
  color: #003034; 
}
.total-label { 
  font-size: 13px; 
  color: #64748b; 
  font-weight: 500; 
  margin-right: 2px;
}

/* Controles de Botones */
.orden-actions { display: flex; gap: 6px; }
.btn-icon { 
  background: white; 
  border: 1px solid #e2e8f0; 
  width: 34px; 
  height: 34px; 
  border-radius: 8px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: all 0.15s; 
  color: #64748b;
}
.btn-icon:hover { transform: scale(1.05); }
.edit-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
.print-btn:hover { border-color: #475569; color: #475569; background: #f1f5f9; }
.whatsapp-btn:hover { border-color: #25d366; color: #25d366; background: #f0fdf4; }
.delete-btn:hover { border-color: #ef4444; color: #ef4444; background: #fdf2f2; }

/* Modales Refinados */
.modal-overlay { 
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(15, 23, 42, 0.4); 
  backdrop-filter: blur(4px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 9999; 
  padding: 16px;
}
.modal-content { 
  background: white; 
  border-radius: 20px; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
  width: 100%; 
  max-height: 90vh; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
}
.modal-large { max-width: 760px; }
.modal-small { max-width: 440px; }

.modal-header { 
  padding: 20px 24px; 
  border-bottom: 1px solid #f1f5f9; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: #fafafa;
}
.modal-header h2 { font-size: 19px; font-weight: 800; color: #003034; margin: 0; }
.header-danger { background: #fdf2f2; border-bottom: 1px solid #fee2e2; }
.header-danger h2 { color: #991b1b; }

.btn-close-modal { 
  background: none; 
  border: none; 
  font-size: 20px; 
  cursor: pointer; 
  color: #94a3b8; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 32px; 
  height: 32px; 
  border-radius: 50%; 
  transition: background 0.2s;
}
.btn-close-modal:hover { background: #f1f5f9; color: #475569; }

.modal-form-body { padding: 24px; overflow-y: auto; flex: 1; }
.modal-body-padding { padding: 20px 24px; color: #475569; font-size: 14.5px; line-height: 1.5; }

/* Estilos de Formulario */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: 13px; font-weight: 700; color: #334155; }
.form-group input, .form-group select, .form-group textarea { 
  border: 1px solid #cbd5e1; 
  border-radius: 10px; 
  padding: 10px 14px; 
  font-size: 14px; 
  color: #0f172a; 
  background-color: white; 
  transition: all 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { 
  outline: none; 
  border-color: #003034; 
  box-shadow: 0 0 0 3px rgba(0, 48, 52, 0.1); 
}
.input-disabled { background-color: #f8fafc !important; color: #64748b !important; font-weight: 600; }

/* Selector Personalizado */
.custom-select-container { position: relative; }
.client-search-input { width: 100%; }
.client-dropdown { 
  position: absolute; 
  top: 100%; left: 0; right: 0; 
  background: white; 
  border: 1px solid #cbd5e1; 
  border-radius: 10px; 
  margin-top: 4px; 
  max-height: 180px; 
  overflow-y: auto; 
  z-index: 100; 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); 
  padding: 0; list-style: none;
}
.client-dropdown li { 
  padding: 10px 14px; 
  cursor: pointer; 
  display: flex; 
  flex-direction: column; 
  border-bottom: 1px solid #f1f5f9;
}
.client-dropdown li:hover { background: #f8fafc; }
.client-dropdown li strong { font-size: 13.5px; color: #0f172a; }
.client-dropdown li span { font-size: 12px; color: #64748b; }
.client-dropdown-empty { 
  position: absolute; 
  top: 100%; left: 0; right: 0; 
  background: white; 
  border: 1px solid #cbd5e1; 
  border-radius: 10px; 
  padding: 12px; 
  font-size: 13px; color: #64748b; text-align: center; z-index: 100;
}
.selected-client { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: #f0fdf4; 
  border: 1px solid #bbf7d0; 
  padding: 8px 12px; 
  border-radius: 10px;
}
.selected-info { display: flex; flex-direction: column; }
.selected-info strong { font-size: 14px; color: #14532d; }
.selected-info span { font-size: 12px; color: #166534; }
.btn-clear { background: none; border: none; color: #166534; cursor: pointer; font-size: 16px; display: flex; align-items: center; }

/* Filas Dinámicas */
.divider { border: 0; border-top: 1px dashed #e2e8f0; margin: 24px 0 16px 0; }
.section-title-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title-actions h3 { font-size: 14px; font-weight: 800; color: #334155; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }

.btn-link { 
  background: none; border: none; 
  color: #003034; font-weight: 700; 
  font-size: 13px; cursor: pointer; 
  display: flex; align-items: center; gap: 4px;
}
.btn-link:hover { text-decoration: underline; }

.dinamic-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.flex-3 { flex: 3; }
.flex-1 { flex: 1; }
.flex-0-5 { flex: 0.5; }

.currency-input { position: relative; display: flex; align-items: center; }
.currency-input span { position: absolute; left: 12px; font-size: 14px; color: #64748b; font-weight: 600; }
.currency-input input { padding-left: 24px !important; width: 100%; }

.btn-row-delete { 
  background: none; border: none; 
  color: #94a3b8; cursor: pointer; 
  font-size: 18px; padding: 6px; 
  border-radius: 6px; transition: all 0.2s;
}
.btn-row-delete:hover { color: #ef4444; background: #fdf2f2; }

/* Totales Resumen */
.totales-resumen { 
  background: #f8fafc; 
  border-radius: 12px; 
  padding: 16px; 
  margin-top: 20px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px;
  border: 1px dashed #cbd5e1;
}
.total-line { display: flex; justify-content: space-between; font-size: 14px; color: #475569; }
.total-line span { font-weight: 600; color: #0f172a; }
.grand-total { 
  border-top: 1px solid #e2e8f0; 
  padding-top: 8px; 
  font-size: 17px; 
  font-weight: 800; 
  color: #003034 !important; 
}
.grand-total span { font-size: 20px; font-weight: 900; color: #003034; }

/* Acciones Footer Modal */
.modal-actions { 
  padding: 16px 24px; 
  border-top: 1px solid #f1f5f9; 
  display: flex; 
  justify-content: flex-end; 
  gap: 10px; 
  background: #fafafa;
}
.padding-actions { padding: 18px 24px; }

/* Botones Generales */
.btn-primary { 
  background: #003034; color: white; 
  border: none; border-radius: 10px; 
  padding: 10px 20px; font-weight: 600; 
  font-size: 14px; cursor: pointer; 
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 10px rgba(0, 48, 52, 0.15);
  transition: all 0.2s;
}
.btn-primary:hover { background: #00444a; transform: translateY(-1px); }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-secondary { 
  background: white; color: #475569; 
  border: 1px solid #cbd5e1; border-radius: 10px; 
  padding: 10px 20px; font-weight: 600; 
  font-size: 14px; cursor: pointer; transition: background 0.2s;
}
.btn-secondary:hover { background: #f1f5f9; color: #1e293b; }

.btn-danger { 
  background: #dc2626; color: white; 
  border: none; border-radius: 10px; 
  padding: 10px 20px; font-weight: 600; 
  font-size: 14px; cursor: pointer; transition: background 0.2s;
}
.btn-danger:hover { background: #b91c1c; }

.btn-whatsapp {
  background: #25d366; color: white;
  border: none; border-radius: 10px;
  padding: 10px 20px; font-weight: 600;
  font-size: 14px; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: background 0.2s;
}
.btn-whatsapp:hover { background: #1ebd58; }

.target-delete-info { 
  background: #fff5f5; border: 1px solid #fee2e2; 
  padding: 12px; border-radius: 8px; margin-top: 12px; 
  font-size: 13.5px; color: #991b1b; line-height: 1.6;
}

/* Modal Detalles Estilos Específicos */
.info-detalles-grid { 
  display: grid; grid-template-columns: 1fr 1fr; 
  gap: 12px; background: #f8fafc; 
  padding: 16px; border-radius: 12px;
  border: 1px solid #e2e8f0; font-size: 14px; color: #334155;
}
.info-detalles-grid div strong { color: #0f172a; }

.falla-block-detalles { margin-top: 16px; }
.falla-block-detalles strong { font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
.falla-block-detalles p { 
  background: #fffbeb; border-left: 4px solid #f59e0b; 
  padding: 12px; border-radius: 0 8px 8px 0; 
  margin: 6px 0 0 0; font-size: 14px; color: #78350f; line-height: 1.5;
}

.proximo-mantenimiento { margin-top: 14px; font-size: 13.5px; color: #475569; }
.proximo-mantenimiento span { color: #7c3aed; font-weight: 700; }

.sub-title-detalles { 
  font-size: 13px; font-weight: 800; color: #334155; 
  margin: 24px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; 
}
.tabla-detalles { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tabla-detalles th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; color: #475569; }
.tabla-detalles td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; }
.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.text-muted { font-size: 13.5px; color: #94a3b8; italic: true; padding: 4px 0; }

/* Loaders Animados */
.loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px 0; font-weight: 600; color: #475569; }
.loading-state-mini { display: flex; align-items: center; gap: 8px; padding: 20px 0; font-weight: 600; color: #64748b; font-size: 13.5px; }
.spin { animation: spin 1s linear infinite; font-size: 20px; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Empty States */
.empty-state { 
  display: flex; flex-direction: column; align-items: center; 
  justify-content: center; padding: 60px 20px; text-align: center; 
  background: white; border: 1px dashed #cbd5e1; border-radius: 16px;
}
.empty-state p { margin: 0; font-size: 15px; font-weight: 600; color: #64748b; }
.empty-icon { font-size: 54px; margin-bottom: 16px; opacity: 0.4; color: #003034; }

.print-only { display: none; }

/* Adaptabilidad Móvil */
@media (max-width: 640px) {
  .ordenes-container { 
    padding: 24px; 
    max-width: 1300px; 
    margin: 0 auto; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .header-actions { flex-direction: column; align-items: stretch; gap: 14px; }
  .btn-primary { justify-content: center; }
  .form-grid-2 { grid-template-columns: 1fr; gap: 0; }
  .info-detalles-grid { grid-template-columns: 1fr; }
  
  .orden-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    width: 91% ;
  }

  .dinamic-row { flex-wrap: wrap; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .dinamic-row .flex-3 { width: 100%; flex: none; }
  .orden-footer { flex-direction: column; gap: 12px; align-items: flex-start; }
  .orden-actions { width: 100%; justify-content: space-between; }
  .btn-icon { flex: 1; }
}

/* IMPRESIÓN NATIVA */
@media print {
  body * { visibility: hidden; background: transparent !important; box-shadow: none !important; }
  .no-print { display: none !important; }
  [id^="print-orden-"] { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; border: none !important; padding: 0 !important; }
  [id^="print-orden-"] * { visibility: visible; }
  .print-only { display: block !important; }
  .print-details h4 { margin: 16px 0 6px 0; font-size: 14px; color: #000; border-bottom: 1px solid #000; padding-bottom: 2px; }
  .print-details ul { margin: 0; padding-left: 20px; font-size: 13px; }
  .orden-badge-estado { border: 1px solid #000 !important; color: #000 !important; padding: 2px 8px; font-size: 12px; }
  .falla-block { background: transparent !important; border: 1px dashed #ccc; padding: 8px; }
  .orden-total { font-size: 24px; font-weight: 900; margin-top: 15px; text-align: right; width: 100%; }
}
</style>