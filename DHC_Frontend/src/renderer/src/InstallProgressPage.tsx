import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        items: ['资源包校验：车辆资源', '资源包校验：地图资源', '资源包校验：光影资源', 'DLC 与车包检测', '基础环境安装'],
        totalSize: 150
    },
    {
        id: 'weather',
        name: '天气系统 (Sol & Pure)',
        icon: <IconFile />,
        items: ['安装 Sol 2.2.9 Core', '安装 Sol Config', '安装 Pure 0.238 Base', '安装 Pure Textures HighRes'],
        totalSize: 500
    },
    {
        id: 'map',
        name: '地图包 (首都高)',
        icon: <IconFolder />,
        items: ['安装 SRP Main Track', '安装 SRP Extras', '安装辰巳 PA 场景', '安装芝浦 PA 场景'],
        totalSize: 2400
    },
    {
        id: 'cars',
        name: '车辆包 (JDM Pack)',
        icon: <IconFile />,
        items: ['安装 Nissan Skyline R34', '安装 Toyota Supra MK4', '安装 Mazda RX-7 FD3S', '安装 Honda NSX-R', '安装 Mitsubishi Lancer Evo 9'],
        totalSize: 1800
    }
];

const { Title, Text } = Typography;

interface InstallProgressPageProps {
    installId?: string;
    onComplete?: () => void;
    onCancel?: () => void;
    manualContinueAfterComplete?: boolean;
    requireBackendTracker?: boolean;
}

type FinishState = 'running' | 'awaiting_continue' | 'done';

export default function InstallProgressPage({
    installId,
    onComplete,
    onCancel,
    manualContinueAfterComplete = false,
    requireBackendTracker = false
}: InstallProgressPageProps): React.JSX.Element {
    const { isDevMode } = useDevMode();
    const [activeCategoryIdx, setActiveCategoryIdx] = useState<number>(0);
    const [activeItemIdx, setActiveItemIdx] = useState<number>(0);
    const [categoryProgress, setCategoryProgress] = useState<number>(0);
    const [totalProgress, setTotalProgress] = useState<number>(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [finishState, setFinishState] = useState<FinishState>('running');
    const [installSuccess, setInstallSuccess] = useState<boolean>(true);

    const [backendCategoryMap, setBackendCategoryMap] = useState<Record<string, InstallationCategoryProgress>>({});

    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const manualContinueRef = useRef(manualContinueAfterComplete);
    manualContinueRef.current = manualContinueAfterComplete;

    const logEndRef = useRef<HTMLDivElement>(null);
    const initializedCategories = useRef<Set<number>>(new Set());

    const addLog = useCallback((msg: string): void => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    }, []);

    /**
     * 统一的安装完成出口。不管是本地模拟还是后端轮询，完成时都调用这个。
     * 根据 manualContinueRef 决定是停留还是自动跳转。
     */
    const handleAllDone = useCallback((success: boolean, errorMsg?: string) => {
        setInstallSuccess(success);
        if (success) {
            setTotalProgress(100);
            addLog('所有安装任务已完成。环境配置更新完毕。');
        } else {
            addLog(`安装失败: ${errorMsg || '未知错误'}`);
        }

        if (manualContinueRef.current) {
            setFinishState('awaiting_continue');
        } else {
            setFinishState('done');
            if (success && onCompleteRef.current) {
                setTimeout(() => onCompleteRef.current?.(), 1000);
            }
        }
    }, [addLog]);

    // --- 本地模拟安装逻辑 ---
    useEffect(() => {
        if (requireBackendTracker) return;
        if (installId) return;
        if (finishState !== 'running') return;
        if (activeCategoryIdx >= INSTALL_QUEUE.length) return;

        const currentCategory = INSTALL_QUEUE[activeCategoryIdx];
        if (!currentCategory || !currentCategory.items || currentCategory.items.length === 0) return;

        const validItemIdx = Math.min(activeItemIdx, currentCategory.items.length - 1);
        if (validItemIdx !== activeItemIdx) {
            setActiveItemIdx(validItemIdx);
            return;
        }

        if (!initializedCategories.current.has(activeCategoryIdx)) {
            addLog(`正在初始化模块: ${currentCategory.name}...`);
            initializedCategories.current.add(activeCategoryIdx);
        }

        const progressSpeed = isDevMode ? 20 : 5;
        const updateInterval = isDevMode ? 50 : 100;

        const timer = setInterval(() => {
            setCategoryProgress(prev => {
                const increment = isDevMode ? progressSpeed : (Math.random() * progressSpeed);
                const next = Math.min(prev + increment, 100); 
                
                const step = 100 / INSTALL_QUEUE.length;
                const base = activeCategoryIdx * step;
                const currentStep = (next / 100) * step;
                const newTotal = Math.min(base + currentStep, activeCategoryIdx === INSTALL_QUEUE.length - 1 ? 100 : 99);
                setTotalProgress(newTotal);
                
                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        const cat = INSTALL_QUEUE[activeCategoryIdx];
                        if (cat) addLog(`模块完成: ${cat.name}`);

                        if (activeCategoryIdx < INSTALL_QUEUE.length - 1) {
                            setTimeout(() => {
                                setActiveCategoryIdx(prev => prev + 1);
                                setActiveItemIdx(0);
                                setCategoryProgress(0);
                            }, 500);
                        } else {
                            handleAllDone(true);
                        }
                    }, 0);
                    return 100;
                }
                
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

        return () => { clearInterval(timer); };
    }, [activeCategoryIdx, activeItemIdx, finishState, isDevMode, installId, addLog, handleAllDone, requireBackendTracker]);

    // 自动滚动日志
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // --- 后端 tracker 驱动逻辑（DEMO） ---
    useEffect(() => {
        if (!installId) return;
        if (finishState !== 'running') return;

        let cancelled = false;
        const lastPhase: Record<string, string> = {};
        const initCats = new Set<string>();

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

                for (const cp of progress.categories || []) {
                    if (cp.status === 'active' && !initCats.has(cp.categoryId)) {
                        addLog(`正在初始化模块: ${cp.categoryName}...`);
                        initCats.add(cp.categoryId);
                    }
                    const phaseName = cp.currentItem || '';
                    if (phaseName && lastPhase[cp.categoryId] !== phaseName) {
                        addLog(phaseName);
                        lastPhase[cp.categoryId] = phaseName;
                    }
                }

                if (progress.status === 'completed' || progress.status === 'failed') {
                    if (cancelled) return;
                    handleAllDone(progress.status === 'completed', progress.error ?? undefined);
                    return;
                }

                const intervalMs = isDevMode ? 120 : 220;
                setTimeout(() => { void poll(); }, intervalMs);
            } catch (err: unknown) {
                console.error('获取安装进度失败:', err);
                handleAllDone(false, '获取安装进度失败，请检查后端连接');
            }
        };

        void poll();
        return () => { cancelled = true; };
    }, [installId, finishState, isDevMode, addLog, handleAllDone]);

    // --- 渲染 ---
    
    const isAllDone = finishState === 'done';
    const isAwaiting = finishState === 'awaiting_continue';

    if (requireBackendTracker && !installId) {
        return (
            <div style={{ height: '100vh', background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card style={{ width: 560, textAlign: 'center', backgroundColor: '#232326', border: '1px solid #444' }}>
                    <Title heading={3} style={{ color: '#fff' }}>无法启动后端安装任务</Title>
                    <Text style={{ color: '#ccc', margin: '16px 0', display: 'block' }}>
                        当前安装流程已配置为必须由后端驱动，但没有拿到有效的 `installId`。
                    </Text>
                    <Text style={{ color: '#888', display: 'block' }}>
                        请返回上一页后重试，并检查 Electron 控制台里是否存在创建安装任务失败的报错。
                    </Text>
                    {onCancel && (
                        <div style={{ marginTop: 20 }}>
                            <Button
                                theme="solid"
                                size="large"
                                style={{ backgroundColor: '#e74c3c', color: '#fff' }}
                                onClick={onCancel}
                            >
                                返回
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    if (isAllDone) {
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
                
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title heading={2} style={{ color: '#fff', marginBottom: 8 }}>
                        {isAwaiting
                            ? (installSuccess ? '安装完成' : '安装失败')
                            : '正在配置游戏环境...'}
                    </Title>
                    <Text style={{ color: '#888' }}>
                        {isAwaiting
                            ? (installSuccess
                                ? '各项模块已就绪。点击下方「继续」进入完成页。'
                                : '安装过程中出现错误，请查看日志。点击下方「继续」返回。')
                            : '请勿关闭安装器，这可能需要几分钟时间'}
                    </Text>
                    
                    <div style={{ marginTop: 30, padding: '0 20px' }}>
                        <Progress 
                            percent={Math.floor(totalProgress)} 
                            stroke={isAwaiting && !installSuccess ? '#e74c3c' : '#6bc786'} 
                            style={{ height: 12 }}
                            showInfo={true}
                            format={(percent) => {
                                const color = isAwaiting && !installSuccess ? '#e74c3c' : '#6bc786';
                                return <span style={{color, fontWeight: 'bold'}}>{percent}%</span>;
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {INSTALL_QUEUE.map((category, index) => {
                        const isBackendMode = Boolean(installId);
                        const cp = backendCategoryMap[category.id];
                        const isDone = isBackendMode
                            ? (cp?.status === 'completed' || false)
                            : (isAwaiting ? true : index < activeCategoryIdx);
                        const isActive = isBackendMode
                            ? (cp?.status === 'active' || false)
                            : (isAwaiting ? false : index === activeCategoryIdx);
                        const isWaiting = !isDone && !isActive;
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

                                {isActive && (
                                    <div style={{ marginTop: 16, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${activePercent}%`, background: '#6bc786', height: '100%', transition: 'width 0.2s linear' }}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

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

                {isAwaiting && (
                    <div style={{ marginTop: 24 }}>
                        <Button
                            theme="solid"
                            size="large"
                            onClick={() => onComplete?.()}
                            style={{ width: '100%', backgroundColor: installSuccess ? '#6bc786' : '#e74c3c', color: '#fff' }}
                        >
                            继续
                        </Button>
                    </div>
                )}

            </div>
        </Layout>
    );
}
