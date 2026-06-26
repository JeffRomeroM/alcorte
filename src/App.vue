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

import { onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)
const router = useRouter()

onMounted(() => {
  // Este método detecta inicios y cierres de sesión globalmente
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      // Limpia cualquier estado global si usas Pinia/Vuex aquí
      router.push('/')
    }
  })
  cargarTemaUsuario()
})


const cargarTemaUsuario = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('color_primario')
        .eq('user_id', user.id) // Clave relacional correcta de tu tabla
        .maybeSingle()

      if (!error && profile?.color_primario) {
        // Modifica la variable global en caliente
        document.documentElement.style.setProperty('--color-primario', profile.color_primario)
      }
    }
  } catch (err) {
    console.error("Error al cargar el tema del usuario:", err)
  }
}



</script>

<template>
  <Header v-if="mostrarHeader" />
  <Menu v-if="mostrarHeader" />
  <router-view />
  
</template>

<style>

*{
  margin: 0 ;
  padding: 0 ;
  box-sizing: border-box ;

}
html, body {
  height: 100%;
  margin: 0;
}

</style>
