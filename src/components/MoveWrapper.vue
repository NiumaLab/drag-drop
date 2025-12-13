<template>
  <div ref="wrapper" class="move-wrapper" @mousedown="handleMouseDown">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import type { MoveData } from '@/types';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

const wrapperRef = useTemplateRef('wrapper');

const emit = defineEmits<{
  (e: 'mounted', el: HTMLElement): void;
  (e: 'move', data: MoveData): void;
  (e: 'moveEnd'): void;
}>();

onMounted(() => {
  emit('mounted', wrapperRef.value!);
})

let isDragging = false;
let startX: number;
let startY: number;
let initialLeft: number;
let initialTop: number;
let rafId: number | null = null;

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

  // 使用 requestAnimationFrame 节流，确保与浏览器刷新率同步
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    startX = e.clientX;
    startY = e.clientY;

    initialLeft = initialLeft + deltaX;
    initialTop = initialTop + deltaY;

    emit('move', { el: wrapperRef.value!, newX: initialLeft, newY: initialTop, deltaX, deltaY });
  });
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
