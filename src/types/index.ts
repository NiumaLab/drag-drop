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
