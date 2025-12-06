import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Button, Steps, Card, Row, Col, Typography, Banner, Tag, Checkbox, Toast, Progress } from '@douyinfe/semi-ui';
import { 
    IconHome, IconFolder, IconFile, IconBolt, IconTickCircle, IconAlertTriangle, IconArrowRight, IconSetting
} from '@douyinfe/semi-icons';

// =================================================================
// 数据配置层 (对接后端时替换为真实 IPC 调用)
// =================================================================

const STEPS = [
    { key: 'manager', title: '管理器', icon: <IconSetting /> },
    { key: 'maps', title: '地图', icon: <IconFolder /> },
    { key: 'cars', title: '车包', icon: <IconFile /> },
    { key: 'shaders', title: '光影', icon: <IconBolt /> },
];

// 模拟本地检测状态 (true=已安装)
const LOCAL_STATE_MOCK: Record<string, boolean> = {
    'cm_app': false,          // Content Manager
    'map_srp_main': true,     // 首都高主图 (已安装)
    'map_c1': false,          // C1环线
    'car_jdm_pack': false,    // JDM车包
    'car_traffic': true,      // 流量车 (已安装)
    'shader_csp': true,       // CSP (已安装)
    'shader_sol': false,      // Sol
    'shader_pure': false      // Pure
};

// 资源配置表
const RESOURCES = {
    manager: [
        { id: 'cm_app', name: 'Content Manager (完整版)', desc: '神力科莎核心第三方启动器，必装组件。', size: '10MB', required: true }
    ],
    maps: [
        { id: 'map_srp_main', name: '首都高地图-全图', version: 'v0.9.3', img: 'https://images.unsplash.com/photo-1542259682-95996872d380?w=400&q=80', desc: '包含全线道路' },
        { id: 'map_c1', name: 'C1 环线竞技版', version: 'v0.9.3', img: 'https://images.unsplash.com/photo-1565672056637-d0d5b6e76839?w=400&q=80', desc: '仅包含C1内环' }
    ],
    cars: [
        { id: 'car_jdm_pack', name: 'JDM 街车包', count: '12 辆', size: '1.2GB', img: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80' },
        { id: 'car_traffic', name: 'Traffic 慢车流', count: '8 辆', size: '500MB', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80' }
    ],
    shaders: [
        { id: 'shader_csp', name: 'CSP 0.1.79', type: 'Patch', desc: '核心物理与光影补丁' },
        { id: 'shader_sol', name: 'Sol 2.2.9', type: 'Weather', desc: '经典天气系统' },
        { id: 'shader_pure', name: 'Pure 0.238', type: 'Weather', desc: '新一代天气系统 (需CSP支持)' }
    ]
};

// 样式常量
const THEME_GREEN = '#6bc786';
const THEME_BG = '#16161a';
const THEME_CARD_BG = '#232326';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// =================================================================
// 主组件
// =================================================================

export default function CustomInstallWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isInstalling, setIsInstalling] = useState(false);

    // 初始化默认选中 (必装且未安装的自动选)
    useEffect(() => {
        const initialSet = new Set<string>();
        if (!LOCAL_STATE_MOCK['cm_app']) initialSet.add('cm_app');
        setSelectedItems(initialSet);
    }, []);

    // 切换选中状态
    const toggleItem = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    // 检查当前步骤是否全部已安装
    const isStepAllInstalled = (stepKey: keyof typeof RESOURCES): boolean => {
        const items = RESOURCES[stepKey];
        return items.every(item => LOCAL_STATE_MOCK[item.id]);
    };

    // 检查当前步骤是否有部分已安装
    const hasStepPartialInstalled = (stepKey: keyof typeof RESOURCES): boolean => {
        const items = RESOURCES[stepKey];
        const installedCount = items.filter(item => LOCAL_STATE_MOCK[item.id]).length;
        return installedCount > 0 && installedCount < items.length;
    };

    // 检查当前步骤是否有已安装且被选中的项（需要覆盖提示）
    const hasStepOverwriteWarning = (stepKey: keyof typeof RESOURCES): boolean => {
        const items = RESOURCES[stepKey];
        return items.some(item => LOCAL_STATE_MOCK[item.id] && selectedItems.has(item.id));
    };

    // 计算当前步骤是否有选中的项目
    const hasSelectionInCurrentStep = useMemo(() => {
        const stepKey = STEPS[currentStep].key;
        const currentStepItems = RESOURCES[stepKey as keyof typeof RESOURCES];
        if (!currentStepItems) return false;
        return currentStepItems.some(item => selectedItems.has(item.id));
    }, [currentStep, selectedItems]);

    // 计算当前步骤是否全部本地已安装
    const isCurrentStepAllInstalled = useMemo(() => {
        const stepKey = STEPS[currentStep].key;
        const currentStepItems = RESOURCES[stepKey as keyof typeof RESOURCES];
        return currentStepItems.every(item => LOCAL_STATE_MOCK[item.id]);
    }, [currentStep]);

    // 下一步/开始安装
    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            handleStartInstall();
        }
    };

    const handleStartInstall = () => {
        if (selectedItems.size === 0) {
            Toast.warning('您没有选择任何项目，安装结束');
            return;
        }
        setIsInstalling(true);
        Toast.success(`开始安装 ${selectedItems.size} 个项目...`);
    };

    // 页面分发
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return <StepManagerInstall selected={selectedItems} toggle={toggleItem} />;
            case 1: return <StepMapInstall selected={selectedItems} toggle={toggleItem} />;
            case 2: return <StepCarPackInstall selected={selectedItems} toggle={toggleItem} />;
            case 3: return <StepShaderInstall selected={selectedItems} toggle={toggleItem} />;
            default: return null;
        }
    };

    // 获取当前步骤的key
    const getCurrentStepKey = (): keyof typeof RESOURCES => {
        const keys: (keyof typeof RESOURCES)[] = ['manager', 'maps', 'cars', 'shaders'];
        return keys[currentStep];
    };

    const currentStepKey = getCurrentStepKey();
    const allInstalled = isStepAllInstalled(currentStepKey);
    const partialInstalled = hasStepPartialInstalled(currentStepKey);
    const hasOverwrite = hasStepOverwriteWarning(currentStepKey);

    return (
        <Layout style={{ height: '100vh', background: THEME_BG, color: 'white', display: 'flex', flexDirection: 'column' }} className="semi-always-dark">
            {/* 顶部导航 */}
            <Header style={{ padding: '20px 40px', background: THEME_BG, borderBottom: '1px solid #333', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Steps 
                        current={currentStep} 
                        style={{ width: 600, cursor: 'pointer' }}
                        onChange={(i) => setCurrentStep(i)}
                    >
                        {STEPS.map(s => <Steps.Step key={s.title} title={s.title} icon={s.icon} />)}
                    </Steps>
                </div>
            </Header>

            {/* 主内容区 */}
            <Content style={{ padding: '20px 40px', overflowY: 'auto', flex: 1 }}>
                {/* 智能提示 Banner */}
                {isCurrentStepAllInstalled && (
                    <Banner 
                        type="success" 
                        fullMode={false}
                        icon={<IconTickCircle />}
                        closeIcon={null}
                        description={
                            <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                                <span>检测到此页面的资源已全部安装。</span>
                                <span style={{fontWeight:'bold', cursor:'pointer'}} onClick={handleNext}>直接跳过 →</span>
                            </div>
                        }
                        style={{ marginBottom: 20, backgroundColor: 'rgba(107, 199, 134, 0.1)', borderColor: THEME_GREEN }}
                    />
                )}
                {partialInstalled && !allInstalled && (
                    <Banner 
                        type="warning" 
                        bordered 
                        icon={<IconAlertTriangle />}
                        description="检测到部分资源已安装。如果选择已安装的资源，将会覆盖现有版本。"
                        style={{ marginBottom: 20, backgroundColor: 'rgba(255, 159, 67, 0.1)', borderColor: '#ff9f43' }}
                    />
                )}
                {hasOverwrite && (
                    <Banner 
                        type="warning" 
                        bordered 
                        icon={<IconAlertTriangle />}
                        description="您已选择部分已安装的资源，安装将覆盖现有版本。"
                        style={{ marginBottom: 20, backgroundColor: 'rgba(255, 159, 67, 0.1)', borderColor: '#ff9f43' }}
                    />
                )}

                {renderStepContent()}
            </Content>

            {/* 底部 Footer */}
            <Footer style={{ 
                padding: '16px 40px', 
                background: THEME_CARD_BG, 
                borderTop: '1px solid #333',
                flexShrink: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: '#888' }}>
                        总计已选: <span style={{ color: THEME_GREEN, fontWeight: 'bold' }}>{selectedItems.size}</span> 项
                    </Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {currentStep > 0 && (
                            <Button onClick={() => setCurrentStep(currentStep - 1)} theme="borderless" style={{ color: '#999' }}>
                                上一步
                            </Button>
                        )}
                        {/* 动态按钮逻辑 */}
                        <Button 
                            theme={hasSelectionInCurrentStep ? 'solid' : 'light'}
                            size="large"
                            onClick={handleNext}
                            style={{ 
                                backgroundColor: hasSelectionInCurrentStep ? THEME_GREEN : 'transparent', 
                                border: hasSelectionInCurrentStep ? 'none' : '1px solid #555',
                                color: hasSelectionInCurrentStep ? '#fff' : '#ccc', 
                                width: 140, 
                                fontWeight: 'bold'
                            }}
                        >
                            {currentStep === 3 
                                ? '开始安装' 
                                : (hasSelectionInCurrentStep ? '下一步' : '跳过此页')
                            }
                        </Button>
                    </div>
                </div>
                {/* 进度条 */}
                <div style={{ height: 4, background: '#333', borderRadius: 2, overflow:'hidden' }}>
                    <div style={{ 
                        width: isInstalling ? '100%' : `${((currentStep + 1) / 4) * 100}%`, 
                        height: '100%', 
                        background: THEME_GREEN, 
                        transition: 'all 0.3s ease' 
                    }}></div>
                </div>
            </Footer>
        </Layout>
    );
}

// =================================================================
// 子组件：各步骤页面
// =================================================================

// 步骤 1: 管理器安装
const StepManagerInstall = ({ selected, toggle }: { selected: Set<string>, toggle: (id: string) => void }) => {
    const isInstalled = LOCAL_STATE_MOCK['cm_app'];
    const isSelected = selected.has('cm_app');
    const item = RESOURCES.manager[0];

    return (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginTop: 40, display: 'flex', gap: 40, alignItems: 'center' }}>
                <div style={{ 
                    width: 200, height: 200, 
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #a8071a 100%)', 
                    borderRadius: 24, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(255, 77, 79, 0.3)'
                }}>
                    <IconSetting style={{ fontSize: 80, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <Title heading={2} style={{ color: '#fff' }}>{item.name}</Title>
                    <Text style={{ color: '#ccc', fontSize: 16, marginTop: 10, display: 'block', lineHeight: 1.6 }}>
                        {item.desc}
                        <br/>
                        体积小巧 (约{item.size})，不产生垃圾文件。
                    </Text>
                    <div style={{ marginTop: 30 }}>
                        <Button 
                            theme="solid" 
                            size="large"
                            onClick={() => toggle('cm_app')}
                            style={{ 
                                backgroundColor: isSelected ? THEME_GREEN : '#333', 
                                color: '#fff',
                                width: 180,
                                height: 50,
                                fontSize: 16
                            }}
                        >
                            {isInstalled ? (isSelected ? '覆盖安装' : '已安装 (点击重装)') : (isSelected ? '已选择' : '点击安装')}
                        </Button>
                        {isInstalled && isSelected && (
                            <Text style={{ display: 'block', marginTop: 8, color: '#ff9f43' }}>
                                <IconAlertTriangle /> 注意：将覆盖现有版本
                            </Text>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 步骤 2: 地图安装
const StepMapInstall = ({ selected, toggle }: { selected: Set<string>, toggle: (id: string) => void }) => {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME_GREEN }}></div>
                <Title heading={4} style={{ color: '#fff', margin: 0 }}>主地图选择</Title>
                <Text style={{ color: '#666', fontSize: 12 }}>点击卡片勾选</Text>
            </div>
            <Row gutter={[24, 24]}>
                {RESOURCES.maps.map(map => {
                    const isInstalled = LOCAL_STATE_MOCK[map.id];
                    const isSelected = selected.has(map.id);
                    
                    return (
                        <Col span={12} key={map.id}>
                            <div 
                                onClick={() => toggle(map.id)}
                                style={{
                                    position: 'relative',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: `2px solid ${isSelected ? THEME_GREEN : 'transparent'}`,
                                    transition: 'all 0.2s',
                                    height: 240
                                }}
                            >
                                <img src={map.img} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} alt={map.name} />
                                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                    {isInstalled ? (
                                        <Tag color="green" type="solid">本地已安装</Tag>
                                    ) : (
                                        !isSelected && <Tag color="red" type="ghost">资源未导入</Tag>
                                    )}
                                </div>
                                {isInstalled && isSelected && (
                                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                                        <Tag color="orange" type="solid" icon={<IconAlertTriangle />}>将覆盖安装</Tag>
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                                    <Title heading={3} style={{ color: '#fff' }}>{map.name}</Title>
                                    <Text style={{ color: '#ccc' }}>版本: {map.version}</Text>
                                    {isSelected && <IconTickCircle style={{ color: THEME_GREEN, fontSize: 30, position: 'absolute', right: 20, bottom: 20 }} />}
                                </div>
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

// 步骤 3: 车包安装
const StepCarPackInstall = ({ selected, toggle }: { selected: Set<string>, toggle: (id: string) => void }) => {
    const allCarIds = RESOURCES.cars.map(c => c.id);
    const isAllSelected = allCarIds.every(id => selected.has(id));
    
    const handleSelectAll = () => {
        if (isAllSelected) {
            allCarIds.forEach(id => { if(selected.has(id)) toggle(id); });
        } else {
            allCarIds.forEach(id => { if(!selected.has(id)) toggle(id); });
        }
    };

    return (
        <div>
            <Banner 
                fullMode={false}
                type="danger"
                description="在安装车包前，请先确保你有全DLC，否则某些车包可能无法使用。"
                style={{ marginBottom: 20, backgroundColor: 'rgba(255, 77, 79, 0.1)', borderColor: '#ff4d4f' }}
            />
            <div style={{ marginBottom: 20 }}>
                <Button 
                    theme={isAllSelected ? 'solid' : 'light'}
                    style={{ 
                        backgroundColor: isAllSelected ? THEME_GREEN : '#333', 
                        color: '#fff' 
                    }}
                    onClick={handleSelectAll}
                >
                    {isAllSelected ? '取消全选' : '全选所有车包'}
                </Button>
            </div>
            <Row gutter={[16, 16]}>
                {RESOURCES.cars.map(car => {
                    const isInstalled = LOCAL_STATE_MOCK[car.id];
                    const isSelected = selected.has(car.id);
                    return (
                        <Col span={8} key={car.id}>
                            <div 
                                onClick={() => toggle(car.id)}
                                style={{
                                    backgroundColor: THEME_CARD_BG,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: `2px solid ${isSelected ? THEME_GREEN : 'transparent'}`,
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ height: 120, overflow: 'hidden' }}>
                                    <img src={car.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={car.name} />
                                </div>
                                <div style={{ padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{car.name}</Text>
                                        <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Tag size="small" style={{ backgroundColor: '#333', color: '#ccc' }}>{car.count}</Tag>
                                        {isInstalled ? (
                                            <Tag size="small" color="green">已安装</Tag>
                                        ) : (
                                            <Tag size="small" color="blue">新资源</Tag>
                                        )}
                                    </div>
                                    {isInstalled && isSelected && (
                                        <Text style={{ display: 'block', marginTop: 4, color: '#ff9f43', fontSize: 12 }}>
                                            <IconAlertTriangle /> 将覆盖
                                        </Text>
                                    )}
                                </div>
                                {isSelected && !isInstalled && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(107, 199, 134, 0.1)' }} />
                                )}
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

// 步骤 4: 光影安装
const StepShaderInstall = ({ selected, toggle }: { selected: Set<string>, toggle: (id: string) => void }) => {
    return (
        <div>
            <Banner 
                icon={<IconBolt />}
                description="光影模组存在依赖关系，Pure 需要 CSP 支持。建议全部勾选以获得最佳体验。"
                style={{ marginBottom: 20, backgroundColor: '#232326', border: '1px solid #444' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RESOURCES.shaders.map(shader => {
                    const isInstalled = LOCAL_STATE_MOCK[shader.id];
                    const isSelected = selected.has(shader.id);
                    return (
                        <div 
                            key={shader.id}
                            onClick={() => toggle(shader.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: THEME_CARD_BG,
                                padding: '16px 24px',
                                borderRadius: 8,
                                border: `1px solid ${isSelected ? THEME_GREEN : '#333'}`,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Checkbox checked={isSelected} style={{ pointerEvents: 'none' }} />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{shader.name}</Text>
                                        <Tag size="small" style={{ backgroundColor: '#444', color: '#ccc' }}>{shader.type}</Tag>
                                    </div>
                                    <Text style={{ color: '#888', fontSize: 12 }}>{shader.desc}</Text>
                                </div>
                            </div>
                            <div>
                                {isInstalled ? (
                                    isSelected ? (
                                        <span style={{ color: '#ff9f43', fontSize: 12 }}>将覆盖当前版本</span>
                                    ) : (
                                        <span style={{ color: THEME_GREEN, fontSize: 12 }}>当前已安装</span>
                                    )
                                ) : (
                                    <span style={{ color: '#666', fontSize: 12 }}>未安装</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

