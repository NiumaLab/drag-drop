<template>
  <div ref="wrapper" class="move-wrapper" @mousedown="handleMouseDown">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

const wrapperRef = useTemplateRef('wrapper');

const emit = defineEmits<{
  (e: 'mounted', el: HTMLElement): void;
  (e: 'move', data: { el: HTMLElement, newX: number, newY: number, isX: boolean, isY: boolean }): void;
  (e: 'moveEnd'): void;
}>();

onMounted(() => {
  emit('mounted', wrapperRef.value!);
})

let isDragging = false;
let startX = 0;
let startY = 0;
let initialLeft = 0;
let initialTop = 0;

function handleMouseDown(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  isDragging = true;
  const element = e.currentTarget as HTMLElement;

  // 获取当前元素的位置（相对于父元素）
  const currentLeft = parseInt(element.style.left) || 0;
  const currentTop = parseInt(element.style.top) || 0;

  startX = e.clientX;
  startY = e.clientY;
  initialLeft = currentLeft;
  initialTop = currentTop;

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging) return;

  e.preventDefault();

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  startX = e.clientX;
  startY = e.clientY;

  const isX = deltaX >= 0
  const isY = deltaY >= 0

  initialLeft = initialLeft + deltaX;
  initialTop = initialTop + deltaY;

  emit('move', { el: e.target as HTMLDivElement, newX: initialLeft, newY: initialTop, isX, isY });
}

function handleMouseUp() {
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    emit('moveEnd');
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.move-wrapper {
  cursor: move;
  user-select: none;
}
</style>
