import React, { useState, useEffect, useRef } from 'react';
import { Layout, Typography, Card, Progress, Button } from '@douyinfe/semi-ui';
import { 
    IconBolt, IconFile, IconFolder, IconTickCircle, IconLoading
} from '@douyinfe/semi-icons';
import { useDevMode } from './contexts/DevModeContext';
import type { InstallationCategoryProgress, InstallationProgressResponse } from './components/OneClickInstaller/types';

const BACKEND_BASE = 'http://127.0.0.1:19810';

async function requestBackend(
    method: string,
    pathAndQuery: string,
    body?: Record<string, unknown>
): Promise<unknown> {
    const url = `${BACKEND_BASE}${pathAndQuery}`;
    const hasBody = body !== undefined;
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
        throw new Error(result.error || 'request failed');
    }
    if (!result.ok) {
        throw new Error(`HTTP ${result.status}`);
    }
    return result.data;
}

// --- 1. 定义安装队列结构 ---
interface InstallCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    items: string[];
    totalSize: number;
}

const INSTALL_QUEUE: InstallCategory[] = [
    {
        id: 'core',
        name: '基础环境 (CSP)',
        icon: <IconBolt />,
        items: ['Content Manager API', 'CSP v0.1.79', '7zip Library'],
        totalSize: 150
    },
    {
        id: 'weather',
        name: '天气系统 (Sol & Pure)',
        icon: <IconFile />,
        items: ['Sol 2.2.9 Core', 'Sol Config', 'Pure 0.238 Base', 'Pure Textures HighRes'],
        totalSize: 500
    },
    {
        id: 'map',
        name: '地图包 (首都高)',
        icon: <IconFolder />,
        items: ['SRP Main Track', 'SRP Extras', 'Tatsumi PA Objects', 'Shibaura PA'],
        totalSize: 2400
    },
    {
        id: 'cars',
        name: '车辆包 (JDM Pack)',
        icon: <IconFile />,
        items: ['Nissan Skyline R34', 'Toyota Supra MK4', 'Mazda RX-7 FD3S', 'Honda NSX-R', 'Mitsubishi Lancer Evo 9'],
        totalSize: 1800
    }
];

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface InstallProgressPageProps {
    installId?: string;
    onComplete?: () => void;
    onCancel?: () => void;
}

export default function InstallProgressPage({ installId, onComplete, onCancel }: InstallProgressPageProps): React.JSX.Element {
    // --- 状态管理 ---
    const { isDevMode } = useDevMode();
    const [activeCategoryIdx, setActiveCategoryIdx] = useState<number>(0); // 当前正在安装的大类索引
    const [activeItemIdx, setActiveItemIdx] = useState<number>(0);         // 当前大类下的子项目索引
    const [categoryProgress, setCategoryProgress] = useState<number>(0);   // 当前大类的百分比
    const [totalProgress, setTotalProgress] = useState<number>(0);         // 总进度
    const [logs, setLogs] = useState<string[]>([]);                          // 底部日志
    const [isFinished, setIsFinished] = useState<boolean>(false);

    // DEMO/后端模式：按 categoryId 存储后端类别进度
    const [backendCategoryMap, setBackendCategoryMap] = useState<Record<string, InstallationCategoryProgress>>({});

    // 滚动日志到底部的 Ref
    const logEndRef = useRef<HTMLDivElement>(null);
    // 跟踪每个类别是否已初始化日志
    const initializedCategories = useRef<Set<number>>(new Set());

    // --- 模拟安装逻辑 (Effect) ---
    useEffect(() => {
        // 后端模式：使用轮询 tracker 真实进度，禁用本地模拟定时器
        if (installId) return;
        if (isFinished) return;
        if (activeCategoryIdx >= INSTALL_QUEUE.length) return;

        const currentCategory = INSTALL_QUEUE[activeCategoryIdx];
        if (!currentCategory || !currentCategory.items || currentCategory.items.length === 0) return;

        // 确保 activeItemIdx 在有效范围内
        const validItemIdx = Math.min(activeItemIdx, currentCategory.items.length - 1);
        if (validItemIdx !== activeItemIdx) {
            setActiveItemIdx(validItemIdx);
            return;
        }

        // 添加开始日志（只在第一次进入该类别时）
        if (!initializedCategories.current.has(activeCategoryIdx)) {
            addLog(`正在初始化模块: ${currentCategory.name}...`);
            initializedCategories.current.add(activeCategoryIdx);
        }

        // 根据开发者模式调整动画速度
        const progressSpeed = isDevMode ? 20 : 5; // 开发者模式：每次增加20，正常模式：每次增加5
        const updateInterval = isDevMode ? 50 : 100; // 开发者模式：50ms更新一次，正常模式：100ms

        const timer = setInterval(() => {
            setCategoryProgress(prev => {
                // 模拟进度增长（开发者模式加速）
                const increment = isDevMode ? progressSpeed : (Math.random() * progressSpeed);
                const next = Math.min(prev + increment, 100); 
                
                // 同步更新总进度
                const step = 100 / INSTALL_QUEUE.length;
                const base = activeCategoryIdx * step;
                const currentStep = (next / 100) * step;
                const newTotal = Math.min(base + currentStep, activeCategoryIdx === INSTALL_QUEUE.length - 1 ? 100 : 99);
                setTotalProgress(newTotal);
                
                // --- 单个子项目完成逻辑 (简化版：这里简单地把大类进度映射为子项目切换) ---
                // 实际逻辑应该是：下载进度 -> 子项目完成 -> 类别完成
                
                if (next >= 100) {
                    clearInterval(timer);
                    // 使用 setTimeout 确保状态更新完成后再调用
                    setTimeout(() => {
                        handleCategoryComplete();
                    }, 0);
                    return 100;
                }
                
                // 模拟子项目切换 (视觉效果)
                const itemsCount = currentCategory.items.length;
                const progressPerItem = 100 / itemsCount;
                const calculatedItemIdx = Math.floor(next / progressPerItem);
                
                if (calculatedItemIdx !== activeItemIdx && calculatedItemIdx < itemsCount) {
                    setActiveItemIdx(calculatedItemIdx);
                    addLog(`已解压: ${currentCategory.items[calculatedItemIdx]} ... OK`);
                }

                return next;
            });
        }, updateInterval);

        return () => {
            clearInterval(timer);
        };
    }, [activeCategoryIdx, activeItemIdx, isFinished, isDevMode, installId]);

    // 自动滚动日志
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // --- 辅助逻辑 ---

    const addLog = (msg: string): void => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    // --- 后端 tracker 驱动逻辑（DEMO） ---
    useEffect(() => {
        // 后端模式才启用；否则走上面“模拟安装逻辑”
        if (!installId) return;
        if (isFinished) return;

        let cancelled = false;

        const lastPhaseByCategoryRef = { current: {} as Record<string, string> };
        const initializedCategoriesRef = new Set<string>();

        const poll = async (): Promise<void> => {
            if (cancelled) return;

            try {
                const progress = (await requestBackend(
                    'GET',
                    `/api/installations/${installId}/progress?category=all`
                )) as InstallationProgressResponse;

                setTotalProgress(progress.totalProgress);

                const map: Record<string, InstallationCategoryProgress> = {};
                for (const cp of progress.categories || []) {
                    map[cp.categoryId] = cp;
                }
                setBackendCategoryMap(map);

                // 生成日志：阶段变化时写入一条
                for (const cp of progress.categories || []) {
                    if (cp.status === 'active' && !initializedCategoriesRef.has(cp.categoryId)) {
                        addLog(`正在初始化模块: ${cp.categoryName}...`);
                        initializedCategoriesRef.add(cp.categoryId);
                    }

                    const phaseName = cp.currentItem || '';
                    if (phaseName && lastPhaseByCategoryRef.current[cp.categoryId] !== phaseName) {
                        addLog(phaseName);
                        lastPhaseByCategoryRef.current[cp.categoryId] = phaseName;
                    }
                }

                if (progress.status === 'completed' || progress.status === 'failed') {
                    if (cancelled) return;
                    setIsFinished(true);

                    if (progress.status === 'completed') {
                        addLog('所有安装任务已完成。环境配置更新完毕。');
                        if (onComplete) {
                            setTimeout(() => onComplete(), 1000);
                        }
                    } else {
                        addLog(`安装失败: ${progress.error || '未知错误'}`);
                    }
                    return;
                }

                // 轮询间隔：开发模式更快一些
                const intervalMs = isDevMode ? 120 : 220;
                setTimeout(() => {
                    void poll();
                }, intervalMs);
            } catch (err: unknown) {
                console.error('获取安装进度失败:', err);
                setIsFinished(true);
                addLog('获取安装进度失败，请检查后端连接');
            }
        };

        void poll();

        return () => {
            cancelled = true;
        };
    }, [installId, isFinished, isDevMode, onComplete]);

    const handleCategoryComplete = (): void => {
        const currentIdx = activeCategoryIdx;
        
        if (currentIdx >= INSTALL_QUEUE.length) {
            // 如果已经超出范围，直接完成
            setTotalProgress(100);
            setIsFinished(true);
            addLog("所有安装任务已完成。环境配置更新完毕。");
            if (onComplete) {
                setTimeout(() => {
                    onComplete();
                }, 1000);
            }
            return;
        }
        
        const currentCategory = INSTALL_QUEUE[currentIdx];
        if (currentCategory) {
            addLog(`模块完成: ${currentCategory.name}`);
        }
        
        if (currentIdx < INSTALL_QUEUE.length - 1) {
            // 进入下一个大类
            setTimeout(() => {
                setActiveCategoryIdx(prev => prev + 1);
                setActiveItemIdx(0);
                setCategoryProgress(0);
            }, 500);
        } else {
            // 全部完成（不自动跳转，让用户自行确定）
            setTotalProgress(100);
            setIsFinished(true);
            addLog("所有安装任务已完成。环境配置更新完毕。");
            // 移除自动跳转逻辑，让用户点击按钮自行决定
        }
    };

    // --- 渲染部分 ---
    
    // 渲染完成页面
    if (isFinished) {
        return (
            <div style={{ height: '100vh', background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card style={{ width: 500, textAlign: 'center', backgroundColor: '#232326', border: '1px solid #444' }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ width: 80, height: 80, background: '#6bc786', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <IconTickCircle size="extra-large" style={{ color: '#fff', fontSize: 40 }} />
                        </div>
                    </div>
                    <Title heading={3} style={{ color: '#fff' }}>安装成功！</Title>
                    <Text style={{ color: '#ccc', margin: '16px 0', display: 'block' }}>
                        所有模组已就绪，首都高 (SRP) 地图包与车辆已成功导入。
                    </Text>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <Button 
                            theme="solid" 
                            size="large" 
                            style={{ backgroundColor: '#6bc786', color: '#fff', flex: 1 }}
                            onClick={onComplete}
                        >
                            完成
                        </Button>
                        {onCancel && (
                            <Button 
                                theme="borderless" 
                                size="large" 
                                style={{ color: '#ccc', flex: 1 }}
                                onClick={onCancel}
                            >
                                取消
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <Layout style={{ height: '100vh', background: '#16161a', color: 'white', padding: 40 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                
                {/* 1. 顶部总进度 */}
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title heading={2} style={{ color: '#fff', marginBottom: 8 }}>正在配置游戏环境...</Title>
                    <Text style={{ color: '#888' }}>请勿关闭安装器，这可能需要几分钟时间</Text>
                    
                    <div style={{ marginTop: 30, padding: '0 20px' }}>
                        <Progress 
                            percent={Math.floor(totalProgress)} 
                            stroke="#6bc786" 
                            trackStyle={{ backgroundColor: '#333' }}
                            style={{ height: 12 }}
                            showInfo={true}
                            format={(percent) => <span style={{color: '#6bc786', fontWeight: 'bold'}}>{percent}%</span>}
                        />
                    </div>
                </div>

                {/* 2. 中间：分步安装列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {INSTALL_QUEUE.map((category, index) => {
                        const isBackendMode = Boolean(installId);
                        const cp = backendCategoryMap[category.id];
                        const isDone = isBackendMode ? cp?.status === 'completed' : index < activeCategoryIdx;
                        const isActive = isBackendMode ? cp?.status === 'active' : index === activeCategoryIdx;
                        const isWaiting = isBackendMode ? !isDone && !isActive : index > activeCategoryIdx;
                        const activePercent = isBackendMode ? Math.floor(cp?.progress || 0) : Math.floor(categoryProgress);

                        return (
                            <div 
                                key={category.id}
                                style={{ 
                                    backgroundColor: isActive ? 'rgba(107, 199, 134, 0.05)' : '#232326',
                                    border: `1px solid ${isActive ? '#6bc786' : '#333'}`,
                                    borderRadius: 12,
                                    padding: '16px 24px',
                                    transition: 'all 0.3s',
                                    opacity: isWaiting ? 0.5 : 1
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {/* 左侧：图标与名称 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ 
                                            width: 40, height: 40, 
                                            borderRadius: 8, 
                                            background: isDone ? '#6bc786' : (isActive ? 'rgba(107, 199, 134, 0.2)' : '#333'),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isDone ? '#fff' : (isActive ? '#6bc786' : '#666')
                                        }}>
                                            {isDone ? <IconTickCircle /> : category.icon}
                                        </div>
                                        <div>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, display: 'block' }}>
                                                {category.name}
                                            </Text>
                                            {/* 状态文字 */}
                                            {isActive && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <IconLoading style={{ color: '#6bc786' }} spin />
                                                    <Text style={{ color: '#6bc786', fontSize: 13 }}>
                                                        正在安装: {isBackendMode ? (cp?.currentItem || category.name) : category.items[Math.min(activeItemIdx, category.items.length - 1)]}
                                                    </Text>
                                                </div>
                                            )}
                                            {isDone && <Text style={{ color: '#666', fontSize: 13 }}>安装完成</Text>}
                                            {isWaiting && <Text style={{ color: '#555', fontSize: 13 }}>等待中...</Text>}
                                        </div>
                                    </div>

                                    {/* 右侧：百分比或对勾 */}
                                    <div style={{ width: 100, textAlign: 'right' }}>
                                        {isDone ? (
                                            <IconTickCircle style={{ color: '#6bc786', fontSize: 20 }} />
                                        ) : isActive ? (
                                            <Text style={{ color: '#6bc786', fontWeight: 'bold', fontSize: 18 }}>
                                                {activePercent}%
                                            </Text>
                                        ) : (
                                            <Text style={{ color: '#444' }}>---</Text>
                                        )}
                                    </div>
                                </div>

                                {/* 仅在活动状态显示底部细进度条 */}
                                {isActive && (
                                    <div style={{ marginTop: 16, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${activePercent}%`, background: '#6bc786', height: '100%', transition: 'width 0.2s linear' }}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 3. 底部：极客 Log 窗口 */}
                <div style={{ marginTop: 30 }}>
                    <div style={{ 
                        backgroundColor: '#000', 
                        borderRadius: 8, 
                        border: '1px solid #333', 
                        padding: 16, 
                        fontFamily: 'monospace', 
                        fontSize: 12,
                        height: 120,
                        overflowY: 'auto',
                        color: '#aaa'
                    }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: 4, wordBreak: 'break-all' }}>
                                <span style={{ color: '#6bc786' }}>➜</span> {log}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>

            </div>
        </Layout>
    );
}

