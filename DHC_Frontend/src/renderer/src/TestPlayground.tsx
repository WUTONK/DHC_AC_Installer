import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Card, Typography, Row, Col, Tag, Divider, Spin } from '@douyinfe/semi-ui';
import {
    IconCode, IconServer, IconPlay, IconDelete, IconBox
} from '@douyinfe/semi-icons';
import HomeBreadcrumb from './components/HomeBreadcrumb';

// =================================================================
// 1. 类型定义 (Type Definitions)
// =================================================================

type LogType = 'info' | 'success' | 'error' | 'warning' | 'req' | 'res';

interface LogEntry {
    id: number;
    time: string;
    type: LogType;
    message: string;
    data?: any; // 可选的详细数据对象
}

interface TestCase {
    id: string;
    name: string;
    desc?: string;
    action: (logger: (type: LogType, msg: string, data?: any) => void) => Promise<void>;
}

interface TestSuite {
    id: string;
    title: string;
    icon: React.ReactNode;
    cases: TestCase[];
}

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// =================================================================
// 2. 页面组件 (TestPlayground)
// =================================================================

export default function TestPlayground(): React.JSX.Element {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const logEndRef = useRef<HTMLDivElement>(null);

    // --- 日志系统 ---
    const addLog = (type: LogType, message: string, data?: any) => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
        
        setLogs(prev => [...prev, {
            id: Date.now() + Math.random(),
            time: timeStr,
            type,
            message,
            data
        }]);
    };

    const clearLogs = () => setLogs([]);

    // 自动滚动到底部
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // --- 执行测试 ---
    const runTest = async (testCase: TestCase) => {
        setLoadingMap(prev => ({ ...prev, [testCase.id]: true }));
        addLog('info', `--- 开始执行测试: [${testCase.name}] ---`);
        
        try {
            await testCase.action(addLog);
        } catch (error) {
            addLog('error', `执行异常: ${error}`);
            console.error(error);
        } finally {
            setLoadingMap(prev => ({ ...prev, [testCase.id]: false }));
            addLog('info', `--- 测试结束 ---`);
        }
    };

    // =================================================================
    // 3. 测试用例配置 (TEST SUITES CONFIG) - 在这里添加新功能！
    // =================================================================
    
    const TEST_SUITES: TestSuite[] = [
        {
            id: 'install',
            title: '安装流程测试',
            icon: <IconBox />,
            cases: [
                {
                    id: 'test_car_install',
                    name: '测试车包安装 (模拟)',
                    desc: '模拟前端发送安装指令 -> 后端解压 -> 返回进度 -> 完成',
                    action: async (log) => {
                        // 1. 模拟发送请求
                        log('req', 'POST /api/install/car', { packId: 'car_jdm_vol1', targetPath: 'D:/AssettoCorsa' });
                        
                        // 模拟网络延迟
                        await new Promise(r => setTimeout(r, 800));
                        
                        // 2. 模拟后端返回确认
                        log('res', '200 OK: 任务已创建 (TaskID: 1024)', { status: 'pending' });

                        // 3. 模拟进度推送 (WebSocket / IPC)
                        log('info', '开始监听进度...');
                        for (let i = 10; i <= 100; i += 30) {
                            await new Promise(r => setTimeout(r, 600));
                            log('info', `[IPC] 进度更新: ${i}%`, { file: `extracting_file_${i}.kn5` });
                        }

                        // 4. 完成
                        log('success', '✅ 安装流程模拟完成');
                    }
                },
                // --- 在这里添加新的安装测试 ---
                // {
                //     id: 'test_map_install',
                //     name: '测试地图安装',
                //     action: async (log) => { ... }
                // }
            ]
        },
        {
            id: 'system',
            title: '系统/环境测试 (示例拓展)',
            icon: <IconServer />,
            cases: [
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
    // 4. 渲染逻辑
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
                                {log.data && (
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
function renderLogBadge(type: LogType) {
    switch (type) {
        case 'req': return <Tag color="blue" size="small" style={{ height: 18, lineHeight: '16px' }}>REQ &gt;&gt;</Tag>;
        case 'res': return <Tag color="cyan" size="small" style={{ height: 18, lineHeight: '16px' }}>&lt;&lt; RES</Tag>;
        case 'error': return <Tag color="red" size="small" style={{ height: 18, lineHeight: '16px' }}>ERR</Tag>;
        case 'success': return <Tag color="green" size="small" style={{ height: 18, lineHeight: '16px' }}>OK</Tag>;
        case 'warning': return <Tag color="orange" size="small" style={{ height: 18, lineHeight: '16px' }}>WARN</Tag>;
        default: return <Tag color="grey" size="small" style={{ height: 18, lineHeight: '16px' }}>INFO</Tag>;
    }
}

