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
  (e: 'focus'): void;
  (e: 'moving', data: MoveData): void;
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
  if (e.button !== 0) return;
  emit('focus')
  e.preventDefault();
  e.stopPropagation();

  // if (!isMoveEdge(wrapperRef.value!, e)) {
  //   return
  // }

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

function isMoveEdge(el: HTMLElement, e: MouseEvent): boolean {
  const rect = el.getBoundingClientRect();
  const threshold = 8; // px from edge
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const nearLeft = x <= threshold;
  const nearRight = x >= rect.width - threshold;
  const nearTop = y <= threshold;
  const nearBottom = y >= rect.height - threshold;

  // only start dragging when mouse is near any edge
  return nearLeft || nearRight || nearTop || nearBottom
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging) return;
  // add focused class when pressed
  wrapperRef.value!.classList.add('moving');

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

    emit('moving', { el: wrapperRef.value!, newX: initialLeft, newY: initialTop, deltaX, deltaY });
  });
}

function handleMouseUp() {
  wrapperRef.value?.classList.remove('moving');
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    emit('moveEnd');
  }
}

onUnmounted(() => {
  console.log('onUnmounted');

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  wrapperRef.value?.classList.remove('focused');
});
</script>

<style scoped>
.move-wrapper {
  user-select: none;
  border: 1px solid #eee;
}

.move-wrapper.moving {
  /* border: 1px solid #000; */
}

.cursor-move {
  cursor: move;
}
</style>
