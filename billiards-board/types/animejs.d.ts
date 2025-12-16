declare module 'animejs' {
  export function animate(
    targets: string | Element | Element[] | NodeListOf<Element> | object,
    options?: Record<string, unknown>
  ): unknown;
  export function stagger(
    value: number | string | readonly (number | string)[],
    options?: Record<string, unknown>
  ): (element: Element, index: number, length: number) => number;
}
