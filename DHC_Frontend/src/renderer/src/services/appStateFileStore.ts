// 注意：渲染进程在 Vite 环境下直接 `import 'path'/'fs'` 可能被替换为浏览器 polyfill，
// 导致 path.resolve 不存在。这里强制使用 Electron renderer 的 Node 内置模块。
// 前提：main 窗口已开启 nodeIntegration 且 contextIsolation=false（你当前就是这个配置）。
// eslint-disable-next-line no-unused-vars
type NodeRequireOnWindow = { require: (moduleId: string) => unknown }
const fs = (window as unknown as NodeRequireOnWindow).require('fs') as typeof import('fs')
const path = (window as unknown as NodeRequireOnWindow).require('path') as typeof import('path')

export interface ServerDisclaimerState {
  shownCount: number
  devForceShowSuppressed: boolean
}

export interface AppStateJson {
  firstLaunchCompleted?: boolean
  serverDisclaimer?: ServerDisclaimerState
}

const DEFAULT_STATE: AppStateJson = {
  firstLaunchCompleted: false,
  serverDisclaimer: {
    shownCount: 0,
    devForceShowSuppressed: false
  }
}

function resolveAppStatePath(): string {
  // 1) 常见场景：electron 从项目根目录启动
  const cwdCandidate = path.resolve(process.cwd(), 'DHC_Backend', 'Databese', 'appState.json')
  if (fs.existsSync(cwdCandidate)) return cwdCandidate

  // 2) 兜底：向上找一层（有时 CWD 可能是 DHC_Frontend）
  const upCandidate = path.resolve(process.cwd(), '..', 'DHC_Backend', 'Databese', 'appState.json')
  if (fs.existsSync(upCandidate)) return upCandidate

  // 3) 最后兜底：返回 CWD 方案（让调用方能看到“找不到/写不进去”的报错）
  return cwdCandidate
}

function readJsonSafe(filePath: string): AppStateJson {
  try {
    if (!fs.existsSync(filePath)) return DEFAULT_STATE
    const raw = fs.readFileSync(filePath, 'utf8')
    if (!raw.trim()) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as AppStateJson

    const shownCount = Number(parsed.serverDisclaimer?.shownCount)
    const devForceShowSuppressed = Boolean(parsed.serverDisclaimer?.devForceShowSuppressed)
    return {
      ...DEFAULT_STATE,
      ...parsed,
      serverDisclaimer: {
        ...DEFAULT_STATE.serverDisclaimer,
        shownCount: Number.isNaN(shownCount) || shownCount < 0 ? 0 : shownCount,
        devForceShowSuppressed
      }
    }
  } catch {
    return DEFAULT_STATE
  }
}

function writeJson(filePath: string, state: AppStateJson): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8')
}

export function getServerDisclaimerState(): ServerDisclaimerState {
  const filePath = resolveAppStatePath()
  const state = readJsonSafe(filePath)
  const shownCount = Number(state.serverDisclaimer?.shownCount)
  return {
    shownCount: Number.isNaN(shownCount) || shownCount < 0 ? 0 : shownCount,
    devForceShowSuppressed: Boolean(state.serverDisclaimer?.devForceShowSuppressed)
  }
}

export function setServerDisclaimerState(next: ServerDisclaimerState): void {
  const filePath = resolveAppStatePath()
  const current = readJsonSafe(filePath)
  const state: AppStateJson = {
    ...current,
    serverDisclaimer: {
      shownCount: next.shownCount < 0 ? 0 : next.shownCount,
      devForceShowSuppressed: next.devForceShowSuppressed
    }
  }
  writeJson(filePath, state)
}

