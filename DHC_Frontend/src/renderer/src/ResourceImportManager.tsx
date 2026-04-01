import React, { useState, useMemo, useEffect } from 'react';
import {
    Layout, Button, Typography, Tag, Tabs, TabPane,
    Collapse, Row, Col, Card, Empty, Modal, Badge, Radio, Upload, Banner, Tooltip, Toast,
    Slider, InputNumber, Select
} from '@douyinfe/semi-ui';
import {
    IconAlertTriangle, IconTickCircle,
    IconFile, IconHelpCircle, IconUpload, IconFolder, IconSetting, IconDelete, IconServer
} from '@douyinfe/semi-icons';
import HomeBreadcrumb from './components/HomeBreadcrumb';
import { useDevMode } from './contexts/DevModeContext';

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
    status: 'imported' | 'partial' | 'missing' | 'included';
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
        requiredFor: ['basic', 'standard', 'premium'],
        status: 'imported', // 已导入
        desc: '包含 C1, 湾岸线等核心道路'
    },
    {
        id: 'map_extras',
        category: 'map',
        name: '地图扩展包 (SRP Extras)',
        fileName: 'SRP_0.9.3_Extras.7z',
        size: '500 MB',
        requiredFor: ['premium'],
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
        requiredFor: ['basic', 'standard', 'premium'],
        status: 'partial', // 导入但文件缺失
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
        requiredFor: ['standard', 'premium'],
        status: 'included', // 已包含在其他包中
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
        requiredFor: ['basic', 'standard', 'premium'],
        status: 'imported',
        desc: '核心补丁'
    },
    {
        id: 'shader_sol',
        category: 'shader',
        name: 'Sol 2.2.9 天气',
        fileName: 'Sol_2.2.9.7z',
        size: '200 MB',
        requiredFor: ['standard', 'premium'],
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
        requiredFor: ['premium'],
        status: 'missing',
        desc: 'HUD 增强显示'
    }
];

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

// 格式化大小辅助函数
const formatSize = (bytes: number): string => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

// 资源大小映射 (用于计算总需求空间)
const getResourceSize = (item: ResourceItem): number => {
    const sizeStr = item.size;
    const value = parseFloat(sizeStr);
    if (sizeStr.includes('GB')) return value * 1024 * 1024 * 1024;
    if (sizeStr.includes('MB')) return value * 1024 * 1024;
    return value * 1024; // KB
};

export default function ResourceImportManager(): React.JSX.Element {
    // --- 状态管理 ---
    const [viewMode, setViewMode] = useState<'basic' | 'standard' | 'premium'>('standard');
    const [activeTab, setActiveTab] = useState<string>('map');
    const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
    const [clearModalVisible, setClearModalVisible] = useState<boolean>(false);
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false);

    const { registerDevOption, unregisterDevOption } = useDevMode();

    // [新增] 开发者调试：磁盘可用空间 (GB)
    const [devDiskFreeGB, setDevDiskFreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskFreeGB_resource');
        return saved !== null ? Number(saved) : 424; // 默认 424GB
    });

    // [新增] 开发者调试：资源状态覆盖
    const [statusOverrides, setStatusOverrides] = useState<Record<string, ResourceItem['status']>>(() => {
        const saved = localStorage.getItem('devResourceStatusOverrides');
        return saved ? JSON.parse(saved) : {};
    });

    // 持久化磁盘空间设置
    useEffect(() => {
        localStorage.setItem('devDiskFreeGB_resource', String(devDiskFreeGB));
    }, [devDiskFreeGB]);

    // 持久化资源状态覆盖设置
    useEffect(() => {
        localStorage.setItem('devResourceStatusOverrides', JSON.stringify(statusOverrides));
    }, [statusOverrides]);

    // --- 计算逻辑 ---
    // 1. 根据当前模式过滤资源，并应用开发者状态覆盖
    const filteredResources = useMemo(() => {
        return RESOURCES_DB.filter(r => r.requiredFor.includes(viewMode)).map(r => ({
            ...r,
            status: statusOverrides[r.id] || r.status
        }));
    }, [viewMode, statusOverrides]);

    // 2. 根据 Tab 分类资源
    const currentTabResources = useMemo(() => {
        return filteredResources.filter(r => r.category === activeTab);
    }, [filteredResources, activeTab]);

    // 3. 计算各分类下的缺失数量 (用于 Badge)
    const getMissingCount = (category: string): number => {
        return filteredResources.filter(r => r.category === category && r.status === 'missing').length;
    };

    // 4. 计算所有资源的总需求空间
    const totalRequiredSize = useMemo(() => {
        return filteredResources.reduce((total, item) => total + getResourceSize(item), 0);
    }, [filteredResources]);

    // 5. 计算磁盘可用空间
    const diskFreeBytes = devDiskFreeGB * 1024 * 1024 * 1024;
    const isSpaceLow = totalRequiredSize > diskFreeBytes;

    // 注册开发者选项
    useEffect(() => {
        registerDevOption({
            id: 'resource-import-disk-space',
            label: '模拟磁盘可用空间（导入资源）',
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
                        <Button size="small" onClick={() => setDevDiskFreeGB(1)} style={{ fontSize: 11 }}>1GB (极低)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(3)} style={{ fontSize: 11 }}>3GB (不足)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(20)} style={{ fontSize: 11 }}>20GB (足够)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(424)} style={{ fontSize: 11 }}>424GB (默认)</Button>
                    </div>
                </div>
            ),
            order: 7
        });

        registerDevOption({
            id: 'resource-status-debug',
            label: '模拟资源包状态',
            component: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                        <Button size="small" type="danger" theme="borderless" onClick={() => setStatusOverrides({})}>重置所有状态</Button>
                    </div>
                    {RESOURCES_DB.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, width: 140 }} ellipsis={{ showTooltip: true }}>{r.name}</Text>
                            <Select
                                size="small"
                                style={{ width: 130 }}
                                value={statusOverrides[r.id] || r.status}
                                onChange={(val) => setStatusOverrides(prev => ({ ...prev, [r.id]: val as ResourceItem['status'] }))}
                                optionList={[
                                    { label: '已导入', value: 'imported' },
                                    { label: '导入但缺失', value: 'partial' },
                                    { label: '未导入', value: 'missing' },
                                    { label: '已包含在其他包中', value: 'included' },
                                ]}
                            />
                        </div>
                    ))}
                </div>
            ),
            order: 8
        });

        return () => {
            unregisterDevOption('resource-import-disk-space');
            unregisterDevOption('resource-status-debug');
        };
    }, [registerDevOption, unregisterDevOption, devDiskFreeGB, statusOverrides]);

    // --- 处理清除逻辑 ---
    const handleClearAll = (): void => {
        // 这里对接真实的清除逻辑，目前仅做前端模拟
        setClearModalVisible(false);
        Toast.success('所有已导入资源记录已清除，请重新扫描');
    };

    // 样式常量
    const BG_DARK = '#16161a';
    const THEME_GREEN = '#6bc786';
    const THEME_RED = '#ff4d4f';
    const THEME_ORANGE = '#ffa940';
    const THEME_BLUE = '#4facfe';

    // --- 渲染辅助函数：文件状态条 ---
    const renderStatusTag = (status: string, fileName: string): React.ReactNode => {
        if (status === 'imported') {
            return (
                <Tag color="green" type="solid">
                    <IconTickCircle style={{ marginRight: 4 }} />
                    已导入
                </Tag>
            );
        }
        if (status === 'partial') {
            return (
                <Tooltip content={`部分文件缺失，请重新导入: ${fileName}`}>
                    <Tag color="orange" type="solid">
                        <IconAlertTriangle style={{ marginRight: 4 }} />
                        导入但缺失
                    </Tag>
                </Tooltip>
            );
        }
        if (status === 'included') {
            return (
                <Tag color="blue" type="solid">
                    <IconTickCircle style={{ marginRight: 4 }} />
                    已包含在其他包中
                </Tag>
            );
        }
        return (
            <Tooltip content={`请下载并拖入: ${fileName}`}>
                <Tag color="red" type="solid">
                    <IconAlertTriangle style={{ marginRight: 4 }} />
                    未导入: {fileName}
                </Tag>
            </Tooltip>
        );
    };

    // --- 渲染：车包详情 (Collapse 模式) ---
    const renderCarPack = (item: ResourceItem): React.ReactNode => (
        <Collapse.Panel
            key={item.id}
            itemKey={item.id}
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
        <Layout style={{ height: '100%', background: BG_DARK, color: 'white', display: 'flex', flexDirection: 'column' }} className="semi-always-dark">
            <Header style={{ padding: '20px 40px', background: BG_DARK, borderBottom: '1px solid #232326', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <HomeBreadcrumb current="资源导入与管理" />
                                <Text style={{ color: '#888' }}>拖入压缩包即可自动安装，请确保关键资源无缺失。</Text>
                            </div>
                        </div>

                        {/* 右侧按钮组：清除按钮 + 帮助按钮 */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            {/* 一键清除按钮 */}
                            <Button
                                icon={<IconDelete />}
                                type="danger"
                                theme="light"
                                style={{
                                    backgroundColor: 'rgba(255, 77, 79, 0.1)',
                                    color: THEME_RED,
                                    border: `1px solid ${THEME_RED}`
                                }}
                                onClick={() => setClearModalVisible(true)}
                            >
                                一键清除资源
                            </Button>

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
                    </div>
                </Header>
                <Content style={{ padding: '20px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* 顶部工具栏：模式切换，居中显示 */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <Radio.Group
                            type="button"
                            buttonSize="large"
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'basic' | 'standard' | 'premium')}
                        >
                            <Radio value="basic">基础极速版</Radio>
                            <Radio value="standard">标准推荐版</Radio>
                            <Radio value="premium">豪华全享版</Radio>
                        </Radio.Group>
                    </div>

                    {/* 状态图例 */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME_GREEN }}></div>
                            <Text style={{color:'#ccc'}}>已导入</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME_ORANGE }}></div>
                            <Text style={{color:'#ccc'}}>导入但文件缺失</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME_RED }}></div>
                            <Text style={{color:'#ccc'}}>未导入</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME_BLUE }}></div>
                            <Text style={{color:'#ccc'}}>已包含在其他包中</Text>
                        </div>
                    </div>

                    {/* 显著的拖拽安装区域 */}
                    <div style={{ marginBottom: 32 }}>
                        <Upload
                            action="#"
                            draggable={true}
                            dragIcon={<IconUpload size="extra-large" style={{ color: THEME_GREEN, fontSize: 48 }} />}
                            accept=".7z,.rar,.zip"
                            disabled={isSpaceLow}
                            style={{
                                backgroundColor: isSpaceLow ? '#2a2a2a' : '#1a1a1d',
                                border: `2px dashed ${isSpaceLow ? '#555' : THEME_GREEN}`,
                                borderRadius: 16,
                                padding: '40px 0',
                                opacity: isSpaceLow ? 0.6 : 1,
                                cursor: isSpaceLow ? 'not-allowed' : 'pointer'
                            }}
                            dragMainText={<span style={{color: isSpaceLow ? '#666' : '#fff', fontSize: 20, fontWeight: 'bold'}}>将下载的资源包拖入到这里完成导入</span>}
                            dragSubText={<span style={{color: '#888', fontSize: 14, marginTop: 8}}>{isSpaceLow ? '请先清理磁盘空间' : '支持 .7z, .rar, .zip 格式，系统将自动识别并分拣文件'}</span>}
                        >
                        </Upload>
                        {isSpaceLow && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                <IconAlertTriangle style={{ color: '#ff4d4f', fontSize: 20 }} />
                                <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                    磁盘空间不足！请清理磁盘或切换到更小的版本
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* 详细文件展示 (默认隐藏) */}
                    <Collapse
                        activeKey={detailsVisible ? ['details'] : []}
                        onChange={(k) => {
                            const keys = Array.isArray(k) ? k : [k];
                            setDetailsVisible(keys.includes('details'));
                        }}
                        style={{ backgroundColor: 'transparent', border: 'none', marginTop: 'auto' }}
                    >
                        <Collapse.Panel
                            header={<Text style={{ color: '#fff', fontWeight: 'bold' }}>{detailsVisible ? '收起详细资源列表' : '查看详细资源列表'}</Text>}
                            itemKey="details"
                            style={{ backgroundColor: '#1b1b1f', borderRadius: 8, border: '1px solid #333' }}
                        >
                            <Tabs
                                type="card"
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                style={{ display: 'flex', flexDirection: 'column' }}
                                contentStyle={{ maxHeight: 400, overflowY: 'auto', backgroundColor: '#1b1b1f', borderRadius: '0 0 12px 12px' }}
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
                        </Collapse.Panel>
                    </Collapse>
                </Content>
                {/* 底部：磁盘空间信息 */}
                <Footer style={{
                    padding: '16px 40px',
                    background: '#232326',
                    borderTop: `1px solid ${isSpaceLow ? '#ff4d4f' : '#333'}`,
                    flexShrink: 0
                }}>
                    {/* 磁盘空间信息条 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        padding: '12px 16px',
                        backgroundColor: isSpaceLow ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSpaceLow ? '#ff4d4f' : '#444'}`,
                        borderRadius: 8
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconServer style={{ color: isSpaceLow ? '#ff4d4f' : '#666' }} />
                                <div>
                                    <Text style={{ color: '#888', fontSize: 12, display: 'block' }}>磁盘可用空间</Text>
                                    <Text style={{ color: isSpaceLow ? '#ff4d4f' : '#fff', fontWeight: 'bold', fontSize: 16 }}>
                                        {formatSize(diskFreeBytes)}
                                    </Text>
                                </div>
                            </div>
                            <div style={{ width: 1, height: 32, background: '#444' }} />
                            <div>
                                <Text style={{ color: '#888', fontSize: 12, display: 'block' }}>当前模式需要</Text>
                                <Text style={{ color: isSpaceLow ? '#ff4d4f' : THEME_GREEN, fontWeight: 'bold', fontSize: 16 }}>
                                    {formatSize(totalRequiredSize)}
                                </Text>
                            </div>
                        </div>
                        {isSpaceLow && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconAlertTriangle style={{ color: '#ff4d4f', fontSize: 20 }} />
                                <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                    磁盘空间不足！请清理磁盘或切换到最小包模式
                                </Text>
                            </div>
                        )}
                    </div>

                    <Button
                        theme="solid"
                        type="primary"
                        size="large"
                        block
                        disabled={isSpaceLow}
                        style={{
                            marginTop: 16,
                            backgroundColor: isSpaceLow ? '#555' : THEME_GREEN,
                            color: '#fff',
                            cursor: isSpaceLow ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSpaceLow ? '磁盘空间不足，无法安装' : '一键扫描并安装选中资源'}
                    </Button>
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

                {/* 一键清除确认 Modal */}
                <Modal
                    title="确认清除所有资源？"
                    visible={clearModalVisible}
                    onOk={handleClearAll}
                    onCancel={() => setClearModalVisible(false)}
                    okButtonProps={{ type: 'danger', theme: 'solid' }}
                    okText="确认清除"
                    cancelText="取消"
                    centered
                    style={{ maxWidth: 400 }}
                >
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <IconAlertTriangle size="extra-large" style={{ color: '#ff4d4f', marginBottom: 16, fontSize: 48 }} />
                        <Text type="danger" style={{ display: 'block', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                            此操作将移除列表中所有已导入的资源记录。
                        </Text>
                        <Text style={{ color: '#666', display: 'block' }}>
                            这不会删除您的原始压缩包文件，但您需要重新扫描或拖入才能再次安装。
                        </Text>
                    </div>
                </Modal>
        </Layout>
    );
}

