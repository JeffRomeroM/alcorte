<template>
  <div class="recordatorios-container">

    <div class="header">
      <div>
        <h1>Recordatorios de Mantenimiento</h1>
        <p>Control de mantenimientos preventivos.</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <span>{{ recordatoriosFiltrados.length }}</span>
          <small>Recordatorios</small>
        </div>
      </div>
    </div>

    <div class="search-box">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar cliente, moto o placa..."
      />
    </div>

    <div v-if="loading" class="loading">
      Cargando...
    </div>

    <div
      v-else-if="recordatoriosFiltrados.length === 0"
      class="empty"
    >
      No se encontraron registros.
    </div>

    <div v-else class="cards">

      <div
        v-for="orden in recordatoriosFiltrados"
        :key="orden.id"
        class="card"
      >
        <div class="card-top">

          <div>
            <h3>
              {{ orden.motos?.marca }}
              {{ orden.motos?.modelo }}
            </h3>

            <span class="placa">
              {{ orden.motos?.placa || 'SIN PLACA' }}
            </span>
          </div>

          <div
            class="estado"
            :class="estadoClase(orden)"
          >
            {{ obtenerEstado(orden) }}
          </div>

        </div>

        <div class="info">

          <div >
            <p>
              <strong class="cliente">
                <Icon icon="mdi:account" /> 
                {{ orden.motos?.clientes?.nombre }} 

              </strong>

            </p>
            <p>
              <strong class="cliente">

                <Icon icon="mdi:phone" />
                {{ orden.motos?.clientes?.telefono }}
              </strong>

            </p>
            
            
          </div>


          <p>
            <strong>Último mantenimiento:</strong>
            {{ formatFecha(orden.fecha_ingreso) }}
          </p>

          <p>
            <strong>Próximo mantenimiento:</strong>
            {{ formatFecha(orden.proximo_mantenimiento) }}
          </p>

          <p>
            <strong>Días restantes:</strong>
            <span
              :style="{
                color: diasRestantes(orden.proximo_mantenimiento) < 0 ? '#dc2626' : '#16a34a'
              }"
            >
              {{ diasRestantes(orden.proximo_mantenimiento) }}
            </span>
          </p>

        </div>

        <button
          class="btn-whatsapp"
          @click="enviarWhatsApp(orden)"
        >
          Enviar Recordatorio
        </button>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { Icon } from '@iconify/vue'


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const loading = ref(true)
const recordatorios = ref([])
const busqueda = ref('')

const cargarRecordatorios = async () => {
  try {
    loading.value = true

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Añadido 'proximo_mantenimiento' a la query select
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        proximo_mantenimiento,
        motos(
          marca,
          modelo,
          placa,
          clientes(
            nombre,
            telefono
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('tipo_servicio', 'Mantenimiento')

    if (error) throw error

    // Ordenar directamente por la fecha de próximo mantenimiento real
    recordatorios.value = (data || []).sort((a, b) => {
      const fechaA = a.proximo_mantenimiento ? new Date(a.proximo_mantenimiento) : new Date(0)
      const fechaB = b.proximo_mantenimiento ? new Date(b.proximo_mantenimiento) : new Date(0)
      return fechaA - fechaB
    })

  } catch (error) {
    console.error('Error cargando recordatorios:', error)
  } finally {
    loading.value = false
  }
}

const diasRestantes = (fechaProxima) => {
  if (!fechaProxima) return 0
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0) // Normalizar horas para evitar desfases numéricos
  
  const proxima = new Date(fechaProxima)
  proxima.setHours(0, 0, 0, 0)

  const diferenciaTiempo = proxima - hoy
  return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))
}

const obtenerEstado = (orden) => {
  const dias = diasRestantes(orden.proximo_mantenimiento)
  if (dias < 0) return 'Vencido'
  if (dias <= 10) return 'Próximo'
  return 'Pendiente'
}

const estadoClase = (orden) => {
  const estado = obtenerEstado(orden)
  if (estado === 'Vencido') return 'vencido'
  if (estado === 'Próximo') return 'proximo'
  return 'pendiente'
}

const recordatoriosFiltrados = computed(() => {
  return recordatorios.value.filter(orden => {
    const texto = `
      ${orden.motos?.marca || ''} 
      ${orden.motos?.modelo || ''} 
      ${orden.motos?.placa || ''} 
      ${orden.motos?.clientes?.nombre || ''}
    `.toLowerCase()
    return texto.includes(busqueda.value.toLowerCase())
  })
})

const formatFecha = (fecha) => {
  if (!fecha) return 'Sin fecha'
  // Reemplazar guiones por barras evita que JavaScript reste un día por la zona horaria UTC
  const fechaLocal = new Date(fecha.replace(/-/g, '\/'))
  return fechaLocal.toLocaleDateString('es-NI')
}

const enviarWhatsApp = async (orden) => {
  if (!orden) return

  try {
    const cliente = orden.motos?.clientes?.nombre || 'Cliente'
    const moto = `${orden.motos?.marca || ''} ${orden.motos?.modelo || ''}`
    const fecha = formatFecha(orden.proximo_mantenimiento)
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


    const nombreTaller = profile?.nombre_negocio || profile?.nombre || 'ALCORTE'
    
    const telefono = orden.motos?.clientes?.telefono 
      ? orden.motos.clientes.telefono.replace(/\s+/g, '') 
      : ''

    const mensaje = `*Taller ${nombreTaller}*🛠\n\n🔧 *RECORDATORIO DE MANTENIMIENTO*\n\nHola ${cliente}.\n\nTe recordamos que tu motocicleta *${moto}* está próxima a su mantenimiento preventivo.\n\n📅 *Fecha recomendada:*\n${fecha}\n\n¿Deseas reservar una cita?\n\nGracias por confiar en nosotros.`

    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
      '_blank'
    )
  } catch (error) {
    console.error("Error al enviar recordatorio por WhatsApp:", error)
  }
}


onMounted(() => {
  cargarRecordatorios()
})
</script>

<style scoped>
.recordatorios-container{
  padding:24px;
}
 .header h1{
  font-size: 24px; 
  font-weight: 800; 
  color: #003034;
}
.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
}
.search-box{
  margin-bottom:20px;
}
.search-box input{
  width:100%;
  padding:14px;
  border:1px solid #ddd;
  border-radius:10px;
  box-sizing: border-box;
}
.stats{
  display:flex;
  gap:12px;
}
.stat-card{
  background:#003034;
  color:white;
  padding:15px 25px;
  border-radius:12px;
}
.stat-card span{
  display:block;
  font-size:24px;
  font-weight:700;
}
.cards{
  display:grid;
  grid-template-columns: repeat(auto-fill,minmax(330px,1fr));
  gap:20px;
}
.card{
  background:white;
  border:1px solid #e5e7eb;
  border-radius:16px;
  padding:20px;
  box-sizing: border-box;
}
.card-top{
  display:flex;
  justify-content:space-between;
  margin-bottom:15px;
}
.placa{
  background:#f1f5f9;
  padding:4px 8px;
  border-radius:6px;
  font-size:12px;
}
.estado{
  padding:6px 12px;
  border-radius:20px;
  font-size:12px;
  font-weight:700;
  align-self: flex-start;
}
.vencido{
  background:#fee2e2;
  color:#dc2626;
}
.proximo{
  background:#fef3c7;
  color:#d97706;
}
.pendiente{
  background:#dcfce7;
  color:#16a34a;
}
.info{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-bottom:20px;
}


.btn-whatsapp{
  width:100%;
  border:none;
  background:#003034;
  color:white;
  padding:14px;
  border-radius:10px;
  cursor:pointer;
  font-weight:700;
  transition: background 0.2s;
}
.btn-whatsapp:hover {
  background: #9e9e9e;
}
.loading,
.empty{
  text-align:center;
  padding:60px;
  color:#64748b;
}

@media (max-width: 480px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>