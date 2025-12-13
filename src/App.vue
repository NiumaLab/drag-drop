<template>
  <header>
    <img class="logo" src="/drag_drop.svg" alt="">
    <span>DRAG & DROP</span>
  </header>
  <main class="container">
    <section class="left">
      <div style="cursor: move;" v-for="([materialId, material]) in materials" :key="materialId" draggable="true"
        @dragstart="handleDragStart($event, materialId)">
        <component :is="material" />
      </div>
    </section>

    <!-- @dragover.prevent 才能触发drop事件 -->
    <main class="middle" ref="middleContainer" @dragover.prevent @dropEnter="handleDropEnter"
      @dropLeave="handleDropLeave" @drop="handleDrop">
      <MoveWrapper :style="{
        left: widget.pos.x + 'px',
        top: widget.pos.y + 'px',
        position: 'absolute',
      }" v-for="widget in widgets" :key="widget.id" @mounted="handleWidgetMounted($event, widget)"
        @move="handleWidgetMove($event, widget)" @moveend="handleWidgetMoveEnd(widget)">
        <component :is="materials.get(widget.materialId)" />
      </MoveWrapper>

      <div class="line horizontal" :style="horizontalLinesStyle[0]"></div>
      <div class="line horizontal" :style="horizontalLinesStyle[1]"></div>
      <div class="line horizontal" :style="horizontalLinesStyle[2]"></div>
      <div class="line vertical" :style="verticalLinesStyle[0]"></div>
      <div class="line vertical" :style="verticalLinesStyle[1]"></div>
      <div class="line vertical" :style="verticalLinesStyle[2]"></div>
    </main>

    <section class="right">

    </section>
  </main>
</template>

<script lang="ts" setup>
import { type Component, markRaw, nextTick, ref, useTemplateRef } from 'vue';
import BoxComp from './components/Box.vue';
import MoveWrapper from './components/MoveWrapper.vue';
import { getUniqueId, objToArr } from './utils';
import { getCenter } from './utils/line';

interface Widget {
  id: number;
  materialId: string;
  pos: {
    x: number;
    y: number;
  };
  el: HTMLElement | null;
}

interface Line {
  display: 'none' | 'block';
  top?: string;
  left?: string;
}

interface HorizontalLine extends Line {
  top: string;
}

interface VerticalLine extends Line {
  left: string;
}

const middleContainerRef = useTemplateRef<HTMLDivElement>('middleContainer')

const lineThreshold = 5

const xoris = ['bottom', 'xcenter', 'top'] as const
const yoris = ['left', 'ycenter', 'right'] as const
type Oris = typeof xoris[number] | typeof yoris[number]
interface LineInfo {
  ori: Oris  // 参照source
  top?: number
  left?: number
  offset: number
}
type ToDisplayLines = Record<Oris, LineInfo>


const materials = new Map<string, Component>([
  [getUniqueId(), markRaw(BoxComp)]
])

const widgets = ref<Widget[]>([])
let id = 0

const initialMaterialId = materials.keys().next().value
if (initialMaterialId) {
  widgets.value.push({
    id: id++,
    materialId: initialMaterialId,
    pos: { x: 0, y: 0 },
    el: null,
  })
}

function handleDragStart(e: DragEvent, materialId: string) {
  e.dataTransfer!.effectAllowed = "copy";
  e.dataTransfer!.setData('materialId', materialId)
}

function handleDrop(e: DragEvent) {
  const materialId = e.dataTransfer!.getData('materialId')
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()

  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  widgets.value.push({
    id: id++,
    materialId: materialId,
    pos: { x, y },
    el: null,
  })
}

function handleDropLeave(e: DragEvent) {
}

function handleDropEnter(e: DragEvent) {
}

function handleWidgetMounted(el: HTMLElement, widget: Widget) {
  widget.el = el
}

const horizontalLinesStyle = ref<HorizontalLine[]>([])
const verticalLinesStyle = ref<VerticalLine[]>([])

async function handleWidgetMove(e: { x: number, y: number }, widget: Widget) {
  updateWidgetPos(widget, e.x, e.y)
  await nextTick()
  setLines(widget)
}

function updateWidgetPos(widget: Widget, x: number, y: number) {
  widget.pos.x = x;
  widget.pos.y = y;
}

function setLines(widget: Widget) {
  const otherWidget = widgets.value.filter(w => w.id !== widget.id)
  if (!otherWidget.length) {
    return
  }

  const [h, v] = getLines(widget, otherWidget)
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
}

function handleWidgetMoveEnd(widget: Widget) {
  horizontalLinesStyle.value.forEach(line => line.display = 'none')
  verticalLinesStyle.value.forEach(line => line.display = 'none')
}


/**
 * @description 获取辅助线
 * 1. 使用防抖（如100ms内只计算一次）减少高频计算，但可能影响实时性。
 * 2. 为拖拽中的元素建立邻近区域搜索，只计算一定范围内的元素。
 * 3. 实现边界框（Bounding Box）缓存，避免重复计算元素几何信息。
 */
function getLines(source: Widget, others: Widget[]) {
  return others.reduce((acc, other) => {
    const [horizontalLines, verticalLines] = acc;
    const lines = getSingleWidgetLines(source.el!.getBoundingClientRect(), other.el!.getBoundingClientRect());

    (Object.keys(lines) as Oris[]).forEach(ori => {
      if (xoris.includes(ori as typeof xoris[number])) {
        const curLine = lines[ori]
        const accLine = horizontalLines[ori]
        if (!accLine || curLine.offset < accLine.offset) {
          horizontalLines[ori] = curLine
        }
      }
      if (yoris.includes(ori as typeof yoris[number])) {
        const curLine = lines[ori]
        const accLine = verticalLines[ori]
        if (!accLine || curLine.offset < accLine.offset) {
          verticalLines[ori] = curLine
        }
      }
    })

    return [horizontalLines, verticalLines] as [ToDisplayLines, ToDisplayLines]
  }, [[], []] as unknown as [ToDisplayLines, ToDisplayLines])
}

/**
 * @description 获取单个widget的辅助线
 * @param sourceRect 移动中的widget
 * @param targetRect 参照的静止的widget
 */
function getSingleWidgetLines(sourceRect: DOMRect, targetRect: DOMRect) {
  const { left: containerLeft, top: containerTop } = middleContainerRef.value!.getBoundingClientRect()
  const toDisplayLines = {} as ToDisplayLines
  const meta = [{
    pos1: 'top',
    pos2: 'bottom',
    oris: xoris,
    containerOffset: containerTop
  }, {
    pos1: 'left',
    pos2: 'right',
    oris: yoris,
    containerOffset: containerLeft
  }] as const
  meta.forEach(({ pos1, pos2, oris, containerOffset }) => {
    oris.forEach(to => {
      const targetLinePos = to.includes('center') ? getCenter(targetRect[pos1], targetRect[pos2]) : targetRect[to as Exclude<Oris, 'xcenter' | 'ycenter'>]
      oris.forEach(so => {
        const sourceLinePos = so.includes('center') ? getCenter(sourceRect[pos1], sourceRect[pos2]) : sourceRect[so as Exclude<Oris, 'xcenter' | 'ycenter'>]
        const offset = Math.abs(targetLinePos - sourceLinePos)
        if (offset <= lineThreshold) {
          toDisplayLines[so] = {
            ori: so, [pos1]: targetLinePos - containerOffset, offset
          }
        }
      })
    })
  })
  return toDisplayLines
}

</script>

<style>
:root {
  --header-height: 64px;
}
</style>

<style scoped>
header {
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color, #bdbaba);
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
  --border-color: #bdbaba;
}

.left {
  padding: 10px;
  border-right: 1px solid var(--border-color);
}

.middle {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.right {
  display: none;
  width: 200px;
}

.line {
  position: absolute;
  display: none;
}

.line.horizontal {
  border-top: 1px dashed var(--border-color);
  width: 100%;
}

.line.vertical {
  border-left: 1px dashed var(--border-color);
  height: 100%;
}
</style>
