import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Layout, Button, Row, Col, Typography,
    Tag, Checkbox, Input, Switch, Popover, Empty, Banner,
    Card, Progress, Slider, InputNumber
} from '@douyinfe/semi-ui';
import {
    IconSetting,
    IconSearch, IconFilter, IconAlertTriangle, IconTickCircle,
    IconCode, IconList, IconInfoCircle,
    IconBolt, IconFile, IconFolder, IconLoading, IconServer
} from '@douyinfe/semi-icons';
import HomeBreadcrumb from './components/HomeBreadcrumb';
import { useDevMode } from './contexts/DevModeContext';

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
    { id: 'installing', title: '正在安装' }, // [新增]
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

// 格式化大小辅助函数
const formatSize = (bytes: number): string => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

// 模拟资源大小映射 (bytes)
const RESOURCE_SIZES: Record<string, number> = {
    cm: 50 * 1024 * 1024, // 50MB
    srp_main: 2.4 * 1024 * 1024 * 1024, // 2.4GB
    c1_loop: 800 * 1024 * 1024, // 800MB
    car_jdm: 1.2 * 1024 * 1024 * 1024, // 1.2GB
    car_euro: 850 * 1024 * 1024, // 850MB
    car_traffic: 2.1 * 1024 * 1024 * 1024, // 2.1GB
    car_shmc: 3.4 * 1024 * 1024 * 1024, // 3.4GB
    car_wangan: 1.8 * 1024 * 1024 * 1024, // 1.8GB
    csp: 150 * 1024 * 1024, // 150MB
    sol: 200 * 1024 * 1024, // 200MB
    pure: 500 * 1024 * 1024, // 500MB
};

export default function CustomInstallWizard(): JSX.Element {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Set<string>>(new Set(['cm']));
    const [localState, setLocalState] = useState<Record<string, boolean>>(INITIAL_DEBUG_STATE);
    const { registerDevOption, unregisterDevOption } = useDevMode();

    // [新增] 开发者调试：磁盘可用空间 (GB)
    const [devDiskFreeGB, setDevDiskFreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskFreeGB_custom');
        return saved !== null ? Number(saved) : 424; // 默认 424GB
    });

    // 持久化磁盘空间设置
    useEffect(() => {
        localStorage.setItem('devDiskFreeGB_custom', String(devDiskFreeGB));
    }, [devDiskFreeGB]);

    // 计算已选择资源的总大小
    const totalSelectedSize = useMemo(() => {
        let total = 0;
        selections.forEach(id => {
            total += RESOURCE_SIZES[id] || 0;
        });
        return total;
    }, [selections]);

    // 磁盘可用空间 (bytes)
    const diskFreeBytes = devDiskFreeGB * 1024 * 1024 * 1024;
    const isSpaceLow = totalSelectedSize > diskFreeBytes;

    // --- Helpers ---
    // 获取当前步骤对应的所有资源 ID
    const getCurrentStepResources = useCallback((stepIndex: number) => {
        switch (stepIndex) {
            case 0: return RESOURCES.manager;
            case 1: return RESOURCES.maps;
            case 2: return RESOURCES.cars;
            case 3: return RESOURCES.shaders;
            default: return [];
        }
    }, []);

    // 判断当前步骤是否有选中的项目
    const hasCurrentSelection = useMemo(() => {
        const currentResources = getCurrentStepResources(currentStep);
        return currentResources.some(item => selections.has(item.id));
    }, [currentStep, selections, getCurrentStepResources]);

    // --- Actions ---
    const toggleSelection = (id: string): void => {
        const next = new Set(selections);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelections(next);
    };

    const toggleLocalState = useCallback((key: string): void => {
        setLocalState(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // 注册开发者选项：模拟本地环境
    useEffect(() => {
        registerDevOption({
            id: 'custom-install-wizard-debug',
            label: '模拟本地环境（自定义安装向导）',
            component: (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {Object.keys(localState).map(key => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                            <Text style={{ color: '#ccc', fontSize: 12, fontFamily: 'monospace' }}>{key}</Text>
                            <Switch size="small" checked={localState[key]} onChange={() => toggleLocalState(key)} />
                        </div>
                    ))}
                </div>
            ),
            order: 3
        });

        // 注册开发者选项：磁盘空间调整
        registerDevOption({
            id: 'custom-install-disk-space',
            label: '模拟磁盘可用空间（自定义安装）',
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
                        <Button size="small" onClick={() => setDevDiskFreeGB(5)} style={{ fontSize: 11 }}>5GB (不足)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(50)} style={{ fontSize: 11 }}>50GB (足够)</Button>
                        <Button size="small" onClick={() => setDevDiskFreeGB(424)} style={{ fontSize: 11 }}>424GB (默认)</Button>
                    </div>
                </div>
            ),
            order: 4
        });

        return () => {
            unregisterDevOption('custom-install-wizard-debug');
            unregisterDevOption('custom-install-disk-space');
        };
    }, [registerDevOption, unregisterDevOption, localState, toggleLocalState, devDiskFreeGB]);

    const handleNext = (): void => {
        if (currentStep < 3) setCurrentStep(prev => prev + 1);
        else if (currentStep === 3) {
            // 点击"开始安装" -> 跳转到安装页 (Index 4)
            setCurrentStep(4);
        }
    };

    const handleTabClick = (index: number): void => {
        // [修改] 禁止直接点击"正在安装"标签
        if (index === 4) return;
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
            case 4: return <InstallingStep selections={selections} onComplete={() => console.log('Done')} />; // [新增]
            default: return null;
        }
    };

    // [新增] 判断是否处于安装中步骤
    const isInstallingStep = currentStep === 4;

    // 动态计算按钮文案和样式
    const isLastStep = currentStep === TABS.length - 1;
    let nextButtonText = '';

    if (isLastStep) {
        // 最后一步：有选中则"开始安装"，无选中则"跳过并安装"
        nextButtonText = hasCurrentSelection ? '开始安装' : '跳过并安装';
    } else {
        // 中间步骤：有选中则"下一步"，无选中则"跳过此类别"
        nextButtonText = hasCurrentSelection ? '下一步' : '跳过此类别';
    }

    // 动态按钮样式：如果有选中，显示外扩白框
    const nextButtonStyle = {
        backgroundColor: THEME.green,
        color: '#fff',
        width: hasCurrentSelection ? 160 : 140, // 选中时稍微宽一点增加强调感
        fontWeight: 'bold',
        // 关键样式：外扩白框
        boxShadow: hasCurrentSelection ? '0 0 0 2px #16161a, 0 0 0 4px #fff' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // 增加一点弹跳动画
        transform: hasCurrentSelection ? 'scale(1.05)' : 'scale(1)'
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
                <div style={{ minWidth: 260, display: 'flex', alignItems: 'center' }}>
                    <HomeBreadcrumb current={isInstallingStep ? "正在安装" : "自定义安装向导"} />
                </div>

                {/* [修改] 安装中隐藏顶部 Tab，防止误触 */}
                {!isInstallingStep && (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%' }}>
                        {TABS.slice(0, 4).map((tab, index) => { // slice(0,4) 隐藏 "正在安装" 的 tab 显示
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
                )}

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
                padding: isInstallingStep ? '0' : '24px 40px', // [修改] 安装页全宽显示
                position: 'relative',
                display: 'flex',   // [修复7] 使用 flex 布局让内容区域自适应
                flexDirection: 'column'
            }}>
                <div style={{
                    maxWidth: 1200, margin: '0 auto', width: '100%', flex: '0 0 auto',
                    height: isInstallingStep ? '100%' : 'auto' // [修改]
                }}>
                    {/* [修改] 安装中隐藏 Banner */}
                    {!isInstallingStep && (
                        <Banner
                            fullMode={false}
                            type="info"
                            icon={<IconInfoCircle style={{color: '#ccc'}} />}
                            closeIcon={null}
                            description={
                                <div style={{ fontSize: 13, color: '#ccc' }}>
                                    流程说明：请在每个步骤勾选您需要的资源，点击&ldquo;下一步&rdquo;保存选择。
                                    <span style={{ color: THEME.green, marginLeft: 8 }}>所有选中的模组将在最后统一进行安装。</span>
                                </div>
                            }
                            style={{
                                marginBottom: 20,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid #333',
                                borderRadius: 8
                            }}
                        />
                    )}
                    {renderContent()}
                </div>
            </Content>

            {/* [修改] 安装中隐藏 Footer */}
            {!isInstallingStep && (
                <Footer style={{
                    flexShrink: 0,     // [修复5] 防止被压缩
                    padding: '16px 40px',
                    background: THEME.cardBg,
                    borderTop: `1px solid ${isSpaceLow ? '#ff4d4f' : THEME.border}`,
                    zIndex: 10
                }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        {/* 磁盘空间不足警告 */}
                        {isSpaceLow && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                backgroundColor: 'rgba(255, 77, 79, 0.1)',
                                border: '1px solid #ff4d4f',
                                borderRadius: 8,
                                padding: '8px 16px',
                                marginBottom: 12
                            }}>
                                <IconAlertTriangle style={{ color: '#ff4d4f' }} />
                                <Text style={{ color: '#ff4d4f', fontSize: 13 }}>
                                    磁盘空间不足！所选资源需要 <strong>{formatSize(totalSelectedSize)}</strong>，
                                    但当前磁盘仅剩 <strong>{formatSize(diskFreeBytes)}</strong>，
                                    请减少选择或清理磁盘空间。
                                </Text>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text style={{ color: THEME.textSub }}>
                                    已选项目: <span style={{ color: THEME.green, fontWeight: 'bold', fontSize: 16 }}>{selections.size}</span>
                                </Text>
                                <div style={{ width: 1, height: 16, background: '#444' }}></div>
                                <Text style={{ color: isSpaceLow ? '#ff4d4f' : '#666', fontSize: 12 }}>
                                    预计占用: <span style={{ fontWeight: isSpaceLow ? 'bold' : 'normal' }}>{formatSize(totalSelectedSize)}</span>
                                </Text>
                                <div style={{ width: 1, height: 16, background: '#444' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <IconServer style={{ color: '#666', fontSize: 12 }} />
                                    <Text style={{ color: isSpaceLow ? '#ff4d4f' : '#666', fontSize: 12 }}>
                                        磁盘可用: {formatSize(diskFreeBytes)}
                                    </Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                {currentStep > 0 && (
                                    <Button onClick={() => setCurrentStep(c => c - 1)} theme="solid" type="tertiary" style={{ backgroundColor: '#333', color: '#ccc' }}>上一步</Button>
                                )}
                                {/* 使用动态样式和文案的下一步按钮 */}
                                <Button
                                    theme="solid" size="large" onClick={handleNext}
                                    disabled={isSpaceLow && currentStep === 3}
                                    style={{
                                        ...nextButtonStyle,
                                        backgroundColor: isSpaceLow && currentStep === 3 ? '#555' : THEME.green,
                                        cursor: isSpaceLow && currentStep === 3 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSpaceLow && currentStep === 3 ? '空间不足' : nextButtonText}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Footer>
            )}
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

// =================================================================
// 9. 新增组件：安装进度页面 (InstallingStep)
//    逻辑复用于 InstallProgressPage，但数据源根据 selections 动态生成
// =================================================================

interface InstallingStepProps {
    selections: Set<string>;
    onComplete: () => void;
}

const InstallingStep = ({ selections, onComplete }: InstallingStepProps): JSX.Element => {
    // 定义队列项的接口
    interface QueueItem {
        id: string;
        name: string;
        icon: React.ReactNode;
        items: string[];
    }

    const [installQueue, setInstallQueue] = useState<QueueItem[]>([]);
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
    const [activeItemIdx, setActiveItemIdx] = useState(0);
    const [categoryProgress, setCategoryProgress] = useState(0);
    const [totalProgress, setTotalProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    // 1. 初始化安装队列 (根据用户的选择)
    useEffect(() => {
        const queue: QueueItem[] = [];

        // 辅助函数：从资源池中筛选选中的项目
        const getNames = (source: Array<{ id: string; name: string }>): string[] =>
            source.filter(item => selections.has(item.id)).map(item => item.name);

        const managerNames = getNames(RESOURCES.manager);
        if (managerNames.length) queue.push({ id: 'manager', name: '启动器 (CM)', icon: <IconSetting />, items: managerNames });

        const mapNames = getNames(RESOURCES.maps);
        if (mapNames.length) queue.push({ id: 'map', name: '地图包', icon: <IconFolder />, items: mapNames });

        const carNames = getNames(RESOURCES.cars);
        if (carNames.length) queue.push({ id: 'car', name: '车辆包', icon: <IconFile />, items: carNames });

        const shaderNames = getNames(RESOURCES.shaders);
        if (shaderNames.length) queue.push({ id: 'shader', name: '光影补丁', icon: <IconBolt />, items: shaderNames });

        setInstallQueue(queue);
    }, [selections]);

    // 2. 日志辅助
    const addLog = (msg: string): void => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    // 3. 模拟安装进程
    useEffect(() => {
        if (installQueue.length === 0 || isFinished) return;

        const currentCategory = installQueue[activeCategoryIdx];

        // 初始日志
        if (categoryProgress === 0 && activeItemIdx === 0 && logs.length === 0) {
            addLog(`准备安装队列，共 ${installQueue.length} 个大类...`);
            addLog(`正在初始化: ${currentCategory.name}...`);
        }

        const timer = setInterval(() => {
            setCategoryProgress(prev => {
                const next = prev + (Math.random() * 8); // 模拟速度
                // 当前大类完成
                if (next >= 100) {
                    clearInterval(timer);
                    addLog(`完成: ${currentCategory.name}`);

                    if (activeCategoryIdx < installQueue.length - 1) {
                        // 进入下一个大类
                        setTimeout(() => {
                            setActiveCategoryIdx(p => p + 1);
                            setActiveItemIdx(0);
                            setCategoryProgress(0);
                            addLog(`正在初始化: ${installQueue[activeCategoryIdx + 1].name}...`);
                        }, 500);
                    } else {
                        // 全部完成
                        setTotalProgress(100);
                        setIsFinished(true);
                        addLog("所有安装任务已完成。");
                        onComplete();
                    }
                    return 100;
                }
                // 模拟子项目切换 (用于在日志中显示正在解压的具体文件)
                const itemsCount = currentCategory.items.length;
                if (itemsCount > 0) {
                    const progressPerItem = 100 / itemsCount;
                    const calculatedItemIdx = Math.floor(next / progressPerItem);
                    if (calculatedItemIdx !== activeItemIdx && calculatedItemIdx < itemsCount) {
                        setActiveItemIdx(calculatedItemIdx);
                        addLog(`正在解压: ${currentCategory.items[calculatedItemIdx]}...`);
                    }
                }
                return next;
            });

            // 更新总进度
            setTotalProgress(() => {
                const step = 100 / installQueue.length;
                const base = activeCategoryIdx * step;
                const current = (categoryProgress / 100) * step;
                return Math.min(base + current, 99);
            });
        }, 100);

        return () => clearInterval(timer);
    }, [installQueue, activeCategoryIdx, activeItemIdx, categoryProgress, isFinished, logs.length, onComplete]);

    // 4. 自动滚动日志
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // --- 渲染完成态 ---
    if (isFinished) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card
                    style={{ width: 500, textAlign: 'center', backgroundColor: THEME.cardBg, border: `1px solid ${THEME.border}`, padding: 40 }}
                    shadows='hover'
                >
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ width: 80, height: 80, background: THEME.green, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: `0 0 30px ${THEME.green}66` }}>
                            <IconTickCircle size="extra-large" style={{ color: '#fff', fontSize: 40 }} />
                        </div>
                    </div>
                    <Title heading={3} style={{ color: '#fff' }}>安装成功！</Title>
                    <Text style={{ color: '#ccc', margin: '16px 0', display: 'block' }}>
                        您选择的 {selections.size} 个项目已成功配置到游戏中。
                    </Text>
                    <Button theme="solid" size="large" style={{ backgroundColor: THEME.green, color: '#fff', marginTop: 20, width: '100%' }}>
                        启动游戏
                    </Button>
                </Card>
            </div>
        );
    }

    // --- 渲染进行态 ---
    return (
        <div style={{ height: '100%', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800 }}>
                {/* 顶部总进度 */}
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                    <Title heading={2} style={{ color: '#fff', marginBottom: 8 }}>正在配置游戏环境...</Title>
                    <Text style={{ color: '#888' }}>请勿关闭安装器，正在处理 {activeCategoryIdx + 1}/{installQueue.length} 个任务类别</Text>

                    <div style={{ marginTop: 30, padding: '0 20px' }}>
                        <Progress
                            percent={Math.floor(totalProgress)}
                            stroke={THEME.green}
                            style={{ height: 12, backgroundColor: '#333' }}
                            showInfo={true}
                            format={percent => <span style={{color: THEME.green, fontWeight: 'bold'}}>{percent}%</span>}
                        />
                    </div>
                </div>

                {/* 中间：分步安装列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {installQueue.map((category, index) => {
                        const status = index < activeCategoryIdx ? 'done' : (index === activeCategoryIdx ? 'active' : 'waiting');
                        const isDone = status === 'done';
                        const isActive = status === 'active';

                        return (
                            <div
                                key={category.id}
                                style={{
                                    backgroundColor: isActive ? 'rgba(107, 199, 134, 0.05)' : THEME.cardBg,
                                    border: `1px solid ${isActive ? THEME.green : THEME.border}`,
                                    borderRadius: 12,
                                    padding: '16px 24px',
                                    transition: 'all 0.3s',
                                    opacity: status === 'waiting' ? 0.5 : 1
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 40, height: 40,
                                            borderRadius: 8,
                                            background: isDone ? THEME.green : (isActive ? 'rgba(107, 199, 134, 0.2)' : '#333'),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isDone ? '#fff' : (isActive ? THEME.green : '#666')
                                        }}>
                                            {isDone ? <IconTickCircle /> : category.icon}
                                        </div>
                                        <div>
                                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, display: 'block' }}>
                                                {category.name}
                                            </Text>
                                            {isActive && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <IconLoading style={{ color: THEME.green }} spin />
                                                    <Text style={{ color: THEME.green, fontSize: 13 }}>
                                                        正在处理: {category.items[activeItemIdx] || '初始化...'}
                                                    </Text>
                                                </div>
                                            )}
                                            {isDone && <Text style={{ color: '#666', fontSize: 13 }}>已完成 {category.items.length} 个项目</Text>}
                                            {status === 'waiting' && <Text style={{ color: '#555', fontSize: 13 }}>等待中...</Text>}
                                        </div>
                                    </div>
                                    <div style={{ width: 100, textAlign: 'right' }}>
                                        {isDone ? (
                                            <IconTickCircle style={{ color: THEME.green, fontSize: 20 }} />
                                        ) : isActive ? (
                                            <Text style={{ color: THEME.green, fontWeight: 'bold', fontSize: 18 }}>
                                                {Math.floor(categoryProgress)}%
                                            </Text>
                                        ) : (
                                            <Text style={{ color: '#444' }}>---</Text>
                                        )}
                                    </div>
                                </div>
                                {isActive && (
                                    <div style={{ marginTop: 16, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ width: `${categoryProgress}%`, background: THEME.green, height: '100%', transition: 'width 0.2s linear' }}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 底部：日志窗口 */}
                <div style={{ marginTop: 30 }}>
                    <div style={{
                        backgroundColor: '#000',
                        borderRadius: 8,
                        border: '1px solid #333',
                        padding: 16,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        height: 120,
                        overflowY: 'auto',
                        color: '#aaa'
                    }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: 4, wordBreak: 'break-all' }}>
                                <span style={{ color: THEME.green }}>➜</span> {log}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};
