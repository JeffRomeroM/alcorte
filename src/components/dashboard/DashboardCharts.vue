<template>
  <div class="charts-container">

    

    <div class="chart-grid">
      <div class="chart-card">
        <h3>Facturación Mensual</h3>
        <canvas ref="facturacionChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>Tipos de Servicio</h3>
        <canvas ref="serviciosChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>Estados de Órdenes</h3>
        <canvas ref="estadoChart"></canvas>
      </div>

    </div>

    <div class="chart-card">
      <h3>Motocicletas Más Atendidas</h3>
      <canvas ref="motosChart"></canvas>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
)

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const facturacionChart = ref(null)
const serviciosChart = ref(null)
const estadoChart = ref(null)
const motosChart = ref(null)

const cargarGraficos = async () => {
  try {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: ordenes } =
      await supabase
        .from('ordenes_trabajo')
        .select(`
          *,
          motos(
            marca,
            modelo
          )
        `)
        .eq('user_id', user.id)

    if (!ordenes) return

    crearGraficoFacturacion(ordenes)
    crearGraficoServicios(ordenes)
    crearGraficoEstados(ordenes)
    crearGraficoMotos(ordenes)

  } catch (error) {
    console.error(error)
  }
}

const crearGraficoFacturacion = (ordenes) => {

  const meses = [
    'Ene','Feb','Mar','Abr',
    'May','Jun','Jul','Ago',
    'Sep','Oct','Nov','Dic'
  ]

  const ingresos = Array(12).fill(0)

  ordenes.forEach(o => {

    const fecha =
      new Date(o.fecha_ingreso)

    const mes =
      fecha.getMonth()

    ingresos[mes] +=
      Number(o.total_general || 0)

  })

  new Chart(
    facturacionChart.value,
    {
      type:'bar',
      data:{
        labels: meses,
        datasets:[
          {
            label:'Facturación',
            data: ingresos
          }
        ]
      },
      options:{
        responsive:true
      }
    }
  )
}

const crearGraficoServicios = (ordenes) => {

  const mantenimientos =
    ordenes.filter(
      o => o.tipo_servicio === 'Mantenimiento'
    ).length

  const reparaciones =
    ordenes.filter(
      o => o.tipo_servicio !== 'Mantenimiento'
    ).length

  new Chart(
    serviciosChart.value,
    {
      type:'doughnut',
      data:{
        labels:[
          'Mantenimiento',
          'Reparación'
        ],
        datasets:[
          {
            data:[
              mantenimientos,
              reparaciones
            ]
          }
        ]
      }
    }
  )
}

const crearGraficoEstados = (ordenes) => {

  const recibidas =
    ordenes.filter(
      o => o.estado === 'Recibida'
    ).length

  const proceso =
    ordenes.filter(
      o => o.estado === 'En proceso'
    ).length

  const listas =
    ordenes.filter(
      o => o.estado === 'Lista para entregar'
    ).length

  new Chart(
    estadoChart.value,
    {
      type:'doughnut',
      data:{
        labels:[
          'Recibidas',
          'En Proceso',
          'Listas'
        ],
        datasets:[
          {
            data:[
              recibidas,
              proceso,
              listas
            ]
          }
        ]
      }
    }
  )
}

const crearGraficoMotos = (ordenes) => {

  const conteo = {}

  ordenes.forEach(o => {

    const nombre =
      `${o.motos?.marca || ''} ${o.motos?.modelo || ''}`

    conteo[nombre] =
      (conteo[nombre] || 0) + 1

  })

  const top =
    Object.entries(conteo)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)

  new Chart(
    motosChart.value,
    {
      type:'bar',
      data:{
        labels:
          top.map(i => i[0]),
        datasets:[
          {
            label:'Servicios',
            data:
              top.map(i => i[1])
          }
        ]
      },
      options:{
        responsive:true,
        indexAxis:'y'
      }
    }
  )
}

onMounted(() => {
  cargarGraficos()
})
</script>

<style scoped>
.charts-container{
  display:flex;
  flex-direction:column;
  gap:24px;
  width: 90%!important;
}

.chart-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:24px;
}

.chart-card{
  background:white;
  padding:24px;
  border-radius:20px;
  border:1px solid #e2e8f0;
  box-shadow:
  0 4px 12px rgba(0,0,0,.05);
  width: 90%;
}

.chart-card h3{
  margin-bottom:20px;
  color:#003034;
}

canvas{
  max-height:350px;
}

@media(max-width:768px){

  .chart-grid{
    grid-template-columns:1fr;
  }
  .chart-card{
    width:90%;
  }

}
</style>