import type { Config } from '@/types/config'
import { xoris, yoris, type MoveableEl, type Oris, type ToDisplayLines } from '@/types'

export class LineHelper {
  private containerRectCache: DOMRect | null = null

  constructor(
    private container: HTMLElement,
    private config: Config,
  ) {}

  public set(container: HTMLElement, config: Config) {
    this.container = container
    this.config = config
  }

  public setContainer(container: HTMLElement) {
    this.container = container
    this.containerRectCache = container.getBoundingClientRect()
  }

  public setConfig(config: Config) {
    this.config = config
  }

  /**
   * @description 获取辅助线
   * 1. TODO: 使用防抖（如100ms内只计算一次）减少高频计算，但可能影响实时性。
   * 2. TODO: 为拖拽中的元素建立邻近区域搜索，只计算一定范围内的元素。
   * 3. TODO: 实现边界框（Bounding Box）缓存，避免重复计算元素几何信息。
   * 4. TODO: getBoundingClientRect触发回流(reflow)，可考虑使用缓存的位置信息。
   */
  public getLines(source: MoveableEl, others: MoveableEl[]) {
    return others.reduce(
      (acc, other) => {
        const [horizontalLines, verticalLines] = acc
        const lines = this.getSingleMoveableElLines(
          source.wrapperEl!.getBoundingClientRect(),
          other.wrapperElRectCache!,
        )

        ;(Object.keys(lines) as Oris[]).forEach((ori) => {
          if (xoris.includes(ori as (typeof xoris)[number])) {
            const curLine = lines[ori]
            const accLine = horizontalLines[ori]
            if (!accLine || curLine.absOffset < accLine.absOffset) {
              horizontalLines[ori] = curLine
            }
          }
          if (yoris.includes(ori as (typeof yoris)[number])) {
            const curLine = lines[ori]
            const accLine = verticalLines[ori]
            if (!accLine || curLine.absOffset < accLine.absOffset) {
              verticalLines[ori] = curLine
            }
          }
        })

        return [horizontalLines, verticalLines] as [ToDisplayLines, ToDisplayLines]
      },
      [{}, {}] as unknown as [ToDisplayLines, ToDisplayLines],
    )
  }

  /**
   * @description 获取单个moveableEl的辅助线
   * @param sourceRect 移动中的moveableEl
   * @param targetRect 参照的静止的moveableEl
   */
  getSingleMoveableElLines(sourceRect: DOMRect, targetRect: DOMRect) {
    const { left: containerLeft, top: containerTop } = this.containerRectCache!
    const toDisplayLines = {} as ToDisplayLines
    const meta = [
      {
        pos1: 'top',
        pos2: 'bottom',
        oris: xoris,
        containerOffset: containerTop,
      },
      {
        pos1: 'left',
        pos2: 'right',
        oris: yoris,
        containerOffset: containerLeft,
      },
    ] as const
    meta.forEach(({ pos1, pos2, oris, containerOffset }) => {
      oris.forEach((to) => {
        const targetLinePos = to.includes('Center')
          ? getCenter(targetRect[pos1], targetRect[pos2])
          : targetRect[to as Exclude<Oris, 'xCenter' | 'yCenter'>]
        oris.forEach((so) => {
          const sourceLinePos = so.includes('Center')
            ? getCenter(sourceRect[pos1], sourceRect[pos2])
            : sourceRect[so as Exclude<Oris, 'xCenter' | 'yCenter'>]
          const offset = targetLinePos - sourceLinePos
          const absOffset = Math.abs(offset)
          if (absOffset <= this.config.lineThreshold) {
            const linePos = targetLinePos - containerOffset
            const sourcePosOffsetOrisMap: Record<Oris, number> = {
              top: 0,
              xCenter: sourceRect.height / 2,
              bottom: sourceRect.height,
              left: 0,
              yCenter: sourceRect.width / 2,
              right: sourceRect.width,
            }
            const sourcePos = linePos - sourcePosOffsetOrisMap[so]
            toDisplayLines[so] = {
              ori: so,
              [pos1]: linePos,
              offset,
              absOffset,
              sourcePos,
            }
          }
        })
      })
    })
    return toDisplayLines
  }

  public updateMoveableElPos(mEl: MoveableEl, x?: number, y?: number) {
    if (typeof x === 'number') {
      mEl.pos.x = x
    }
    if (typeof y === 'number') {
      mEl.pos.y = y
    }
  }

  /**
   * @description 获取辅助线最小偏移量，相对拖拽元素
   * @returns 辅助线最小偏移量(磁吸位置)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getMinOffsetSourcePos(lines: ToDisplayLines, delta: number) {
    // const lineInfos = Object.values(lines).filter(l => delta * l.offset > 0)
    const lineInfos = Object.values(lines)
    if (!lineInfos.length) {
      return
    }
    return lineInfos.reduce((min, line) => (line.absOffset < min.absOffset ? line : min)).sourcePos
  }
}

function getCenter(a: number, b: number) {
  return (a + b) / 2
}
