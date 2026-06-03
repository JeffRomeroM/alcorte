<template>
  <div class="dashboard">

    <DashboardStats />

    <DashboardCharts />

    <DashboardActivity />

  </div>
</template>

<script setup>
import DashboardStats from '../../components/dashboard/DashboardStats.vue'
import DashboardCharts from '../../components/dashboard/DashboardCharts.vue'
import DashboardActivity from '../../components/dashboard/DashboardActivity.vue'
</script>

<style scoped>
.dashboard{
  padding:24px;
  display:flex;
  flex-direction:column;
  gap:24px;
  background:#f8fafc;
}
</style>