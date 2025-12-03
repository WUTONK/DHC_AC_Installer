import React, { useState, useEffect } from 'react';
import { Layout, Button, Typography, Modal, Steps, Card, Checkbox, Progress, Banner, Toast, List, Space, Divider } from '@douyinfe/semi-ui';
import { 
    IconAlertTriangle, IconSave, IconRefresh, IconServer, IconFolder, IconArrowRight, IconTickCircle 
} from '@douyinfe/semi-icons';

// 模拟数据：磁盘和资源情况
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

// 待安装的模组包总大小
const INSTALL_SIZE = 15 * 1024 * 1024 * 1024; // 15GB

// 模拟本地已存在的资源 (用于冲突检测)
const EXISTING_RESOURCES = ['extension', 'content/weather/sol', 'apps/python/sol_config'];

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function OneClickInstaller(): React.JSX.Element {
    // --- 状态管理 ---
    const [isDiagnosing, setIsDiagnosing] = useState<boolean>(true); // 是否正在诊断
    const [mode, setMode] = useState<'normal' | 'clean_install'>('normal'); // 'normal' | 'clean_install'
    
    // 纯净安装向导状态
    const [wizardStep, setWizardStep] = useState<number>(0); 
    const [backupItems, setBackupItems] = useState<string[]>(['cars', 'tracks', 'dashes']);
    const [backupProgress, setBackupProgress] = useState<number>(0);
    const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
    
    // 冲突检测状态
    const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);
    
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
    const handleOneClickInstall = (): void => {
        // 1. 检查磁盘空间
        if (INSTALL_SIZE > DISK_INFO.free) {
            Modal.error({ title: '磁盘空间不足', content: '所在磁盘空间不足，无法安装。' });
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
        Toast.success('开始一键安装流程...');
        // 这里对接真实的安装逻辑
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
        const percentInstall = (INSTALL_SIZE / DISK_INFO.total) * 100;
        const isSpaceLow = (DISK_INFO.free < INSTALL_SIZE);
        
        return (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title heading={3}>一键式安装</Title>
                    <Button 
                        icon={<IconRefresh />} 
                        theme="borderless" 
                        style={{ color: '#ff9f43' }} 
                        onClick={() => setMode('clean_install')}
                    >
                        遇到问题？切换到修复模式
                    </Button>
                </div>

                {/* 1. 磁盘空间检测卡片 */}
                <Card 
                    style={{ borderRadius: 12, marginBottom: 20 }}
                    title={
                        <div style={{display:'flex', alignItems:'center', gap: 8}}>
                            <IconServer /> 
                            <span>目标位置: {DISK_INFO.label} 盘</span>
                        </div>
                    }
                >
                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', color: 'var(--semi-color-text-2)', fontSize: 12 }}>
                        <span>游戏路径: {GAME_PATH}</span>
                        <span>{formatSize(DISK_INFO.free)} 可用 / {formatSize(DISK_INFO.total)} 总共</span>
                    </div>
                    {/* 叠加进度条：灰色底(总)，深灰(已用)，绿色(将要安装) */}
                    <div style={{ height: 20, backgroundColor: 'var(--semi-color-fill-1)', borderRadius: 10, overflow: 'hidden', position: 'relative', display: 'flex' }}>
                        {/* 已用空间 */}
                        <div style={{ width: `${percentUsed}%`, backgroundColor: 'var(--semi-color-border)', height: '100%', transition: 'width 0.3s' }} />
                        {/* 预计占用 */}
                        <div style={{ width: `${percentInstall}%`, backgroundColor: isSpaceLow ? '#ff4d4f' : '#6bc786', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 20, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--semi-color-border)' }}></div>
                            <Text type="tertiary">已用空间</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSpaceLow ? '#ff4d4f' : '#6bc786' }}></div>
                            <Text style={{color: isSpaceLow ? '#ff4d4f' : '#6bc786', fontWeight:'bold'}}>
                                本次安装预计占用: {formatSize(INSTALL_SIZE)}
                            </Text>
                        </div>
                    </div>
                    {isSpaceLow && (
                        <div style={{ marginTop: 12, color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconAlertTriangle /> 磁盘空间严重不足，请先清理磁盘！
                        </div>
                    )}
                </Card>

                {/* 2. 安装动作区 */}
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Button 
                        theme="solid" 
                        size="large" 
                        style={{ 
                            backgroundColor: isSpaceLow ? '#555' : '#6bc786', 
                            color: '#fff', 
                            width: 300, 
                            height: 60,
                            fontSize: 18,
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(107, 199, 134, 0.4)'
                        }}
                        disabled={isSpaceLow}
                        onClick={handleOneClickInstall}
                    >
                        立即开始安装
                    </Button>
                    <Text style={{ display: 'block', marginTop: 12, color: 'var(--semi-color-text-2)' }}>
                        将自动安装 CSP, Sol, Pure, 车辆包及地图
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
                            检测到您的游戏中已经存在模组资源。
                        </Paragraph>
                    </div>
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ffccc7', padding: 12, borderRadius: 6, color: '#cf1322', fontSize: 13 }}>
                        ⚠️ <strong>覆盖安装</strong> 将会替换您现有的 CSP、Sol 和相关配置。如果您之前手动修改过这些文件，修改将会丢失。
                    </div>
                    <p style={{ marginTop: 12, color: 'var(--semi-color-text-2)' }}>
                        建议：如果您现在的游戏运行正常，只是想更新，可以继续。如果游戏经常崩溃，建议点击右上角切换到"修复模式"。
                    </p>
                </Modal>
            </div>
        );
    };

    if (isDiagnosing) {
        return (
            <Layout style={{ minHeight: '100vh', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text>正在检测游戏环境...</Text>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', padding: 40 }}>
            <Content>
                {mode === 'normal' ? renderNormalInstaller() : renderCleanInstallWizard()}
            </Content>
        </Layout>
    );
}

