import { createRouter, createWebHistory } from 'vue-router'
import Register from '../components/register/Register.vue'
import Login from '../components/login/Login.vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const routes = [
  { path: '/', component: Login },
  { path: '/registro', component: Register },
  
  // CRÍTICO: Esta vista DEBE ser pública. Si requiere auth, causará un bucle infinito.
  {
    path: '/pago-pendiente',
    name: 'pago-pendiente',
    component: () => import('../views/bloqueo/PagoPendiente.vue'),
  },

  // Rutas protegidas
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/dashboard/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: () => import('../views/clientes/VistaClientes.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/motos',
    name: 'motos',
    component: () => import('../views/motos/VistaMotos.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/servicios',
    name: 'servicios',
    component: () => import('../views/servicios/VistaServicios.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/completar-perfil',
    name: 'completar-perfil',
    component: () => import('../views/profile/CompletarPerfil.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/editar-perfil',
    name: 'editar-perfil',
    component: () => import('../views/profile/EditarPerfil.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const publicRoutes = ['/', '/registro', '/pago-pendiente']
  
  // 1. Si va a una ruta pública, permitir el paso directo
  if (publicRoutes.includes(to.path)) {
    return true
  }

  // 2. Verificar autenticación utilizando getUser (más seguro que getSession)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return '/'
  }

  // 3. Verificar estado de pago si intenta ir a una ruta protegida
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('activo')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    // Si la mensualidad venció (activo === false), lo mandamos directo al bloqueo
    if (profile && profile.activo === false) {
      return '/pago-pendiente'
    }
  } catch (err) {
    console.error('Error al validar estado de cuenta:', err.message)
    // En caso de error crítico de base de datos, es mejor mandarlo al login por seguridad
    return '/'
  }

  // Si está autenticado y está activo, avanza normalmente
  return true
})

export default router