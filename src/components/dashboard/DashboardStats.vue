<template>
  <div class="stats-grid">

    <div class="stat-card">
      <div class="icon bg-blue">
        <Icon icon="mdi:motorbike" />
      </div>

      <div>
        <span class="label">Motocicletas</span>
        <h2>{{ motos }}</h2>
      </div>
    </div>

    <div class="stat-card">
      <div class="icon bg-green">
        <Icon icon="mdi:account-group" />
      </div>

      <div>
        <span class="label">Clientes</span>
        <h2>{{ clientes }}</h2>
      </div>
    </div>

    <div class="stat-card">
      <div class="icon bg-orange">
        <Icon icon="mdi:clipboard-text" />
      </div>

      <div>
        <span class="label">Órdenes</span>
        <h2>{{ ordenes }}</h2>
      </div>
    </div>

    <div class="stat-card">
      <div class="icon bg-red">
        <Icon icon="mdi:wrench" />
      </div>

      <div>
        <span class="label">En proceso</span>
        <h2>{{ enProceso }}</h2>
      </div>
    </div>

    <div class="stat-card">
      <div class="icon bg-purple">
        <Icon icon="mdi:cash-multiple" />
      </div>

      <div>
        <span class="label">Facturación Total</span>
        <h2>${{ totalFacturado.toFixed(2) }}</h2>
      </div>
    </div>

    <div class="stat-card">
      <div class="icon bg-teal">
        <Icon icon="mdi:calendar-clock" />
      </div>

      <div>
        <span class="label">Recordatorios</span>
        <h2>{{ recordatorios }}</h2>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const motos = ref(0)
const clientes = ref(0)
const ordenes = ref(0)
const enProceso = ref(0)
const totalFacturado = ref(0)
const recordatorios = ref(0)

const calcularRecordatorios = (ordenesData) => {
  const hoy = new Date()

  return ordenesData.filter(o => {
    if (o.tipo_servicio !== 'Mantenimiento') return false

    const fecha = new Date(o.fecha_ingreso)

    fecha.setDate(fecha.getDate() + 75)

    const dias = Math.ceil(
      (fecha - hoy) /
      (1000 * 60 * 60 * 24)
    )

    return dias <= 15
  }).length
}

const cargarDatos = async () => {
  try {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const [
      motosRes,
      clientesRes,
      ordenesRes
    ] = await Promise.all([
      supabase
        .from('motos')
        .select('id')
        .eq('user_id', user.id),

      supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id),

      supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('user_id', user.id)
    ])

    motos.value =
      motosRes.data?.length || 0

    clientes.value =
      clientesRes.data?.length || 0

    ordenes.value =
      ordenesRes.data?.length || 0

    enProceso.value =
      ordenesRes.data?.filter(
        o => o.estado === 'En proceso'
      ).length || 0

    totalFacturado.value =
      ordenesRes.data?.reduce(
        (sum, o) =>
          sum + Number(o.total_general || 0),
        0
      ) || 0

    recordatorios.value =
      calcularRecordatorios(
        ordenesRes.data || []
      )

  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.stats-grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(220px,1fr));
  gap:20px;
}

.stat-card{
  background:white;
  border-radius:18px;
  padding:20px;
  display:flex;
  align-items:center;
  gap:15px;
  border:1px solid #e2e8f0;
  box-shadow:
  0 4px 12px rgba(0,0,0,.05);
}

.icon{
  width:60px;
  height:60px;
  border-radius:16px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:28px;
  color:white;
}

.label{
  display:block;
  color:#64748b;
  font-size:13px;
  margin-bottom:4px;
}

h2{
  margin:0;
  color:#003034;
  font-size:26px;
  font-weight:800;
}

.bg-blue{
  background:#3b82f6;
}

.bg-green{
  background:#22c55e;
}

.bg-orange{
  background:#f59e0b;
}

.bg-red{
  background:#ef4444;
}

.bg-purple{
  background:#8b5cf6;
}

.bg-teal{
  background:#14b8a6;
}

@media(max-width:768px){

  .stats-grid{
    grid-template-columns:1fr 1fr;
  }

  h2{
    font-size:20px;
  }

}

@media(max-width:500px){

  .stats-grid{
    grid-template-columns:1fr;
  }

}
</style>