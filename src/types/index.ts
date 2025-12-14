export const xoris = ['bottom', 'xCenter', 'top'] as const
export const yoris = ['left', 'yCenter', 'right'] as const
export type Oris = (typeof xoris)[number] | (typeof yoris)[number]
export interface LineInfo {
  ori: Oris // 参照source
  top?: number // 水平线位置
  left?: number // 垂直线位置
  offset: number // source距离target偏移
  absOffset: number // source距离target偏移 绝对值
  sourcePos: number // source磁吸位置
}
export type ToDisplayLines = Record<Oris, LineInfo>

export interface Widget {
  id: number
  materialId: string
  pos: {
    x: number // left
    y: number // top
  }
  el: HTMLElement | null
}

export interface Line {
  display: 'none' | 'block'
  top?: string
  left?: string
}

export interface HorizontalLine extends Line {
  top: string
}

export interface VerticalLine extends Line {
  left: string
}
export interface MoveData {
  el: HTMLElement
  newX: number
  newY: number
  deltaX: number
  deltaY: number
}
