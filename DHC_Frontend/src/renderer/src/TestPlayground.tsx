import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Card, Typography, Row, Col, Tag, Divider, Spin, Progress, Space } from '@douyinfe/semi-ui';
import {
    IconCode, IconServer, IconPlay, IconDelete, IconBox, IconLink
} from '@douyinfe/semi-icons';
import HomeBreadcrumb from './components/HomeBreadcrumb';

// =================================================================
// 1. 类型定义 (Type Definitions)
// =================================================================

type LogType = 'info' | 'success' | 'error' | 'warning' | 'req' | 'res';

// eslint-disable-next-line no-unused-vars
interface Logger {
    (type: LogType, message: string, data?: unknown): void;
}

// eslint-disable-next-line no-unused-vars
interface TestAction {
    (log: Logger): Promise<void>;
}

interface LogEntry {
    id: number;
    time: string;
    type: LogType;
    message: string;
    data?: unknown; // 可选的详细数据对象
}

interface TestCase {
    id: string;
    name: string;
    desc?: string;
    action: TestAction;
    renderCustomUI?: () => React.ReactNode; // 允许渲染自定义交互面板
}

interface TestSuite {
    id: string;
    title: string;
    icon: React.ReactNode;
    cases: TestCase[];
}

// --- 安装通用任务接口模型 ---
export interface InstallationCreateResponse {
    id: string;
    versionId: string;
    status: string;
    startTime: number;
}

export interface InstallationCategoryProgress {
    categoryId: string;
    categoryName: string;
    status: 'waiting' | 'active' | 'completed' | 'failed' | string;
    progress: number;
    currentItem: string;
    totalItems: number;
    completedItems: number;
    subProgress: number;
}

export interface InstallationProgressResponse {
    installId: string;
    status: 'preparing' | 'installing' | 'completed' | 'failed' | string;
    totalProgress: number;
    categories: InstallationCategoryProgress[];
    startTime: number;
    endTime: number | null;
    error: string | null;
}

const { Header } = Layout;
const { Title, Text } = Typography;

/** 与 DHC_Backend/cmd/main.go 监听端口一致 */
const BACKEND_BASE = 'http://127.0.0.1:19810';

/**
 * 经主进程 fetch 代理请求本地后端（与 OpenAPI 客户端同源路径）。
 * 会写入右侧 Console：REQ / RES。
 */
async function requestBackend(
    log: Logger,
    method: string,
    pathAndQuery: string,
    body?: Record<string, unknown>
): Promise<unknown> {
    const url = `${BACKEND_BASE}${pathAndQuery}`;
    const hasBody = body !== undefined;
    log('req', `${method} ${pathAndQuery}`, hasBody ? body : undefined);
    const result = await window.api.requestApi(
        url,
        hasBody
            ? {
                  method,
                  body: JSON.stringify(body),
                  headers: { 'Content-Type': 'application/json' }
              }
            : { method }
    );
    if (!result.success) {
        log('error', 'IPC/网络失败', { error: result.error });
        throw new Error(result.error || 'request failed');
    }
    log('res', `${result.status} ${result.statusText}`, result.data);
    if (!result.ok) {
        throw new Error(`HTTP ${result.status}`);
    }
    return result.data;
}

// =================================================================
// 2. 页面组件 (TestPlayground)
// =================================================================

export default function TestPlayground(): React.JSX.Element {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const logEndRef = useRef<HTMLDivElement>(null);

    // 安装状态存储
    const [installProgress, setInstallProgress] = useState<InstallationProgressResponse | null>(null);
    const isPollingRef = useRef<boolean>(false);
    const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- 日志系统 ---
    const addLog = (type: LogType, message: string, data?: unknown): void => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        setLogs((prev) => [...prev, {
            id: Date.now() + Math.random(),
            time: timeStr,
            type,
            message,
            data
        }]);
    };

    const clearLogs = (): void => setLogs([]);

    // 自动滚动到底部
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // 组件卸载时停止轮询
    useEffect(() => {
        return () => {
            isPollingRef.current = false;
            if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
            }
        };
    }, []);

    // --- 执行常规测试 ---
    const runTest = async (testCase: TestCase): Promise<void> => {
        setLoadingMap((prev) => ({ ...prev, [testCase.id]: true }));
        addLog('info', `--- 开始执行测试: [${testCase.name}] ---`);

        try {
            await testCase.action(addLog);
        } catch (error) {
            addLog('error', `执行异常: ${error}`);
            console.error(error);
        } finally {
            setLoadingMap((prev) => ({ ...prev, [testCase.id]: false }));
            addLog('info', `--- 测试结束 ---`);
        }
    };

    // =================================================================
    // 3. 安装流程专属方法
    // =================================================================

    const stopPolling = (): void => {
        isPollingRef.current = false;
        if (pollingTimerRef.current) {
            clearTimeout(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
    };

    const pollInstallationProgress = async (installId: string, log: Logger): Promise<void> => {
        isPollingRef.current = true;

        const poll = async (): Promise<void> => {
            if (!isPollingRef.current) return;
            try {
                const progress = (await requestBackend(
                    log,
                    'GET',
                    `/api/installations/${installId}/progress?category=all`
                )) as InstallationProgressResponse;

                setInstallProgress(progress);

                if (progress.status === 'completed' || progress.status === 'failed') {
                    stopPolling();
                    log(progress.status === 'completed' ? 'success' : 'error', `安装任务已${progress.status === 'completed' ? '完成' : '失败'}`, progress);
                    return; // 结束轮询
                }
            } catch (err: unknown) {
                log('error', `获取安装进度失败: ${err}`);
                stopPolling();
                return;
            }

            // 继续下一轮轮询，间隔 2ms
            if (isPollingRef.current) {
                pollingTimerRef.current = setTimeout(() => {
                    void poll();
                }, 2);
            }
        };

        // 发起第一次轮询
        pollingTimerRef.current = setTimeout(() => {
            void poll();
        }, 2);
    };

    const startInstallationDemo = async (log: Logger): Promise<void> => {
        // 先重置旧状态与轮询
        stopPolling();
        setInstallProgress(null);

        try {
            const response = (await requestBackend(log, 'POST', '/api/installations', {
                versionId: 'cm-demo-v1'
            })) as InstallationCreateResponse;

            log('info', `成功创建安装任务，Install ID: ${response.id}`);

            // 开始轮询进度
            await pollInstallationProgress(response.id, log);
        } catch (err: unknown) {
            log('error', `创建安装任务请求失败: ${err}`);
            throw err;
        }
    };

    // =================================================================
    // 4. 自定义面板渲染
    // =================================================================

    const getCategoryStatusColor = (status: string): string => {
        switch (status) {
            case 'active':
                return '#52c41a';
            case 'failed':
                return '#ff4d4f';
            case 'completed':
                return '#22d3ee';
            default:
                return '#8c8c8c';
        }
    };

    const renderInstallationDemoPanel = (): React.ReactNode => {
        if (!installProgress) return null;

        return (
            <div style={{ marginTop: 16 }}>
                <Card style={{ backgroundColor: '#1a1a1c', border: '1px solid #333' }}>
                    <Title heading={5} style={{ color: '#eee', marginBottom: 16 }}>当前安装任务面板</Title>
                    <Space vertical align="start" style={{ width: '100%' }}>

                        {/* 头部全局状态 */}
                        <Space spacing="loose">
                            <Text style={{ color: '#ccc' }}>
                                Install ID: <Text strong style={{ color: '#fff', userSelect: 'all' }}>{installProgress.installId}</Text>
                            </Text>
                            <Space>
                                <Text style={{ color: '#ccc' }}>全局状态:</Text>
                                <Tag color={
                                    installProgress.status === 'completed' ? 'green' :
                                    installProgress.status === 'failed' ? 'red' :
                                    installProgress.status === 'installing' ? 'blue' : 'grey'
                                }>{installProgress.status}</Tag>
                            </Space>
                        </Space>

                        {/* 全局进度 */}
                        <div style={{ width: '100%', marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: '#ccc', fontSize: 13 }}>总进度</Text>
                                <Text style={{ color: '#ccc', fontSize: 13 }}>{installProgress.totalProgress}%</Text>
                            </div>
                            <Progress
                                percent={installProgress.totalProgress}
                                style={{ height: 8 }}
                                stroke="var(--semi-color-primary)"
                            />
                        </div>

                        <Divider style={{ margin: '16px 0', borderColor: '#333' }} />

                        <Title heading={6} style={{ color: '#eee', marginBottom: 12 }}>Categories 列表</Title>

                        {/* Category 卡片列表 */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {installProgress.categories?.map(cat => (
                                <Card key={cat.categoryId} style={{ backgroundColor: '#232326', border: '1px solid #444', padding: 12 }} bodyStyle={{ padding: 0 }}>
                                    <Space vertical align="start" style={{ width: '100%' }}>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Space>
                                                <span
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        display: 'inline-block',
                                                        backgroundColor: getCategoryStatusColor(cat.status)
                                                    }}
                                                />
                                                <Text strong style={{ color: '#fff' }}>{cat.categoryName}</Text>
                                                <Text type="tertiary" size="small">({cat.categoryId})</Text>
                                            </Space>
                                            <Tag size="small" style={{ backgroundColor: '#333', color: '#ccc', border: 'none' }}>{cat.status}</Tag>
                                        </Space>

                                        <div style={{ width: '100%', marginTop: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ color: '#aaa', fontSize: 12 }}>分类进度</Text>
                                                <Text style={{ color: '#aaa', fontSize: 12 }}>{cat.progress}%</Text>
                                            </div>
                                            <Progress percent={cat.progress} style={{ height: 6 }} stroke="var(--semi-color-success)" />
                                        </div>

                                        {cat.currentItem && (
                                            <div style={{ width: '100%', marginTop: 12, background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, border: '1px solid #333' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Text style={{ color: '#ddd', fontSize: 12 }}>当前阶段: {cat.currentItem}</Text>
                                                    <Text style={{ color: '#ddd', fontSize: 12 }}>{cat.subProgress}%</Text>
                                                </div>
                                                <Progress percent={cat.subProgress} style={{ height: 4 }} stroke="var(--semi-color-warning)" />
                                            </div>
                                        )}
                                    </Space>
                                </Card>
                            ))}
                            {(!installProgress.categories || installProgress.categories.length === 0) && (
                                <Text type="tertiary">暂无 Category 数据</Text>
                            )}
                        </div>
                    </Space>
                </Card>
            </div>
        );
    };

    // =================================================================
    // 5. 测试用例配置 (TEST SUITES CONFIG)
    // =================================================================

    const TEST_SUITES: TestSuite[] =[
        {
            id: 'install_api',
            title: 'Installations API (通用架构)',
            icon: <IconServer />,
            cases:[
                {
                    id: 'architecture_desc',
                    name: '通用安装分发层',
                    desc: '后端提供通用的 /api/installations 接口，统一下发、调度和聚合多 Category。前端按此规范统一处理安装，无需为具体项目绑定强侵入逻辑。',
                    action: async (log) => {
                        log('info', '说明已阅读：请通过下方具体项目安装触发。');
                    }
                }
            ]
        },
        {
            id: 'install_targets',
            title: 'Install Targets (具体安装项目)',
            icon: <IconBox />,
            cases:[
                {
                    id: 'cm_install_demo',
                    name: '安装 CM DEMO',
                    desc: '调用 POST /api/installations 分配任务，获得 installId 后持续轮询 GET /progress，实时在下方渲染进度',
                    action: async (log) => {
                        await startInstallationDemo(log);
                    },
                    renderCustomUI: renderInstallationDemoPanel
                }
            ]
        },
        {
            id: 'install',
            title: '旧版安装流程测试 (Stub)',
            icon: <IconBox />,
            cases:[
                {
                    id: 'test_car_install',
                    name: '测试车包安装 (模拟)',
                    desc: '模拟前端发送安装指令 -> 后端解压 -> 返回进度 -> 完成',
                    action: async (log) => {
                        log('req', 'POST /api/install/car', { packId: 'car_jdm_vol1', targetPath: 'D:/AssettoCorsa' });
                        await new Promise(r => setTimeout(r, 800));
                        log('res', '200 OK: 任务已创建 (TaskID: 1024)', { status: 'pending' });
                        log('info', '开始监听进度...');
                        for (let i = 10; i <= 100; i += 30) {
                            await new Promise(r => setTimeout(r, 600));
                            log('info', `[IPC] 进度更新: ${i}%`, { file: `extracting_file_${i}.kn5` });
                        }
                        log('success', '✅ 安装流程模拟完成');
                    }
                }
            ]
        },
        {
            id: 'real_demo',
            title: '真实端到端 DEMO（需后端 19810 已启动）',
            icon: <IconLink />,
            cases:[
                {
                    id: 'real_health',
                    name: '连通性：GET /api/TestPlaygroundHealth',
                    desc: '渲染进程 → IPC → 主进程 fetch → Gin → 返回 JSON',
                    action: async (log) => {
                        await requestBackend(log, 'GET', '/api/TestPlaygroundHealth');
                        log('success', '✅ 后端可达');
                    }
                },
                {
                    id: 'real_echo',
                    name: 'JSON 往返：POST /api/TestPlaygroundEcho',
                    desc: '发送 JSON，后端原样回显并附带 serverTime',
                    action: async (log) => {
                        await requestBackend(log, 'POST', '/api/TestPlaygroundEcho', {
                            demo: 'from-renderer',
                            ts: Date.now()
                        });
                        log('success', '✅ Echo 完成');
                    }
                },
                {
                    id: 'real_existing_get',
                    name: '现有 API：GET /api/GetGamePath',
                    desc: '走同一套 IPC 代理，调用项目已有接口',
                    action: async (log) => {
                        await requestBackend(log, 'GET', '/api/GetGamePath');
                        log('success', '✅ GetGamePath 完成');
                    }
                },
                {
                    id: 'real_job_poll',
                    name: '完整流程：创建任务 + 轮询进度（真实 HTTP）',
                    desc: 'POST 创建 jobId → 轮询 GET progress 直至 phase=done（后端按时间推进进度）',
                    action: async (log) => {
                        const start = (await requestBackend(log, 'POST', '/api/TestPlaygroundJob/start')) as {
                            jobId: string;
                            message?: string;
                        };
                        const jobId = start.jobId;
                        log('info', '开始轮询进度（约每秒数次，直至 100%）…');

                        const pollIntervalMs = 450;
                        for (;;) {
                            const progress = (await requestBackend(
                                log,
                                'GET',
                                `/api/TestPlaygroundJob/progress?jobId=${encodeURIComponent(jobId)}`
                            )) as { progress: number; phase: string; detail?: unknown };

                            if (progress.phase === 'done' || progress.progress >= 100) {
                                log('success', '✅ 任务完成（后端进度已到 100%）', {
                                    finalProgress: progress.progress,
                                    phase: progress.phase
                                });
                                break;
                            }
                            await new Promise((r) => setTimeout(r, pollIntervalMs));
                        }
                    }
                }
            ]
        },
        {
            id: 'system',
            title: '系统/环境测试 (示例拓展)',
            icon: <IconServer />,
            cases:[
                {
                    id: 'check_disk',
                    name: '检查磁盘空间',
                    action: async (log) => {
                        log('req', 'GET /api/system/disk_info');
                        await new Promise(r => setTimeout(r, 500));
                        log('res', '200 OK', { drive: 'D:', free: '424 GB', total: '1024 GB' });
                        log('success', '磁盘检查通过');
                    }
                }
            ]
        }
    ];

    // =================================================================
    // 6. 渲染结构
    // =================================================================

    // 样式常量
    const BG_DARK = '#16161a';
    const CARD_BG = '#232326';
    const CONSOLE_BG = '#0d0d10';

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white', display: 'flex', flexDirection: 'column' }} className="semi-always-dark">
            {/* Header */}
            <Header style={{ padding: '20px 40px', background: BG_DARK, borderBottom: '1px solid #333', flexShrink: 0 }}>
                <HomeBreadcrumb current="开发者测试实验室" />
            </Header>

            {/* Main Content (Split View) */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* 左侧：测试用例面板 (Scrollable) */}
                <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <div style={{ padding: 8, background: 'rgba(255, 159, 67, 0.2)', borderRadius: 8, color: '#ff9f43' }}>
                                <IconCode size="large" />
                            </div>
                            <div>
                                <Title heading={3} style={{ color: '#fff', margin: 0 }}>开发者测试实验室</Title>
                                <Text type="tertiary" size="small">Frontend-Backend Integration Playground</Text>
                            </div>
                        </div>
                    </div>

                    <Row gutter={[24, 24]}>
                        {TEST_SUITES.map(suite => (
                            <Col span={24} key={suite.id}>
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {suite.icon} {suite.title}
                                        </div>
                                    }
                                    style={{ backgroundColor: CARD_BG, border: '1px solid #333' }}
                                    headerStyle={{ borderBottom: '1px solid #333' }}
                                >
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                        {suite.cases.map(testCase => (
                                            <div key={testCase.id} style={{ marginBottom: 8, width: '100%' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Text style={{ fontWeight: 'bold', color: '#eee' }}>{testCase.name}</Text>
                                                        {loadingMap[testCase.id] && <Spin size="small" />}
                                                    </div>
                                                    <Button
                                                        theme="solid"
                                                        icon={<IconPlay />}
                                                        style={{ backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
                                                        onClick={() => runTest(testCase)}
                                                        loading={loadingMap[testCase.id]}
                                                    >
                                                        运行
                                                    </Button>
                                                </div>
                                                {testCase.desc && (
                                                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                                                        <Text style={{ color: '#666', fontSize: 12 }}>{testCase.desc}</Text>
                                                    </div>
                                                )}

                                                {/* 如果用例自定义了渲染面板，则渲染在下方 */}
                                                {testCase.renderCustomUI && testCase.renderCustomUI()}

                                                <Divider style={{ margin: '12px 0', borderColor: '#333' }} />
                                            </div>
                                        ))}
                                        {suite.cases.length === 0 && <Text type="tertiary">暂无测试用例</Text>}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* 右侧：实时日志控制台 (Fixed Width) */}
                <div style={{ width: 450, background: CONSOLE_BG, borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>

                    {/* Console Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: '#ccc' }}>Real-time Console</Text>
                        <Button icon={<IconDelete />} size="small" theme="borderless" style={{ color: '#888' }} onClick={clearLogs} />
                    </div>

                    {/* Console Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontFamily: 'monospace', fontSize: 12 }}>
                        {logs.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: 100, color: '#444' }}>
                                <IconServer style={{ fontSize: 40, marginBottom: 10 }} />
                                <div>Ready to listen...</div>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} style={{ marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.5 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span style={{ color: '#555' }}>[{log.time}]</span>
                                    {renderLogBadge(log.type)}
                                </div>
                                <div style={{ color: '#ddd', paddingLeft: 0, marginTop: 2 }}>
                                    {log.message}
                                </div>
                                {log.data !== undefined && log.data !== null && (
                                    <pre style={{
                                        margin: '4px 0 0 0',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 4,
                                        color: '#aaddff',
                                        fontSize: 11,
                                        overflowX: 'auto'
                                    }}>
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// --- 辅助函数：渲染日志标签 ---
function renderLogBadge(type: LogType): React.JSX.Element {
    switch (type) {
        case 'req': return <Tag color="blue" size="small" style={{ height: 18, lineHeight: '16px' }}>REQ &gt;&gt;</Tag>;
        case 'res': return <Tag color="cyan" size="small" style={{ height: 18, lineHeight: '16px' }}>&lt;&lt; RES</Tag>;
        case 'error': return <Tag color="red" size="small" style={{ height: 18, lineHeight: '16px' }}>ERR</Tag>;
        case 'success': return <Tag color="green" size="small" style={{ height: 18, lineHeight: '16px' }}>OK</Tag>;
        case 'warning': return <Tag color="orange" size="small" style={{ height: 18, lineHeight: '16px' }}>WARN</Tag>;
        default: return <Tag color="grey" size="small" style={{ height: 18, lineHeight: '16px' }}>INFO</Tag>;
    }
}
