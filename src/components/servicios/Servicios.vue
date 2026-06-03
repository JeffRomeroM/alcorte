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
          <div class="orden-badge-estado" :class="orden.estado.toLowerCase().replace(/ /g, '-')">
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
        </div>

        <div class="print-details print-only" v-if="orden.detallesImpresion">
          <hr />
          <h4>Detalle de Servicios / Mano de Obra</h4>
          <ul>
            <li v-for="(s, i) in orden.detallesImpresion.servicios" :key="i">
              {{ s.descripcion }} — ${{ parseFloat(s.precio).toFixed(2) }}
            </li>
          </ul>
          <h4 v-if="orden.detallesImpresion.repuestos.length">Repuestos Aplicados</h4>
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
            <button @click="prepararImpresion(orden)" class="btn-icon print-btn" title="Imprimir / PDF">
              <Icon icon="mdi:printer" />
            </button>
            <button @click="compartirWhatsApp(orden)" class="btn-icon whatsapp-btn" title="Enviar por WhatsApp">
              <Icon icon="mdi:whatsapp" />
            </button>
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
          <h2>Detalles de Orden #{{ ordenSeleccionada?.id.toString().slice(-4).toUpperCase() }}</h2>
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

          <div v-if="loadingDetalles" class="loading-state-mini">
            <Icon icon="mdi:loading" class="spin" /> Cargando desglose...
          </div>

          <div v-else>
            <h3 class="sub-title-detalles">Mano de Obra & Servicios</h3>
            <div v-if="detallesCargados.servicios.length === 0" class="text-muted">No hay tareas registradas.</div>
            <table v-else class="tabla-detalles">
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
            <table v-else class="tabla-detalles">
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
                <option value="Reparación General">Reparación General 🛠️</option>
                <option value="Mantenimiento">Mantenimiento Periódico 📅</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group" v-if="!isEditing">
              <label>Seleccionar Motocicleta *</label>
              <select v-model="form.moto_id" required>
                <option value="" disabled>Seleccione una unidad...</option>
                <option v-for="moto in motosList" :key="moto.id" :value="moto.id">
                  {{ moto.placa || 'S/P' }} - {{ moto.marca }} {{ moto.modelo }} ({{ moto.clientes?.nombre }})
                </option>
              </select>
            </div>
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

          <div class="totales-resumen">
            <div class="total-line">Mano de Obra: <span>${{ totals.manoObra }}</span></div>
            <div class="total-line">Repuestos / Fluidos: <span>${{ totals.repuestos }}</span></div>
            <div class="total-line grand-total">Total Facturado: <span>${{ totals.general }}</span></div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Icon v-if="saving" icon="mdi:loading" class="spin" />
              {{ saving ? 'Guardando cambios...' : 'Guardar Orden de Trabajo' }}
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
          <p>Esta acción no se puede deshacer. Se removerán los registros de mano de obra y repuestos vinculados a esta orden.</p>
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

// Nuevos estados para la consulta interactiva
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
  falla_reportada: '',
  servicios: [],
  repuestos: []
})

const totals = computed(() => {
  const manoObra = form.value.servicios.reduce((acc, s) => acc + (parseFloat(s.precio) || 0), 0)
  const repuestos = form.value.repuestos.reduce((acc, r) => acc + ((parseFloat(r.precio_unitario) || 0) * (parseInt(r.cantidad) || 1)), 0)
  return {
    manoObra: manoObra.toFixed(2),
    repuestos: repuestos.toFixed(2),
    general: (manoObra + repuestos).toFixed(2)
  }
})

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
    .select('id, marca, modelo, placa, clientes(nombre)')
    .eq('user_id', user.id)
  motosList.value = data || []
}

const ordenesFiltradas = computed(() => {
  if (estadoFiltro.value === 'Todas') return ordenes.value
  if (estadoFiltro.value === 'Mantenimientos') return ordenes.value.filter(o => o.tipo_servicio === 'Mantenimiento')
  if (estadoFiltro.value === 'Reparaciones') return ordenes.value.filter(o => o.tipo_servicio === 'Reparación General')
  return ordenes.value.filter(o => o.estado === estadoFiltro.value)
})

const agregarServicioFila = () => form.value.servicios.push({ descripcion: '', precio: '' })
const removerServicioFila = (index) => form.value.servicios.splice(index, 1)
const agregarRepuestoFila = () => form.value.repuestos.push({ repuesto_nombre: '', cantidad: 1, precio_unitario: '' })
const removerRepuestoFila = (index) => form.value.repuestos.splice(index, 1)

// Abrir modal de detalles al hacer click en la Card
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
  const hoy = new Date().toISOString().split('T')[0]
  form.value = { 
    moto_id: '', 
    moto_display_txt: '',
    estado: 'Recibida', 
    tipo_servicio: 'Reparación General',
    fecha_ingreso: hoy,
    falla_reportada: '', 
    servicios: [], 
    repuestos: [] 
  }
  showModal.value = true
}

const abrirModalEditar = async (orden) => {
  isEditing.value = true
  ordenIdActiva.value = orden.id
  
  const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
  const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)

  const placaTxt = orden.motos?.placa ? `[${orden.motos.placa}]` : '[S/P]'
  form.value = {
    moto_id: orden.moto_id,
    moto_display_txt: `${placaTxt} ${orden.motos?.marca || ''} ${orden.motos?.modelo || ''}`,
    estado: orden.estado,
    tipo_servicio: orden.tipo_servicio || 'Reparación General',
    fecha_ingreso: orden.fecha_ingreso || new Date().toISOString().split('T')[0],
    falla_reportada: orden.falla_reportada,
    servicios: servs || [],
    repuestos: reps || []
  }
  showModal.value = true
}

const guardarOrden = async () => {
  try {
    saving.value = true
    const { data: { user } } = await supabase.auth.getUser()

    const maestroPayload = {
      user_id: user.id,
      moto_id: form.value.moto_id,
      estado: form.value.estado,
      tipo_servicio: form.value.tipo_servicio,
      fecha_ingreso: form.value.fecha_ingreso,
      falla_reportada: form.value.falla_reportada,
      total_mano_obra: parseFloat(totals.value.manoObra),
      total_repuestos: parseFloat(totals.value.repuestos),
      total_general: parseFloat(totals.value.general)
    }

    let ordenId = ordenIdActiva.value

    if (isEditing.value) {
      await supabase.from('ordenes_trabajo').update(maestroPayload).eq('id', ordenId)
      await supabase.from('orden_servicios').delete().eq('orden_id', ordenId)
      await supabase.from('orden_repuestos').delete().eq('orden_id', ordenId)
    } else {
      const { data, error } = await supabase.from('ordenes_trabajo').insert([maestroPayload]).select().single()
      if (error) throw error
      ordenId = data.id
    }

    if (form.value.servicios.length > 0) {
      const sPayload = form.value.servicios.map(s => ({ orden_id: ordenId, descripcion: s.descripcion, precio: parseFloat(s.precio) || 0 }))
      await supabase.from('orden_servicios').insert(sPayload)
    }
    if (form.value.repuestos.length > 0) {
      const rPayload = form.value.repuestos.map(r => ({ orden_id: ordenId, repuesto_nombre: r.repuesto_nombre, cantidad: parseInt(r.cantidad) || 1, precio_unitario: parseFloat(r.precio_unitario) || 0 }))
      await supabase.from('orden_repuestos').insert(rPayload)
    }

    await fetchOrdenes()
    cerrarModal()
  } catch (error) {
    console.error('Error al guardar orden:', error)
    alert('Ocurrió un fallo de red o base de datos al guardar.')
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
    deleting.value = true
    await supabase.from('orden_servicios').delete().eq('orden_id', ordenAEliminar.value.id)
    await supabase.from('orden_repuestos').delete().eq('orden_id', ordenAEliminar.value.id)
    
    const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', ordenAEliminar.value.id)
    if (error) throw error
    
    ordenes.value = ordenes.value.filter(o => o.id !== ordenAEliminar.value.id)
    showDeleteModal.value = false
  } catch (error) {
    console.error(error)
    alert('Error al intentar eliminar la orden.')
  } finally {
    deleting.value = false
    ordenAEliminar.value = null
  }
}

const compartirWhatsApp = async (orden) => {
  const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
  const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
  
  const telefono = orden.motos?.clientes?.telefono || ''
  
  let msg = `*ÓRDEN DE TRABAJO #${orden.id.toString().slice(-4).toUpperCase()}*\n`
  msg += `📍 *Estado:* ${orden.estado}\n`
  msg += `🏍️ *Unidad:* ${orden.motos?.marca || ''} ${orden.motos?.modelo || ''} (${orden.motos?.placa || 'S/P'})\n`
  msg += `📝 *Detalle:* ${orden.falla_reportada}\n\n`
  
  if(servs && servs.length > 0) {
    msg += `*Servicios:* \n`
    servs.forEach(s => msg += `• ${s.descripcion} -> $${parseFloat(s.precio).toFixed(2)}\n`)
  }
  if(reps && reps.length > 0) {
    msg += `\n*Repuestos:* \n`
    reps.forEach(r => msg += `• ${r.cantidad}x ${r.repuesto_nombre} -> $${(r.cantidad * r.precio_unitario).toFixed(2)}\n`)
  }
  
  msg += `\n💵 *Total General:* $${parseFloat(orden.total_general).toFixed(2)}\n`
  msg += `¡Gracias por su confianza!`

  const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}

// Utiliza los datos del modal si se imprime desde ahí
const convertirDetalleAImpresion = async (orden) => {
  showDetallesModal.value = false
  orden.detallesImpresion = { ...detallesCargados.value }
  await nextTick()
  window.print()
}

const prepararImpresion = async (orden) => {
  const { data: servs } = await supabase.from('orden_servicios').select('*').eq('orden_id', orden.id)
  const { data: reps } = await supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
  
  orden.detallesImpresion = { servicios: servs || [], repuestos: reps || [] }
  
  await nextTick()
  window.print()
}

const cerrarModal = () => showModal.value = false

const formatFecha = (fechaStr) => {
  if (!fechaStr) return ''
  const [year, month, day] = fechaStr.split('-')
  return `${day}/${month}/${year}`
}

onMounted(() => {
  fetchOrdenes()
  fetchMotosList()
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

/* Estados */
.orden-badge-estado { 
  padding: 5px 12px; 
  border-radius: 30px; 
  font-size: 11px; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.3px;
}
.orden-badge-estado.recibida { background: #fee2e2; color: #ef4444; }
.orden-badge-estado.en-proceso { background: #fef3c7; color: #d97706; }
.orden-badge-estado.lista-para-entregar { background: #dcfce7; color: #16a34a; }

/* Contenido Interno de la Tarjeta */
.moto-header { 
  display: flex; 
  align-items: flex-start; 
  justify-content: space-between; 
  gap: 8px; 
  margin-bottom: 8px;
}
.moto-header h3 { margin: 0; color: #0f172a; font-size: 17px; font-weight: 700; }
.moto-placa { 
  font-weight: 700; 
  color: #475569; 
  background: #f1f5f9; 
  padding: 4px 8px; 
  border-radius: 6px; 
  font-size: 11px; 
  border: 1px solid #e2e8f0;
}

.tipo-servicio-tag { 
  display: inline-flex; 
  align-items: center; 
  gap: 5px; 
  font-size: 12px; 
  font-weight: 600; 
  padding: 4px 10px; 
  border-radius: 6px; 
  margin-bottom: 12px;
}
.tipo-servicio-tag.mantenimiento { background: #e0f2fe; color: #0369a1; }
.tipo-servicio-tag.reparación-general { background: #f3e8ff; color: #6b21a8; }

.falla-block { 
  font-size: 14px; 
  color: #334155; 
  line-height: 1.5; 
  margin-bottom: 12px; 
  background: #f8fafc; 
  padding: 10px; 
  border-radius: 8px;
}
.cliente-mini-info { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  font-size: 13px; 
  color: #64748b; 
  font-weight: 500;
}

/* Footer de Tarjeta */
.orden-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-top: 18px; 
  padding-top: 14px; 
  border-top: 1px solid #f1f5f9; 
}
.orden-total { font-size: 20px; font-weight: 800; color: #003034; }
.total-label { font-size: 13px; color: #64748b; font-weight: 500; margin-right: 2px; }

/* MODALES */
.modal-overlay { 
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(15, 23, 42, 0.6); 
  backdrop-filter: blur(4px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 9999; 
  padding: 16px; 
}
.modal-content { 
  background: white; 
  width: 100%; 
  border-radius: 16px; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
  max-height: 94vh; 
  display: flex; 
  flex-direction: column; 
  animation: modalScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalScale { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-large { max-width: 700px; }
.modal-small { max-width: 450px; }

.modal-header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 20px 24px; 
  border-bottom: 1px solid #e2e8f0; 
}
.modal-header h2 { font-size: 20px; margin: 0; color: #003034; font-weight: 800; }
.header-danger h2 { color: #b91c1c; }
.btn-close-modal { background: none; border: none; font-size: 22px; color: #64748b; cursor: pointer; display: flex; }
.btn-close-modal:hover { color: #ef4444; }

.modal-form-body { 
  padding: 24px; 
  overflow-y: auto; 
  flex: 1; 
}
.modal-body-padding { padding: 20px 24px; color: #334155; font-size: 14px; line-height: 1.5; }
.target-delete-info { margin-top: 12px; padding: 12px; background: #f8fafc; border-left: 4px solid #ef4444; border-radius: 4px; color: #1e293b; }

/* Estilos de Consulta de detalles */
.info-detalles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #334155;
  margin-bottom: 18px;
}
.falla-block-detalles {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 20px;
}
.falla-block-detalles strong { color: #b45309; font-size: 13px; display: block; margin-bottom: 4px; }
.falla-block-detalles p { margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; }
.sub-title-detalles { font-size: 15px; color: #003034; font-weight: 700; margin: 18px 0 10px 0; border-left: 3px solid #003034; padding-left: 8px; }
.tabla-detalles { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px; }
.tabla-detalles th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 600; color: #475569; }
.tabla-detalles td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.text-muted { color: #94a3b8; font-size: 13px; padding-left: 12px; }
.loading-state-mini { text-align: center; padding: 30px; color: #64748b; font-size: 14px; }

.btn-whatsapp{
    background: #25D366;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
}
/* Grillas Internas del Formulario */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* DISEÑO DE INPUTS */
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; }
.form-group label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }

.form-group input, 
.form-group textarea, 
.form-group select,
.dinamic-row input { 
  width: 100%; 
  padding: 11px 14px; 
  border: 1px solid #cbd5e1; 
  border-radius: 8px; 
  font-size: 14px; 
  box-sizing: border-box; 
  color: #0f172a; 
  background-color: #ffffff;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus, 
.form-group textarea:focus, 
.form-group select:focus,
.dinamic-row input:focus { 
  outline: none; 
  border-color: #003034; 
  box-shadow: 0 0 0 3px rgba(0, 48, 52, 0.12), inset 0 1px 2px rgba(0,0,0,0.02);
}
.input-disabled { background-color: #f1f5f9 !important; color: #64748b !important; border-color: #e2e8f0 !important; cursor: not-allowed; }

/* Filas Dinámicas */
.divider { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
.section-title-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title-actions h3 { font-size: 15px; color: #003034; font-weight: 700; margin: 0; }
.btn-link { background: none; border: none; color: #003034; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 14px; }
.btn-link:hover { opacity: 0.8; }

.dinamic-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.currency-input { position: relative; display: flex; align-items: center; }
.currency-input span { position: absolute; left: 12px; color: #94a3b8; font-size: 14px; font-weight: 500; }
.currency-input input { padding-left: 24px !important; }

.flex-3 { flex: 3; }
.flex-1 { flex: 1; }
.flex-0-5 { flex: 0.5; }

.btn-row-delete { background: #fee2e2; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 10px; border-radius: 8px; display: flex; transition: background 0.2s; }
.btn-row-delete:hover { background: #fca5a5; color: #b91c1c; }

/* Resumen Económico */
.totales-resumen { 
  background: #f8fafc; 
  border: 1px solid #e2e8f0;
  border-radius: 12px; 
  padding: 16px 20px; 
  margin-top: 24px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  align-items: flex-end; 
}
.total-line { font-size: 14px; color: #475569; font-weight: 500; }
.total-line span { font-weight: 700; color: #0f172a; margin-left: 6px; }
.grand-total { 
  font-size: 16px; 
  color: #003034; 
  font-weight: 700; 
  border-top: 1px dashed #cbd5e1; 
  padding-top: 10px; 
  margin-top: 4px; 
  width: 100%;
  text-align: right;
}
.grand-total span { color: #003034; font-size: 22px; font-weight: 900; }

/* Botonera */
.btn-primary { 
  background: #003034; 
  color: white; 
  border: none; 
  padding: 11px 22px; 
  border-radius: 8px; 
  font-weight: 600; 
  font-size: 14px;
  cursor: pointer; 
  display: inline-flex; 
  align-items: center; 
  gap: 8px; 
  transition: background 0.2s;
}
.btn-primary:hover { background: #07141a; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary { 
  background: #f1f5f9; 
  color: #475569; 
  border: 1px solid #e2e8f0; 
  padding: 11px 22px; 
  border-radius: 8px; 
  font-weight: 600; 
  font-size: 14px;
  cursor: pointer; 
  transition: background 0.2s;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-danger { background: #ef4444; color: white; border: none; padding: 11px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.btn-danger:hover { background: #dc2626; }

.orden-actions { display: flex; gap: 6px; }
.btn-icon { 
  width: 34px; 
  height: 34px; 
  border-radius: 8px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border: 1px solid #e2e8f0; 
  cursor: pointer; 
  font-size: 16px; 
  background: #f1f5f9;
  color: #475569;
  transition: all 0.2s; 
}
.edit-btn:hover { background: #003034; color: white; border-color: #003034; }
.print-btn:hover { background: #0284c7; color: white; border-color: #0284c7; }
.whatsapp-btn:hover { background: #22c55e; color: white; border-color: #22c55e; }
.delete-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
.padding-actions { padding: 0 24px 24px 24px; }

/* Estados */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.empty-state, .loading-state { text-align: center; padding: 60px 20px; color: #64748b; }
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
    width: 82% ;
  }

  .dinamic-row { flex-wrap: wrap; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .dinamic-row .flex-3 { width: 100%; flex: none; }
  .orden-footer { flex-direction: column; gap: 12px; align-items: flex-start; }
  .orden-actions { width: 100%; justify-content: space-between; }
  .btn-icon { flex: 1; }
}

/* IMPRESIÓN */
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