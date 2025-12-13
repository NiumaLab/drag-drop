import { markRaw, type Component } from 'vue'
import Box1 from './components/Box1.vue'

export class Material {
  public store = new Map<string, Component>()

  constructor() {
    this.register('box1', Box1)
  }

  public register(id: string, component: Component) {
    this.store.set(id, markRaw(component))
  }

  public get(id: string) {
    return this.store.get(id)
  }
}
