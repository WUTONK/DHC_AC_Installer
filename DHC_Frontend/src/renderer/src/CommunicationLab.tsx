import React, { useMemo, useRef, useState } from 'react'
import { Button, Card, Input, Layout, Progress, Tag, Typography } from '@douyinfe/semi-ui'
import HomeBreadcrumb from './components/HomeBreadcrumb'

type LogLevel = 'req' | 'res' | 'info' | 'success' | 'error'

interface LogEntry {
  id: number
  level: LogLevel
  text: string
  time: string
  data?: unknown
}

interface IpcApiResult {
  success: boolean
  data?: unknown
  error?: string
  status: number
  statusText: string
  ok: boolean
  headers?: Record<string, string>
}

const BACKEND_BASE = 'http://127.0.0.1:19810'

interface LessonStep {
  id: 'step1' | 'step2' | 'step3'
  title: string
  goal: string
  files: string[]
  todo: string
  check: string
}

function nowTimeString(): string {
  const now = new Date()
  return `${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`
}

function CommunicationLab(): React.JSX.Element {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [name, setName] = useState<string>('electron-beginner')
  const [progress, setProgress] = useState<number>(0)
  const [running, setRunning] = useState<boolean>(false)
  const [teachingMode, setTeachingMode] = useState<boolean>(true)
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({})
  const logTailRef = useRef<HTMLDivElement>(null)

  const addLog = (level: LogLevel, text: string, data?: unknown): void => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), level, text, time: nowTimeString(), data }])
    queueMicrotask(() => logTailRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  const resetLab = (): void => {
    setLogs([])
    setProgress(0)
  }

// HTTPS请求处理模块 支持 GET/POST
  const request = async (
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<unknown> => {
    addLog('req', `${method} ${path}`, body)
    const options =
      body === undefined
        ? { method }
        : { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
    const result = (await window.api.requestApi(`${BACKEND_BASE}${path}`, options)) as IpcApiResult
    if (!result.success) {
      addLog('error', 'IPC/网络错误', result.error)
      throw new Error(result.error || 'IPC request failed')
    }
    addLog('res', `${result.status} ${result.statusText}`, result.data)
    if (!result.ok) {
      throw new Error(`HTTP ${result.status}`)
    }
    return result.data
  }

  const runStepPing = async (): Promise<void> => {
    await request('GET', '/api/lab/ping')
    addLog('success', 'Step 1 完成：后端在线')
  }

  const runStepEcho = async (): Promise<void> => {
    await request('POST', '/api/lab/echo', {
      userInput: name,
      from: 'renderer',
      learnerLevel: 'WUTONG',
      timestamp: Date.now()
    })
    addLog('success', 'Step 2 完成：JSON 成功往返')
  }

  const runStepTask = async (): Promise<void> => {
    setRunning(true)
    setProgress(0)
    try {
      const start = (await request('POST', '/api/lab/task/start')) as { taskId?: string }
      if (!start.taskId) {
        throw new Error('missing taskId from backend')
      }
      addLog('info', `Step 3 开始：taskId=${start.taskId}`)

      for (;;) {
        const data = (await request('GET', `/api/lab/task/status?taskId=${encodeURIComponent(start.taskId)}`)) as {
          status?: string
          progress?: number
        }
        const next = typeof data.progress === 'number' ? data.progress : 0
        setProgress(next)
        addLog('info', `轮询进度：${next}%`)
        if (data.status === 'done' || next >= 100) {
          addLog('success', 'Step 3 完成：轮询结束')
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    } finally {
      setRunning(false)
    }
  }

  const intro = useMemo(
    () => [
      'Step 1: GET /api/lab/ping（确认后端在线）',
      'Step 2: POST /api/lab/echo（发送 JSON 并回显）',
      'Step 3: POST + 轮询 GET（完整异步任务流程）'
    ],
    []
  )

  const lessons = useMemo<LessonStep[]>(
    () => [
      {
        id: 'step1',
        title: 'Step 1 - Ping',
        goal: '理解最短请求链路：Renderer -> IPC -> Main fetch -> Gin -> Renderer',
        files: [
          'DHC_Frontend/src/renderer/src/CommunicationLab.tsx',
          'DHC_Frontend/src/main/index.ts',
          'DHC_Backend/handler/labdemo.go'
        ],
        todo: '把 /api/lab/ping 返回 JSON 中新增字段 lesson: "step1" ，再点击运行 Step 1',
        check: '右侧日志 RES 的 data 里能看到 lesson 字段'
      },
      {
        id: 'step2',
        title: 'Step 2 - Echo JSON',
        goal: '理解 POST JSON 的 body/headers 是如何一路传到 Gin 的',
        files: [
          'DHC_Frontend/src/renderer/src/CommunicationLab.tsx',
          'DHC_Frontend/src/preload/index.ts',
          'DHC_Frontend/src/main/index.ts',
          'DHC_Backend/handler/labdemo.go'
        ],
        todo: '在前端 body 里新增一个字段 learnerLevel，然后在后端原样回显',
        check: '右侧日志里 REQ 和 RES 的 echo 中都能看到 learnerLevel'
      },
      {
        id: 'step3',
        title: 'Step 3 - Task + Polling',
        goal: '理解异步任务接口设计：start 创建任务，status 轮询进度',
        files: [
          'DHC_Frontend/src/renderer/src/CommunicationLab.tsx',
          'DHC_Backend/handler/labdemo.go'
        ],
        todo: '把轮询间隔从 500ms 改成 300ms，并把后端进度速度改慢（例如 /80）',
        check: '进度条更新更频繁，但整体完成时间更长'
      }
    ],
    []
  )

  const markDone = (id: LessonStep['id']): void => {
    setDoneMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', background: '#141418', color: '#fff' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #2c2c33' }}>
        <HomeBreadcrumb current="前后端通信实验室（新手版）" />
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Card title="从零跑通通信链路" style={{ background: '#23232a', border: '1px solid #31313a' }}>
            <Typography.Text style={{ color: '#d0d0da' }}>
              目标：亲眼看到 React 页面发请求，通过 IPC 到主进程，再到 Gin，最后回到页面。
            </Typography.Text>
            <div style={{ marginTop: 10 }}>
              <Button size="small" theme={teachingMode ? 'solid' : 'light'} onClick={() => setTeachingMode((v) => !v)}>
                {teachingMode ? '教学模式: 已开启' : '教学模式: 已关闭'}
              </Button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {intro.map((x) => (
                <Tag key={x} color="white">
                  {x}
                </Tag>
              ))}
            </div>
          </Card>

          <Card
            title="Step 1 - Ping"
            style={{ marginTop: 16, background: '#23232a', border: '1px solid #31313a' }}
            headerExtraContent={<Button onClick={() => void runStepPing()}>运行 Step 1</Button>}
          >
            <Typography.Text style={{ color: '#c4c4d0' }}>
              用 GET 请求确认后端进程和路由都正常。
            </Typography.Text>
            {teachingMode && (
              <TeachingBlock
                step={lessons[0]}
                done={Boolean(doneMap.step1)}
                onToggleDone={() => markDone('step1')}
              />
            )}
          </Card>

          <Card
            title="Step 2 - Echo JSON"
            style={{ marginTop: 16, background: '#23232a', border: '1px solid #31313a' }}
            headerExtraContent={<Button onClick={() => void runStepEcho()}>运行 Step 2</Button>}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Typography.Text style={{ color: '#c4c4d0' }}>发送字段 userInput:</Typography.Text>
              <Input value={name} onChange={setName} style={{ maxWidth: 280 }} />
            </div>
            {teachingMode && (
              <TeachingBlock
                step={lessons[1]}
                done={Boolean(doneMap.step2)}
                onToggleDone={() => markDone('step2')}
              />
            )}
          </Card>

          <Card
            title="Step 3 - Start Task + Polling"
            style={{ marginTop: 16, background: '#23232a', border: '1px solid #31313a' }}
            headerExtraContent={
              <Button loading={running} onClick={() => void runStepTask()}>
                运行 Step 3
              </Button>
            }
          >
            <Typography.Text style={{ color: '#c4c4d0' }}>先创建任务，再每 500ms 轮询状态直到完成。</Typography.Text>
            <div style={{ marginTop: 12 }}>
              <Progress percent={progress} showInfo />
            </div>
            {teachingMode && (
              <TeachingBlock
                step={lessons[2]}
                done={Boolean(doneMap.step3)}
                onToggleDone={() => markDone('step3')}
              />
            )}
          </Card>
        </div>

        <div style={{ width: 470, borderLeft: '1px solid #2c2c33', background: '#0f0f13', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2c2c33', display: 'flex', justifyContent: 'space-between' }}>
            <Typography.Text strong style={{ color: '#d4d4dd' }}>
              实时日志
            </Typography.Text>
            <Button size="small" onClick={resetLab}>
              清空
            </Button>
          </div>
          <div style={{ padding: 12, overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: 12 }}>
            {logs.map((x) => (
              <div key={x.id} style={{ marginBottom: 10 }}>
                <div style={{ color: '#727280' }}>
                  [{x.time}] <b>{x.level.toUpperCase()}</b>
                </div>
                <div style={{ color: '#d7d7e0' }}>{x.text}</div>
                {x.data !== undefined && (
                  <pre style={{ marginTop: 4, padding: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: '#9ad4ff' }}>
                    {JSON.stringify(x.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            <div ref={logTailRef} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CommunicationLab

function TeachingBlock({
  step,
  done,
  onToggleDone
}: {
  step: LessonStep
  done: boolean
  onToggleDone: () => void
}): React.JSX.Element {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: '1px dashed #4e4e61',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.03)'
      }}
    >
      <Typography.Text strong style={{ color: '#f3f3fb' }}>
        学习目标：{step.goal}
      </Typography.Text>
      <div style={{ marginTop: 8 }}>
        <Typography.Text style={{ color: '#b7b7c7' }}>建议先打开这些文件：</Typography.Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {step.files.map((f) => (
            <Tag key={f} color="grey">
              {f}
            </Tag>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Typography.Text style={{ color: '#ffd89b' }}>练习任务：{step.todo}</Typography.Text>
      </div>
      <div style={{ marginTop: 4 }}>
        <Typography.Text style={{ color: '#9de2a1' }}>通过标准：{step.check}</Typography.Text>
      </div>
      <div style={{ marginTop: 10 }}>
        <Button size="small" type={done ? 'primary' : 'tertiary'} onClick={onToggleDone}>
          {done ? '已完成（点击可取消）' : '标记为已完成'}
        </Button>
      </div>
    </div>
  )
}
