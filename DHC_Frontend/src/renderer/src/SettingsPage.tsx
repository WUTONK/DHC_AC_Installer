import React, { useState } from 'react';

import { Layout, Button, Typography, Card, Select, Radio, Steps, Toast, Tag, Row, Col, Input, Banner, Modal, List, Space } from '@douyinfe/semi-ui';

import {

    IconSetting, IconFolder, IconHelpCircle,

    IconFile, IconServer, IconTickCircle, IconAlertTriangle,

    IconCamera, IconComment, IconExport, IconLink

} from '@douyinfe/semi-icons';

import HomeBreadcrumb from './components/HomeBreadcrumb';



const { Header, Content } = Layout;

const { Text, Paragraph } = Typography;

export default function SettingsPage(): React.JSX.Element {
    // --- 状态管理 ---

    // 1. 语言设置 (模拟系统语言检测)
    const systemLang: string = 'zh_CN';
    const [language, setLanguage] = useState<string>('zh_CN');

    // 2. 存储设置
    const [storageMode, setStorageMode] = useState<'simple' | 'advanced'>('simple');
    const [selectedDrive, setSelectedDrive] = useState<string>('D');
    const [paths, setPaths] = useState<{resource: string; cache: string}>({
        resource: 'D:\\SteamLibrary\\steamapps\\common\\assettocorsa',
        cache: 'D:\\DHC_Launcher\\Cache'
    });



    // 3. 弹窗状态管理 (新增)
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    // 联系我们 - 是否已阅读须知
    const [hasReadContactInfo, setHasReadContactInfo] = useState(false);

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


    // 打开日志弹窗并模拟生成
    const handleOpenLogModal = (): void => {
        const loadingToast = Toast.info({ content: '正在打包日志...', duration: 0 });
        setTimeout(() => {
            Toast.close(loadingToast);
            setLogModalVisible(true);
        }, 800);
    };



    const handleSaveStorage = (): void => {
        Toast.success('存储路径配置已更新');
    };



    // 重置联系我们弹窗状态
    const handleOpenContact = (): void => {
        setHasReadContactInfo(false);
        setContactModalVisible(true);
    };

    // 样式常量
    const BG_DARK = '#16161a';
    const CARD_BG = '#232326';
    const THEME_GREEN = '#6bc786';



    // 动态生成日志文件名
    const getLogFileName = (): string => {
        const now = new Date();
        const str = now.toISOString().replace(/[-:T.]/g, '').slice(2, 14); // yymmddhhmmss
        return `DHC_LOG_${str}`;
    };

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            <Header style={{ padding: '20px 40px', background: BG_DARK, display: 'flex', alignItems: 'center', gap: 16 }}>
                <HomeBreadcrumb current="设置" />
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

                            {/* 第一步 */}

                            <Steps.Step

                                title={<Text style={{color:'#fff', fontWeight:'bold'}}>第一步：导出日志</Text>}

                                description={

                                    <div style={{ marginTop: 8 }}>

                                        <Text type="tertiary" style={{ fontSize: 13 }}>系统会自动打包错误信息供管理员分析。</Text>

                                        <div style={{ marginTop: 8 }}>

                                            <Button

                                                icon={<IconExport />}

                                                theme="solid"

                                                style={{ backgroundColor: '#444', color: '#fff' }}

                                                onClick={handleOpenLogModal}

                                            >

                                                点此导出日志

                                            </Button>

                                        </div>

                                    </div>

                                }

                                icon={<IconFile style={{color: '#fff'}} />}

                            />

                            {/* 第二步 */}

                            <Steps.Step

                                title={<Text style={{color:'#fff', fontWeight:'bold'}}>第二步：截图保留</Text>}

                                description={

                                    <div style={{ marginTop: 8 }}>

                                        <Text type="tertiary" style={{ fontSize: 13 }}>对报错弹窗或异常画面进行截图。</Text>

                                        <div style={{ marginTop: 8 }}>

                                            <Button

                                                icon={<IconCamera />}

                                                theme="solid"

                                                style={{ backgroundColor: '#444', color: '#fff' }}

                                                onClick={() => setScreenshotModalVisible(true)}

                                            >

                                                如何截图？

                                            </Button>

                                        </div>

                                    </div>

                                }

                                icon={<IconCamera style={{color: '#fff'}} />}

                            />

                            {/* 第三步 */}

                            <Steps.Step

                                title={<Text style={{color:'#fff', fontWeight:'bold'}}>第三步：联系我们</Text>}

                                description={

                                    <div style={{ marginTop: 8 }}>

                                        <Text type="tertiary" style={{ fontSize: 13 }}>将日志和截图发送给技术支持。</Text>

                                        <div style={{ marginTop: 8 }}>

                                            <Button

                                                icon={<IconComment />}

                                                theme="solid"

                                                style={{ backgroundColor: '#444', color: '#fff' }}

                                                onClick={handleOpenContact}

                                            >

                                                联系我们

                                            </Button>

                                        </div>

                                    </div>

                                }

                                icon={<IconHelpCircle style={{color: '#fff'}} />}

                            />

                        </Steps>

                    </div>
                    </Card>

            </Content>



            {/* --- Modals (弹窗区域) --- */}



            {/* 1. 导出日志成功弹窗 */}

            <Modal

                visible={logModalVisible}

                onCancel={() => setLogModalVisible(false)}

                footer={<Button type="primary" theme="solid" onClick={() => setLogModalVisible(false)}>好的，我知道了</Button>}

                title="日志导出成功"

                width={400}

                style={{ top: 100 }}

            >

                <div style={{ textAlign: 'center', padding: '20px 0' }}>

                    <IconTickCircle size="extra-large" style={{ color: THEME_GREEN, fontSize: 48, marginBottom: 16 }} />

                    <Paragraph style={{ fontSize: 16 }}>

                        日志压缩包已经导出到桌面文件夹

                    </Paragraph>

                    <div style={{ marginTop: 8 }}>
                        <Text code copyable style={{ fontSize: 16, color: THEME_GREEN }}>
                            {getLogFileName()}
                        </Text>
                    </div>

                </div>

            </Modal>



            {/* 2. 如何截图教程弹窗 */}

            <Modal

                visible={screenshotModalVisible}

                onCancel={() => setScreenshotModalVisible(false)}

                footer={<Button type="primary" theme="solid" onClick={() => setScreenshotModalVisible(false)}>学会了</Button>}

                title="如何截图？"

                width={500}

            >

                <div style={{ lineHeight: 1.8 }}>

                    <Paragraph>1. 按 <kbd style={{ padding: '2px 6px', background: '#333', border: '1px solid #555', borderRadius: 3, fontSize: 12 }}>Windows</kbd> + <kbd style={{ padding: '2px 6px', background: '#333', border: '1px solid #555', borderRadius: 3, fontSize: 12 }}>Shift</kbd> + <kbd style={{ padding: '2px 6px', background: '#333', border: '1px solid #555', borderRadius: 3, fontSize: 12 }}>S</kbd> 键进行截图。</Paragraph>



                    {/* 图片占位 */}

                    <div style={{

                        height: 120, background: '#333', borderRadius: 8, margin: '10px 0',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '1px dashed #555'

                    }}>

                        [截图操作示意图占位]

                    </div>



                    <Paragraph>2. 然后在右侧的通知中打开。</Paragraph>



                    {/* 图片占位 */}

                    <div style={{

                        height: 120, background: '#333', borderRadius: 8, margin: '10px 0',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '1px dashed #555'

                    }}>

                        [通知中心打开示意图占位]

                    </div>



                    <Paragraph>3. 将其保存到桌面。</Paragraph>



                    {/* 图片占位 */}

                    <div style={{

                        height: 120, background: '#333', borderRadius: 8, margin: '10px 0',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '1px dashed #555'

                    }}>

                        [保存文件示意图占位]

                    </div>

                </div>

            </Modal>



            {/* 3. 联系我们/提问须知弹窗 */}

            <Modal

                visible={contactModalVisible}

                onCancel={() => setContactModalVisible(false)}

                title={hasReadContactInfo ? "加入社区寻求帮助" : "提问须知"}

                footer={null} // 自定义 Footer 逻辑

                width={500}

                maskClosable={false}

            >

                {!hasReadContactInfo ? (

                    // 状态 A: 显示须知

                    <>

                        <Banner

                            type="info"

                            description="为了让我们更高效地解决您的问题，请务必阅读以下内容。"

                            style={{ marginBottom: 16 }}

                        />

                        <List

                            bordered

                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: '#444' }}

                        >

                            <List.Item>1. 请将导出的 <Text strong>日志压缩包</Text> 以及 <Text strong>问题截图</Text> 和你的 <Text strong>问题描述</Text> 一起发送给我们。</List.Item>

                            <List.Item>2. 如果不是在安装过程中遇到问题，而是在打开游戏时遇到问题，那么请发送概括了你的问题的截图。</List.Item>

                            <List.Item>3. 礼貌且尽可能详细的描述你的问题。</List.Item>

                            <List.Item><Text type="danger">4. 如果不遵循如下规范，则我们不会回答你的问题。</Text></List.Item>

                        </List>

                        <div style={{ marginTop: 24, textAlign: 'center' }}>

                            <Button

                                theme="solid"

                                size="large"

                                style={{ backgroundColor: THEME_GREEN, color: '#fff', width: '100%' }}

                                onClick={() => setHasReadContactInfo(true)}

                            >

                                我已经了解须知

                            </Button>

                        </div>

                    </>

                ) : (

                    // 状态 B: 显示社交链接

                    <div style={{ textAlign: 'center', padding: '20px 0' }}>

                        <Paragraph style={{ marginBottom: 24, color: '#ccc' }}>

                            感谢配合！请选择您常用的平台加入我们的频道进行反馈。

                        </Paragraph>



                        <Space spacing={20} style={{ width: '100%', justifyContent: 'center' }}>

                            {/* QQ 按钮 */}

                            <Button

                                theme="solid"

                                size="large"

                                icon={<IconComment />}

                                style={{

                                    backgroundColor: '#12B7F5', // QQ 品牌色

                                    color: '#fff',

                                    height: 50,

                                    padding: '0 30px',

                                    fontSize: 16,

                                    fontWeight: 'bold'

                                }}

                                onClick={() => window.open('https://qm.qq.com/example', '_blank')}

                            >

                                加入 QQ 群

                            </Button>



                            {/* Discord 按钮 */}

                            <Button

                                theme="solid"

                                size="large"

                                icon={<IconLink />}

                                style={{

                                    backgroundColor: '#5865F2', // Discord 品牌色

                                    color: '#fff',

                                    height: 50,

                                    padding: '0 30px',

                                    fontSize: 16,

                                    fontWeight: 'bold'

                                }}

                                onClick={() => window.open('https://discord.gg/example', '_blank')}

                            >

                                加入 Discord

                            </Button>

                        </Space>

                    </div>

                )}

            </Modal>



        </Layout>
    );
}

