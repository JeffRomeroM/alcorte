<template>
  <div class="activity-grid">

    <!-- Últimas órdenes -->
    <div class="card">
      <div class="card-header">
        <h3>Últimas Órdenes</h3>
        <span class="counter">{{ ultimasOrdenes.length }}</span>
      </div>

      <div
        v-if="ultimasOrdenes.length"
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

          <small class="date">
            {{ formatDate(orden.fecha_ingreso) }}
          </small>
        </div>

        <span class="amount">
          ${{ Number(orden.total_general || 0).toFixed(2) }}
        </span>
      </div>

      <div
        v-if="!ultimasOrdenes.length"
        class="empty-state"
      >
        No hay órdenes registradas
      </div>
    </div>

    <!-- Próximos mantenimientos -->
    <div class="card">
      <div class="card-header">
        <h3>Próximos Mantenimientos</h3>
        <span class="counter">{{ mantenimientos.length }}</span>
      </div>

      <div
        v-if="mantenimientos.length"
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

        <span
          class="badge"
          :class="{
            danger: diasRestantes(moto.fecha_ingreso) < 0,
            warning: diasRestantes(moto.fecha_ingreso) >= 0
          }"
        >
          {{
            diasRestantes(moto.fecha_ingreso) < 0
              ? 'Vencido'
              : `${diasRestantes(moto.fecha_ingreso)} días`
          }}
        </span>
      </div>

      <div
        v-if="!mantenimientos.length"
        class="empty-state"
      >
        No hay mantenimientos próximos
      </div>
    </div>

    <!-- Clientes frecuentes -->
    <div class="card">
      <div class="card-header">
        <h3>Clientes Frecuentes</h3>
      </div>

      <div
        v-if="clientesFrecuentes.length"
        v-for="(cliente,index) in clientesFrecuentes"
        :key="cliente.nombre"
        class="item"
      >
        <span>
          #{{ index + 1 }}
          {{ cliente.nombre }}
        </span>

        <strong class="rank">
          {{ cliente.total }} visitas
        </strong>
      </div>

      <div
        v-if="!clientesFrecuentes.length"
        class="empty-state"
      >
        Sin datos disponibles
      </div>
    </div>

    <!-- Motos más atendidas -->
    <div class="card">
      <div class="card-header">
        <h3>Motos Más Atendidas</h3>
      </div>

      <div
        v-if="motosFrecuentes.length"
        v-for="(moto,index) in motosFrecuentes"
        :key="moto.nombre"
        class="item"
      >
        <span>
          #{{ index + 1 }}
          {{ moto.nombre }}
        </span>

        <strong class="rank">
          {{ moto.total }}
        </strong>
      </div>

      <div
        v-if="!motosFrecuentes.length"
        class="empty-state"
      >
        Sin datos disponibles
      </div>
    </div>

    <!-- Resumen financiero -->
    <!-- <div class="card full-width">
      <div class="card-header">
        <h3>Resumen Financiero</h3>
      </div>

      <div class="finance-grid">

        <div class="finance-card today">
          <span>Hoy</span>
          <strong>${{ hoy }}</strong>
        </div>

        <div class="finance-card week">
          <span>Últimos 7 días</span>
          <strong>${{ semana }}</strong>
        </div>

        <div class="finance-card month">
          <span>Este mes</span>
          <strong>${{ mes }}</strong>
        </div>

      </div>
    </div> -->

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

  ultimasOrdenes.value = [...data]
    .sort((a,b)=>
      new Date(b.created_at) -
      new Date(a.created_at)
    )
    .slice(0,5)

  mantenimientos.value = data
    .filter(o =>
      o.tipo_servicio === 'Mantenimiento'
    )
    .filter(o =>
      diasRestantes(o.fecha_ingreso) <= 15
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

  hoy.value = totalHoy.toFixed(2)
  semana.value = totalSemana.toFixed(2)
  mes.value = totalMes.toFixed(2)
}

const diasRestantes = fecha => {
  const proxima = new Date(fecha)

  proxima.setDate(
    proxima.getDate() + 75
  )

  return Math.ceil(
    (proxima - new Date()) /
    (1000*60*60*24)
  )
}

const formatDate = fecha => {
  return new Date(fecha)
    .toLocaleDateString('es-NI')
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
  box-shadow:0 8px 24px rgba(0,0,0,.06);
  transition:.3s;
  max-height:420px;
  overflow:auto;
}

.card:hover{
  transform:translateY(-3px);
}

.card-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:20px;
}

.card h3{
  margin:0;
  color:#003034;
}

.counter{
  background:#003034;
  color:white;
  font-size:12px;
  padding:6px 10px;
  border-radius:30px;
}

.item{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:14px 0;
  border-bottom:1px solid #f1f5f9;
}

.item:last-child{
  border-bottom:none;
}

.item strong{
  display:block;
  color:#0f172a;
}

.item small{
  display:block;
  color:#64748b;
  margin-top:2px;
}

.date{
  font-size:11px;
}

.amount{
  font-weight:700;
  color:#16a34a;
}

.badge{
  padding:6px 12px;
  border-radius:30px;
  font-size:12px;
  font-weight:700;
}

.warning{
  background:#fef3c7;
  color:#d97706;
}

.danger{
  background:#fee2e2;
  color:#dc2626;
}

.rank{
  color:#003034;
}

.empty-state{
  text-align:center;
  padding:30px 0;
  color:#94a3b8;
}

.full-width{
  grid-column:1/-1;
}

.finance-grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(200px,1fr));
  gap:20px;
}

.finance-card{
  padding:24px;
  border-radius:18px;
  color:white;
  text-align:center;
}

.today{
  background:linear-gradient(135deg,#003034,#00545c);
}

.week{
  background:linear-gradient(135deg,#0284c7,#0369a1);
}

.month{
  background:linear-gradient(135deg,#16a34a,#15803d);
}

.finance-card span{
  display:block;
  opacity:.85;
  margin-bottom:10px;
}

.finance-card strong{
  font-size:28px;
}

@media(max-width:768px){

  .activity-grid{
    grid-template-columns:1fr;
  }

  .card{
    max-height:none;
  }

}
</style>