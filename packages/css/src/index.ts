import * as CSS from 'csstype'

import { SystemStyleObject, UseThemeFunction, Theme } from './types'

export * from './types'

// to enable deep level flatten use recursion with reduce and concat
const flatDeep = arr =>
  arr.reduce(
    (acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val) : val),
    []
  )

export function get(
  obj: object,
  key: string | number,
  def?: unknown,
  p?: number,
  undef?: unknown
): any {
  const path = key && typeof key === 'string' ? key.split('.') : [key]
  for (p = 0; p < path.length; p++) {
    obj = obj ? (obj as any)[path[p]] : undef
  }
  return obj === undef ? def : obj
}

const defaultBreakpoints = [40, 52, 64].map(n => n + 'em')

const defaultTheme = {
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 72],
}

const aliases = {
  bg: 'backgroundColor',
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginX',
  my: 'marginY',
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingX',
  py: 'paddingY',
} as const
type Aliases = typeof aliases

export const multiples = {
  marginX: ['marginLeft', 'marginRight'],
  marginY: ['marginTop', 'marginBottom'],
  paddingX: ['paddingLeft', 'paddingRight'],
  paddingY: ['paddingTop', 'paddingBottom'],
  size: ['width', 'height'],
}

export const scales = {
  color: 'colors',
  backgroundColor: 'colors',
  borderColor: 'colors',
  margin: 'space',
  marginTop: 'space',
  marginRight: 'space',
  marginBottom: 'space',
  marginLeft: 'space',
  marginX: 'space',
  marginY: 'space',
  padding: 'space',
  paddingTop: 'space',
  paddingRight: 'space',
  paddingBottom: 'space',
  paddingLeft: 'space',
  paddingX: 'space',
  paddingY: 'space',
  top: 'space',
  right: 'space',
  bottom: 'space',
  left: 'space',
  gridGap: 'space',
  gridColumnGap: 'space',
  gridRowGap: 'space',
  gap: 'space',
  columnGap: 'space',
  rowGap: 'space',
  fontFamily: 'fonts',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights',
  letterSpacing: 'letterSpacings',
  border: 'borders',
  borderTop: 'borders',
  borderRight: 'borders',
  borderBottom: 'borders',
  borderLeft: 'borders',
  borderWidth: 'borderWidths',
  borderStyle: 'borderStyles',
  borderRadius: 'radii',
  borderTopRightRadius: 'radii',
  borderTopLeftRadius: 'radii',
  borderBottomRightRadius: 'radii',
  borderBottomLeftRadius: 'radii',
  borderTopWidth: 'borderWidths',
  borderTopColor: 'colors',
  borderTopStyle: 'borderStyles',
  borderBottomWidth: 'borderWidths',
  borderBottomColor: 'colors',
  borderBottomStyle: 'borderStyles',
  borderLeftWidth: 'borderWidths',
  borderLeftColor: 'colors',
  borderLeftStyle: 'borderStyles',
  borderRightWidth: 'borderWidths',
  borderRightColor: 'colors',
  borderRightStyle: 'borderStyles',
  outlineColor: 'colors',
  boxShadow: 'shadows',
  textShadow: 'shadows',
  zIndex: 'zIndices',
  width: 'sizes',
  minWidth: 'sizes',
  maxWidth: 'sizes',
  height: 'sizes',
  minHeight: 'sizes',
  maxHeight: 'sizes',
  flexBasis: 'sizes',
  size: 'sizes',
  // svg
  fill: 'colors',
  stroke: 'colors',
} as const
type Scales = typeof scales

const positiveOrNegative = (scale: object, value: string | number) => {
  if (typeof value !== 'number' || value >= 0) {
    return get(scale, value, value)
  }
  const absolute = Math.abs(value)
  const n = get(scale, absolute, absolute)
  if (typeof n === 'string') return '-' + n
  return Number(n) * -1
}

const transforms = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginX',
  'marginY',
  'top',
  'bottom',
  'left',
  'right',
].reduce(
  (acc, curr) => ({
    ...acc,
    [curr]: positiveOrNegative,
  }),
  {}
)

const responsive = (styles: Exclude<SystemStyleObject, UseThemeFunction>) => (
  theme?: Theme
) => {
  const next: Exclude<SystemStyleObject, UseThemeFunction> = {}
  const breakpoints =
    (theme && (theme.breakpoints as string[])) || defaultBreakpoints
  const mediaQueries = [
    null,
    ...breakpoints.map(n => `@media screen and (min-width: ${n})`),
  ]

  for (const key in styles) {
    const value =
      typeof styles[key] === 'function' ? styles[key](theme) : styles[key]

    if (value == null) continue

    if (!Array.isArray(value)) {
      next[key] = value
      continue
    }

    if (key === 'variants') {
      let variants = []
      let mediaVariants = []
      for (let i = 0; i < value.length; i++) {
        const variant =
          typeof value[i] === 'function' ? value[i](theme) : value[i]

        if (variant == null) continue

        if (!Array.isArray(variant)) {
          variants = [...variants, variant]
          next[key] = variants
          continue
        }

        const flatVariant = flatDeep(variant)
        for (
          let i = 0;
          i < flatVariant.slice(0, mediaQueries.length).length;
          i++
        ) {
          const media = mediaQueries[i]

          if (!media) {
            variants = [...variants, flatVariant[i]]
            next[key] = variants
            continue
          }

          next[media] = next[media] || {}

          if (flatVariant[i] == null) continue

          mediaVariants = [...mediaVariants, flatVariant[i]]
          next[media][key] = mediaVariants
        }
      }
      continue
    }

    for (let i = 0; i < value.slice(0, mediaQueries.length).length; i++) {
      const media = mediaQueries[i]
      if (!media) {
        next[key] = value[i]
        continue
      }
      next[media] = next[media] || {}
      if (value[i] == null) continue
      next[media][key] = value[i]
    }
  }

  return next
}

type CssPropsArgument = { theme: Theme } | Theme

export const css = (args: SystemStyleObject = {}) => (
  props: CssPropsArgument = {}
): CSS.Properties => {
  const theme: Theme = {
    ...defaultTheme,
    ...('theme' in props ? props.theme : props),
  }
  let result = {}
  const obj = typeof args === 'function' ? args(theme) : args
  const styles = responsive(obj)(theme)

  for (const key in styles) {
    const x = styles[key]
    const val = typeof x === 'function' ? x(theme) : x

    if (key === 'variant') {
      const variant = css(get(theme, val))(theme)
      result = { ...result, ...variant }
      continue
    }

    if (key === 'variants') {
      const variantsArray = flatDeep([val])
      for (let i = 0; i < variantsArray.length; i++) {
        const variants = css(get(theme, variantsArray[i]))(theme)
        result = { ...result, ...variants }
      }
      continue
    }

    if (val && typeof val === 'object') {
      result[key] = css(val)(theme)
      continue
    }

    const prop = key in aliases ? aliases[key as keyof Aliases] : key
    const scaleName = prop in scales ? scales[prop as keyof Scales] : undefined
    const scale = get(theme, scaleName as any, get(theme, prop, {}))
    const transform: any = get(transforms, prop, get)
    const value = transform(scale, val, val)

    if (multiples[prop]) {
      const dirs = multiples[prop]

      for (let i = 0; i < dirs.length; i++) {
        result[dirs[i]] = value
      }
    } else {
      result[prop] = value
    }
  }

  return result
}
