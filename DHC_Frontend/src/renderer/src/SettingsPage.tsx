import React, { useState } from 'react';
import { Layout, Button, Typography, Card, Select, Radio, Steps, Toast, Tag, Divider, Row, Col, Input, Banner } from '@douyinfe/semi-ui';
import {
    IconSetting, IconFolder, IconHelpCircle,
    IconFile, IconHome, IconDownload, IconServer, IconTickCircle, IconAlertTriangle
} from '@douyinfe/semi-icons';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function SettingsPage(): React.JSX.Element {
    // --- 状态管理 ---

    // 1. 语言设置 (模拟系统语言检测)
    const systemLang = 'zh_CN';
    const [language, setLanguage] = useState<string>('zh_CN');

    // 2. 存储设置
    const [storageMode, setStorageMode] = useState<'simple' | 'advanced'>('simple'); // 'simple' | 'advanced'
    const [selectedDrive, setSelectedDrive] = useState<string>('D'); // 简易模式下的选择
    const [paths, setPaths] = useState<{resource: string; cache: string}>({
        resource: 'D:\\SteamLibrary\\steamapps\\common\\assettocorsa',
        cache: 'D:\\DHC_Launcher\\Cache'
    });

    // 3. 模拟磁盘数据
    interface DriveInfo {
        label: string;
        name: string;
        free: string;
        total: string;
        percent: number;
        color: string;
    }

    const drives: DriveInfo[] = [
        { label: 'C:', name: '系统盘', free: '50 GB', total: '500 GB', percent: 90, color: '#ff4d4f' },
        { label: 'D:', name: '游戏盘', free: '400 GB', total: '1000 GB', percent: 60, color: '#6bc786' },
        { label: 'E:', name: '仓库盘', free: '800 GB', total: '2000 GB', percent: 20, color: '#6bc786' },
    ];

    // --- 交互逻辑 ---
    const handleExportLog = (): void => {
        const loadingToast = Toast.info({ content: '正在打包日志文件...', duration: 0 });
        setTimeout(() => {
            Toast.close(loadingToast.id);
            Toast.success({
                content: '导出成功！已保存至桌面 "DHC_ERROR_LOG" 文件夹',
                duration: 4000
            });
        }, 1500);
    };

    const handleSaveStorage = (): void => {
        Toast.success('存储路径配置已更新');
    };

    // 样式常量
    const BG_DARK = '#16161a';
    const CARD_BG = '#232326';
    const THEME_GREEN = '#6bc786';

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            <Header style={{ padding: '20px 40px', background: BG_DARK }}>
                    <Title heading={3} style={{ color: '#fff' }}>设置</Title>
                </Header>
                <Content style={{ padding: '0 40px 40px 40px', overflowY: 'auto' }}>

                    {/* --- 1. 通用设置 (语言) --- */}
                    <Card
                        title={<div style={{display:'flex', alignItems:'center', gap:8}}><IconSetting /> 通用设置</div>}
                        style={{ backgroundColor: CARD_BG, borderRadius: 12, border: 'none', marginBottom: 20 }}
                        headerStyle={{ borderBottom: '1px solid #333' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>界面语言</Text>
                                <div style={{ marginTop: 4 }}>
                                    <Text style={{ color: '#888', fontSize: 12 }}>更改启动器的显示语言</Text>
                                </div>
                            </div>
                            <Select
                                value={language}
                                onChange={(value) => setLanguage(value as string)}
                                style={{ width: 250, backgroundColor: '#333' }}
                            >
                                <Select.Option value="zh_CN">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        简体中文
                                        {systemLang === 'zh_CN' && <Tag size="small" color="green" type="solid">系统推荐</Tag>}
                                    </div>
                                </Select.Option>
                                <Select.Option value="en_US">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        English
                                        {systemLang === 'en_US' && <Tag size="small" color="green" type="solid">系统推荐</Tag>}
                                    </div>
                                </Select.Option>
                            </Select>
                        </div>
                    </Card>

                    {/* --- 2. 存储管理 (简易/详细) --- */}
                    <Card
                        title={
                            <div style={{display:'flex', alignItems:'center', justifyContent: 'space-between', width: '100%'}}>
                                <div style={{display:'flex', alignItems:'center', gap:8}}>
                                    <IconServer /> 存储管理
                                </div>
                                <Radio.Group
                                    type="button"
                                    buttonSize="small"
                                    value={storageMode}
                                    onChange={(e) => setStorageMode(e.target.value as 'simple' | 'advanced')}
                                >
                                    <Radio value="simple">简易模式</Radio>
                                    <Radio value="advanced">详细模式</Radio>
                                </Radio.Group>
                            </div>
                        }
                        style={{ backgroundColor: CARD_BG, borderRadius: 12, border: 'none', marginBottom: 20 }}
                        headerStyle={{ borderBottom: '1px solid #333' }}
                    >
                        {storageMode === 'simple' ? (
                            // --- 简易模式：选盘符 ---
                            <div>
                                <Text style={{ color: '#ccc', marginBottom: 16, display: 'block' }}>
                                    请选择一个磁盘来存放下载的资源和缓存文件，我们建议选择剩余空间最大的磁盘。
                                </Text>
                                <Row gutter={[16, 16]}>
                                    {drives.map(drive => {
                                        const isSelected = selectedDrive === drive.label.replace(':', '');
                                        return (
                                            <Col span={8} key={drive.label}>
                                                <div
                                                    onClick={() => setSelectedDrive(drive.label.replace(':', ''))}
                                                    style={{
                                                        border: `2px solid ${isSelected ? THEME_GREEN : '#444'}`,
                                                        backgroundColor: isSelected ? 'rgba(107, 199, 134, 0.1)' : '#333',
                                                        borderRadius: 8,
                                                        padding: 16,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                        <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 16 }}>{drive.label} ({drive.name})</Text>
                                                        {isSelected && <IconTickCircle style={{ color: THEME_GREEN }} />}
                                                    </div>
                                                    {/* 模拟进度条 */}
                                                    <div style={{ height: 6, background: '#111', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                                                        <div style={{ width: `${drive.percent}%`, background: drive.color, height: '100%' }}></div>
                                                    </div>
                                                    <Text style={{ color: '#888', fontSize: 12 }}>剩余 {drive.free} / 总共 {drive.total}</Text>
                                                </div>
                                            </Col>
                                        )
                                    })}
                                </Row>
                            </div>
                        ) : (
                            // --- 详细模式：选文件夹 ---
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <Text style={{ color: '#fff', marginBottom: 8, display: 'block' }}>资源存放位置 (Assetto Corsa 根目录)</Text>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Input value={paths.resource} onChange={(value) => setPaths({...paths, resource: value})} />
                                        <Button icon={<IconFolder />} style={{ backgroundColor: '#444', color: '#fff' }}>浏览</Button>
                                    </div>
                                </div>
                                <div>
                                    <Text style={{ color: '#fff', marginBottom: 8, display: 'block' }}>缓存文件夹位置 (下载临时文件)</Text>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Input value={paths.cache} onChange={(value) => setPaths({...paths, cache: value})} />
                                        <Button icon={<IconFolder />} style={{ backgroundColor: '#444', color: '#fff' }}>浏览</Button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button theme="solid" style={{ backgroundColor: THEME_GREEN, color: '#fff' }} onClick={handleSaveStorage}>应用更改</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* --- 3. 故障排查 (小白向导) --- */}
                    <Card
                        title={<div style={{display:'flex', alignItems:'center', gap:8}}><IconAlertTriangle style={{color: '#ff9f43'}} /> 故障排查与反馈</div>}
                        style={{ backgroundColor: CARD_BG, borderRadius: 12, border: 'none' }}
                        headerStyle={{ borderBottom: '1px solid #333' }}
                    >
                        <Banner
                            type="warning"
                            bordered
                            description="如果您在使用过程中遇到安装失败、闪退或黑屏，请按照以下步骤反馈给管理员。"
                            style={{ marginBottom: 24, borderRadius: 8, backgroundColor: 'rgba(255, 159, 67, 0.1)', borderColor: '#ff9f43' }}
                        />
                        <div style={{ padding: '0 20px' }}>
                            <Steps current={-1} status="process" style={{ color: '#fff' }}>
                                <Steps.Step
                                    title={<Text style={{color:'#fff', fontWeight:'bold'}}>第一步：导出日志</Text>}
                                    description={
                                        <div style={{ marginTop: 12, padding: '12px 0' }}>
                                            <div style={{ color: '#ccc', marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
                                                点击下方按钮，系统会自动将错误信息打包。
                                                <br/>
                                                文件将生成在桌面的 <Text code style={{color: '#6bc786'}}>DHC_ERROR_LOG</Text> 文件夹中。
                                            </div>
                                            <Button
                                                icon={<IconFile />}
                                                onClick={handleExportLog}
                                                theme="solid"
                                                size="large"
                                                block={false}
                                                style={{
                                                    backgroundColor: '#6bc786',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    boxShadow: '0 2px 8px rgba(107, 199, 134, 0.3)'
                                                }}
                                            >
                                                一键导出错误日志
                                            </Button>
                                        </div>
                                    }
                                    icon={<IconFile style={{color: '#fff'}} />}
                                />
                                <Steps.Step
                                    title={<Text style={{color:'#fff', fontWeight:'bold'}}>第二步：截图保留</Text>}
                                    description={
                                        <div style={{ marginTop: 8, color: '#ccc', fontSize: 13 }}>
                                            请对报错弹窗或异常画面进行截图。
                                            <br/>
                                            <Text type="tertiary">提示：Win + Shift + S 可快速截图</Text>
                                        </div>
                                    }
                                    icon={<IconFile style={{color: '#fff'}} />}
                                />
                                <Steps.Step
                                    title={<Text style={{color:'#fff', fontWeight:'bold'}}>第三步：联系我们</Text>}
                                    description={
                                        <div style={{ marginTop: 8, color: '#ccc', fontSize: 13 }}>
                                            将 <strong>日志文件夹</strong> 和 <strong>截图</strong> 发送给群管理员或技术支持。
                                            <br/>
                                            请简单描述："在进行什么操作时发生了什么问题"。
                                        </div>
                                    }
                                    icon={<IconHelpCircle style={{color: '#fff'}} />}
                                />
                            </Steps>
                        </div>
                    </Card>
                </Content>
        </Layout>
    );
}

