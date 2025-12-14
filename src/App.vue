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
    <main class="middle" ref="middleContainer" @dragover.prevent @drop="handleDrop">
      <MoveWrapper :style="{
        left: widget.pos.x + 'px',
        top: widget.pos.y + 'px',
        position: 'absolute',
      }" v-for="widget in widgets" :key="widget.id" @mounted="handleWidgetMounted($event, widget)"
        @move="handleWidgetMove($event, widget)" @moveEnd="handleWidgetMoveEnd(widget)">
        <div style="position: absolute;">{{ widget.id }}</div>
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
import { nextTick, onMounted, ref, useTemplateRef } from 'vue';
import Box2 from './components/Box2.vue';
import MoveWrapper from './components/MoveWrapper.vue';
import { getUniqueId, objToArr } from '@/utils';
import { LineHelper } from '@/utils/lineHelper';
import type { HorizontalLine, LineInfo, MoveData, VerticalLine, Widget } from '@/types';
import { Material } from '@/material';

const middleContainerRef = useTemplateRef<HTMLDivElement>('middleContainer')


/**
 * init material
 */
const materials = new Material()
const initialMaterialId = getUniqueId()
materials.register(initialMaterialId, Box2)

const widgets = ref<Widget[]>([])
let id = 0

if (initialMaterialId) {
  widgets.value.push({
    id: id++,
    materialId: initialMaterialId,
    pos: { x: 0, y: 0 },
    el: null,
  })
}

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

  widgets.value.push({
    id: id++,
    materialId: materialId,
    pos: { x, y },
    el: null,
  })
}

function handleWidgetMounted(el: HTMLElement, widget: Widget) {
  widget.el = el
}

const horizontalLinesStyle = ref<HorizontalLine[]>([])
const verticalLinesStyle = ref<VerticalLine[]>([])

async function handleWidgetMove(e: MoveData, widget: Widget) {
  lineHelper.updateWidgetPos(widget, e.newX, e.newY)
  const otherWidget = widgets.value.filter(w => w.id !== widget.id)
  if (!otherWidget.length) {
    return
  }
  await nextTick()
  const [newY, newX] = setLines(widget, otherWidget, e)
  lineHelper.updateWidgetPos(widget, newX, newY)
}

/**
 * @description 计算并设置辅助线，并返回磁吸后的新位置
 * @returns [newY, newX] 磁吸后的新位置
 */
function setLines(source: Widget, others: Widget[], extra: MoveData) {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleWidgetMoveEnd(widget: Widget) {
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
