import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Button, Typography, Modal, Toast, Switch, Slider, InputNumber } from '@douyinfe/semi-ui';
import {
    IconAlertTriangle,
    IconSetting,
    IconDownload
} from '@douyinfe/semi-icons';
import InstallProgressPage from './InstallProgressPage';
import { useDevMode } from './contexts/DevModeContext';
import { useNavigation } from './contexts/NavigationContext';
import { DEFAULT_DISK_INFO, INSTALL_MODES, EXISTING_RESOURCES } from './components/OneClickInstaller/constants';
import {
    DiskInfo, InstallStep,
    InstallMode
} from './components/OneClickInstaller/types';
import PostInstallPage from './components/OneClickInstaller/PostInstallPage';
import CleanInstallWizard from './components/OneClickInstaller/CleanInstallWizard';
import NormalInstaller from './components/OneClickInstaller/NormalInstaller';
import PreCheckPage from './components/OneClickInstaller/PreCheckPage';
import { usePrecheck } from './hooks/usePrecheck';
import { useInstallation } from './hooks/useInstallation';

const { Content } = Layout;
const { Text, Paragraph } = Typography;

export default function OneClickInstaller(): React.JSX.Element {
    // --- 状态管理 ---
    // 开发者调试：地区
    const [devRegionCN, setDevRegionCN] = useState<boolean>(() => {
        const saved = localStorage.getItem('devRegionCN');
        return saved !== null ? saved === 'true' : true;
    });
    // 开发者调试：模拟启动时检测到光影冲突
    const [devSimulateConflict, setDevSimulateConflict] = useState<boolean>(() => {
        const saved = localStorage.getItem('devSimulateConflict');
        return saved !== null ? saved === 'true' : false;
    });

    // [新增] 开发者调试：安装 DEMO 测试 toggle
    const [devInstallDemo, setDevInstallDemo] = useState<boolean>(() => {
        const saved = localStorage.getItem('devInstallDemo');
        return saved !== null ? saved === 'true' : false;
    });

    const [devDemoSlowProgress, setDevDemoSlowProgress] = useState<boolean>(() => {
        const saved = localStorage.getItem('devDemoSlowProgress');
        return saved !== null ? saved === 'true' : true;
    });
    const [devDemoSlowTotalSeconds, setDevDemoSlowTotalSeconds] = useState<number>(() => {
        const saved = localStorage.getItem('devDemoSlowTotalSeconds');
        const n = saved !== null ? Number(saved) : 20;
        return Number.isFinite(n) && n > 0 ? n : 20;
    });

    const [devInstallManualContinue, setDevInstallManualContinue] = useState<boolean>(() => {
        const saved = localStorage.getItem('devInstallManualContinue');
        return saved !== null ? saved === 'true' : true;
    });
    const [requireBackendInstall, setRequireBackendInstall] = useState<boolean>(false);

    // [新增] 开发者调试：资源模拟状态
    const [devResourceImported, setDevResourceImported] = useState<boolean>(() => {
        const saved = localStorage.getItem('devResourceImported');
        return saved !== null ? saved === 'true' : false;
    });
    const [devResourceComplete, setDevResourceComplete] = useState<boolean>(() => {
        const saved = localStorage.getItem('devResourceComplete');
        return saved !== null ? saved === 'true' : true;
    });

    // [新增] 开发者调试：磁盘可用空间 (GB)
    const [devDiskFreeGB, setDevDiskFreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskFreeGB');
        return saved !== null ? Number(saved) : 424; // 默认 424GB
    });

    // 动态计算磁盘信息
    const DISK_INFO = useMemo<DiskInfo>(() => {
        const freeBytes = devDiskFreeGB * 1024 * 1024 * 1024;
        return {
            label: 'D:',
            total: DEFAULT_DISK_INFO.total,
            used: DEFAULT_DISK_INFO.total - freeBytes,
            free: freeBytes
        };
    }, [devDiskFreeGB]);

    // 根据开发者选项初始化诊断状态（使用函数初始化确保读取到正确的值）
    const [isDiagnosing, setIsDiagnosing] = useState<boolean>(() => {
        const saved = localStorage.getItem('devSimulateConflict');
        return saved !== null ? saved === 'true' : false;
    }); // 是否正在诊断
    const [mode, setMode] = useState<'normal' | 'clean_install'>('normal'); // 'normal' | 'clean_install'
    const [selectedModeId, setSelectedModeId] = useState<string>('standard'); // 默认选中标准版
    const [currentStep, setCurrentStep] = useState<InstallStep>('SELECT_MODE'); // 安装步骤

    const { registerDevOption, unregisterDevOption } = useDevMode();

    // 持久化开发者选项状态
    useEffect(() => {
        localStorage.setItem('devRegionCN', String(devRegionCN));
    }, [devRegionCN]);

    useEffect(() => {
        localStorage.setItem('devSimulateConflict', String(devSimulateConflict));
    }, [devSimulateConflict]);

    useEffect(() => {
        localStorage.setItem('devInstallDemo', String(devInstallDemo));
    }, [devInstallDemo]);

    useEffect(() => {
        localStorage.setItem('devDemoSlowProgress', String(devDemoSlowProgress));
    }, [devDemoSlowProgress]);

    useEffect(() => {
        localStorage.setItem('devDemoSlowTotalSeconds', String(devDemoSlowTotalSeconds));
    }, [devDemoSlowTotalSeconds]);

    useEffect(() => {
        localStorage.setItem('devInstallManualContinue', String(devInstallManualContinue));
    }, [devInstallManualContinue]);

    useEffect(() => {
        localStorage.setItem('devResourceImported', String(devResourceImported));
    }, [devResourceImported]);

    useEffect(() => {
        localStorage.setItem('devResourceComplete', String(devResourceComplete));
    }, [devResourceComplete]);

    useEffect(() => {
        localStorage.setItem('devDiskFreeGB', String(devDiskFreeGB));
    }, [devDiskFreeGB]);

    // 注册开发者选项到开发者面板
    useEffect(() => {
        // 选项 1: 地区模拟
        registerDevOption({
            id: 'oneclick-installer-region',
            label: '地区模拟（一键式安装）',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devRegionCN}
                        onChange={(checked) => setDevRegionCN(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devRegionCN ? '中国区' : '非中国区'}
                    </span>
                </div>
            ),
            order: 2
        });

        // 选项 2: 启动冲突检测模拟
        registerDevOption({
            id: 'oneclick-installer-conflict',
            label: '模拟：启动时检测到光影冲突',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devSimulateConflict}
                        onChange={(checked) => setDevSimulateConflict(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devSimulateConflict ? '开启' : '关闭'}
                    </span>
                </div>
            ),
            order: 3
        });

        registerDevOption({
            id: 'oneclick-installer-demo',
            label: '安装DEMO测试toggle',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devInstallDemo}
                        onChange={(checked) => setDevInstallDemo(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devInstallDemo ? '开启：豪华全享版→安装DEMO' : '关闭'}
                    </span>
                </div>
            ),
            order: 7
        });

        registerDevOption({
            id: 'oneclick-installer-demo-slow',
            label: 'DEMO：后端慢速进度（总时长）',
            component: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Switch
                            checked={devDemoSlowProgress}
                            onChange={(checked) => setDevDemoSlowProgress(checked)}
                            size="small"
                        />
                        <span style={{ color: '#ccc', fontSize: 12 }}>
                            {devDemoSlowProgress
                                ? '开启：按总进度 pacing（默认约 20s 跑完全程）'
                                : '关闭：后端最快速度'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>目标总秒数</span>
                        <InputNumber
                            size="small"
                            min={1}
                            max={300}
                            value={devDemoSlowTotalSeconds}
                            onChange={(v) => {
                                if (typeof v === 'number' && Number.isFinite(v)) {
                                    setDevDemoSlowTotalSeconds(Math.min(300, Math.max(1, Math.round(v))));
                                }
                            }}
                            style={{ width: 100 }}
                        />
                    </div>
                </div>
            ),
            order: 9
        });

        registerDevOption({
            id: 'oneclick-install-manual-continue',
            label: '安装完成：停留在分类进度页',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devInstallManualContinue}
                        onChange={(checked) => setDevInstallManualContinue(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devInstallManualContinue
                            ? '开启：保留天气/地图/车辆等列表至结束，点「继续」再进入完成页'
                            : '关闭：完成后约 1s 自动进入完成页'}
                    </span>
                </div>
            ),
            order: 10
        });

        // [新增] 选项 3: 资源已导入模拟
        registerDevOption({
            id: 'oneclick-resource-imported',
            label: '模拟：资源已导入',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devResourceImported}
                        onChange={(checked) => setDevResourceImported(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devResourceImported ? '开启' : '关闭'}
                    </span>
                </div>
            ),
            order: 4
        });

        // [新增] 选项 4: 资源完整性校验通过模拟
        registerDevOption({
            id: 'oneclick-resource-complete',
            label: '模拟：资源完整性校验通过',
            component: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                        checked={devResourceComplete}
                        onChange={(checked) => setDevResourceComplete(checked)}
                        size="small"
                    />
                    <span style={{ color: '#ccc', fontSize: 12 }}>
                        {devResourceComplete ? '开启' : '关闭'}
                    </span>
                </div>
            ),
            order: 5
        });

        // [新增] 选项 5: 磁盘可用空间调整
        registerDevOption({
            id: 'oneclick-disk-space',
            label: '模拟磁盘可用空间（一键式安装）',
            component: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Slider
                            value={devDiskFreeGB}
                            onChange={(value) => setDevDiskFreeGB(value as number)}
                            min={0}
                            max={500}
                            step={1}
                            style={{ flex: 1, minWidth: 120 }}
                        />
                        <InputNumber
                            value={devDiskFreeGB}
                            onChange={(value) => setDevDiskFreeGB(value as number)}
                            min={0}
                            max={1000}
                            suffix="GB"
                            style={{ width: 100 }}
                            size="small"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button size="small" onClick={() => setDevDiskFreeGB(5)} style={{ fontSize: 11 }}>5GB (不足)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(20)} style={{ fontSize: 11 }}>20GB (勉强)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(100)} style={{ fontSize: 11 }}>100GB (足够)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(424)} style={{ fontSize: 11 }}>424GB (默认)</Button>
                    </div>
                </div>
            ),
            order: 6
        });

        return () => {
            unregisterDevOption('oneclick-installer-region');
            unregisterDevOption('oneclick-installer-conflict');
            unregisterDevOption('oneclick-installer-demo');
            unregisterDevOption('oneclick-installer-demo-slow');
            unregisterDevOption('oneclick-install-manual-continue');
            unregisterDevOption('oneclick-resource-imported');
            unregisterDevOption('oneclick-resource-complete');
            unregisterDevOption('oneclick-disk-space');
        };
    }, [
        registerDevOption,
        unregisterDevOption,
        devRegionCN,
        devSimulateConflict,
        devInstallDemo,
        devDemoSlowProgress,
        devDemoSlowTotalSeconds,
        devInstallManualContinue,
        devResourceImported,
        devResourceComplete,
        devDiskFreeGB
    ]);

    const [cmTutorialVisible, setCmTutorialVisible] = useState<boolean>(false);
    const [keyTutorialVisible, setKeyTutorialVisible] = useState<boolean>(false);
    const [taobaoTutorialVisible, setTaobaoTutorialVisible] = useState<boolean>(false);
    const [resourceDownloadVisible, setResourceDownloadVisible] = useState<boolean>(false);
    const [deletePackageAfterInstall, setDeletePackageAfterInstall] = useState<boolean>(false);
    const [demoInstallId, setDemoInstallId] = useState<string | null>(null);

    // 纯净安装向导状态
    const [wizardStep, setWizardStep] = useState<number>(0);
    const [backupItems, setBackupItems] = useState<string[]>(['cars', 'tracks', 'dashes']);
    const [backupProgress, setBackupProgress] = useState<number>(0);
    const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

    // 冲突检测状态
    const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);

    // 启动时的冲突检测弹窗（初始值根据开发者选项设置，使用函数初始化确保读取到正确的值）
    const [initConflictVisible, setInitConflictVisible] = useState<boolean>(() => {
        const saved = localStorage.getItem('devSimulateConflict');
        return saved !== null ? saved === 'true' : false;
    });

    // 根据开发者 toggle 动态替换 “豪华全享版” 卡片为 “安装DEMO”
    const demoInstallMode = useMemo<InstallMode>(() => {
        return {
            id: 'demo',
            name: '安装DEMO',
            icon: <IconDownload size="extra-large" />,
            size: 5 * 1024 * 1024 * 1024,
            desc: '开发者调试版：资源校验/DLC模拟 + 写入模拟 .txt 文件，并接入后端 tracker。',
            color: '#a06cd5'
        };
    }, []);

    const installModesForUI = useMemo<InstallMode[]>(() => {
        if (!devInstallDemo) return INSTALL_MODES;
        // 只替换 full 卡片，不改变其它卡片的样式结构
        return INSTALL_MODES.map(m => (m.id === 'full' ? demoInstallMode : m));
    }, [devInstallDemo, demoInstallMode]);

    // 获取当前选中的模式对象
    const currentMode = useMemo(() => {
        const found = installModesForUI.find(m => m.id === selectedModeId);
        return found || installModesForUI[1];
    }, [selectedModeId, installModesForUI]);

    // 预检查（hook）
    const {
        checkingEnv, checkingResources,
        resourceState, setResourceState,
        cmInstalled, setCmInstalled,
        hasAllDLC
    } = usePrecheck({
        enabled: currentStep === 'PRE_CHECK',
        modeId: currentMode.id,
        devResourceImported: devResourceImported,
        devResourceComplete: devResourceComplete
    });

    // 安装相关（hook）
    const {
        cmInstalling, cmInstallProgress, cmInstallStatusText, cmInstallCompleted,
        handleInstallCM, importingProgress,
        handleResourceVerify, resourceVerifyState,
        createDemoInstall
    } = useInstallation();

    // CM 安装完成后同步到预检查状态
    useEffect(() => {
        if (cmInstallCompleted) {
            setCmInstalled(true);
        }
    }, [cmInstallCompleted, setCmInstalled]);

    // 资源校验完成后同步到预检查状态
    useEffect(() => {
        if (resourceVerifyState) {
            setResourceState(resourceVerifyState);
        }
    }, [resourceVerifyState, setResourceState]);

    // 当 devInstallDemo 切换时，保证 selectedModeId 与 UI 列表一致
    useEffect(() => {
        if (devInstallDemo && selectedModeId === 'full') {
            setSelectedModeId('demo');
        }
        if (!devInstallDemo && selectedModeId === 'demo') {
            setSelectedModeId('standard');
        }
    }, [devInstallDemo, selectedModeId]);

    // --- 1. 启动时检测逻辑 (修改后：受开发者模式控制) ---
    useEffect(() => {
        // 如果开发者开关开启，则模拟检测到冲突
        if (devSimulateConflict) {
            setIsDiagnosing(true);
            setInitConflictVisible(true);
        } else {
            // 默认情况下，直接跳过检测，进入主界面
            setIsDiagnosing(false);
            setInitConflictVisible(false);
        }
    }, [devSimulateConflict]);

    // --- 辅助函数：格式化大小 ---
    const formatSize = (bytes: number): string => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

    // [新增] 显示磁盘空间解决方案弹窗
    const showSpaceSolutionModal = (): void => {
        Modal.error({
            title: '磁盘空间不足',
            icon: <IconAlertTriangle style={{ color: '#ff4d4f' }} size="extra-large" />,
            content: (
                <div>
                    <Paragraph style={{ marginBottom: 16, fontSize: 15 }}>
                        安装 <strong style={{ color: currentMode.color }}>{currentMode.name}</strong> 需要{' '}
                        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatSize(currentMode.size)}</span> 空间，
                        但当前目标磁盘 ({DISK_INFO.label}) 仅剩 {formatSize(DISK_INFO.free)}。
                    </Paragraph>

                    <div
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid #444',
                            borderRadius: 8,
                            padding: 16
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <IconSetting style={{ color: '#00b5ad', marginTop: 4 }} size="large" />
                            <div>
                                <Text strong style={{ color: '#fff', fontSize: 14 }}>建议解决方案</Text>
                                <Paragraph style={{ color: '#999', marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>
                                    请前往设置页面调整存储策略。您可以开启 <strong>自动选择最大剩余空间磁盘</strong> 选项，
                                    或手动指定其他剩余空间充足的磁盘路径。
                                </Paragraph>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            okText: '立即前往设置',
            cancelText: '关闭',
            onOk: () => {
                navigate('SettingsPage', { state: { from: 'install-disk-low' } });
            },
            style: { maxWidth: 520 }
        });
    };

    const { navigate } = useNavigation();

    // --- 逻辑：处理一键安装点击 ---
    const handleInstallClick = (): void => {
        // 1. 检查磁盘空间
        if (currentMode.size > DISK_INFO.free) {
            Modal.error({
                title: '磁盘空间不足',
                // 使用自定义图标增强警示感
                icon: <IconAlertTriangle style={{ color: '#ff4d4f' }} size="extra-large" />,
                content: (
                    <div>
                        <Paragraph style={{ marginBottom: 16, fontSize: 15 }}>
                            安装 <strong style={{ color: currentMode.color }}>{currentMode.name}</strong> 需要 <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatSize(currentMode.size)}</span> 空间，
                            但当前目标磁盘 ({DISK_INFO.label}) 仅剩 {formatSize(DISK_INFO.free)}。
                        </Paragraph>

                        {/* 建议引导卡片 */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid #444',
                            borderRadius: 8,
                            padding: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <IconSetting style={{ color: '#00b5ad', marginTop: 4 }} size="large" />
                                <div>
                                    <Text strong style={{ color: '#fff', fontSize: 14 }}>建议解决方案</Text>
                                    <Paragraph style={{ color: '#999', marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>
                                        请前往设置页面调整存储策略。您可以开启 <strong>自动选择最大剩余空间磁盘</strong> 选项，或手动指定其他剩余空间充足的磁盘路径。
                                    </Paragraph>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                okText: '立即前往设置',
                cancelText: '暂不处理',
                // 点击确定时跳转
                onOk: () => {
                    navigate('SettingsPage', { state: { from: 'install-disk-low' } });
                },
                style: { maxWidth: 520 }
            });
            return;
        }

        // 2. 检查资源冲突 (保持原有逻辑)
        if (EXISTING_RESOURCES.length > 0 && mode !== 'clean_install') {
            setConflictModalVisible(true);
        } else {
            setCurrentStep('PRE_CHECK');
        }
    };

    const handleInstallComplete = (): void => {
        setCurrentStep('POST_INSTALL');
        setDemoInstallId(null);
        setRequireBackendInstall(false);
        Toast.success('安装完成！');
        // 可以在这里添加其他完成后的逻辑，比如刷新页面或跳转
    };

    // --- 逻辑：备份与重装模拟 ---
    const startBackup = (): void => {
        setIsBackingUp(true);
        let p = 0;
        const t = setInterval(() => {
            p += 5;
            setBackupProgress(p);
            if(p >= 100) {
                clearInterval(t);
                setIsBackingUp(false);
                setWizardStep(1); // 进入下一步
                Toast.success('备份完成');
            }
        }, 100);
    };

    const restoreBackup = (): void => {
        setIsBackingUp(true); // 复用loading状态
        // 模拟还原
        setTimeout(() => {
            setIsBackingUp(false);
            setMode('normal'); // 还原完成后回到普通安装模式
            setCurrentStep('SELECT_MODE');
            Toast.success('备份已还原，环境已重置，可以开始安装了');
        }, 2000);
    };

    const startRealInstall = (): void => {
        if (currentMode.id === 'demo') {
            Toast.info('开始 DEMO 安装，一切准备就绪');
            setRequireBackendInstall(true);
            setDemoInstallId(null);
            void (async () => {
                const installId = await createDemoInstall(
                    devDemoSlowProgress
                        ? { demoSlowProgress: true, demoSlowTotalSeconds: devDemoSlowTotalSeconds }
                        : undefined
                );
                if (installId) {
                    setDemoInstallId(installId);
                    setCurrentStep('INSTALLING');
                } else {
                    setRequireBackendInstall(false);
                }
            })();
            return;
        }

        setRequireBackendInstall(false);
        setCurrentStep('INSTALLING');
        Toast.info('开始安装，一切准备就绪');
    };

    // polling 逻辑已移至 useInstallation hook

    // [新增] 模拟导入资源文件动作
    const handleImportResource = (): void => {
        // DEMO：导入按钮在这里等价于“后端资源包校验”，并把 tracker 进度同步到 importingProgress。
        if (currentMode.id === 'demo') {
            handleResourceVerify(
                devDemoSlowProgress
                    ? { demoSlowProgress: true, demoSlowTotalSeconds: devDemoSlowTotalSeconds }
                    : undefined
            );
            return;
        }

        // 非 DEMO：本地模拟导入
        let localProgress = 1;
        const timer = setInterval(() => {
            localProgress += 10;
            if (localProgress >= 100) {
                clearInterval(timer);
                setResourceState({ imported: true, complete: devResourceComplete });
                Toast.success('资源包导入成功！');
            }
        }, 100);
    };

    // 启动检测弹窗（始终渲染在顶层）
    const renderInitConflictModal = (): React.JSX.Element => (
        <Modal
            title="检测到已安装光影模组"
            icon={<IconAlertTriangle style={{ color: '#ff9f43' }} size="extra-large" />}
            visible={initConflictVisible}
            closable={false}
            maskClosable={false}
            okText="是的，我要修复问题"
            cancelText="不是，我只是想更新/覆盖"
            style={{ maxWidth: 500 }}
            onOk={() => {
                setMode('clean_install');
                setInitConflictVisible(false);
                setIsDiagnosing(false);
            }}
            onCancel={() => {
                setMode('normal');
                setInitConflictVisible(false);
                setIsDiagnosing(false);
            }}
        >
            <div>
                <p>检测到您的游戏中已经安装了 CSP 或 Sol。</p>
                <p style={{ fontWeight: 'bold', marginTop: 10 }}>您是因为遇到游戏崩溃、黑屏或光影失效才使用此安装器的吗？</p>
            </div>
        </Modal>
    );

    if (isDiagnosing) {
        return (
            <>
                <Layout style={{ minHeight: '100vh', background: '#16161a', overflow: 'auto' }}>
                    <Content style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff' }}>正在检测游戏环境...</Text>
                    </Content>
                </Layout>
                {renderInitConflictModal()}
            </>
        );
    }

    const renderContent = (): React.JSX.Element => {
        if (mode !== 'normal') {
            return (
                <CleanInstallWizard
                    wizardStep={wizardStep}
                    setWizardStep={setWizardStep}
                    backupItems={backupItems}
                    setBackupItems={setBackupItems}
                    isBackingUp={isBackingUp}
                    backupProgress={backupProgress}
                    startBackup={startBackup}
                    restoreBackup={restoreBackup}
                    setMode={setMode}
                />
            );
        }
        switch (currentStep) {
            case 'SELECT_MODE':
                return (
                    <NormalInstaller
                        currentMode={currentMode}
                        DISK_INFO={DISK_INFO}
                        devRegionCN={devRegionCN}
                        setDevRegionCN={setDevRegionCN}
                        INSTALL_MODES={installModesForUI}
                        selectedModeId={selectedModeId}
                        setSelectedModeId={setSelectedModeId}
                        formatSize={formatSize}
                        handleInstallClick={handleInstallClick}
                        setMode={setMode}
                        showSpaceSolutionModal={showSpaceSolutionModal}
                        conflictModalVisible={conflictModalVisible}
                        setConflictModalVisible={setConflictModalVisible}
                        setCurrentStep={setCurrentStep}
                    />
                );
            case 'PRE_CHECK':
                return (
                    <PreCheckPage
                        currentMode={currentMode}
                        devRegionCN={devRegionCN}
                        formatSize={formatSize}
                        setCurrentStep={setCurrentStep}
                        checkingResources={checkingResources}
                        resourceState={resourceState}
                        resourceDownloadVisible={resourceDownloadVisible}
                        setResourceDownloadVisible={setResourceDownloadVisible}
                        importingProgress={importingProgress}
                        handleImportResource={handleImportResource}
                        deletePackageAfterInstall={deletePackageAfterInstall}
                        setDeletePackageAfterInstall={setDeletePackageAfterInstall}
                        checkingEnv={checkingEnv}
                        cmInstalled={cmInstalled}
                        cmTutorialVisible={cmTutorialVisible}
                        setCmTutorialVisible={setCmTutorialVisible}
                        handleInstallCM={handleInstallCM}
                        cmInstalling={cmInstalling}
                        cmInstallStatusText={cmInstallStatusText}
                        cmInstallProgress={cmInstallProgress}
                        hasAllDLC={hasAllDLC}
                        keyTutorialVisible={keyTutorialVisible}
                        setKeyTutorialVisible={setKeyTutorialVisible}
                        taobaoTutorialVisible={taobaoTutorialVisible}
                        setTaobaoTutorialVisible={setTaobaoTutorialVisible}
                        startRealInstall={startRealInstall}
                    />
                );
            case 'INSTALLING':
                return (
                    <InstallProgressPage
                        installId={demoInstallId || undefined}
                        onComplete={handleInstallComplete}
                        onCancel={() => {
                            setRequireBackendInstall(false);
                            setCurrentStep('PRE_CHECK');
                        }}
                        manualContinueAfterComplete={devInstallManualContinue}
                        requireBackendTracker={requireBackendInstall}
                    />
                );
            case 'POST_INSTALL':
                return <PostInstallPage setCurrentStep={setCurrentStep} />;
            default:
                return (
                    <NormalInstaller
                        currentMode={currentMode}
                        DISK_INFO={DISK_INFO}
                        devRegionCN={devRegionCN}
                        setDevRegionCN={setDevRegionCN}
                        INSTALL_MODES={installModesForUI}
                        selectedModeId={selectedModeId}
                        setSelectedModeId={setSelectedModeId}
                        formatSize={formatSize}
                        handleInstallClick={handleInstallClick}
                        setMode={setMode}
                        showSpaceSolutionModal={showSpaceSolutionModal}
                        conflictModalVisible={conflictModalVisible}
                        setConflictModalVisible={setConflictModalVisible}
                        setCurrentStep={setCurrentStep}
                    />
                );
        }
    };

    return (
        <>
            <Layout style={{ height: '100vh', background: '#16161a', color: 'white', overflow: 'hidden' }}>
                <Content style={{ padding: 40, overflowY: 'auto', height: '100%' }}>
                    {renderContent()}
                </Content>
            </Layout>
            {renderInitConflictModal()}
        </>
    );
}
