<template>
  <div class="activity-grid">

    <!-- Últimas órdenes -->
    <div class="card">
      <h3>Últimas Órdenes</h3>

      <div
        v-for="orden in ultimasOrdenes"
        :key="orden.id"
        class="item"
      >
        <div>
          <strong>
            {{ orden.motos?.marca }}
            {{ orden.motos?.modelo }}
          </strong>

          <small>
            {{ orden.motos?.clientes?.nombre }}
          </small>
        </div>

        <span class="amount">
          ${{ Number(orden.total_general).toFixed(2) }}
        </span>
      </div>
    </div>

    <!-- Próximos mantenimientos -->
    <div class="card">
      <h3>Próximos Mantenimientos</h3>

      <div
        v-for="moto in mantenimientos"
        :key="moto.id"
        class="item"
      >
        <div>
          <strong>
            {{ moto.motos?.marca }}
            {{ moto.motos?.modelo }}
          </strong>

          <small>
            {{ moto.motos?.clientes?.nombre }}
          </small>
        </div>

        <span class="badge">
          {{ diasRestantes(moto.fecha_ingreso) }} días
        </span>
      </div>
    </div>

    <!-- Clientes frecuentes -->
    <div class="card">
      <h3>Clientes Frecuentes</h3>

      <div
        v-for="cliente in clientesFrecuentes"
        :key="cliente.nombre"
        class="item"
      >
        <span>{{ cliente.nombre }}</span>

        <strong>
          {{ cliente.total }} visitas
        </strong>
      </div>
    </div>

    <!-- Motos más atendidas -->
    <div class="card">
      <h3>Motos Más Atendidas</h3>

      <div
        v-for="moto in motosFrecuentes"
        :key="moto.nombre"
        class="item"
      >
        <span>{{ moto.nombre }}</span>

        <strong>
          {{ moto.total }}
        </strong>
      </div>
    </div>

    <!-- Resumen financiero -->
    <div class="card full-width">
      <h3>Resumen Financiero</h3>

      <div class="finance-grid">

        <div class="finance-card">
          <span>Hoy</span>
          <strong>${{ hoy }}</strong>
        </div>

        <div class="finance-card">
          <span>Semana</span>
          <strong>${{ semana }}</strong>
        </div>

        <div class="finance-card">
          <span>Mes</span>
          <strong>${{ mes }}</strong>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const ultimasOrdenes = ref([])
const mantenimientos = ref([])
const clientesFrecuentes = ref([])
const motosFrecuentes = ref([])

const hoy = ref('0.00')
const semana = ref('0.00')
const mes = ref('0.00')

const cargarDatos = async () => {

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return

  const { data } = await supabase
    .from('ordenes_trabajo')
    .select(`
      *,
      motos(
        marca,
        modelo,
        clientes(
          nombre
        )
      )
    `)
    .eq('user_id', user.id)

  if (!data) return

  ultimasOrdenes.value =
    [...data]
      .sort((a,b)=>
        new Date(b.created_at) -
        new Date(a.created_at)
      )
      .slice(0,5)

  mantenimientos.value =
    data
      .filter(
        o =>
          o.tipo_servicio ===
          'Mantenimiento'
      )
      .filter(
        o =>
          diasRestantes(
            o.fecha_ingreso
          ) <= 15
      )
      .slice(0,5)

  calcularClientes(data)
  calcularMotos(data)
  calcularFinanzas(data)
}

const calcularClientes = (ordenes) => {

  const mapa = {}

  ordenes.forEach(o => {

    const nombre =
      o.motos?.clientes?.nombre

    if (!nombre) return

    mapa[nombre] =
      (mapa[nombre] || 0) + 1
  })

  clientesFrecuentes.value =
    Object.entries(mapa)
      .map(([nombre,total])=>({
        nombre,
        total
      }))
      .sort((a,b)=>b.total-a.total)
      .slice(0,5)
}

const calcularMotos = (ordenes) => {

  const mapa = {}

  ordenes.forEach(o => {

    const nombre =
      `${o.motos?.marca} ${o.motos?.modelo}`

    mapa[nombre] =
      (mapa[nombre] || 0) + 1
  })

  motosFrecuentes.value =
    Object.entries(mapa)
      .map(([nombre,total])=>({
        nombre,
        total
      }))
      .sort((a,b)=>b.total-a.total)
      .slice(0,5)
}

const calcularFinanzas = (ordenes) => {

  const ahora = new Date()

  let totalHoy = 0
  let totalSemana = 0
  let totalMes = 0

  ordenes.forEach(o => {

    const fecha =
      new Date(o.fecha_ingreso)

    const total =
      Number(o.total_general || 0)

    if (
      fecha.toDateString() ===
      ahora.toDateString()
    ) {
      totalHoy += total
    }

    const diferencia =
      (ahora - fecha) /
      (1000 * 60 * 60 * 24)

    if (diferencia <= 7)
      totalSemana += total

    if (
      fecha.getMonth() ===
      ahora.getMonth()
    ) {
      totalMes += total
    }
  })

  hoy.value =
    totalHoy.toFixed(2)

  semana.value =
    totalSemana.toFixed(2)

  mes.value =
    totalMes.toFixed(2)
}

const diasRestantes = fecha => {

  const proxima =
    new Date(fecha)

  proxima.setDate(
    proxima.getDate() + 75
  )

  return Math.ceil(
    (proxima - new Date()) /
    (1000*60*60*24)
  )
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.activity-grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(350px,1fr));
  gap:20px;
}

.card{
  background:white;
  border-radius:20px;
  padding:20px;
  border:1px solid #e2e8f0;
  box-shadow:
  0 4px 12px rgba(0,0,0,.05);
}

.card h3{
  color:#003034;
  margin-bottom:20px;
}

.item{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 0;
  border-bottom:1px solid #f1f5f9;
}

.item:last-child{
  border-bottom:none;
}

.item strong{
  display:block;
}

.item small{
  color:#64748b;
}

.amount{
  font-weight:700;
  color:#003034;
}

.badge{
  background:#fef3c7;
  color:#d97706;
  padding:6px 10px;
  border-radius:30px;
  font-size:12px;
  font-weight:700;
}

.full-width{
  grid-column:1/-1;
}

.finance-grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(180px,1fr));
  gap:16px;
}

.finance-card{
  background:#003034;
  color:white;
  padding:20px;
  border-radius:16px;
  text-align:center;
}

.finance-card span{
  display:block;
  opacity:.8;
  margin-bottom:8px;
}

.finance-card strong{
  font-size:28px;
}

@media(max-width:768px){

  .activity-grid{
    grid-template-columns:1fr;
  }

}
</style>