import React from 'react';
import { Button, Typography, Card, Row, Col, Switch, Divider, Modal } from '@douyinfe/semi-ui';
import { IconServer, IconDownload, IconRefresh, IconTickCircle, IconArrowRight, IconAlertTriangle } from '@douyinfe/semi-icons';
import { InstallMode, DiskInfo, RequirementConfig } from './types';
import { REQUIREMENTS_MAP } from './constants';

const { Title, Text, Paragraph } = Typography;

interface NormalInstallerProps {
    currentMode: InstallMode;
    DISK_INFO: DiskInfo;
    devRegionCN: boolean;
    setDevRegionCN: (val: boolean) => void;
    INSTALL_MODES: InstallMode[];
    selectedModeId: string;
    setSelectedModeId: (id: string) => void;
    formatSize: (bytes: number) => string;
    handleInstallClick: () => void;
    setMode: (mode: 'normal' | 'clean_install') => void;
    onNavigate?: (page: string) => void;
    showSpaceSolutionModal: () => void;
    conflictModalVisible: boolean;
    setConflictModalVisible: (val: boolean) => void;
    setCurrentStep: (step: any) => void;
}

export default function NormalInstaller({
    currentMode, DISK_INFO, devRegionCN, setDevRegionCN,
    INSTALL_MODES, selectedModeId, setSelectedModeId,
    formatSize, handleInstallClick, setMode, onNavigate,
    showSpaceSolutionModal, conflictModalVisible, setConflictModalVisible, setCurrentStep
}: NormalInstallerProps): React.JSX.Element {
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

            {/* --- 1. 模式选择卡片 --- */}
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
                                    backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : '#232326',
                                    border: `2px solid ${isSelected ? item.color : '#333'}`,
                                    borderRadius: 12,
                                    padding: 24,
                                    height: '100%',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    boxShadow: isSelected ? `0 0 20px ${item.color}20` : 'none'
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

            {/* --- 2. 磁盘空间检测 --- */}
            <Card
                style={{ backgroundColor: '#232326', borderRadius: 12, border: '1px solid #444', marginBottom: 20 }}
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
                        backgroundColor: isSpaceLow ? '#ff4d4f' : currentMode.color,
                        height: '100%',
                        transition: 'all 0.5s ease-in-out',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
                            animation: 'shimmer 2s infinite'
                        }} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <Text style={{ color: '#888' }}>目标磁盘: <strong style={{ color: '#fff' }}>{DISK_INFO.label}</strong></Text>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Text style={{ color: '#888' }}>已用: {formatSize(DISK_INFO.used)}</Text>
                        <Text style={{ color: isSpaceLow ? '#ff4d4f' : currentMode.color, fontWeight: 'bold' }}>
                            预计新增: {formatSize(currentMode.size)}
                        </Text>
                        <Text style={{ color: '#888' }}>剩余: {formatSize(DISK_INFO.free)}</Text>
                    </div>
                </div>
                {isSpaceLow && (
                    <div style={{ marginTop: 12, color: '#ff4d4f', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconTickCircle /> <span>磁盘空间不足，请清理或更换安装路径。</span>
                    </div>
                )}
            </Card>

            {/* --- 3. 高级选项与操作区 --- */}
            <Card
                style={{ backgroundColor: '#232326', borderRadius: 12, border: '1px solid #444' }}
                bodyStyle={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#ccc' }}>下载节点</Text>
                        <Switch
                            checked={devRegionCN}
                            onChange={(v) => setDevRegionCN(v)}
                            checkedText="国内"
                            uncheckedText="全球"
                            style={{ backgroundColor: devRegionCN ? '#6bc786' : '#555' }}
                        />
                    </div>
                    <Divider layout="vertical" style={{ height: 20, borderColor: '#444' }} />
                    <Button
                        theme="borderless"
                        style={{ color: '#00b5ad' }}
                        onClick={() => {
                            if (onNavigate) {
                                onNavigate('CustomInstallWizard');
                            }
                        }}
                    >
                        高级自定义安装
                    </Button>
                </div>

                <Button
                    theme="solid"
                    size="large"
                    icon={<IconArrowRight />}
                    style={{
                        backgroundColor: currentMode.color,
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '0 32px',
                        height: 48,
                        fontSize: 16,
                        boxShadow: `0 4px 14px ${currentMode.color}40`
                    }}
                    onClick={handleInstallClick}
                >
                    下一步：环境预检
                </Button>
            </Card>

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
}
