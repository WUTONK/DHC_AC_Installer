import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Button, Typography, Modal, Steps, Card, Checkbox, Progress, Banner, Toast, List, Space, Row, Col } from '@douyinfe/semi-ui';
import {
    IconAlertTriangle, IconSave, IconRefresh, IconServer, IconFolder, IconArrowRight, IconTickCircle,
    IconDownload, IconPlay, IconFile, IconSetting, IconHelpCircle
} from '@douyinfe/semi-icons';
import InstallProgressPage from './InstallProgressPage';

// 模拟数据：磁盘情况
const GAME_PATH = "D:\\SteamLibrary\\steamapps\\common\\assettocorsa";

interface DiskInfo {
    label: string;
    total: number; // bytes
    used: number;  // bytes
    free: number;  // bytes
}

const DISK_INFO: DiskInfo = {
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

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface OneClickInstallerProps {
    onNavigate?: (page: string) => void;
}

export default function OneClickInstaller({ onNavigate }: OneClickInstallerProps = {}): React.JSX.Element {
    // --- 状态管理 ---
    const [isDiagnosing, setIsDiagnosing] = useState<boolean>(true); // 是否正在诊断
    const [mode, setMode] = useState<'normal' | 'clean_install'>('normal'); // 'normal' | 'clean_install'
    const [selectedModeId, setSelectedModeId] = useState<string>('standard'); // 默认选中标准版
    const [showProgressPage, setShowProgressPage] = useState<boolean>(false); // 是否显示安装进度页面

    // 纯净安装向导状态
    const [wizardStep, setWizardStep] = useState<number>(0);
    const [backupItems, setBackupItems] = useState<string[]>(['cars', 'tracks', 'dashes']);
    const [backupProgress, setBackupProgress] = useState<number>(0);
    const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

    // 冲突检测状态
    const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);

    // 获取当前选中的模式对象
    const currentMode = useMemo(() => INSTALL_MODES.find(m => m.id === selectedModeId) || INSTALL_MODES[1], [selectedModeId]);

    // --- 1. 启动时检测逻辑 ---
    useEffect(() => {
        // 模拟：检测到本地已经安装了 CSP 或 Sol
        const hasExistingShaders = true;
        if (hasExistingShaders) {
            Modal.confirm({
                title: '检测到已安装光影模组',
                icon: <IconAlertTriangle style={{ color: '#ff9f43' }} size="extra-large" />,
                content: (
                    <div>
                        <p>检测到您的游戏中已经安装了 CSP 或 Sol。</p>
                        <p style={{ fontWeight: 'bold', marginTop: 10 }}>您是因为遇到游戏崩溃、黑屏或光影失效才使用此安装器的吗？</p>
                    </div>
                ),
                okText: '是的，我要修复问题',
                cancelText: '不是，我只是想更新/覆盖',
                style: { maxWidth: 500 },
                onOk: () => {
                    setMode('clean_install');
                    setIsDiagnosing(false);
                },
                onCancel: () => {
                    setMode('normal');
                    setIsDiagnosing(false);
                }
            });
        } else {
            setIsDiagnosing(false);
        }
    }, []);

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
        if (EXISTING_RESOURCES.length > 0) {
            setConflictModalVisible(true);
        } else {
            startInstall();
        }
    };

    const startInstall = (): void => {
        setConflictModalVisible(false);
        Toast.success(`正在开始安装：${currentMode.name}`);
        // 切换到安装进度页面
        setShowProgressPage(true);
    };

    const handleInstallComplete = (): void => {
        setShowProgressPage(false);
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
            Toast.success('备份已还原，环境已重置，可以开始安装了');
        }, 2000);
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
                                <div>
                                    {/* [修复]: 强制 Title 和 Text 颜色 */}
                                    <Text strong style={{ color: '#fff', fontSize: 15 }}>需要更个性化的选择？</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text style={{ color: '#ccc', fontSize: 13 }}>
                                            如果您只想安装特定的车包，或者想手动调整光影版本，请前往"模组安装"页面。
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    theme="borderless"
                                    style={{ fontWeight: 'bold', color: '#00b5ad' }}
                                    onClick={() => onNavigate && onNavigate('ModInstallPage')}
                                >
                                    去自定义安装 <IconArrowRight />
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
                        {isSpaceLow ? '磁盘空间不足' : `安装 ${currentMode.name}`}
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
                    onOk={startInstall}
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

    // 如果显示安装进度页面，直接渲染进度页面
    if (showProgressPage) {
        return <InstallProgressPage onComplete={handleInstallComplete} />;
    }

    if (isDiagnosing) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#16161a', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff' }}>正在检测游戏环境...</Text>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#16161a', color: 'white', padding: 40 }}>
            <Content>
                {mode === 'normal' ? renderNormalInstaller() : renderCleanInstallWizard()}
            </Content>
        </Layout>
    );
}
