<template>
  <header>
    <img class="logo" src="/drag_drop.svg" alt="">
    <span>DRAG & DROP</span>
  </header>
  <main class="container">
    <section class="left">
      <div style="cursor: move;" v-for="([materialId, material]) in materials.store" :key="materialId" draggable="true"
        @dragstart="handleDragStart($event, materialId)">
        <component :is="material" />
      </div>
    </section>

    <!-- @dragover.prevent 才能触发drop事件 -->
    <main class="middle" ref="middleContainer" @dragover.prevent @drop="handleDrop"
      @mousedown.self="handleSelectionMouseDown">
      <MoveWrapper :class="{ focused: focusedEls.includes(mEl) }" :style="{
        left: mEl.pos.x + 'px',
        top: mEl.pos.y + 'px',
        position: 'absolute',
        width: (mEl.pos.width ? mEl.pos.width + 'px' : ''),
        height: (mEl.pos.height ? mEl.pos.height + 'px' : ''),
      }" v-for="mEl in moveableEls" :key="mEl.id" @mounted="handleMoveableElMounted($event, mEl)"
        @focus="handleMoveableElFocus(mEl)" @moving="handleMoveableElMoving($event, mEl)"
        @moveEnd="handleMoveableElMoveEnd(mEl)">
        <template v-if="(mEl as Group).widgets">
          <component :style="{
            left: m.pos.relativeX + 'px',
            top: m.pos.relativeY + 'px',
            position: 'absolute',
          }" v-for="m in (mEl as Group).widgets" :is="materials.get(m.materialId)" :key="m.id" />
        </template>
        <component v-if="(mEl as Widget).materialId" :is="materials.get((mEl as Widget).materialId)" />
      </MoveWrapper>

      <div class="line horizontal" :style="horizontalLinesStyle[0]"></div>
      <div class="line horizontal" :style="horizontalLinesStyle[1]"></div>
      <div class="line horizontal" :style="horizontalLinesStyle[2]"></div>
      <div class="line vertical" :style="verticalLinesStyle[0]"></div>
      <div class="line vertical" :style="verticalLinesStyle[1]"></div>
      <div class="line vertical" :style="verticalLinesStyle[2]"></div>

      <div class="selection-rect" :style="{
        left: selectionStyle.left + 'px',
        top: selectionStyle.top + 'px',
        width: selectionStyle.width + 'px',
        height: selectionStyle.height + 'px',
        display: selectionStyle.display
      }"></div>
    </main>

    <section class="right">
      focusedEls
      <code>
    <pre>{{ focusedEls }}</pre>
  </code>
      <!-- moveableEls
      <code>
        <pre>{{ moveableEls }}</pre>
      </code> -->
    </section>
  </main>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { getUniqueId, objToArr } from '@/utils';
import { LineHelper } from '@/utils/lineHelper';
import type { HorizontalLine, LineInfo, MoveableEl, MoveData, VerticalLine, Widget, Group } from '@/types';
import { MaterialHelper } from '@/utils/material';
import Box2 from './components/Box2.vue';
import MoveWrapper from './components/MoveWrapper.vue';

const middleContainerRef = useTemplateRef<HTMLDivElement>('middleContainer')


/**
 * init material
 */
const materials = new MaterialHelper()
const initialMaterialId = getUniqueId()
materials.register(initialMaterialId, Box2)

const moveableEls = ref<Array<MoveableEl>>([])
let id = 0

if (initialMaterialId) {
  moveableEls.value.push({
    id: id++,
    materialId: initialMaterialId,
    pos: { x: 0, y: 0 },
  })
}
const focusedEls = ref<MoveableEl[]>([])

/**
 * init lineHelper
 */
const lineHelper = new LineHelper(middleContainerRef.value!, {
  lineThreshold: 5,
})
onMounted(() => {
  lineHelper.setContainer(middleContainerRef.value!)
})

function handleDragStart(e: DragEvent, materialId: string) {
  e.dataTransfer!.effectAllowed = "copy";
  e.dataTransfer!.setData('materialId', materialId)
}

function handleDrop(e: DragEvent) {
  const materialId = e.dataTransfer!.getData('materialId')
  if (!materialId) {
    return
  }

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  moveableEls.value.push({
    id: id++,
    materialId: materialId,
    pos: { x, y },
  })
}

function handleMoveableElMounted(el: HTMLElement, widget: MoveableEl) {
  const rect = el.getBoundingClientRect()
  widget.wrapperEl = el
  widget.pos.width = rect.width
  widget.pos.height = rect.height
  widget.wrapperElRectCache = rect
}

function handleMoveableElFocus(widget: MoveableEl) {
  focusedEls.value = [widget]
}

// Selection (marquee) state and handlers (refactor: store style directly)
const isSelecting = ref(false)
const selectStart = ref({ x: 0, y: 0 })

const selectionStyle = ref({ left: 0, top: 0, width: 0, height: 0, display: 'none' })

function handleSelectionMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  const container = middleContainerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  isSelecting.value = true
  selectStart.value.x = e.clientX - rect.left
  selectStart.value.y = e.clientY - rect.top

  selectionStyle.value.left = selectStart.value.x
  selectionStyle.value.top = selectStart.value.y
  selectionStyle.value.width = 0
  selectionStyle.value.height = 0
  selectionStyle.value.display = 'block'

  window.addEventListener('mousemove', onSelectionMouseMove)
  window.addEventListener('mouseup', onSelectionMouseUp, { once: true })
}

function onSelectionMouseMove(e: MouseEvent) {
  if (!isSelecting.value) return
  const container = middleContainerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const curX = e.clientX - rect.left
  const curY = e.clientY - rect.top

  const left = Math.min(selectStart.value.x, curX)
  const top = Math.min(selectStart.value.y, curY)
  const width = Math.abs(curX - selectStart.value.x)
  const height = Math.abs(curY - selectStart.value.y)

  selectionStyle.value.left = left
  selectionStyle.value.top = top
  selectionStyle.value.width = width
  selectionStyle.value.height = height
}

function onSelectionMouseUp() {
  if (!isSelecting.value) return
  isSelecting.value = false
  window.removeEventListener('mousemove', onSelectionMouseMove)

  // compute selection bounds from selectionStyle
  const sel = {
    left: selectionStyle.value.left,
    top: selectionStyle.value.top,
    right: selectionStyle.value.left + selectionStyle.value.width,
    bottom: selectionStyle.value.top + selectionStyle.value.height,
  }

  const container = middleContainerRef.value
  if (!container) return
  const containerRect = container.getBoundingClientRect()

  const selected: Widget[] = []
  const toDelIndexes: number[] = []
  moveableEls.value.forEach((w, i) => {
    const { wrapperElRectCache, id, materialId, pos } = w as Widget
    const left = wrapperElRectCache!.left - containerRect.left
    const top = wrapperElRectCache!.top - containerRect.top
    const right = left + wrapperElRectCache!.width
    const bottom = top + wrapperElRectCache!.height

    if (sel.left <= left && sel.top <= top && sel.right >= right && sel.bottom >= bottom) {
      selected.push({
        id,
        materialId,
        pos,
      })
      toDelIndexes.push(i)
    }
  })
  // remove selected from moveableEls
  for (let i = toDelIndexes.length - 1; i >= 0; i--) {
    moveableEls.value.splice(toDelIndexes[i]!, 1)
  }

  focusedEls.value = selected

  const x = Math.min(...selected.map(s => s.pos.x))
  const y = Math.min(...selected.map(s => s.pos.y))
  const width = Math.max(...selected.map(s => s.pos.x + s.pos.width! + (s.wrapperElRectCache?.width || 0))) - x
  const height = Math.max(...selected.map(s => s.pos.y + s.pos.height! + (s.wrapperElRectCache?.height || 0))) - y
  selected.forEach(s => {
    s.pos.relativeX = s.pos.x - x
    s.pos.relativeY = s.pos.y - y
  })
  moveableEls.value.push({
    id: id++,
    pos: {
      x,
      y,
      width,
      height
    },
    widgets: selected
  })

  console.log(moveableEls.value);


  selectionStyle.value.display = 'none'
  selectionStyle.value.left = 0
  selectionStyle.value.top = 0
  selectionStyle.value.width = 0
  selectionStyle.value.height = 0
}

const horizontalLinesStyle = ref<HorizontalLine[]>([])
const verticalLinesStyle = ref<VerticalLine[]>([])

async function handleMoveableElMoving(e: MoveData, widget: MoveableEl) {
  lineHelper.updateMoveableElPos(widget, e.newX, e.newY)
  const otherWidget = moveableEls.value.filter(w => w.id !== widget.id)
  if (!otherWidget.length) {
    return
  }
  await nextTick()
  const [newY, newX] = setLines(widget, otherWidget, e)

  lineHelper.updateMoveableElPos(widget, newX, newY)
}

/**
 * @description 计算并设置辅助线，并返回磁吸后的新位置
 * @returns [newY, newX] 磁吸后的新位置
 */
function setLines(source: MoveableEl, others: MoveableEl[], extra: MoveData) {
  const [h, v] = lineHelper.getLines(source, others)

  horizontalLinesStyle.value = objToArr<LineInfo, HorizontalLine>(h, (line) => {
    return {
      top: line.top! + 'px',
      display: 'block'
    }
  })
  verticalLinesStyle.value = objToArr<LineInfo, VerticalLine>(v, (line) => {
    return {
      left: line.left! + 'px',
      display: 'block'
    }
  })

  return [lineHelper.getMinOffsetSourcePos(h, extra.deltaY), lineHelper.getMinOffsetSourcePos(v, extra.deltaX)]
}

function handleMoveableElMoveEnd(mEl: MoveableEl) {
  mEl.wrapperElRectCache = mEl.wrapperEl!.getBoundingClientRect()
  horizontalLinesStyle.value.forEach(line => line.display = 'none')
  verticalLinesStyle.value.forEach(line => line.display = 'none')
}


</script>

<style>
:root {
  --header-height: 55px;
  --border-color: #bdbaba;
}
</style>

<style scoped>
header {
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color);
  line-height: var(--header-height);
  font-size: 1.5rem;
  font-weight: normal;
  padding: 0 12px;
}

header .logo {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.container {
  display: flex;
  height: calc(100vh - var(--header-height));
}

.left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-right: 1px solid var(--border-color);
}

.middle {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.right {
  /* display: none; */
  width: 300px;
  border-left: 1px solid var(--border-color);
  overflow-x: auto;
}

.line {
  position: absolute;
  display: none;
}

.selection-rect {
  position: absolute;
  border: 1px dashed rgba(0, 120, 212, 0.9);
  background: rgba(0, 120, 212, 0.08);
  pointer-events: none;
  z-index: 9999;
}

.line.horizontal {
  border-top: 1px dashed var(--border-color);
  width: 100%;
}

.line.vertical {
  border-left: 1px dashed var(--border-color);
  height: 100%;
}

.focused {
  border: 1px solid #000;
}
</style>
