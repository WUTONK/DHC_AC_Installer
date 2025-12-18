import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Button, Typography, Modal, Steps, Card, Checkbox, Progress, Banner, Toast, List, Space, Row, Col, Tooltip, Divider, Tag, Switch, Slider, InputNumber } from '@douyinfe/semi-ui';
import {
    IconAlertTriangle, IconSave, IconRefresh, IconServer, IconFolder, IconArrowRight, IconTickCircle,
    IconDownload, IconFile, IconSetting, IconHelpCircle, IconBox, IconUpload, IconCloud
} from '@douyinfe/semi-icons';
import InstallProgressPage from './InstallProgressPage';
import { useDevMode } from './contexts/DevModeContext';

// 模拟数据：磁盘情况
const GAME_PATH = "D:\\SteamLibrary\\steamapps\\common\\assettocorsa";

interface DiskInfo {
    label: string;
    total: number; // bytes
    used: number;  // bytes
    free: number;  // bytes
}

const DEFAULT_DISK_INFO: DiskInfo = {
    label: 'D:',
    total: 1024 * 1024 * 1024 * 1024, // 1TB
    used: 600 * 1024 * 1024 * 1024,   // 600GB Used
    free: 424 * 1024 * 1024 * 1024    // 424GB Free
};

// 定义安装模式接口
interface InstallMode {
    id: string;
    name: string;
    icon: React.ReactNode;
    size: number;
    desc: string;
    color: string;
    recommended?: boolean;
}

// 定义三种安装模式
const INSTALL_MODES: InstallMode[] = [
    {
        id: 'minimal',
        name: '基础极速版',
        icon: <IconDownload size="extra-large" />,
        size: 5.2 * 1024 * 1024 * 1024,
        desc: '仅包含 CSP + Sol + 基础联机车包。适合硬盘空间紧张或仅需最低联机要求的玩家。',
        color: '#00b5ad'
    },
    {
        id: 'standard',
        name: '标准推荐版',
        icon: <IconTickCircle size="extra-large" />,
        size: 15.8 * 1024 * 1024 * 1024,
        desc: '包含首都高地图 + 常用车流 + 基础光影。最平衡的选择，推荐大多数玩家使用。',
        color: '#6bc786',
        recommended: true
    },
    {
        id: 'full',
        name: '豪华全享版',
        icon: <IconFile size="extra-large" />,
        size: 28.5 * 1024 * 1024 * 1024,
        desc: '包含 Pure 高级光影 + 4K 材质包 + 全套车包。体验极致画质，需要较好显卡。',
        color: '#a06cd5'
    }
];

// 模拟本地已存在的资源
const EXISTING_RESOURCES = ['extension', 'content/weather/sol'];

// 模拟配置需求数据
interface RequirementConfig {
    title: string;
    cpu: string;
    gpu: string;
    ram: string;
    note: string;
}

const REQUIREMENTS_MAP: Record<string, RequirementConfig> = {
    minimal: {
        title: '入门级配置',
        cpu: 'Intel Core i3-8100 或 AMD Ryzen 3 1200',
        gpu: 'NVIDIA GTX 1050 Ti (4GB) 或同级显卡',
        ram: '8 GB RAM',
        note: '可流畅运行联机模式，低画质。'
    },
    standard: {
        title: '推荐配置',
        cpu: 'Intel Core i5-9600K 或 AMD Ryzen 5 3600',
        gpu: 'NVIDIA GTX 1660 Super (6GB) 或 RTX 3050',
        ram: '16 GB RAM',
        note: '流畅运行首都高 + CSP 光影，中高画质。'
    },
    full: {
        title: '极致配置',
        cpu: 'Intel Core i7-10700K 或 AMD Ryzen 7 5800X',
        gpu: 'NVIDIA RTX 3070 (8GB) 或更高',
        ram: '32 GB RAM',
        note: '开启 Pure 高级光影 + 4K 材质 + 极致画质 (2K/4K分辨率)。'
    }
};

// Markdown 教程内容占位
const MD_CM_CONFIG = `# Content Manager 配置指南

1. 打开 Settings -> Content Manager。
2. 勾选 Custom Shaders Patch 并完成登录。
3. 重启游戏后测试光影是否正常。`;

const MD_CDKEY_USAGE = `# Steam CDKey 激活教程

1. 打开 Steam 客户端左下角「添加游戏」。
2. 选择「在 Steam 上激活产品」。
3. 输入购买的 CDKey 并确认激活。`;

const MD_TAOBAO_TUTORIAL = (
    <div>
        <p>1. 点击下方“前往淘宝购买”按钮。</p>
        <p>2. 在搜索结果中选择“Assetto Corsa Ultimate”或“神力科莎 终极版”。</p>
        <p>3. 推荐选择销量较高、价格合理的店铺（通常 15 元左右）。</p>
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
            <img
                src="https://placehold.co/600x300/png?text=Taobao+Search+Example"
                alt="淘宝搜索示例"
                style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>示例：搜索结果页示意图</div>
        </div>
        <p>4. 购买后您将获得 Steam 激活码 (CDKey)。</p>
        <p>5. 拿到激活码后，请参考界面的“如何使用 CDKey?”教程进行激活。</p>
    </div>
);

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface OneClickInstallerProps {
    onNavigate?: (page: string) => void;
}

// 安装步骤路由
type InstallStep = 'SELECT_MODE' | 'PRE_CHECK' | 'INSTALLING' | 'POST_INSTALL';

export default function OneClickInstaller({ onNavigate }: OneClickInstallerProps = {}): React.JSX.Element {
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
            unregisterDevOption('oneclick-resource-imported');
            unregisterDevOption('oneclick-resource-complete');
            unregisterDevOption('oneclick-disk-space');
        };
    }, [registerDevOption, unregisterDevOption, devRegionCN, devSimulateConflict, devResourceImported, devResourceComplete, devDiskFreeGB]);

    // 预检查状态
    const [cmInstalled, setCmInstalled] = useState<boolean>(false);
    const [hasAllDLC, setHasAllDLC] = useState<boolean>(true);
    const [cmTutorialVisible, setCmTutorialVisible] = useState<boolean>(false);
    const [keyTutorialVisible, setKeyTutorialVisible] = useState<boolean>(false);
    const [taobaoTutorialVisible, setTaobaoTutorialVisible] = useState<boolean>(false);
    const [checkingEnv, setCheckingEnv] = useState<boolean>(false);

    // [新增] 资源检测相关状态
    const [checkingResources, setCheckingResources] = useState<boolean>(false);
    const [resourceState, setResourceState] = useState<{ imported: boolean; complete: boolean }>({ imported: false, complete: false });
    const [resourceDownloadVisible, setResourceDownloadVisible] = useState<boolean>(false);
    const [importingProgress, setImportingProgress] = useState<number>(0); // 模拟导入进度
    const [deletePackageAfterInstall, setDeletePackageAfterInstall] = useState<boolean>(false); // 安装后删除包选项

    // CM 安装状态
    const [cmInstalling, setCmInstalling] = useState<boolean>(false);
    const [cmInstallProgress, setCmInstallProgress] = useState<number>(0);
    const [cmInstallStatusText, setCmInstallStatusText] = useState<string>('');

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

    // 获取当前选中的模式对象
    const currentMode = useMemo(() => INSTALL_MODES.find(m => m.id === selectedModeId) || INSTALL_MODES[1], [selectedModeId]);

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

    // 进入预检查后自动检测 CM、DLC 和资源状态（可替换为后端接口）
    useEffect(() => {
        if (currentStep !== 'PRE_CHECK') return;
        setCheckingEnv(true);
        setCheckingResources(true);
        // 模拟并行检测
        const timer = setTimeout(() => {
            setCmInstalled(false); // TODO: 替换为后端返回
            setHasAllDLC(false);   // TODO: 替换为后端返回
            setCheckingEnv(false);

            // 资源检测结果 (基于 DevMode)
            setResourceState({
                imported: devResourceImported,
                complete: devResourceComplete
            });
            setCheckingResources(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [currentStep, devResourceImported, devResourceComplete]);

    // --- 辅助函数：格式化大小 ---
    const formatSize = (bytes: number): string => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

    // --- 逻辑：处理一键安装点击 ---
    const handleInstallClick = (): void => {
        // 1. 检查磁盘空间
        if (currentMode.size > DISK_INFO.free) {
            Modal.error({
                title: '空间不足',
                content: `所选模式需要 ${formatSize(currentMode.size)}，但磁盘仅剩 ${formatSize(DISK_INFO.free)}`
            });
            return;
        }

        // 2. 检查资源冲突
        if (EXISTING_RESOURCES.length > 0 && mode !== 'clean_install') {
            setConflictModalVisible(true);
        } else {
            setCurrentStep('PRE_CHECK');
        }
    };

    const handleInstallComplete = (): void => {
        setCurrentStep('POST_INSTALL');
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
        setCurrentStep('INSTALLING');
        Toast.info('开始安装，一切准备就绪');
    };

    const handleInstallCM = (): void => {
        setCmInstalling(true);
        setCmInstallStatusText('正在连接服务器...');
        let p = 0;

        // 模拟下载和安装过程
        const timer = setInterval(() => {
            p += 2;
            setCmInstallProgress(p);

            if (p < 30) {
                setCmInstallStatusText(`正在下载 Content Manager... ${p}%`);
            } else if (p < 60) {
                setCmInstallStatusText(`正在下载 Content Manager... ${p}%`);
            } else if (p < 80) {
                setCmInstallStatusText('下载完成，正在解压文件...');
            } else if (p < 95) {
                setCmInstallStatusText('正在配置 CM 环境...');
            } else {
                setCmInstallStatusText('正在完成安装...');
            }

            if (p >= 100) {
                clearInterval(timer);
                setCmInstalling(false);
                setCmInstalled(true);
                setCmInstallProgress(0);
                Toast.success('Content Manager 安装成功！');
            }
        }, 100);
    };

    // [新增] 模拟导入资源文件动作
    const handleImportResource = (): void => {
        setImportingProgress(1);
        const timer = setInterval(() => {
            setImportingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setResourceState({ imported: true, complete: devResourceComplete }); // 导入后状态取决于完整性开关
                    setImportingProgress(0);
                    Toast.success('资源包导入成功！');
                    return 0;
                }
                return prev + 10;
            });
        }, 100);
    };

    const renderMarkdownModal = (
        visible: boolean,
        setVisible: React.Dispatch<React.SetStateAction<boolean>>,
        title: string,
        content: React.ReactNode,
        action?: React.ReactNode
    ): React.JSX.Element => (
        <Modal
            title={title}
            visible={visible}
            onCancel={() => setVisible(false)}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => setVisible(false)}>关闭</Button>
                    {action}
                </div>
            }
            style={{ maxWidth: 620 }}
            bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
        >
            {content}
        </Modal>
    );

    const renderPreCheckPage = (): React.JSX.Element => {
        // 判断是否允许开始安装：资源必须已导入且完整
        const canStartInstall = resourceState.imported && resourceState.complete;

        return (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px', paddingBottom: '40px' }}>
                <Button
                    icon={<IconArrowRight style={{ transform: 'rotate(180deg)' }} />}
                    onClick={() => setCurrentStep('SELECT_MODE')}
                    theme="borderless"
                    style={{ color: '#999', marginBottom: 10 }}
                >
                    返回模式选择
                </Button>

                <Title heading={3} style={{ color: 'var(--semi-color-text-0)', marginBottom: 12 }}>环境检查与准备</Title>
                <Text type="tertiary">正在为 <Text strong style={{color: currentMode.color}}>{currentMode.name}</Text> 准备环境，请确保以下项就绪。</Text>

                {/* 1. 本地资源包检测 (新增) */}
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconBox style={{ color: canStartInstall ? '#6bc786' : '#ff9f43' }} />
                            <span>资源包就绪状态 (必要)</span>
                        </div>
                    }
                    style={{ backgroundColor: '#232326', border: canStartInstall ? '1px solid #444' : '1px solid #ff9f43', marginTop: 20, marginBottom: 16 }}
                    headerStyle={{ borderBottom: '1px solid #333', color: '#fff' }}
                >
                    {checkingResources ? (
                        <div style={{ padding: 20, textAlign: 'center' }}>
                            <Space>
                                <IconRefresh style={{ animation: 'spin 1s linear infinite' }} />
                                <Text>正在扫描本地资源缓存...</Text>
                            </Space>
                        </div>
                    ) : (
                        <div>
                            {/* 情况 A: 未导入 */}
                            {!resourceState.imported && (
                                <div>
                                    <Banner
                                        type="warning"
                                        bordered
                                        icon={<IconAlertTriangle />}
                                        description="未检测到所需的安装包资源。请先获取资源并导入。"
                                        style={{ marginBottom: 16, backgroundColor: 'rgba(255, 159, 67, 0.1)' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8 }}>
                                        <div>
                                            <Text style={{ color: '#ccc', display: 'block', marginBottom: 4 }}>方式一：从群文件/网盘下载</Text>
                                            <Text type="tertiary" size="small">下载 <Text code>DHC_{currentMode.id}_v1.0.7z</Text> 后，拖入或手动选择。</Text>
                                        </div>
                                        <Space>
                                            <Button theme="light" icon={<IconCloud />} onClick={() => setResourceDownloadVisible(true)}>获取资源链接</Button>
                                            <Button theme="solid" icon={<IconUpload />} onClick={handleImportResource} loading={importingProgress > 0}>
                                                {importingProgress > 0 ? `导入中 ${importingProgress}%` : '选择本地文件导入'}
                                            </Button>
                                        </Space>
                                    </div>
                                    {importingProgress > 0 && (
                                        <Progress percent={importingProgress} stroke={currentMode.color} style={{height: 4, marginTop: 16}} />
                                    )}
                                </div>
                            )}

                            {/* 情况 B: 已导入但损坏 */}
                            {resourceState.imported && !resourceState.complete && (
                                <div>
                                    <Banner
                                        type="danger"
                                        bordered
                                        description="资源包校验失败！文件可能损坏或不完整 (MD5 Mismatch)。"
                                        style={{ marginBottom: 16, backgroundColor: 'rgba(255, 77, 79, 0.1)' }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <Button theme="solid" type="danger" icon={<IconRefresh />} onClick={handleImportResource}>重新导入资源包</Button>
                                        <Text type="tertiary">建议重新下载资源包后再次尝试。</Text>
                                    </div>
                                </div>
                            )}

                            {/* 情况 C: 就绪 */}
                            {resourceState.imported && resourceState.complete && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <IconTickCircle size="extra-large" style={{ color: '#6bc786' }} />
                                        <div>
                                            <Text style={{ color: '#6bc786', fontWeight: 'bold', fontSize: 16 }}>资源包已就绪</Text>
                                            <div style={{ marginTop: 4 }}>
                                                <Text type="tertiary" size="small">完整性校验通过，可以开始安装。</Text>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ borderLeft: '1px solid #444', paddingLeft: 20 }}>
                                        <Checkbox
                                            checked={deletePackageAfterInstall}
                                            onChange={(e) => {
                                                const checked = (e.target as HTMLInputElement).checked;
                                                setDeletePackageAfterInstall(checked);
                                            }}
                                        >
                                            <Text style={{ color: '#ccc' }}>安装完成后删除源文件</Text>
                                        </Checkbox>
                                        <div style={{ marginTop: 4 }}>
                                            <Text type="tertiary" size="small">释放约 {formatSize(currentMode.size)} 磁盘空间</Text>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconSetting />
                            <span>Content Manager (CM) 检测</span>
                        </div>
                    }
                    style={{ backgroundColor: '#232326', border: '1px solid #444', marginTop: 20, marginBottom: 16 }}
                    headerStyle={{ borderBottom: '1px solid #333', color: '#fff' }}
                >
                    {checkingEnv ? (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                            <Space vertical align="center">
                                <IconRefresh style={{ animation: 'spin 1s linear infinite' }} />
                                <Text>正在检测本地是否已安装 Content Manager...</Text>
                            </Space>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>
                                    如果未安装 CM，将无法方便地管理光影与模组。建议先完成安装。
                                </Text>
                                <Space spacing={8}>
                                    <Tag color={cmInstalled ? 'orange' : 'grey'} type="solid">
                                        {cmInstalled ? '已检测到 CM' : '未检测到 CM'}
                                    </Tag>
                                    {cmInstalled && (
                                        <Text type="tertiary" size="small">
                                            继续安装可能覆盖部分 CM 配置
                                        </Text>
                                    )}
                                </Space>
                            </div>
                            <Space>
                                <Button icon={<IconHelpCircle />} theme="light" onClick={() => setCmTutorialVisible(true)}>
                                    配置教程
                                </Button>
                                {cmInstalled ? (
                                    <Tooltip content="检测到已安装，继续可覆盖未保护的 CM 配置">
                                        <Button theme="solid" type="warning" disabled style={{ opacity: 0.6 }}>
                                            已安装
                                        </Button>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        theme="solid"
                                        icon={<IconDownload />}
                                        style={{ backgroundColor: '#00b5ad' }}
                                        onClick={handleInstallCM}
                                        loading={cmInstalling}
                                    >
                                        {cmInstalling ? '正在安装' : '一键安装 CM'}
                                    </Button>
                                )}
                            </Space>
                        </div>
                    )}

                    {/* CM 安装进度条 */}
                    {cmInstalling && (
                        <div style={{ marginTop: 24, borderTop: '1px solid #333', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: '#ccc', fontSize: 13 }}>{cmInstallStatusText}</Text>
                                <Text style={{ color: '#00b5ad', fontWeight: 'bold', fontSize: 13 }}>{cmInstallProgress}%</Text>
                            </div>
                            <Progress
                                percent={cmInstallProgress}
                                stroke="#00b5ad"
                                style={{ height: 6 }}
                                showInfo={false}
                            />
                        </div>
                    )}
                </Card>

                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconFile style={{ color: hasAllDLC ? '#6bc786' : '#ff4d4f' }} />
                            <span>DLC 与车包检测</span>
                        </div>
                    }
                    style={{ backgroundColor: '#232326', border: '1px solid #444', marginBottom: 20 }}
                    headerStyle={{ borderBottom: '1px solid #333', color: '#fff' }}
                >
                    {hasAllDLC ? (
                        <div style={{ color: '#6bc786', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IconTickCircle />
                            <Text style={{ color: '#6bc786' }}>已检测到完整 DLC，可直接开始安装。</Text>
                        </div>
                    ) : (
                        <>
                            <Banner
                                type="danger"
                                description="缺少 Japanese Pack 等核心 DLC，部分服务器（如首都高）需要这些内容。"
                                style={{ marginBottom: 12, borderRadius: 8 }}
                            />
                            {devRegionCN ? (
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8 }}>
                                    <Text strong style={{ color: '#ff9f43' }}>中国区推荐：淘宝全 DLC 版本</Text>
                                    <div style={{ margin: '10px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                            <div>
                                                <Text type="tertiary" size="small">Steam 官方价</Text>
                                                <div style={{ color: '#666', textDecoration: 'line-through' }}>¥ 88.00</div>
                                            </div>
                                            <Divider layout="vertical" style={{ borderColor: '#555', height: 32, margin: '0 4px' }} />
                                            <div>
                                                <Text type="tertiary" size="small">淘宝全 DLC 估价</Text>
                                                <div style={{ color: '#6bc786', fontWeight: 'bold', fontSize: 18 }}>¥ 12.00</div>
                                            </div>
                                        </div>
                                    </div>
                                    <Space spacing={10}>
                                        <Button
                                            theme="solid"
                                            type="primary"
                                            icon={<IconFolder />}
                                            onClick={() => setTaobaoTutorialVisible(true)}
                                        >
                                            进入购买页面
                                        </Button>
                                        <Button theme="borderless" icon={<IconHelpCircle />} onClick={() => setKeyTutorialVisible(true)} style={{ color: '#fff' }}>
                                            如何使用 CDKey？
                                        </Button>
                                    </Space>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: '#ccc' }}>建议前往 Steam 购买官方 DLC，以保证正版体验。</Text>
                                    <Button theme="solid" icon={<IconDownload />} onClick={() => window.open('https://store.steampowered.com/app/244210/Assetto_Corsa/', '_blank')}>
                                        前往 Steam
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Card>

                <div style={{ textAlign: 'center', marginTop: 30, marginBottom: 20 }}>
                    <Button
                        theme="solid"
                        size="large"
                        disabled={!canStartInstall}
                        style={{
                            width: 320,
                            height: 56,
                            fontSize: 16,
                            fontWeight: 'bold',
                            backgroundColor: canStartInstall ? currentMode.color : '#444',
                            cursor: canStartInstall ? 'pointer' : 'not-allowed'
                        }}
                        onClick={startRealInstall}
                    >
                        {canStartInstall ? '确认环境并开始安装' : '请先准备资源包'}
                    </Button>
                    {!canStartInstall && (
                        <div style={{ marginTop: 12 }}>
                            <Text type="tertiary">您需要先导入并校验通过资源包才能继续</Text>
                        </div>
                    )}
                    {canStartInstall && (
                    <div style={{ marginTop: 12 }}>
                        <Checkbox defaultChecked>我已阅读并知晓上述提示</Checkbox>
                    </div>
                    )}
                </div>

                {/* 资源下载链接 Modal */}
                <Modal
                    visible={resourceDownloadVisible}
                    onCancel={() => setResourceDownloadVisible(false)}
                    title="获取资源包"
                    footer={null}
                    style={{ maxWidth: 500 }}
                >
                    <List>
                        <List.Item
                            main={<Text link onClick={() => window.open('https://example.com/qq-group', '_blank')}>QQ群文件下载 (推荐)</Text>}
                            extra={<Text type="tertiary">群号: 888888</Text>}
                        />
                        <List.Item
                            main={<Text link onClick={() => window.open('https://pan.baidu.com/example', '_blank')}>百度网盘 (提取码: 1234)</Text>}
                        />
                        <List.Item
                            main={<Text link onClick={() => window.open('https://123pan.com/example', '_blank')}>123 云盘 (不限速)</Text>}
                        />
                    </List>
                </Modal>

                {renderMarkdownModal(cmTutorialVisible, setCmTutorialVisible, 'CM 配置教程', MD_CM_CONFIG)}
                {renderMarkdownModal(keyTutorialVisible, setKeyTutorialVisible, 'CDKey 激活教程', MD_CDKEY_USAGE)}
                {renderMarkdownModal(
                    taobaoTutorialVisible,
                    setTaobaoTutorialVisible,
                    '淘宝购买教程',
                    MD_TAOBAO_TUTORIAL,
                    <Button theme="solid" type="primary" onClick={() => window.open('https://s.taobao.com/search?q=Assetto+Corsa+Ultimate', '_blank')}>
                        前往淘宝购买
                    </Button>
                )}
            </div>
        );
    };

    const renderPostInstallPage = (): React.JSX.Element => {
        return (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <IconTickCircle size="extra-large" style={{ color: '#6bc786', fontSize: 54, marginBottom: 12 }} />
                    <Title heading={3} style={{ color: '#fff', marginBottom: 4 }}>安装完成！</Title>
                    <Text type="tertiary">环境已配置完成，挑选一个服务器上路吧。</Text>
                </div>

                <Row gutter={[16, 16]}>
                    <Col span={14}>
                        <Card
                            style={{ backgroundColor: '#232326', border: '1px solid #444', height: '100%' }}
                            bodyStyle={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                        >
                            <IconServer size="extra-large" style={{ color: '#6bc786', fontSize: 64, marginBottom: 20 }} />
                            <Title heading={4} style={{ color: '#fff', marginBottom: 12 }}>探索服务器</Title>
                            <Text style={{ color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
                                浏览热门服务器推荐，找到适合你的服务器加入游戏
                            </Text>
                            <Button
                                theme="solid"
                                size="large"
                                icon={<IconArrowRight />}
                                style={{ backgroundColor: '#6bc786', color: '#fff', fontWeight: 'bold', minWidth: 200 }}
                                onClick={() => {
                                    if (onNavigate) {
                                        onNavigate('ServerListPage')
                                    }
                                }}
                            >
                                前往服务器推荐页面
                            </Button>
                        </Card>
                    </Col>
                    <Col span={10}>
                        <Card
                            style={{
                                background: 'linear-gradient(135deg, #a06cd5 0%, #6bc786 100%)',
                                border: 'none',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                            bodyStyle={{ padding: 20 }}
                        >
                            <IconHelpCircle style={{ fontSize: 42, color: '#fff', marginBottom: 10 }} />
                            <Title heading={4} style={{ color: '#fff' }}>赞助我们</Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.9)' }}>
                                如果这个安装器帮助到你，欢迎请开发者喝杯咖啡。赞助非强制，但能让项目走得更远。
                            </Paragraph>
                            <Button theme="solid" style={{ backgroundColor: '#fff', color: '#a06cd5', fontWeight: 'bold' }} block>
                                ☕ 赞助一杯咖啡
                            </Button>
                        </Card>
                    </Col>
                </Row>

                <Divider style={{ borderColor: '#333', margin: '36px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <Button onClick={() => setCurrentStep('SELECT_MODE')}>返回主页</Button>
                    <Button theme="solid" type="primary" onClick={() => window.close()}>启动 CM 并关闭</Button>
                </div>
            </div>
        );
    };

    // --- 渲染：纯净重装向导 (Mode: clean_install) ---
    const renderCleanInstallWizard = (): React.JSX.Element => (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: 30 }}>
                <Button
                    icon={<IconArrowRight style={{transform: 'rotate(180deg)'}}/>}
                    onClick={() => setMode('normal')}
                    theme="borderless"
                    style={{color:'#999', marginBottom: 10}}
                >
                    返回常规模式
                </Button>
                <Title heading={3} style={{ color: 'var(--semi-color-text-0)' }}>纯净重装向导</Title>
                <Steps current={wizardStep} style={{ marginTop: 20 }}>
                    <Steps.Step title="资源备份" description="保存重要资产" />
                    <Steps.Step title="清理游戏" description="卸载并重装" />
                    <Steps.Step title="恢复环境" description="还原备份" />
                </Steps>
            </div>
            <Card style={{ borderRadius: 12 }}>
                {wizardStep === 0 && (
                    <>
                        <Title heading={5}>1. 选择要备份的内容</Title>
                        <Banner
                            type="warning"
                            style={{ margin: '16px 0', borderRadius: 8 }}
                            description={
                                <div>
                                    注意：除了以下勾选的内容，<strong>所有其他 MOD、配置、截图和回放都将被清空</strong>。请确保您知晓此操作的后果。
                                </div>
                            }
                        />
                        <div style={{ backgroundColor: 'var(--semi-color-fill-0)', padding: 16, borderRadius: 8 }}>
                            <Checkbox.Group value={backupItems} onChange={(values) => setBackupItems(values as string[])} style={{ width: '100%' }}>
                                <List>
                                    <List.Item
                                        style={{ padding: 10, borderBottom: '1px solid var(--semi-color-border)' }}
                                        header={<Checkbox value="cars">车辆 (content/cars)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留所有已安装的第三方车辆模组</Text>}
                                    />
                                    <List.Item
                                        style={{ padding: 10, borderBottom: '1px solid var(--semi-color-border)' }}
                                        header={<Checkbox value="tracks">赛道 (content/tracks)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留所有已安装的第三方地图/赛道</Text>}
                                    />
                                    <List.Item
                                        style={{ padding: 10 }}
                                        header={<Checkbox value="dashes">仪表盘 (apps/python)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留 SimHub 或其他仪表盘插件配置</Text>}
                                    />
                                </List>
                            </Checkbox.Group>
                        </div>
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            {isBackingUp ? (
                                <div>
                                    <Text type="tertiary">正在备份资源到临时目录...</Text>
                                    <Progress percent={backupProgress} style={{marginTop: 8}} stroke="#6bc786" />
                                </div>
                            ) : (
                                <Button
                                    theme="solid"
                                    icon={<IconSave />}
                                    style={{ backgroundColor: '#6bc786', color: '#fff' }}
                                    onClick={startBackup}
                                >
                                    开始备份
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {wizardStep === 1 && (
                    <>
                        <Title heading={5}>2. 彻底清理游戏文件</Title>
                        <div style={{ color: 'var(--semi-color-text-1)', margin: '20px 0', lineHeight: 1.8 }}>
                            <p>备份已完成。为了解决光影崩溃问题，请严格按照以下步骤操作：</p>
                            <ol style={{ paddingLeft: 20 }}>
                                <li>打开 Steam，右键 Assetto Corsa -&gt; 管理 -&gt; <strong>卸载</strong>。</li>
                                <li>打开文件夹：<Text code>{GAME_PATH}</Text></li>
                                <li><strong>手动删除</strong>该目录下剩余的所有文件（非常重要，Steam 卸载不干净）。</li>
                                <li>回到 Steam，点击<strong>安装</strong>，等待下载完成。</li>
                            </ol>
                        </div>
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button theme="solid" type="primary" onClick={() => setWizardStep(2)}>
                                我已完成重装，下一步
                            </Button>
                        </div>
                    </>
                )}

                {wizardStep === 2 && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <IconRefresh size="extra-large" style={{ color: '#6bc786', marginBottom: 20 }} />
                        <Title heading={5}>3. 恢复备份与环境</Title>
                        <p style={{ color: 'var(--semi-color-text-1)', marginBottom: 20 }}>
                            我们将把刚才备份的车辆和赛道还原到新安装的游戏中。
                        </p>
                        {isBackingUp ? (
                             <Progress percent={66} stroke="#6bc786" aria-label="restoring" />
                        ) : (
                            <Button
                                theme="solid"
                                size="large"
                                style={{ backgroundColor: '#6bc786', color: '#fff' }}
                                onClick={restoreBackup}
                            >
                                恢复备份并进入安装页面
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );

    // --- 渲染：常规一键安装 (Mode: normal) ---
    const renderNormalInstaller = (): React.JSX.Element => {
        const percentUsed = (DISK_INFO.used / DISK_INFO.total) * 100;
        const percentInstall = (currentMode.size / DISK_INFO.total) * 100;
        const isSpaceLow = (DISK_INFO.free < currentMode.size);
        const req = REQUIREMENTS_MAP[selectedModeId] || REQUIREMENTS_MAP['standard'];
        const specsData = [
            { key: '处理器 (CPU)', value: req.cpu, icon: <IconServer /> },
            { key: '显卡 (GPU)', value: req.gpu, icon: <IconServer /> },
            { key: '内存 (RAM)', value: req.ram, icon: <IconDownload /> },
        ];

        return (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <Title heading={3} style={{ color: '#fff', margin: 0 }}>一键式安装</Title>
                        <Text style={{ color: '#888' }}>选择适合你的预设方案，全自动配置游戏环境</Text>
                    </div>
                    <Button
                        icon={<IconRefresh />}
                        theme="borderless"
                        style={{ color: '#ff9f43' }}
                        onClick={() => setMode('clean_install')}
                    >
                        修复模式
                    </Button>
                </div>

                {/* --- 1. 模式选择卡片 (修复可见度) --- */}
                <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
                    {INSTALL_MODES.map(item => {
                        const isSelected = selectedModeId === item.id;
                        return (
                            <Col span={8} key={item.id}>
                                <div
                                    onClick={() => setSelectedModeId(item.id)}
                                    style={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        // [修复]: 确保背景色是深色 (#232326)，而不是透明或白色
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : '#232326',
                                        border: `2px solid ${isSelected ? item.color : '#333'}`, // 未选中时给一个深灰边框
                                        borderRadius: 12,
                                        padding: 24,
                                        height: '100%',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        boxShadow: isSelected ? `0 0 20px ${item.color}20` : 'none' // 选中加一点光晕
                                    }}
                                >
                                    {/* 推荐标签 */}
                                    {item.recommended && (
                                        <div style={{
                                            position: 'absolute', top: 0, right: 0,
                                            background: item.color, color: '#fff',
                                            fontSize: 10, padding: '2px 8px',
                                            borderRadius: '0 8px 0 8px', fontWeight: 'bold'
                                        }}>
                                            RECOMMENDED
                                        </div>
                                    )}

                                    <div style={{
                                        color: item.color,
                                        marginBottom: 16,
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        padding: 12,
                                        borderRadius: '50%'
                                    }}>
                                        {item.icon}
                                    </div>

                                    <Title heading={5} style={{ color: '#fff', marginBottom: 8 }}>{item.name}</Title>

                                    {/* [修复]: 强制指定文字颜色为浅灰，防止在深色背景下看不清 */}
                                    <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 16, flex: 1, lineHeight: 1.5 }}>
                                        {item.desc}
                                    </Text>

                                    <div style={{ marginTop: 'auto', borderTop: '1px solid #333', width: '100%', paddingTop: 12 }}>
                                        <Text style={{ color: '#666', fontSize: 12 }}>预计大小</Text>
                                        <div style={{ color: item.color, fontWeight: 'bold', fontSize: 16 }}>{formatSize(item.size)}</div>
                                    </div>
                                    {/* 选中时的对勾 */}
                                    {isSelected && (
                                        <div style={{ position: 'absolute', top: 12, left: 12, color: item.color }}>
                                            <IconTickCircle size="large" />
                                        </div>
                                    )}
                                </div>
                            </Col>
                        );
                    })}
                </Row>

                {/* 配置需求提示条 */}
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: '16px 24px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <div style={{ marginRight: 40, minWidth: 120 }}>
                        <Text style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 4 }}>推荐配置</Text>
                        <Text style={{ color: currentMode.color, fontWeight: 'bold', fontSize: 16 }}>{req.title}</Text>
                        <Paragraph style={{ color: '#888', marginTop: 4, fontSize: 12, marginBottom: 0 }}>
                            {req.note}
                        </Paragraph>
                    </div>
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', gap: 20 }}>
                        {specsData.map((spec, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ color: '#666' }}>{spec.icon}</div>
                                <div>
                                    <Text style={{ color: '#555', fontSize: 12, display: 'block', lineHeight: 1.2 }}>{spec.key}</Text>
                                    <Text style={{ color: '#ddd', fontSize: 13, fontWeight: 500 }}>{spec.value}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- 2. 磁盘空间检测 (修复白底问题) --- */}
                <Card
                    // [修复]: 显式设置 backgroundColor: '#232326'，覆盖 Semi 默认的白色背景
                    style={{ backgroundColor: '#232326', borderRadius: 12, border: '1px solid #444', marginBottom: 20 }}
                    // [修复]: 强制 Title 颜色为白色
                    title={
                        <div style={{display:'flex', alignItems:'center', gap: 8}}>
                            <IconServer style={{color:'#fff'}} />
                            <span style={{color:'#fff'}}>磁盘空间预估</span>
                        </div>
                    }
                    bodyStyle={{ padding: '20px 24px' }}
                >
                    <div style={{ height: 24, backgroundColor: '#333', borderRadius: 12, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                        {/* 已用 */}
                        <div style={{ width: `${percentUsed}%`, backgroundColor: '#555', height: '100%' }} />
                        {/* 预计新增 (带动画) */}
                        <div style={{
                            width: `${percentInstall}%`,
                            backgroundColor: isSpaceLow ? '#ff4d4f' : currentMode.color, // 跟随模式颜色
                            height: '100%',
                            transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#555' }}></div>
                                {/* [修复]: 强制文字颜色 */}
                                <Text style={{color:'#ccc'}}>已用: {formatSize(DISK_INFO.used)}</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMode.color }}></div>
                                <Text style={{color: currentMode.color, fontWeight:'bold'}}>
                                    {currentMode.name}: +{formatSize(currentMode.size)}
                                </Text>
                            </div>
                        </div>
                        {/* [修复]: 强制文字颜色 */}
                        <Text style={{color: isSpaceLow ? '#ff4d4f' : '#ccc'}}>
                            剩余可用: {formatSize(DISK_INFO.free)}
                        </Text>
                    </div>
                </Card>

                {/* --- 3. 自定义模式引导入口 (修复文字看不清) --- */}
                <div style={{ marginBottom: 40, padding: '0 5px' }}>
                    <Banner
                        type="info"
                        bordered
                        icon={<IconSetting style={{color: '#fff'}} />}
                        // [修复]: Banner 背景设为深色半透明
                        style={{ backgroundColor: 'rgba(35, 35, 38, 0.8)', borderColor: '#444', borderRadius: 8 }}
                        description={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <div style={{ flex: 1 }}>
                                    {/* [修复]: 强制 Title 和 Text 颜色 */}
                                    <Text strong style={{ color: '#fff', fontSize: 15 }}>需要更个性化的选择？</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text style={{ color: '#ccc', fontSize: 13 }}>
                                            如果您只想安装特定的车包，或者想手动调整光影版本，请使用其他安装方式。
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    theme="solid"
                                    type="primary"
                                    icon={<IconArrowRight />}
                                    style={{
                                        backgroundColor: '#00b5ad',
                                        color: '#fff',
                                        marginLeft: 16,
                                        flexShrink: 0
                                    }}
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate('CustomInstallWizard');
                                        }
                                    }}
                                >
                                    前往自定义安装
                                </Button>
                            </div>
                        }
                    />
                </div>

                {/* --- 4. 底部安装按钮 --- */}
                <div style={{ textAlign: 'center', paddingBottom: 40 }}>
                    <Button
                        theme="solid"
                        size="large"
                        style={{
                            backgroundColor: isSpaceLow ? '#555' : currentMode.color, // 按钮颜色随模式变
                            color: '#fff',
                            width: 320,
                            height: 64,
                            fontSize: 18,
                            fontWeight: 'bold',
                            boxShadow: `0 8px 20px -6px ${currentMode.color}80` // 阴影颜色也随模式变
                        }}
                        disabled={isSpaceLow}
                        onClick={handleInstallClick}
                    >
                        {isSpaceLow ? '磁盘空间不足' : '下一步：环境检查'}
                    </Button>
                    <Text style={{ display: 'block', marginTop: 16, color: '#666', fontSize: 12 }}>
                        点击安装即代表同意覆盖现有配置
                    </Text>
                </div>

                {/* 冲突确认 Modal */}
                <Modal
                    title={<span style={{color:'#ff9f43'}}>确认覆盖安装？</span>}
                    visible={conflictModalVisible}
                    onCancel={() => setConflictModalVisible(false)}
                    onOk={() => {
                        setConflictModalVisible(false);
                        setCurrentStep('PRE_CHECK');
                    }}
                    okText="我确定，覆盖它们"
                    okButtonProps={{ type: 'danger', theme: 'solid' }}
                    cancelText="取消"
                    style={{ maxWidth: 450 }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <IconAlertTriangle size="extra-large" style={{ color: '#ff9f43', marginBottom: 10 }} />
                        <Paragraph style={{ fontSize: 16 }}>
                            检测到您已安装部分模组。继续安装 <strong>{currentMode.name}</strong> 将会重置相关文件。
                        </Paragraph>
                    </div>
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ffccc7', padding: 12, borderRadius: 6, color: '#cf1322', fontSize: 13 }}>
                        ⚠️ 此操作不可撤销，建议先备份重要数据。
                    </div>
                </Modal>
            </div>
        );
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
            return renderCleanInstallWizard();
        }
        switch (currentStep) {
            case 'SELECT_MODE':
                return renderNormalInstaller();
            case 'PRE_CHECK':
                return renderPreCheckPage();
            case 'INSTALLING':
                return <InstallProgressPage onComplete={handleInstallComplete} />;
            case 'POST_INSTALL':
                return renderPostInstallPage();
            default:
                return renderNormalInstaller();
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
