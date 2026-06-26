<template>
 
    <!-- DESKTOP -->
    <nav class="menu-desktop">
      
      <router-link to="/dashboard" class="item">
        <Icon icon="mdi:chart-bar" />
        <span>Dashboard</span>
      </router-link>
      <router-link to="/motos" class="item">
        <Icon icon="mdi:motorbike" />
        <span>Motos</span>
      </router-link>

      <router-link to="/clientes" class="item">
        <Icon icon="mdi:account-group-outline" />
        <span>Clientes</span>
      </router-link>

      <router-link to="/servicios" class="item">
        <Icon icon="mdi:wrench-outline" />
        <span>Servicios</span>
      </router-link>

      <router-link to="/recordatorios" class="item">
        <Icon icon="mdi:calendar-clock-outline" />
        <span>Recordatorios</span>
      </router-link>
    </nav>

    <!-- MOBILE -->
    <nav class="menu-mobile">

      <router-link to="/dashboard" class="mobile-item">
        <Icon icon="mdi:chart-bar" />
        <span>Dashboard</span>
      </router-link>



      <router-link to="/clientes" class="mobile-item">
        <Icon icon="mdi:account-group-outline" />
        <span>Clientes</span>
      </router-link>

      <!-- <router-link to="/servicios" class="mobile-item center-btn">
        <Icon icon="mdi:wrench-outline" />
      </router-link> -->

      <router-link to="/servicios" class="mobile-item">
        <Icon icon="mdi:wrench-outline" />
        <span>Servicios</span>
      </router-link>

      <router-link to="/motos" class="mobile-item">
        <Icon icon="mdi:motorbike" />
        <span>Motos</span>
      </router-link>

      <router-link to="/recordatorios" class="mobile-item">
        <Icon icon="mdi:calendar-clock-outline" />
        <span>Record.</span>
      </router-link>

      
      

    </nav>
  
</template>

<script setup>
import { Icon } from '@iconify/vue'
import '../../assets/main.css'  
</script>

<style scoped>

/* DESKTOP */

.menu-desktop{
  width:100%;
  background:white;
  border-bottom:1px solid #e2e8f0;
  display:flex;
  justify-content:center;
  gap:10px;
  padding:12px 20px;
  position:sticky;
  top:45px;
  z-index:100;
}

.item{
  text-decoration:none;
  color:#64748b;
  padding:10px 18px;
  border-radius:12px;
  display:flex;
  align-items:center;
  gap:8px;
  font-weight:600;
  transition:.3s;
}

.item:hover{
  background:#f1f5f9;
}

.item.router-link-active{
  background: var(--color-primario);
  color:white;
}

/* MOBILE */

.menu-mobile{
  display:none;
}

@media(max-width:768px){

  .menu-desktop{
    display:none;
  }

  .menu-mobile{
    position:fixed;
    bottom:0px;
    left:0;
    width:100%;
    height:55px;
    background:white;
    border-top:1px solid #e2e8f0;
    display:flex;
    justify-content:space-around;
    align-items:center;
    z-index:999;
    box-shadow:0 -5px 20px rgba(0,0,0,.08);
  }

  .mobile-item{
    text-decoration:none;
    color:#64748b;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:2px;
    font-size:11px;
    flex:1;
  }

  .mobile-item svg{
    font-size:24px;
  }

  .mobile-item.router-link-active{
    color:#003034;
  }

  .center-btn{
    width:80px;
    height:40px;
    border-radius:50%;
    background:#003034;
    color:white !important;
    margin-top:-30px;
    box-shadow:0 8px 20px rgba(0,48,52,.3);
  }

  .center-btn svg{
    font-size:28px;
  }
}

</style>