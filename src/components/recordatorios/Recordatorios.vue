<template>
  <div class="recordatorios-container">

    <div class="header">
      <div>
        <h1>Recordatorios de Mantenimiento</h1>
        <p>Control de mantenimientos preventivos.</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <span>{{ recordatorios.length }}</span>
          <small>Total</small>
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

          <p>
            <strong>Cliente:</strong>
            {{ orden.motos?.clientes?.nombre }}
          </p>

          <p>
            <strong>Teléfono:</strong>
            {{ orden.motos?.clientes?.telefono }}
          </p>

          <p>
            <strong>Último mantenimiento:</strong>
            {{ formatFecha(orden.fecha_ingreso) }}
          </p>

          <p>
            <strong>Próximo mantenimiento:</strong>
            {{ formatFecha(
              calcularProximaFecha(
                orden.fecha_ingreso
              )
            ) }}
          </p>

          <p>
            <strong>Días restantes:</strong>

            <span
              :style="{
                color:
                  diasRestantes(
                    orden.fecha_ingreso
                  ) < 0
                    ? '#dc2626'
                    : '#16a34a'
              }"
            >
              {{ diasRestantes(
                orden.fecha_ingreso
              ) }}
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
import {
  ref,
  computed,
  onMounted
} from 'vue'

import {
  createClient
} from '@supabase/supabase-js'

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

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } =
      await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
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

    recordatorios.value = (data || [])
      .sort((a, b) => {

        const fechaA =
          calcularProximaFecha(
            a.fecha_ingreso
          )

        const fechaB =
          calcularProximaFecha(
            b.fecha_ingreso
          )

        return fechaA - fechaB

      })

  } catch (error) {

    console.error(error)

  } finally {

    loading.value = false

  }

}

const calcularProximaFecha = (fecha) => {

  const d = new Date(fecha)

  d.setDate(
    d.getDate() + 75
  )

  return d

}

const diasRestantes = (fecha) => {

  const hoy = new Date()

  const proxima =
    calcularProximaFecha(fecha)

  return Math.ceil(
    (proxima - hoy) /
    (1000 * 60 * 60 * 24)
  )

}

const obtenerEstado = (orden) => {

  const dias =
    diasRestantes(
      orden.fecha_ingreso
    )

  if (dias < 0)
    return 'Vencido'

  if (dias <= 15)
    return 'Próximo'

  return 'Pendiente'

}

const estadoClase = (orden) => {

  const estado =
    obtenerEstado(orden)

  if (estado === 'Vencido')
    return 'vencido'

  if (estado === 'Próximo')
    return 'proximo'

  return 'pendiente'

}

const recordatoriosFiltrados =
computed(() => {

  return recordatorios.value.filter(
    orden => {

      const texto =
        `${orden.motos?.marca}
         ${orden.motos?.modelo}
         ${orden.motos?.placa}
         ${orden.motos?.clientes?.nombre}`
          .toLowerCase()

      return texto.includes(
        busqueda.value.toLowerCase()
      )

    }
  )

})

const formatFecha = fecha => {

  return new Date(fecha)
    .toLocaleDateString('es-NI')

}

const enviarWhatsApp = orden => {

  const cliente =
    orden.motos?.clientes?.nombre ||
    'Cliente'

  const telefono =
    orden.motos?.clientes?.telefono

  const moto =
    `${orden.motos?.marca}
     ${orden.motos?.modelo}`

  const fecha =
    formatFecha(
      calcularProximaFecha(
        orden.fecha_ingreso
      )
    )

  const mensaje = `
🔧 RECORDATORIO DE MANTENIMIENTO

Hola ${cliente}.

Te recordamos que tu motocicleta ${moto}
está próxima a su mantenimiento preventivo.

📅 Fecha recomendada:
${fecha}

¿Deseas reservar una cita?

Gracias por confiar en nosotros.
`

  window.open(
    `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
    '_blank'
  )

}

onMounted(() => {
  cargarRecordatorios()
})
</script>

<style scoped>
.recordatorios-container{
  padding:24px;
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
  grid-template-columns:
  repeat(auto-fill,minmax(330px,1fr));
  gap:20px;
}

.card{
  background:white;
  border:1px solid #e5e7eb;
  border-radius:16px;
  padding:20px;
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
  background:#25D366;
  color:white;
  padding:14px;
  border-radius:10px;
  cursor:pointer;
  font-weight:700;
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
  .search-box {
    margin-bottom: 12px;
    }
  .search-box input {
    width: 91%;
  
  }
  .card{
    padding: 15px;
    width: 86%;
  }


}
</style>