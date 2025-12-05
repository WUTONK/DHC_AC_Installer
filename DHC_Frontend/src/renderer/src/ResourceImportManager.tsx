import React, { useState, useMemo } from 'react';
import { 
    Layout, Nav, Button, Typography, Tag, Tabs, TabPane, 
    Collapse, Row, Col, Card, Empty, Modal, Badge, Radio, Upload, Banner, Tooltip
} from '@douyinfe/semi-ui';
import { 
    IconHome, IconDownload, IconAlertTriangle, IconTickCircle, 
    IconFile, IconHelpCircle, IconUpload, IconFolder, IconSetting
} from '@douyinfe/semi-icons';

// --- 1. 模拟数据结构 ---
interface Car {
    name: string;
    thumb: string;
}

interface ResourceItem {
    id: string;
    category: 'map' | 'car' | 'shader' | 'dash';
    name: string;
    fileName: string;
    size: string;
    requiredFor: string[];
    status: 'imported' | 'missing';
    desc?: string;
    cars?: Car[];
}

const RESOURCES_DB: ResourceItem[] = [
    // --- 地图类 ---
    {
        id: 'map_main',
        category: 'map',
        name: '首都高主地图包 (SRP Main)',
        fileName: 'SRP_0.9.3_Main.7z',
        size: '2.4 GB',
        requiredFor: ['minimal', 'full'], // 最小包和完整包都需要
        status: 'imported', // 已导入
        desc: '包含 C1, 湾岸线等核心道路'
    },
    {
        id: 'map_extras',
        category: 'map',
        name: '地图扩展包 (SRP Extras)',
        fileName: 'SRP_0.9.3_Extras.7z',
        size: '500 MB',
        requiredFor: ['full'],
        status: 'missing', // 缺失
        desc: '包含更多停车场和纹理细节'
    },
    // --- 车包类 (包含具体车辆列表) ---
    {
        id: 'car_pack_shmc',
        category: 'car',
        name: 'SHMC 基础联机车包',
        fileName: 'SHMC_Car_Pack_v2.0.rar',
        size: '1.8 GB',
        requiredFor: ['minimal', 'full'],
        status: 'imported',
        cars: [
            { name: 'Nissan GTR R34', thumb: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=200&q=80' },
            { name: 'Toyota Supra MK4', thumb: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200&q=80' },
            { name: 'Mazda RX-7 FD', thumb: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&q=80' }
        ]
    },
    {
        id: 'car_pack_traffic',
        category: 'car',
        name: 'AI 慢车包 (Traffic)',
        fileName: 'SRP_Traffic_Pack.7z',
        size: '800 MB',
        requiredFor: ['full'],
        status: 'missing',
        cars: [
            { name: 'Toyota Prius Traffic', thumb: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&q=80' },
            { name: 'Bus / Truck', thumb: 'https://images.unsplash.com/photo-1580273916550-e323be2ed5d6?w=200&q=80' }
        ]
    },
    // --- 光影类 ---
    {
        id: 'shader_csp',
        category: 'shader',
        name: 'CSP 0.1.79 (预览版)',
        fileName: 'lights-patch-v0.1.79.zip',
        size: '150 MB',
        requiredFor: ['minimal', 'full'],
        status: 'imported',
        desc: '核心补丁'
    },
    {
        id: 'shader_sol',
        category: 'shader',
        name: 'Sol 2.2.9 天气',
        fileName: 'Sol_2.2.9.7z',
        size: '200 MB',
        requiredFor: ['minimal', 'full'],
        status: 'missing',
        desc: '基础天气控制'
    },
    // --- 仪表盘类 ---
    {
        id: 'dash_boost',
        category: 'dash',
        name: 'HKS 涡轮表',
        fileName: 'HKS_Boost_Gauge.rar',
        size: '5 MB',
        requiredFor: ['full'],
        status: 'missing',
        desc: 'HUD 增强显示'
    }
];

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function ResourceImportManager(): React.JSX.Element {
    // --- 状态管理 ---
    const [viewMode, setViewMode] = useState<'minimal' | 'full'>('minimal'); // 'minimal' | 'full'
    const [activeTab, setActiveTab] = useState<string>('map');
    const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);

    // --- 计算逻辑 ---
    // 1. 根据当前模式过滤资源
    const filteredResources = useMemo(() => {
        return RESOURCES_DB.filter(r => r.requiredFor.includes(viewMode));
    }, [viewMode]);

    // 2. 根据 Tab 分类资源
    const currentTabResources = useMemo(() => {
        return filteredResources.filter(r => r.category === activeTab);
    }, [filteredResources, activeTab]);

    // 3. 计算各分类下的缺失数量 (用于 Badge)
    const getMissingCount = (category: string): number => {
        return filteredResources.filter(r => r.category === category && r.status === 'missing').length;
    };

    // 样式常量
    const BG_DARK = '#16161a';
    const THEME_GREEN = '#6bc786';
    const THEME_RED = '#ff4d4f';

    // --- 渲染辅助函数：文件状态条 ---
    const renderStatusTag = (status: string, fileName: string): React.ReactNode => {
        if (status === 'imported') {
            return <Tag color="green" type="solid" icon={<IconTickCircle />}>已就绪</Tag>;
        }
        return (
            <Tooltip content={`请下载并拖入: ${fileName}`}>
                <Tag color="red" type="solid" icon={<IconAlertTriangle />}>
                    缺失: {fileName}
                </Tag>
            </Tooltip>
        );
    };

    // --- 渲染：车包详情 (Collapse 模式) ---
    const renderCarPack = (item: ResourceItem): React.ReactNode => (
        <Collapse.Panel
            key={item.id}
            header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <IconFile size="large" style={{ color: item.status === 'imported' ? THEME_GREEN : '#888' }} />
                        <div>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                            <div style={{ fontSize: 12, color: '#666' }}>{item.size}</div>
                        </div>
                    </div>
                    {renderStatusTag(item.status, item.fileName)}
                </div>
            }
            style={{ backgroundColor: '#232326', borderBottom: '1px solid #333' }}
        >
            <div style={{ padding: '16px 24px' }}>
                <Text style={{ color: '#999', marginBottom: 12, display: 'block' }}>包含车辆预览：</Text>
                <Row gutter={[12, 12]}>
                    {item.cars?.map((car, idx) => (
                        <Col span={6} key={idx}>
                            <div style={{ backgroundColor: '#1a1a1d', borderRadius: 8, overflow: 'hidden', border: '1px solid #333' }}>
                                <div style={{ height: 80, overflow: 'hidden' }}>
                                    <img src={car.thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={car.name} />
                                </div>
                                <div style={{ padding: 8 }}>
                                    <Text ellipsis style={{ color: '#ccc', fontSize: 12 }}>{car.name}</Text>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </Collapse.Panel>
    );

    // --- 渲染：普通资源列表 (List 模式) ---
    const renderNormalItem = (item: ResourceItem): React.ReactNode => (
        <div 
            key={item.id}
            style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                backgroundColor: '#232326', padding: '16px 24px', 
                borderBottom: '1px solid #333',
                marginBottom: 1 // 模拟列表分割
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.category === 'map' && <IconFolder size="large" style={{ color: '#4facfe' }} />}
                {item.category === 'shader' && <IconFile size="large" style={{ color: '#a06cd5' }} />}
                {item.category === 'dash' && <IconSetting size="large" style={{ color: '#ff9f43' }} />}
                
                <div>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{item.name}</Text>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {item.desc} • {item.size}
                    </div>
                </div>
            </div>
            {renderStatusTag(item.status, item.fileName)}
        </div>
    );

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            {/* 侧边栏保持一致 */}
            <Sider style={{ backgroundColor: '#232326', width: 240 }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: '#333', borderRadius: '50%' }}></div>
                    <Title heading={4} style={{ color: '#fff', margin: 0 }}>东濠涌</Title>
                </div>
                <Nav
                    defaultSelectedKeys={['Import']}
                    items={[{ itemKey: 'Import', text: '资源导入', icon: <IconDownload /> }]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: '20px 40px', background: BG_DARK, borderBottom: '1px solid #232326' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Title heading={3} style={{ color: '#fff', margin: 0 }}>资源导入与管理</Title>
                            <Text style={{ color: '#888' }}>拖入压缩包即可自动安装，请确保关键资源无缺失。</Text>
                        </div>
                        {/* 资源获取指引按钮 */}
                        <Button 
                            icon={<IconHelpCircle />} 
                            theme="solid" 
                            style={{ backgroundColor: '#333', color: THEME_GREEN, border: `1px solid ${THEME_GREEN}` }}
                            onClick={() => setHelpModalVisible(true)}
                        >
                            如何获取资源？
                        </Button>
                    </div>
                </Header>
                <Content style={{ padding: '20px 40px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* 顶部工具栏：模式切换 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Radio.Group 
                            type="button" 
                            buttonSize="large"
                            value={viewMode} 
                            onChange={(e) => setViewMode(e.target.value as 'minimal' | 'full')}
                        >
                            <Radio value="minimal">最小包 (仅主图+联机车)</Radio>
                            <Radio value="full">完整包 (全资源)</Radio>
                        </Radio.Group>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME_GREEN }}></div>
                                <Text style={{color:'#ccc'}}>已导入</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME_RED }}></div>
                                <Text style={{color:'#ccc'}}>缺失资源</Text>
                            </div>
                        </div>
                    </div>
                    {/* 分类 Tabs */}
                    <Tabs 
                        type="card" 
                        activeKey={activeTab} 
                        onChange={setActiveTab}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
                        contentStyle={{ flex: 1, overflowY: 'auto', backgroundColor: '#1b1b1f', borderRadius: '0 0 12px 12px' }}
                    >
                        {[
                            { key: 'map', label: '地图类', icon: <IconFolder /> },
                            { key: 'car', label: '车辆类', icon: <IconFile /> },
                            { key: 'shader', label: '光影类', icon: <IconFile /> },
                            { key: 'dash', label: '仪表盘', icon: <IconSetting /> },
                        ].map(tab => {
                            const missingCount = getMissingCount(tab.key);
                            return (
                                <TabPane 
                                    tab={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {tab.icon} {tab.label}
                                            {missingCount > 0 && <Badge count={missingCount} type='danger' style={{ marginLeft: 4 }} />}
                                        </div>
                                    } 
                                    itemKey={tab.key}
                                    key={tab.key}
                                >
                                    {/* 列表内容区域 */}
                                    <div style={{ minHeight: 300 }}>
                                        {currentTabResources.length === 0 ? (
                                            <Empty 
                                                image={<IconFolder style={{ fontSize: 48, color: '#333' }} />} 
                                                description="当前模式下该分类无必需资源" 
                                                style={{ marginTop: 60 }}
                                            />
                                        ) : (
                                            activeTab === 'car' ? (
                                                <Collapse accordion style={{ border: 'none' }}>
                                                    {currentTabResources.map(renderCarPack)}
                                                </Collapse>
                                            ) : (
                                                <div>
                                                    {currentTabResources.map(renderNormalItem)}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </TabPane>
                            )
                        })}
                    </Tabs>
                </Content>
                {/* 底部：一键导入入口 */}
                <Footer style={{ 
                    padding: '16px 40px', 
                    background: '#232326', 
                    borderTop: '1px solid #333'
                }}>
                    <Upload
                        action="#"
                        draggable={true}
                        dragIcon={<IconUpload />}
                        accept=".7z,.rar,.zip"
                        style={{ backgroundColor: '#1a1a1d', border: '1px dashed #444' }}
                        dragMainText={<span style={{color: '#fff'}}>点击或拖拽资源包到此处 (支持批量)</span>}
                        dragSubText={<span style={{color: '#666'}}>系统将自动识别并分拣地图、车辆和光影文件</span>}
                    >
                        <Button theme="solid" type="primary" size="large" block style={{ marginTop: 12, backgroundColor: THEME_GREEN, color: '#fff' }}>
                            一键扫描并安装选中资源
                        </Button>
                    </Upload>
                </Footer>
                {/* 资源获取指引 Modal */}
                <Modal
                    title="如何获取模组资源？"
                    visible={helpModalVisible}
                    onCancel={() => setHelpModalVisible(false)}
                    footer={null}
                    style={{ maxWidth: 500 }}
                >
                    <Banner 
                        type="info" 
                        description="为了保证联机版本一致，请务必使用官方提供的资源包。" 
                        style={{ marginBottom: 20 }}
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Card style={{ cursor: 'pointer', borderColor: '#444' }} shadows="hover">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, background: '#12b7f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>QQ</div>
                                <div>
                                    <Text style={{ fontWeight: 'bold', display: 'block' }}>QQ 群文件下载 (推荐)</Text>
                                    <Text style={{ color: '#666', fontSize: 12 }}>速度快，版本更新最及时。群号: 88888888</Text>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ cursor: 'pointer', borderColor: '#444' }} shadows="hover">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, background: '#e2e2e2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 'bold' }}>网盘</div>
                                <div>
                                    <Text style={{ fontWeight: 'bold', display: 'block' }}>网盘分流下载</Text>
                                    <Text style={{ color: '#666', fontSize: 12 }}>包含完整包和单独补丁。提取码: 6666</Text>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Modal>
            </Layout>
        </Layout>
    );
}

