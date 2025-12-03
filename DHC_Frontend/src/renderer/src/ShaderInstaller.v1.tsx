import React, { useState } from 'react';

import {
    Layout,
    Nav,
    Button,
    Row,
    Col,
    Typography,
    Tag,
    Space,
    Progress,
    Card,
    List,
    Upload,
} from '@douyinfe/semi-ui';

import {
    IconHome,
    IconDownload,
    IconFile,
    IconSetting,
    IconUpload,
    IconRefresh,
    IconTickCircle,
    IconAlertTriangle,
    IconSave,
} from '@douyinfe/semi-icons';

// 模拟数据：CSP 版本列表
interface CspVersion {
    version: string;
    type: 'Preview' | 'Stable';
    date: string;
    status: 'installed' | 'available';
    isRecommended: boolean;
}

const CSP_VERSIONS: CspVersion[] = [
    { version: '0.2.3-preview211', type: 'Preview', date: '2024-03-01', status: 'installed', isRecommended: false },
    { version: '0.1.79', type: 'Stable', date: '2023-05-20', status: 'available', isRecommended: true },
    { version: '0.1.78', type: 'Stable', date: '2023-01-15', status: 'available', isRecommended: false },
];

// 模拟数据：天气模组状态
interface WeatherModState {
    installed: boolean;
    version: string | null;
    latest: string;
}

const WEATHER_MODS: { sol: WeatherModState; pure: WeatherModState } = {
    sol: { installed: true, version: '2.2.9', latest: '2.2.9' },
    pure: { installed: false, version: null, latest: '0.238' }, // Pure 未安装
};

const { Header, Footer, Sider, Content } = Layout;
const { Text, Title, Paragraph } = Typography;

export default function ShaderInstallerV1(): React.JSX.Element {
    // 状态管理
    const [installingTarget, setInstallingTarget] = useState<string | null>(null); // 当前正在安装的项目名
    const [installProgress, setInstallProgress] = useState<number>(0);

    // 模拟安装过程
    const handleInstall = (targetName: string): void => {
        setInstallingTarget(targetName);
        setInstallProgress(0);

        let p = 0;
        const timer = setInterval(() => {
            p += 10;
            setInstallProgress(p);
            if (p >= 100) {
                clearInterval(timer);
                setTimeout(() => setInstallingTarget(null), 500); // 延迟关闭
                // TODO: 在这里触发真实的状态更新逻辑
            }
        }, 300);
    };

    // 样式常量
    const THEME_GREEN = '#6bc786';
    const BG_DARK = '#16161a';
    const CARD_BG = '#232326';
    const TEXT_SECONDARY = '#888';

    // 渲染 CSP 列表项
    const renderCSPItem = (item: CspVersion): React.JSX.Element => {
        const isInstalled = item.status === 'installed';
        return (
            <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <Space align="center">
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>v{item.version}</Text>
                            <Tag color={item.type === 'Stable' ? 'green' : 'orange'} size="small" type="ghost">
                                {item.type}
                            </Tag>
                            {item.isRecommended && (
                                <Tag color="blue" size="small" type="solid">
                                    推荐
                                </Tag>
                            )}
                        </Space>
                        <div style={{ marginTop: 4 }}>
                            <Text size="small" style={{ color: TEXT_SECONDARY }}>
                                发布日期: {item.date}
                            </Text>
                        </div>
                    </div>

                    <div>
                        {isInstalled ? (
                            <Button
                                theme="solid"
                                type="tertiary"
                                style={{ backgroundColor: '#333', color: THEME_GREEN, cursor: 'default' }}
                                icon={<IconTickCircle />}
                            >
                                当前使用
                            </Button>
                        ) : (
                            <Button
                                theme="borderless"
                                style={{ color: '#fff', border: '1px solid #444' }}
                                onClick={() => handleInstall(`CSP ${item.version}`)}
                            >
                                切换版本
                            </Button>
                        )}
                    </div>
                </div>
            </List.Item>
        );
    };

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            {/* 侧边栏保持一致 */}
            <Sider style={{ backgroundColor: '#232326', width: 240 }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: '#333', borderRadius: '50%' }}></div>
                    <Title heading={4} style={{ color: '#fff', margin: 0 }}>
                        东濠涌
                    </Title>
                </div>
                <Nav
                    defaultSelectedKeys={['Shaders']}
                    style={{ backgroundColor: 'transparent' }}
                    items={[
                        { itemKey: 'Install', text: '模组安装', icon: <IconHome /> },
                        { itemKey: 'Import', text: '资源导入', icon: <IconDownload /> },
                    ]}
                    footer={{ collapseButton: true }}
                />
            </Sider>

            <Layout>
                <Header style={{ padding: '20px 40px', background: BG_DARK }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '30px',
                            fontSize: '12px',
                            color: '#666',
                            justifyContent: 'center',
                        }}
                    >
                        <span>管理器安装</span>
                        <span>地图安装</span>
                        <span>车包安装</span>
                        {/* 当前页面高亮 */}
                        <span
                            style={{
                                color: THEME_GREEN,
                                borderBottom: `2px solid ${THEME_GREEN}`,
                                paddingBottom: 4,
                            }}
                        >
                            光影安装
                        </span>
                        <span>其他设置</span>
                    </div>
                </Header>

                <Content style={{ padding: '0 40px', overflowY: 'auto' }}>
                    {/* 顶部 Banner: CSP 状态概览 */}
                    <div style={{ marginBottom: 24 }}>
                        <Title heading={3} style={{ color: '#fff', marginBottom: 12 }}>
                            Custom Shaders Patch (CSP)
                        </Title>
                        <Card
                            style={{ backgroundColor: CARD_BG, border: 'none', borderRadius: 12 }}
                            bodyStyle={{ padding: 0 }}
                        >
                            <Row>
                                {/* 左侧：当前状态 */}
                                <Col span={10} style={{ padding: 24, borderRight: '1px solid #333' }}>
                                    <Text style={{ color: TEXT_SECONDARY }}>当前已安装版本</Text>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            marginTop: 8,
                                        }}
                                    >
                                        <Title heading={1} style={{ color: THEME_GREEN, margin: 0 }}>
                                            0.2.3
                                        </Title>
                                        <Tag size="large" color="orange">
                                            Preview 211
                                        </Tag>
                                    </div>
                                    <Paragraph style={{ color: '#999', marginTop: 12 }}>
                                        CSP 是神力科莎的核心光影补丁，所有天气模组（Sol/Pure）都依赖于它运行。
                                    </Paragraph>
                                    <Space style={{ marginTop: 20 }}>
                                        <Button icon={<IconSetting />} style={{ color: '#fff', backgroundColor: '#333' }}>
                                            打开 CSP 设置
                                        </Button>
                                    </Space>
                                </Col>

                                {/* 右侧：版本列表 */}
                                <Col span={14}>
                                    <div
                                        style={{
                                            padding: '16px 24px',
                                            borderBottom: '1px solid #333',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text style={{ fontWeight: 'bold', color: '#fff' }}>可用版本</Text>
                                        <IconRefresh style={{ color: '#666', cursor: 'pointer' }} />
                                    </div>
                                    <List
                                        dataSource={CSP_VERSIONS}
                                        renderItem={renderCSPItem}
                                        style={{ height: 180, overflowY: 'auto' }}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </div>

                    {/* 下半部分：天气系统 (Sol & Pure) */}
                    <Title
                        heading={3}
                        style={{ color: '#fff', marginBottom: 12, marginTop: 32 }}
                    >
                        天气控制器 (Weather Script)
                    </Title>

                    <Row gutter={24}>
                        {/* SOL 卡片 */}
                        <Col span={12}>
                            <Card
                                style={{
                                    backgroundColor: CARD_BG,
                                    border: 'none',
                                    borderRadius: 12,
                                    height: '100%',
                                }}
                                cover={
                                    <div
                                        style={{
                                            height: 120,
                                            background: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
                                            // 暖色调代表 Sol (太阳)
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Title
                                            heading={1}
                                            style={{
                                                color: 'rgba(255,255,255,0.9)',
                                                letterSpacing: 4,
                                            }}
                                        >
                                            SOL
                                        </Title>
                                        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                                            <Tag color="green" type="solid">
                                                已安装 v{WEATHER_MODS.sol.version}
                                            </Tag>
                                        </div>
                                    </div>
                                }
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>经典天气系统</Text>
                                    <Text style={{ color: THEME_GREEN }}>已是最新</Text>
                                </div>
                                <Paragraph
                                    style={{
                                        color: '#999',
                                        marginBottom: 20,
                                        minHeight: 40,
                                    }}
                                >
                                    经典的 24 小时动态天气循环系统，性能消耗较低，兼容性最好。
                                </Paragraph>
                                <Space style={{ width: '100%' }}>
                                    <Button
                                        theme="solid"
                                        type="tertiary"
                                        block
                                        style={{ backgroundColor: '#333', color: '#fff' }}
                                    >
                                        重新安装
                                    </Button>
                                    <Button
                                        theme="solid"
                                        type="warning"
                                        block
                                        style={{ backgroundColor: '#444', color: '#fff' }}
                                    >
                                        卸载
                                    </Button>
                                </Space>
                            </Card>
                        </Col>

                        {/* PURE 卡片 */}
                        <Col span={12}>
                            <Card
                                style={{
                                    backgroundColor: CARD_BG,
                                    border: 'none',
                                    borderRadius: 12,
                                    height: '100%',
                                }}
                                cover={
                                    <div
                                        style={{
                                            height: 120,
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            // 冷色调代表 Pure (纯净)
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Title
                                            heading={1}
                                            style={{
                                                color: 'rgba(255,255,255,0.9)',
                                                letterSpacing: 4,
                                            }}
                                        >
                                            PURE
                                        </Title>
                                        {/* 未安装状态 */}
                                        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                                            <Tag color="grey" type="solid">
                                                未安装
                                            </Tag>
                                        </div>
                                    </div>
                                }
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>下一代天气系统</Text>
                                    <Text style={{ color: '#666' }}>需要 CSP 0.1.79+</Text>
                                </div>
                                <Paragraph
                                    style={{
                                        color: '#999',
                                        marginBottom: 20,
                                        minHeight: 40,
                                    }}
                                >
                                    提供更加逼真的天空、云层和光照渲染。包含 Pure LCS 支持。
                                </Paragraph>

                                {installingTarget === 'Pure' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Progress percent={installProgress} style={{ flex: 1 }} stroke={THEME_GREEN} />
                                        <Text size="small" style={{ color: THEME_GREEN }}>
                                            安装中...
                                        </Text>
                                    </div>
                                ) : (
                                    <Button
                                        theme="solid"
                                        block
                                        style={{ backgroundColor: THEME_GREEN, color: '#fff' }}
                                        onClick={() => handleInstall('Pure')}
                                    >
                                        一键安装 (v{WEATHER_MODS.pure.latest})
                                    </Button>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* 底部：手动安装区域 */}
                    <div style={{ marginTop: 32, marginBottom: 40 }}>
                        <Title heading={4} style={{ color: '#fff', marginBottom: 12 }}>
                            手动安装
                        </Title>
                        <Upload
                            action="#"
                            draggable={true}
                            dragIcon={<IconUpload size="extra-large" />}
                            style={{ backgroundColor: '#232326', border: '1px dashed #444' }}
                            dragMainText={<span style={{ color: '#ccc' }}>点击或拖拽 Zip 文件到此处</span>}
                            dragSubText={
                                <span style={{ color: '#666' }}>支持 CSP / Sol / Pure 安装包，系统将自动识别</span>
                            }
                            onFileChange={() => handleInstall('Manual File')}
                        />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}

