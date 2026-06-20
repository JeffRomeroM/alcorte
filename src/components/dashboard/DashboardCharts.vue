<template>
  <div class="charts-container">

    <div class="chart-grid">

      <div class="chart-card">
        <div class="card-header">
          <h3>Facturación Mensual</h3>
        </div>
        <canvas ref="facturacionChart"></canvas>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <h3>Tipos de Servicio</h3>
        </div>
        <canvas ref="serviciosChart"></canvas>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <h3>Estados de Órdenes</h3>
        </div>
        <canvas ref="estadoChart"></canvas>
      </div>

    </div>

    <div class="chart-card full-width">
      <div class="card-header">
        <h3>Motocicletas Más Atendidas</h3>
      </div>
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

const opcionesBase = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1200
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  }
}

const cargarGraficos = async () => {

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

    ingresos[
      fecha.getMonth()
    ] += Number(
      o.total_general || 0
    )

  })

  new Chart(
    facturacionChart.value,
    {
      type:'bar',
      data:{
        labels:meses,
        datasets:[
          {
            label:'Facturación',
            data:ingresos,
            backgroundColor:'#14b8a6',
            borderRadius:12,
            borderSkipped:false
          }
        ]
      },
      options:{
        ...opcionesBase,
        plugins:{
          ...opcionesBase.plugins,
          tooltip:{
            callbacks:{
              label:(ctx)=>
                `$${Number(ctx.raw).toFixed(2)}`
            }
          }
        }
      }
    }
  )
}

const crearGraficoServicios = (ordenes) => {

  const mantenimientos =
    ordenes.filter(
      o =>
      o.tipo_servicio ===
      'Mantenimiento'
    ).length

  const reparaciones =
    ordenes.filter(
      o =>
      o.tipo_servicio !==
      'Mantenimiento'
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
            ],
            backgroundColor:[
              '#14b8a6',
              '#3b82f6'
            ],
            borderWidth:0
          }
        ]
      },
      options:{
        ...opcionesBase,
        cutout:'65%'
      }
    }
  )
}

const crearGraficoEstados = (ordenes) => {

  const recibidas =
    ordenes.filter(
      o =>
      o.estado ===
      'Recibida'
    ).length

  const proceso =
    ordenes.filter(
      o =>
      o.estado ===
      'En proceso'
    ).length

  const listas =
    ordenes.filter(
      o =>
      o.estado ===
      'Lista para entregar'
    ).length

  new Chart(
    estadoChart.value,
    {
      type:'doughnut',
      data:{
        labels:[
          'Recibidas',
          'En proceso',
          'Listas'
        ],
        datasets:[
          {
            data:[
              recibidas,
              proceso,
              listas
            ],
            backgroundColor:[
              '#f59e0b',
              '#3b82f6',
              '#22c55e'
            ],
            borderWidth:0
          }
        ]
      },
      options:{
        ...opcionesBase,
        cutout:'65%'
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
          top.map(i=>i[0]),
        datasets:[
          {
            label:'Servicios',
            data:
              top.map(i=>i[1]),
            backgroundColor:[
              '#14b8a6',
              '#3b82f6',
              '#8b5cf6',
              '#f59e0b',
              '#ef4444'
            ],
            borderRadius:12,
            borderSkipped:false
          }
        ]
      },
      options:{
        ...opcionesBase,
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
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
}

.chart-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.05),
    0 4px 10px rgba(0, 0, 0, 0.03);
  transition: all .25s ease;
  position: relative;
  overflow: hidden;
}

    
.chart-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(
    90deg,
    #003034,
    #00b894,
    #0984e3
  );
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 35px rgba(0, 0, 0, 0.08),
    0 8px 15px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
  margin: 0 0 20px;
  color: #003034;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-card canvas {
  width: 100% !important;
  height: 320px !important;
}

.chart-card.large canvas {
  height: 420px !important;
}

/* Estado vacío */
.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  color: #94a3b8;
  font-size: 14px;
}

/* Loader */
.chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #e2e8f0;
  border-top-color: #00b894;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .charts-container {
    gap: 18px;
  }

  .chart-card {
    padding: 18px;
    border-radius: 18px;
  }

  .chart-card h3 {
    font-size: 1rem;
  }

  .chart-card canvas {
    height: 260px !important;
  }

  .chart-card.large canvas {
    height: 320px !important;
  }
}

@media (max-width: 480px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    padding: 16px;
  }

  .chart-card canvas {
    height: 220px !important;
  }
}
</style>