import React from 'react';
import {
    Banner,
    Button,
    Card,
    Checkbox,
    Divider,
    List,
    Modal,
    Progress,
    Space,
    Tag,
    Tooltip,
    Typography
} from '@douyinfe/semi-ui';
import {
    IconAlertTriangle,
    IconArrowRight,
    IconBox,
    IconCloud,
    IconDownload,
    IconFile,
    IconFolder,
    IconHelpCircle,
    IconRefresh,
    IconSetting,
    IconTickCircle,
    IconUpload
} from '@douyinfe/semi-icons';
import {
    MD_CDKEY_USAGE,
    MD_CM_CONFIG,
    MD_TAOBAO_TUTORIAL
} from './constants';
import { InstallMode, InstallStep } from './types';

const { Title, Text } = Typography;

/* eslint-disable no-unused-vars */
interface PreCheckPageProps {
    currentMode: InstallMode;
    devRegionCN: boolean;
    formatSize: (...args: [number]) => string;
    setCurrentStep: (...args: [InstallStep]) => void;
    checkingResources: boolean;
    resourceState: { imported: boolean; complete: boolean };
    resourceDownloadVisible: boolean;
    setResourceDownloadVisible: React.Dispatch<React.SetStateAction<boolean>>;
    importingProgress: number;
    handleImportResource(): void;
    deletePackageAfterInstall: boolean;
    setDeletePackageAfterInstall: React.Dispatch<React.SetStateAction<boolean>>;
    checkingEnv: boolean;
    cmInstalled: boolean;
    cmTutorialVisible: boolean;
    setCmTutorialVisible: React.Dispatch<React.SetStateAction<boolean>>;
    handleInstallCM(): void | Promise<void>;
    cmInstalling: boolean;
    cmInstallStatusText: string;
    cmInstallProgress: number;
    hasAllDLC: boolean;
    keyTutorialVisible: boolean;
    setKeyTutorialVisible: React.Dispatch<React.SetStateAction<boolean>>;
    taobaoTutorialVisible: boolean;
    setTaobaoTutorialVisible: React.Dispatch<React.SetStateAction<boolean>>;
    startRealInstall(): void;
}
/* eslint-enable no-unused-vars */

export default function PreCheckPage({
    currentMode,
    devRegionCN,
    formatSize,
    setCurrentStep,
    checkingResources,
    resourceState,
    resourceDownloadVisible,
    setResourceDownloadVisible,
    importingProgress,
    handleImportResource,
    deletePackageAfterInstall,
    setDeletePackageAfterInstall,
    checkingEnv,
    cmInstalled,
    cmTutorialVisible,
    setCmTutorialVisible,
    handleInstallCM,
    cmInstalling,
    cmInstallStatusText,
    cmInstallProgress,
    hasAllDLC,
    keyTutorialVisible,
    setKeyTutorialVisible,
    taobaoTutorialVisible,
    setTaobaoTutorialVisible,
    startRealInstall
}: PreCheckPageProps): React.JSX.Element {
    const canStartInstall = resourceState.imported && resourceState.complete;

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

            <Title heading={3} style={{ color: 'var(--semi-color-text-0)', marginBottom: 12 }}>
                环境检查与准备
            </Title>
            <Text type="tertiary">
                正在为 <Text strong style={{ color: currentMode.color }}>{currentMode.name}</Text> 准备环境，请确保以下项就绪。
            </Text>

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
                                        <Text type="tertiary" size="small">
                                            下载 <Text code>DHC_{currentMode.id}_v1.0.7z</Text> 后，拖入或手动选择。
                                        </Text>
                                    </div>
                                    <Space>
                                        <Button theme="light" icon={<IconCloud />} onClick={() => setResourceDownloadVisible(true)}>
                                            获取资源链接
                                        </Button>
                                        <Button theme="solid" icon={<IconUpload />} onClick={handleImportResource} loading={importingProgress > 0}>
                                            {importingProgress > 0 ? `导入中 ${importingProgress}%` : '选择本地文件导入'}
                                        </Button>
                                    </Space>
                                </div>
                                {importingProgress > 0 && (
                                    <Progress percent={importingProgress} stroke={currentMode.color} style={{ height: 4, marginTop: 16 }} />
                                )}
                            </div>
                        )}

                        {resourceState.imported && !resourceState.complete && (
                            <div>
                                <Banner
                                    type="danger"
                                    bordered
                                    description="资源包校验失败！文件可能损坏或不完整 (MD5 Mismatch)。"
                                    style={{ marginBottom: 16, backgroundColor: 'rgba(255, 77, 79, 0.1)' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <Button theme="solid" type="danger" icon={<IconRefresh />} onClick={handleImportResource}>
                                        重新导入资源包
                                    </Button>
                                    <Text type="tertiary">建议重新下载资源包后再次尝试。</Text>
                                </div>
                            </div>
                        )}

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
                            {cmInstalled ? (
                                <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>
                                    CM已经成功安装！其已被存放在您的桌面目录，
                                    <strong style={{ color: '#66b1ff', textShadow: '0 0 8px rgba(102, 177, 255, 0.6)' }}>
                                        您可以在桌面上找到它
                                    </strong>
                                </Text>
                            ) : (
                                <Text style={{ color: '#ccc', display: 'block', marginBottom: 8 }}>
                                    如果未安装 CM，将无法方便地管理光影与模组。建议先完成安装。
                                </Text>
                            )}
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

                {cmInstalling && (
                    <div style={{ marginTop: 24, borderTop: '1px solid #333', paddingTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ color: '#ccc', fontSize: 13 }}>{cmInstallStatusText}</Text>
                            <Text style={{ color: '#00b5ad', fontWeight: 'bold', fontSize: 13 }}>{cmInstallProgress}%</Text>
                        </div>
                        <Progress percent={cmInstallProgress} stroke="#00b5ad" style={{ height: 6 }} showInfo={false} />
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
                                    <Button
                                        theme="borderless"
                                        icon={<IconHelpCircle />}
                                        onClick={() => setKeyTutorialVisible(true)}
                                        style={{ color: '#fff' }}
                                    >
                                        如何使用 CDKey？
                                    </Button>
                                </Space>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: '#ccc' }}>建议前往 Steam 购买官方 DLC，以保证正版体验。</Text>
                                <Button
                                    theme="solid"
                                    icon={<IconDownload />}
                                    onClick={() => window.open('https://store.steampowered.com/app/244210/Assetto_Corsa/', '_blank')}
                                >
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
                <Button
                    theme="solid"
                    type="primary"
                    onClick={() => window.open('https://s.taobao.com/search?q=Assetto+Corsa+Ultimate', '_blank')}
                >
                    前往淘宝购买
                </Button>
            )}
        </div>
    );
}
