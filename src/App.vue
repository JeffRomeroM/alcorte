<script setup>
import Header from './components/header/Header.vue'
import Menu from './components/menu/Menu.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const mostrarHeader = computed(() => {
  const rutasOcultas = ['/', '/login', '/registro', '/*'] // Rutas donde no se muestra el header
  // Si la ruta actual está en la lista, devolvemos false (no mostrar)
  return !rutasOcultas.includes(route.path)
})

</script>

<template>
  <Header v-if="mostrarHeader" />
  <Menu v-if="mostrarHeader" />
  <router-view />
  
</template>

<style>

*{
  margin: 0;
  padding: 0;
}
html, body {
  height: 100%;
  margin: 0;
}

</style>
