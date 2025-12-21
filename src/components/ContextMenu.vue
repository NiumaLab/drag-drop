<template>
  <div v-if="visible" class="context-menu" :style="style">
    <ul>
      <li @click="onMerge">merge</li>
      <li @click="onCancel">cancel</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const visible = ref(false)
const x = ref(0)
const y = ref(0)
let resolver: ((v: boolean) => void) | null = null

function open(clientX: number, clientY: number) {
  x.value = clientX
  y.value = clientY
  visible.value = true
  return new Promise<boolean>((resolve) => {
    resolver = resolve
  })
}

function close(result = false) {
  visible.value = false
  if (resolver) {
    resolver(result)
    resolver = null
  }
}

function onMerge() {
  close(true)
}

function onCancel() {
  close(false)
}

function onWindowClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.context-menu')) {
    close(false)
  }
}

onMounted(() => window.addEventListener('click', onWindowClick))
onBeforeUnmount(() => window.removeEventListener('click', onWindowClick))

defineExpose({ open })

const style = computed(() => ({
  left: x.value + 'px',
  top: y.value + 'px',
  zIndex: 10000,
}))
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 6px 0;
  border-radius: 4px;
  font-size: 12px;
}
.context-menu ul { list-style: none; margin: 0; padding: 0; }
.context-menu li { padding: 6px 12px; cursor: pointer; }
.context-menu li:hover { background: #f5f5f5; }
</style>
