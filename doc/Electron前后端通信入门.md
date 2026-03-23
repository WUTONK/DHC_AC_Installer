# Electron + React + Go/Gin：本项目的请求是怎么走的？

面向：**熟悉 React 和 Go/Gin，但不熟悉 Electron** 的开发者。读完应能回答：「我写的 React 代码是怎么调用到 Gin 接口的？」

---

## 1. 先对照：你熟悉的模式 vs 本项目

| 你熟悉的（浏览器 + 后端） | 本项目（Electron 桌面应用） |
|---------------------------|-----------------------------|
| React 跑在浏览器里，地址例如 `http://localhost:5173` | React 跑在 **Electron 的窗口**里，页面是打包进应用的本地文件，不是你在浏览器里单独打开的那个开发服务器 |
| 前端直接 `fetch('http://127.0.0.1:19810/api/...')` 调后端 | 本项目里，**渲染进程**（跑 React 的那一侧）通过 **`window.api.requestApi`** 发消息，真正发 HTTP 的是 **主进程**（Node.js 环境） |
| 后端是单独终端里 `go run` 起的 Gin | 一样：Gin 监听 **`127.0.0.1:19810`**；Electron 主进程启动时还会 **自动拉起** 后端可执行文件（开发环境） |

结论：**Gin 还是你熟悉的 Gin 写 HTTP 接口**；多出来的是 Electron 把「前端页面」和「谁去发 HTTP」拆成了两层。

---

## 2. Electron 里至少要记住的三个角色

可以把桌面应用想成「一个小团队」：

1. **主进程（Main）**  
   - 对应文件：`DHC_Frontend/src/main/index.ts`（入口）  
   - 类似 Node.js 程序：能起窗口、能 `fetch`、能起子进程。  
   - 这里会 **启动后端** `DHC_Backend` 可执行文件，并注册 **`api-request`** 这条 IPC。

2. **渲染进程（Renderer）**  
   - 你的 **React 页面**跑在这里，和浏览器里跑 React 很像（DOM、Hooks 都一样）。  
   - 默认 **不能直接** 用 Node 的能力；和主进程通信要靠 **IPC**。

3. **预加载脚本（Preload）**  
   - 对应文件：`DHC_Frontend/src/preload/index.ts`  
   - 在页面和主进程之间**搭桥**：在**安全的前提下**把 `window.api` 挂到页面上。

**IPC** 就是进程间通信：渲染进程发「帮我去请求这个 URL」，主进程收到后用 `fetch` 请求 Gin，再把结果返回。

---

## 3. 一条请求从 React 到 Gin 的完整流程（最重要）

下面按**时间顺序**拆成 6 步。你可以对着代码搜关键词。

```
[1] React 组件里调用
        window.api.requestApi('http://127.0.0.1:19810/api/xxx', { body, method, ... })
        ↓
[2] preload 里把 invoke 转发到主进程
        ipcRenderer.invoke('api-request', url, options)
        ↓
[3] 主进程 ipcMain.handle('api-request', ...) 收到
        使用 fetch(url, { method, body, headers }) 请求本地 Gin
        ↓
[4] Gin（Go）处理路由，返回 JSON
        ↓
[5] 主进程把响应 body 解析成 JSON，打包成 { success, data, status, ... } 通过 IPC 返回
        ↓
[6] React 里 await 拿到结果，更新界面或打 log
```

**和你熟悉的「React fetch 后端」相比**：  
差别只在 **第 2～5 步**：不是「浏览器 → 直接 HTTP」，而是 **「React → IPC → 主进程 → HTTP → Gin」**。

---

## 4. 和 OpenAPI 生成的客户端的关系

项目里还有一套 **`src/shared/index.ts`** 里的 `Api`（`DefaultApi`）：

- 它把 **fetch** 换成了 **`ipcFetch`**：内部仍然调用 `window.api.requestApi(url)`，只是 URL 用 `basePath http://127.0.0.1:19810` 拼好。
- 所以：**业务代码用 `Api.xxx()` 时，底层还是走同一套 IPC + 主进程 `fetch`**。

---

## 5. 端口与进程（你调试时心里要有数）

| 服务 | 地址/说明 |
|------|-----------|
| Gin 后端 | `http://127.0.0.1:19810`（见 `DHC_Backend/cmd/main.go`） |
| 开发时前端 dev server | 工具链里会配一个端口（例如 `11451`），由 Electron 窗口加载；**不是**你调后端用的端口 |

**后端 19810** 是 **HTTP API**；Electron 里 React 不直接连这个端口发请求，而是**主进程**去连。

---

## 6. 代码地图（想改某一层时去哪找）

| 你想做的事 | 主要看哪个文件 |
|------------|----------------|
| 改「页面怎么请求」、TestPlayground 的 `requestBackend` | `DHC_Frontend/src/renderer/src/TestPlayground.tsx` |
| 改「暴露给页面什么 API」 | `DHC_Frontend/src/preload/index.ts` + `preload/index.d.ts`（类型） |
| 改「真正怎么发 HTTP」、错误处理 | `DHC_Frontend/src/main/index.ts` 里 `ipcMain.handle('api-request', ...)` |
| 改「用 `Api` 客户端时的 fetch」 | `DHC_Frontend/src/shared/index.ts` |
| 改 Gin 路由与业务 | `DHC_Backend/handler/init.go` 及各 handler；演示接口在 `handler/testplayground.go` |

---

## 7. TestPlayground 页面在干什么（和「模拟」对照）

- **左侧**：每个「测试用例」是一个 `action`，里面可以调用传入的 `log(...)`。  
- **`log` 和 `addLog` 是同一个函数**：往 React 的 `logs` state 里追加一条，**右侧**只是 `logs.map` 渲染出来，**没有**经过网络或 IPC。

- **「安装流程测试」里纯前端 `setTimeout` 的**：全部是**模拟**，没有打到 Gin。

- **「真实端到端 DEMO」**：  
  - 调用 `requestBackend` → `window.api.requestApi` → 主进程 `fetch` → **你写的 Gin 接口**（如 `/api/TestPlaygroundHealth`）。  
  - 右侧看到的 **REQ / RES** 就是这次真实往返里**在前端打印的日志**，不是后端自动推过来的。

---

## 8. 小结（一句话）

**React 只负责界面和调用 `window.api.requestApi`；真正访问 `127.0.0.1:19810` 的是 Electron 主进程里的 `fetch`；Gin 与纯浏览器 + Go 项目里写的没有本质区别。**

你只需多记一层：**「前端页面 → IPC → 主进程 → HTTP → Gin」**。

---

## 9. 推荐阅读顺序（官方文档）

1. [Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model)（主进程 / 渲染进程）  
2. [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)（为什么用 preload 暴露 `window.api`）  
3. [IPC 通信](https://www.electronjs.org/docs/latest/tutorial/ipc)（`invoke` / `handle`）

读完再对照本文第 3 节的 6 步，会更容易对应到代码。
