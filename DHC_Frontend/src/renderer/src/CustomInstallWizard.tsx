import { useState } from 'react';
import {
    Layout, Button, Row, Col, Typography,
    Tag, Checkbox, Toast, Input, Switch, Popover, Empty
} from '@douyinfe/semi-ui';
import {
    IconSetting,
    IconSearch, IconFilter, IconAlertTriangle, IconTickCircle,
    IconCode, IconArrowLeft, IconList
} from '@douyinfe/semi-icons';

// =================================================================
// 1. 样式与配置 (CONFIG)
// =================================================================

const THEME = {
    bg: '#16161a',       // 全局深色背景
    cardBg: '#232326',   // 卡片背景
    green: '#6bc786',    // 主题绿 (参考图1/图3)
    textMain: '#ffffff', // 主文字
    textSub: '#888888',  // 次要文字
    border: '#333333'    // 边框颜色
};

// 定义步骤配置
const TABS = [
    { id: 'manager', title: '管理器安装' },
    { id: 'map', title: '地图安装' },
    { id: 'car', title: '车包安装' },
    { id: 'shader', title: '光影安装' },
];

// 模拟资源数据
const RESOURCES = {
    manager: [
        { id: 'cm', name: 'Content Manager', desc: '神力科莎核心启动器 (必装组件)', size: '10MB' }
    ],
    maps: [
        { id: 'srp_main', name: '首都高全图 (SRP)', version: 'v0.9.3', img: 'https://images.unsplash.com/photo-1542259682-95996872d380?w=500&q=80', desc: '包含C1、湾岸线、横羽线等' },
        { id: 'c1_loop', name: 'C1 环状线竞技版', version: 'v0.9.3', img: 'https://images.unsplash.com/photo-1565672056637-d0d5b6e76839?w=500&q=80', desc: '轻量化，仅包含内环' }
    ],
    cars: [
        { id: 'car_jdm', name: 'SRP JDM Pack Vol.1', count: 4, size: '1.2GB', img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80' },
        { id: 'car_euro', name: 'SRP Euro Pack', count: 2, size: '850MB', img: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&q=80' },
        { id: 'car_traffic', name: 'Traffic Cars Pack', count: 8, size: '2.1GB', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80' },
        { id: 'car_shmc', name: 'SHMC 联机车包', count: 12, size: '3.4GB', img: 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=400&q=80' },
        { id: 'car_wangan', name: 'Wangan Midnight Pack', count: 6, size: '1.8GB', img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80' },
    ],
    shaders: [
        { id: 'csp', name: 'CSP 0.1.79', type: 'Patch', desc: '物理与光影补丁' },
        { id: 'sol', name: 'Sol 2.2.9', type: 'Weather', desc: '经典天气控制器' },
        { id: 'pure', name: 'Pure 0.238', type: 'Weather', desc: '新一代天气系统' }
    ]
};

// 初始调试状态
const INITIAL_DEBUG_STATE: Record<string, boolean> = {
    cm: false,
    srp_main: true,
    c1_loop: false,
    car_jdm: false,
    car_euro: true, // 模拟缺失资源
    car_traffic: true,
    car_shmc: false,
    csp: true,
    sol: false,
    pure: false,
    _missing_car_euro: true
};

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// =================================================================
// 2. 主页面容器 (CustomInstallPage)
// =================================================================

export default function CustomInstallWizard(): JSX.Element {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Set<string>>(new Set(['cm']));
    const [localState, setLocalState] = useState<Record<string, boolean>>(INITIAL_DEBUG_STATE);

    // --- Actions ---
    const toggleSelection = (id: string): void => {
        const next = new Set(selections);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelections(next);
    };

    const toggleLocalState = (key: string): void => {
        setLocalState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNext = (): void => {
        if (currentStep < TABS.length - 1) setCurrentStep(prev => prev + 1);
        else Toast.success('开始安装流程...');
    };

    const handleTabClick = (index: number): void => {
        // 允许直接点击 Tab 切换
        setCurrentStep(index);
    };

    // --- Render Switch ---
    const renderContent = (): JSX.Element | null => {
        const props = { selections, toggleSelection, localState };
        switch (currentStep) {
            case 0: return <ManagerStep {...props} />;
            case 1: return <MapStep {...props} />;
            case 2: return <CarStep {...props} />;
            case 3: return <ShaderStep {...props} />;
            default: return null;
        }
    };

    return (
        <Layout style={{
            height: '100%',
            background: THEME.bg,
            color: 'white',
            // [修复1] 强制使用 Flex 纵向布局，并隐藏 body 级滚动条
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }} className="semi-always-dark">
            {/* Header: 完全重写的顶部导航栏，参考图1 */}
            <Header style={{
                height: 60,
                flexShrink: 0, // [修复2] 固定高度
                background: THEME.bg,
                borderBottom: `1px solid ${THEME.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 10
            }}>
                {/* 左侧：返回/标题 */}
                <div style={{ width: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button icon={<IconArrowLeft />} theme="borderless" style={{ color: '#ccc' }} />
                </div>

                {/* 中间：图1 风格的 Tab Bar */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%' }}>
                    {TABS.map((tab, index) => {
                        const isActive = currentStep === index;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleTabClick(index)}
                                style={{
                                    height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 24px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    color: isActive ? THEME.green : THEME.textSub,
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: 14,
                                    transition: 'color 0.2s'
                                }}
                            >
                                {tab.title}
                                {/* 底部高亮线 */}
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 24, right: 24,
                                        height: 2, background: THEME.green,
                                        boxShadow: `0 -2px 6px ${THEME.green}66` // 一点点光晕
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 右侧：调试面板 */}
                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
                    <DebugController localState={localState} onToggle={toggleLocalState} />
                </div>
            </Header>

            {/* Main Content */}
            <Content style={{
                flex: 1,           // [修复3] 自动占据剩余空间
                minHeight: 0,      // [修复6] 允许 flex 子元素正确收缩
                overflowY: 'auto', // [修复4] 只有中间区域滚动
                padding: '24px 40px',
                position: 'relative',
                display: 'flex',   // [修复7] 使用 flex 布局让内容区域自适应
                flexDirection: 'column'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', flex: '0 0 auto' }}>
                    {renderContent()}
                </div>
            </Content>

            {/* Footer */}
            <Footer style={{
                flexShrink: 0,     // [修复5] 防止被压缩
                padding: '16px 40px',
                background: THEME.cardBg,
                borderTop: `1px solid ${THEME.border}`,
                zIndex: 10
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text style={{ color: THEME.textSub }}>
                            已选项目: <span style={{ color: THEME.green, fontWeight: 'bold', fontSize: 16 }}>{selections.size}</span>
                        </Text>
                        <div style={{ width: 1, height: 16, background: '#444' }}></div>
                        <Text style={{ color: '#666', fontSize: 12 }}>预计占用: -- GB</Text>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        {currentStep > 0 && (
                            <Button onClick={() => setCurrentStep(c => c - 1)} theme="solid" type="tertiary" style={{ backgroundColor: '#333', color: '#ccc' }}>上一步</Button>
                        )}
                        <Button
                            theme="solid" size="large" onClick={handleNext}
                            style={{ backgroundColor: THEME.green, color: '#fff', width: 140, fontWeight: 'bold' }}
                        >
                            {currentStep === 3 ? '开始安装' : '下一步'}
                        </Button>
                    </div>
                </div>
            </Footer>
        </Layout>
    );
}

// =================================================================
// 3. 调试控制器 (Debug Controller)
// =================================================================

interface DebugControllerProps {
    localState: Record<string, boolean>;
    onToggle: (key: string) => void;
}

const DebugController = ({ localState, onToggle }: DebugControllerProps): JSX.Element => {
    return (
        <Popover
            trigger="click"
            position="bottomRight"
            showArrow
            style={{ backgroundColor: '#1f1f22', border: '1px solid #444' }}
            content={
                <div style={{ padding: 12, width: 280, maxHeight: 400, overflowY: 'auto' }}>
                    <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #333' }}>
                        <Text strong style={{ color: '#fff' }}>🔧 模拟本地环境 (Dev)</Text>
                    </div>
                    {Object.keys(localState).map(key => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                            <Text style={{ color: '#ccc', fontSize: 12, fontFamily: 'monospace' }}>{key}</Text>
                            <Switch size="small" checked={localState[key]} onChange={() => onToggle(key)} />
                        </div>
                    ))}
                </div>
            }
        >
            <Button icon={<IconCode />} theme="borderless" style={{ color: '#666' }} />
        </Popover>
    );
};

// =================================================================
// 4. 组件一：管理器安装 (ManagerStep)
// =================================================================

interface StepProps {
    selections: Set<string>;
    toggleSelection: (id: string) => void;
    localState: Record<string, boolean>;
}

const ManagerStep = ({ selections, toggleSelection, localState }: StepProps): JSX.Element => {
    const item = RESOURCES.manager[0];
    const isInstalled = localState[item.id];
    const isSelected = selections.has(item.id);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{
                width: '100%', maxWidth: 800,
                background: THEME.cardBg, borderRadius: 16, padding: 40,
                border: `1px solid ${isSelected ? THEME.green : THEME.border}`,
                display: 'flex', gap: 40, alignItems: 'center',
                boxShadow: isSelected ? `0 0 30px ${THEME.green}15` : 'none',
                transition: 'all 0.3s'
            }}>
                {/* 左侧图标 */}
                <div style={{
                    width: 140, height: 140, borderRadius: 24,
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 24px rgba(255, 77, 79, 0.2)'
                }}>
                    <IconSetting style={{ fontSize: 60, color: '#fff' }} />
                </div>

                {/* 右侧内容 */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Title heading={3} style={{ color: '#fff' }}>{item.name}</Title>
                        {isInstalled && (
                            <Tag style={{ backgroundColor: 'rgba(107, 199, 134, 0.1)', color: THEME.green, border: `1px solid ${THEME.green}` }}>
                                <IconTickCircle style={{ marginRight: 4 }} /> 本地已安装
                            </Tag>
                        )}
                    </div>

                    <Text style={{ color: '#999', lineHeight: 1.6, fontSize: 15 }}>
                        神力科莎必装的第三方启动器。提供更现代的界面、更高效的模组管理以及 CSP 补丁支持。
                        <br />如果您已安装，可以选择跳过。
                    </Text>

                    <div style={{ marginTop: 32 }}>
                        <Button
                            theme="solid" size="large"
                            onClick={() => toggleSelection(item.id)}
                            style={{
                                backgroundColor: isSelected ? THEME.green : '#333',
                                color: isSelected ? '#fff' : '#ccc',
                                width: 180, fontWeight: 'bold'
                            }}
                        >
                            {isSelected ? (isInstalled ? '覆盖安装' : '已选择') : '点击安装'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================
// 5. 组件二：地图安装 (MapStep)
// =================================================================

const MapStep = ({ selections, toggleSelection, localState }: StepProps): JSX.Element => {
    return (
        <div>
            {/* 简单的标题提示 */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: THEME.green, borderRadius: 2 }} />
                    <Title heading={5} style={{ color: '#fff' }}>地图选择</Title>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                {RESOURCES.maps.map(map => {
                    const isInstalled = localState[map.id];
                    const isSelected = selections.has(map.id);
                    return (
                        <Col span={12} key={map.id}>
                            <ResourceCard
                                data={map}
                                isInstalled={isInstalled}
                                isSelected={isSelected}
                                onToggle={() => toggleSelection(map.id)}
                                type="map"
                            />
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

// =================================================================
// 6. 组件三：车包安装 (CarStep - 参考图1，带工具栏)
// =================================================================

const CarStep = ({ selections, toggleSelection, localState }: StepProps): JSX.Element => {
    const [filterInstallable, setFilterInstallable] = useState(false);
    const [search, setSearch] = useState('');

    const filteredCars = RESOURCES.cars.filter(car => {
        const matchSearch = car.name.toLowerCase().includes(search.toLowerCase());
        const isMissingFile = localState[`_missing_${car.id}`];
        if (filterInstallable && isMissingFile) return false;
        return matchSearch;
    });

    const handleSelectAll = (): void => {
        filteredCars.forEach(c => {
            if (!localState[`_missing_${c.id}`]) toggleSelection(c.id);
        });
    };

    const handleClear = (): void => {
        filteredCars.forEach(c => {
            if (selections.has(c.id)) toggleSelection(c.id);
        });
    };

    return (
        <div>
            {/* 顶部工具栏 (图1风格) */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20, background: '#1f1f22', padding: '12px 20px', borderRadius: 8
            }}>
                {/* 左侧操作 */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={handleSelectAll} theme="solid" type="tertiary" style={{ backgroundColor: '#333', color: '#fff' }}>全选当前</Button>
                    <Button onClick={handleClear} theme="borderless" style={{ color: '#888' }}>清空</Button>
                </div>

                {/* 右侧筛选 */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setFilterInstallable(!filterInstallable)}>
                        <Switch size="small" checked={filterInstallable} />
                        <Text style={{ color: filterInstallable ? '#fff' : '#888', fontSize: 13 }}>仅显示资源就绪</Text>
                    </div>
                    <Input
                        prefix={<IconSearch style={{ color: '#666' }} />}
                        placeholder="搜索车包..."
                        style={{ width: 220, backgroundColor: '#16161a', border: '1px solid #333' }}
                        value={search}
                        onChange={setSearch}
                    />
                </div>
            </div>

            {/* 内容网格 */}
            {filteredCars.length === 0 ? (
                <Empty image={<IconFilter style={{ fontSize: 48, color: '#333' }} />} description="未找到匹配的车包" />
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredCars.map(car => {
                        const isInstalled = localState[car.id];
                        const isSelected = selections.has(car.id);
                        const isMissingFile = localState[`_missing_${car.id}`];

                        return (
                            <Col span={8} xl={6} key={car.id}>
                                <ResourceCard
                                    data={car}
                                    isInstalled={isInstalled}
                                    isSelected={isSelected}
                                    isMissingResource={isMissingFile}
                                    onToggle={() => toggleSelection(car.id)}
                                    type="car"
                                />
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
};

// =================================================================
// 7. 组件四：光影安装 (ShaderStep - 列表式)
// =================================================================

const ShaderStep = ({ selections, toggleSelection, localState }: StepProps): JSX.Element => {
    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 4, height: 16, background: '#ff9f43', borderRadius: 2 }} />
                <Title heading={5} style={{ color: '#fff' }}>光影组件</Title>
                <Text style={{ color: '#666', fontSize: 12, marginLeft: 8 }}>组件间存在依赖关系，建议保持默认选择</Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RESOURCES.shaders.map(shader => {
                    const isInstalled = localState[shader.id];
                    const isSelected = selections.has(shader.id);
                    return (
                        <div
                            key={shader.id}
                            onClick={() => toggleSelection(shader.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                backgroundColor: THEME.cardBg,
                                padding: '16px 24px', borderRadius: 12,
                                border: `1px solid ${isSelected ? THEME.green : THEME.border}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                                <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{shader.name}</Text>
                                        <Tag size="small" style={{ backgroundColor: '#333', color: '#888', border: 'none' }}>{shader.type}</Tag>
                                    </div>
                                    <Text style={{ color: '#666', fontSize: 12, display: 'block', marginTop: 4 }}>{shader.desc}</Text>
                                </div>
                            </div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {isInstalled ? (
                                    <Tag style={{ backgroundColor: 'rgba(107, 199, 134, 0.1)', color: THEME.green }}>本地已安装</Tag>
                                ) : (
                                    <Text style={{ color: '#444', fontSize: 12 }}>未安装</Text>
                                )}
                            </div>

                            {/* 选中高亮背景 */}
                            {isSelected && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: `linear-gradient(90deg, ${THEME.green}08 0%, transparent 100%)`,
                                    pointerEvents: 'none'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// =================================================================
// 8. 统一卡片组件 (ResourceCard)
// =================================================================

interface ResourceData {
    id: string;
    name: string;
    version?: string;
    img?: string;
    desc?: string;
    count?: number;
    size?: string;
}

interface ResourceCardProps {
    data: ResourceData;
    isInstalled: boolean;
    isSelected: boolean;
    isMissingResource?: boolean;
    onToggle: () => void;
    type: 'map' | 'car';
}

const ResourceCard = ({ data, isInstalled, isSelected, isMissingResource, onToggle, type }: ResourceCardProps): JSX.Element => {
    const isDisabled = isMissingResource;

    return (
        <div
            onClick={!isDisabled ? onToggle : undefined}
            style={{
                backgroundColor: THEME.cardBg,
                borderRadius: 12,
                overflow: 'hidden',
                border: `2px solid ${isSelected ? THEME.green : 'transparent'}`,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
                opacity: isDisabled ? 0.6 : 1,
                boxShadow: isSelected ? `0 4px 20px ${THEME.green}15` : 'none'
            }}
        >
            {/* 1. 图片区 (参考图3的大图占比) */}
            <div style={{ height: type === 'map' ? 180 : 140, overflow: 'hidden', position: 'relative' }}>
                {data.img && <img src={data.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={data.name} />}

                {/* 渐变遮罩 */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />

                {/* 状态标签 (右上角，参考图1的Tag) */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {isMissingResource && <Tag color="red" type="solid">资源缺失</Tag>}
                    {isInstalled && <Tag style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: THEME.green, border: `1px solid ${THEME.green}`, backdropFilter: 'blur(4px)' }}>已安装</Tag>}
                </div>

                {/* 选中时的覆盖层 + 居中对勾 */}
                {isSelected && !isDisabled && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(107, 199, 134, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'grayscale(0.5)'
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: THEME.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                            <IconTickCircle style={{ color: '#fff', fontSize: 24 }} />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. 信息区 (参考图1的布局) */}
            <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text ellipsis={{ showTooltip: true }} style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{data.name}</Text>
                    {/* 小小的包含数量 */}
                    {data.count && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666', fontSize: 12 }}>
                            <IconList size="small" /> {data.count}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#666', fontSize: 12 }}>{data.size}</Text>

                    {/* 覆盖提示 */}
                    {isInstalled && isSelected && !isDisabled && (
                        <Text style={{ color: '#e6a23c', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconAlertTriangle size="small" /> 覆盖
                        </Text>
                    )}
                </div>
            </div>
        </div>
    );
};
