<script setup lang="ts">
import { ref } from 'vue'
import { Upload, X, Star } from 'lucide-vue-next'
import { compressAndReadFile } from '../../lib/images'

const props = withDefaults(defineProps<{
  images: string[]
  mainImage?: string
  maxImages?: number
  label?: string
}>(), {
  images: () => [],
  mainImage: '',
  maxImages: 8,
  label: 'Galería de Imágenes'
})

const emit = defineEmits<{
  (e: 'update:images', images: string[]): void
  (e: 'update:mainImage', mainImage: string): void
}>()

const isUploading = ref(false)

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  isUploading.value = true
  try {
    const newImages = [...props.images]
    let currentMain = props.mainImage || ''

    for (let i = 0; i < input.files.length; i++) {
      if (newImages.length >= props.maxImages) break
      const file = input.files[i]
      const compressedDataUrl = await compressAndReadFile(file)
      newImages.push(compressedDataUrl)
      if (!currentMain) {
        currentMain = compressedDataUrl
      }
    }

    emit('update:images', newImages)
    emit('update:mainImage', currentMain || newImages[0] || '')
  } catch (err) {
    console.error('Error al subir imagen:', err)
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

function removeImage(index: number) {
  const removed = props.images[index]
  const updated = props.images.filter((_, i) => i !== index)
  emit('update:images', updated)

  if (props.mainImage === removed) {
    emit('update:mainImage', updated[0] || '')
  }
}

function setAsMain(imgUrl: string) {
  emit('update:mainImage', imgUrl)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="block text-xs font-bold text-gray-700">{{ label }} (máx. {{ maxImages }})</label>
      <span class="text-[10px] font-black text-gray-400">{{ images.length }} / {{ maxImages }}</span>
    </div>

    <!-- Grid de imágenes -->
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      <div
        v-for="(img, idx) in images"
        :key="idx"
        class="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-border group bg-gray-100"
      >
        <img :src="img" class="w-full h-full object-cover" />

        <!-- Badge Foto Principal -->
        <button
          type="button"
          @click="setAsMain(img)"
          :title="mainImage === img ? 'Foto Principal' : 'Marcar como Principal'"
          :class="[
            'absolute top-1 left-1 p-1 rounded-lg backdrop-blur-xs transition-all',
            mainImage === img ? 'bg-amber-400 text-slate-900 font-black' : 'bg-black/40 text-white hover:bg-black/60'
          ]"
        >
          <Star class="w-3 h-3 fill-current stroke-[2.5]" />
        </button>

        <!-- Botón Eliminar -->
        <button
          type="button"
          @click="removeImage(idx)"
          class="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-all"
        >
          <X class="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>

      <!-- Botón Subir -->
      <label
        v-if="images.length < maxImages"
        class="aspect-square rounded-xl border-2 border-dashed border-brand-border bg-brand-light hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-all"
      >
        <Upload class="w-5 h-5 text-brand-accent stroke-[2.5] mb-1" />
        <span class="text-[10px] font-black text-brand-dark">
          {{ isUploading ? 'Procesando...' : 'Subir Foto' }}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          :disabled="isUploading"
          @change="handleFileUpload"
        />
      </label>
    </div>
  </div>
</template>