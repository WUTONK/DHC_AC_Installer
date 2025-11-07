import FS from 'fs'
import Path from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
import { compileString, Logger } from 'sass'
import type { PluginOption } from 'vite'

const require = createRequire(import.meta.url)

type SemiThemePluginOptions = {
  theme: string
  options?: {
    prefixCls?: string
    variables?: Record<string, string | number>
    include?: string
    cssLayer?: boolean
  }
}

export default function semiThemePlugin({ theme, options = {} }: SemiThemePluginOptions): PluginOption {
  return {
    name: 'semi-theme',
    enforce: 'post',
    load(id: string) {
      const filePath = normalizePath(id)
      const pluginOptions = { ...options }

      if (pluginOptions.include) {
        pluginOptions.include = normalizePath(pluginOptions.include)
      }

      if (/@douyinfe\/semi-(ui|icons|foundation)\/lib\/.+\.css$/.test(filePath)) {
        const scssFilePath = filePath.replace(/\.css$/, '.scss')

        const semiLoaderOptions = { name: theme }

        return compileString(
          loader(FS.readFileSync(scssFilePath), {
            ...semiLoaderOptions,
            ...pluginOptions,
            variables: convertMapToString(pluginOptions.variables || {})
          }),
          {
            importers: [
              {
                findFileUrl(url: string) {
                  if (url.startsWith('~')) {
                    try {
                      const resolved = require.resolve(url.substring(1), {
                        paths: [process.cwd(), Path.dirname(scssFilePath)]
                      })
                      return pathToFileURL(resolved)
                    } catch (err) {
                      return null
                    }
                  }

                  const resolvedPath = Path.resolve(Path.dirname(scssFilePath), url)

                  if (FS.existsSync(resolvedPath)) {
                    return pathToFileURL(resolvedPath)
                  }

                  return null
                }
              }
            ],
            logger: Logger.silent
          }
        ).css
      }

      return null
    }
  }
}

function loader(source: Buffer, options: any) {
  let fileStr = source.toString('utf8')

  const cssLayer = options.cssLayer ?? false

  const theme = options.name || '@douyinfe/semi-theme-default'
  const scssVarStr = `@import "~${theme}/scss/index.scss";\n`
  const cssVarStr = `@import "~${theme}/scss/global.scss";\n`
  let animationStr = `@import "~${theme}/scss/animation.scss";\n`

  try {
    require.resolve(`${theme}/scss/animation.scss`)
  } catch (e) {
    animationStr = ''
  }

  const shouldInject = fileStr.includes('semi-base')

  let componentVariables

  try {
    componentVariables = require.resolve(`${theme}/scss/local.scss`)
  } catch (e) {
    componentVariables = undefined
  }

  if (options.include || options.variables || componentVariables) {
    let localImport = ''
    if (componentVariables) {
      localImport += `\n@import "~${theme}/scss/local.scss";`
    }
    if (options.include) {
      localImport += `\n@import "${options.include}";`
    }
    if (options.variables) {
      localImport += `\n${options.variables}`
    }
    try {
      const regex = /(@import '.\/variables.scss';?|@import ".\/variables.scss";?)/g
      const fileSplit = fileStr.split(regex).filter((item: string) => Boolean(item))
      if (fileSplit.length > 1) {
        fileSplit.splice(fileSplit.length - 1, 0, localImport)
        fileStr = fileSplit.join('')
      }
    } catch (error) {}
  }

  const prefixCls = options.prefixCls || 'semi'

  const prefixClsStr = `$prefix: '${prefixCls}';\n`

  let finalCSS = ''

  if (shouldInject) {
    finalCSS = `${animationStr}${cssVarStr}${scssVarStr}${prefixClsStr}${fileStr}`
  } else {
    finalCSS = `${scssVarStr}${prefixClsStr}${fileStr}`
  }

  if (cssLayer) {
    finalCSS = `@layer semi{${finalCSS}}`
  }

  return finalCSS
}

function convertMapToString(map: Record<string, string | number>) {
  return Object.keys(map).reduce((prev, curr) => {
    return prev + `${curr}: ${map[curr]};\n`
  }, '')
}

function normalizePath(id: string) {
  return Path.posix.normalize(process.platform === 'win32' ? id.replace(/\\/g, '/') : id)
}

