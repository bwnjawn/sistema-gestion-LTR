<script setup lang="ts">
// Ajustes: lista corta de secciones. Cada una abre su propia pantalla (rutas `admin-settings-*`).
import { ChevronRight, Images, Percent, ShieldCheck, Store } from 'lucide-vue-next'

const secciones = [
  { ruta: 'admin-settings-negocio', titulo: 'Datos del negocio', detalle: 'Contacto y transferencia', icono: Store },
  { ruta: 'admin-settings-reglas', titulo: 'Reglas de reservas', detalle: 'Abonos, IVA y cupos', icono: Percent },
  { ruta: 'admin-settings-contenido', titulo: 'Contenido para el cliente', detalle: 'Reglamento y fotos del inicio', icono: Images },
  { ruta: 'admin-settings-equipo', titulo: 'Equipo', detalle: 'Quién tiene acceso al panel', icono: ShieldCheck }
]
</script>

<template>
  <div class="max-w-md lg:max-w-none mx-auto w-full pb-20">
    <ul class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden divide-y divide-brand-border/60 lg:bg-transparent lg:border-0 lg:shadow-none lg:overflow-visible lg:divide-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
      <li v-for="seccion in secciones" :key="seccion.ruta" class="lg:bg-white lg:rounded-3xl lg:border-2 lg:border-brand-border lg:shadow-xs lg:overflow-hidden lg:hover:border-brand-dark">
        <router-link :to="{ name: seccion.ruta }" class="flex items-center gap-3 px-4 py-3.5 min-h-14 lg:py-6 active:bg-brand-light">
          <span class="shrink-0 w-9 h-9 rounded-full bg-brand-light border border-brand-border flex items-center justify-center">
            <component :is="seccion.icono" class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
          </span>
          <span class="min-w-0 grow">
            <span class="block text-base font-bold text-brand-dark leading-tight">{{ seccion.titulo }}</span>
            <span class="block text-sm text-gray-700 leading-tight">{{ seccion.detalle }}</span>
          </span>
          <ChevronRight class="w-5 h-5 text-gray-500 shrink-0" aria-hidden="true" />
        </router-link>
      </li>
    </ul>
  </div>
</template>
