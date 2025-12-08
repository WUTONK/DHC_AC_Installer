import React, { useState } from 'react';

import { Layout, Button, Row, Col, Typography, Tag, Space, Progress, Card, List, Toast, Banner, Modal, Descriptions } from '@douyinfe/semi-ui';

import {

    IconHome, IconDownload, IconRefresh, IconTickCircle, IconFolder, IconAlertTriangle, IconArrowRight, IconPlay

} from '@douyinfe/semi-icons';

// --- 1. 定义数据源：目标安装包的版本 vs 本地已安装的状态 ---

// 假设这是服务器/安装包里提供的版本

interface TargetPackage {
    name: string;
    version: string;
    label: string;
}

interface LocalState {
    installed: boolean;
    version: string | null;
}

interface ConflictItem {
    id: string;
    name: string;
    currentVersion: string;
    targetVersion: string;
    type: 'reinstall' | 'upgrade' | 'downgrade';
}

const TARGET_PACKAGES: Record<string, TargetPackage> = {

    csp: { name: 'CSP', version: '0.1.79', label: 'Stable' },

    sol: { name: 'Sol', version: '2.2.9', label: 'Weather' },

    pure: { name: 'Pure', version: '0.238', label: 'Weather' }

};

// 假设这是从本地读取到的状态 (模拟数据：CSP和Sol已安装，Pure未安装)

const LOCAL_STATE_MOCK: Record<string, LocalState> = {

    csp: { installed: true, version: '0.1.78' }, // 旧版本

    sol: { installed: true, version: '2.2.9' }, // 同版本

    pure: { installed: false, version: null }    // 未安装

};

const { Header, Content } = Layout;

const { Text, Title, Paragraph } = Typography;

export default function ShaderInstaller() {

    // 状态管理

    const [installing, setInstalling] = useState<boolean>(false);

    const [installProgress, setInstallProgress] = useState<number>(0);



    // 冲突弹窗控制

    const [conflictModalVisible, setConflictModalVisible] = useState<boolean>(false);

    const [conflicts, setConflicts] = useState<ConflictItem[]>([]); // 存储具体的冲突列表

    // 检查冲突的逻辑

    const checkAndInstall = () => {

        const detectedConflicts: ConflictItem[] = [];



        // 遍历我们要安装的目标

        Object.keys(TARGET_PACKAGES).forEach(key => {

            const local = LOCAL_STATE_MOCK[key];

            const target = TARGET_PACKAGES[key];

            // 如果本地已安装，则视为冲突（或者叫"覆盖确认"）

            if (local && local.installed) {

                detectedConflicts.push({

                    id: key,

                    name: target.name,

                    currentVersion: local.version || '',

                    targetVersion: target.version,

                    // 判断是升级、降级还是重装

                    type: local.version === target.version ? 'reinstall' : (local.version && local.version < target.version ? 'upgrade' : 'downgrade')

                });

            }

        });

        if (detectedConflicts.length > 0) {

            setConflicts(detectedConflicts);

            setConflictModalVisible(true); // 弹出确认框

        } else {

            // 没有冲突（说明全是新安装），直接开始

            startInstallProcess();

        }

    };

    // 执行安装进程

    const startInstallProcess = () => {

        setConflictModalVisible(false); // 关闭弹窗

        setInstalling(true);

        setInstallProgress(0);



        // 模拟进度条

        let p = 0;

        const timer = setInterval(() => {

            p += 5;

            if (p > 100) p = 100;

            setInstallProgress(p);



            if (p >= 100) {

                clearInterval(timer);

                setTimeout(() => {

                    setInstalling(false);

                    Toast.success('所有模组安装完成！');

                }, 800);

            }

        }, 100);

    };

    // 样式常量

    const THEME_GREEN = '#6bc786';

    const BG_DARK = '#16161a';

    const CARD_BG = '#232326';

    return (

        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">

            <Header style={{ padding: '20px 40px', background: BG_DARK }}>

                    {/* 顶部导航省略... */}

                    <Title heading={5} style={{color:'white'}}>光影安装</Title>

                </Header>

                <Content style={{ padding: '0 40px 40px 40px', overflowY: 'auto' }}>



                    {/* --- 一键安装区域 --- */}

                    <div style={{ marginBottom: 30 }}>

                        <Banner

                            fullMode={false}

                            type="success"

                            style={{ backgroundColor: 'rgba(107, 199, 134, 0.1)', border: `1px solid ${THEME_GREEN}`, borderRadius: 12, padding: 24 }}

                            description={

                                <div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                        <div>

                                            <Title heading={4} style={{ color: '#fff', margin: 0 }}>一键安装推荐配置</Title>

                                            <Text style={{ color: '#ccc', marginTop: 4 }}>

                                                包含: CSP {TARGET_PACKAGES.csp.version}, Sol {TARGET_PACKAGES.sol.version}, Pure {TARGET_PACKAGES.pure.version}

                                            </Text>

                                        </div>

                                        <div style={{ width: 200 }}>

                                            {installing ? (

                                                <div style={{ textAlign: 'center' }}>

                                                    <Text style={{ color: THEME_GREEN, marginBottom: 5, display: 'block' }}>正在覆盖安装...</Text>

                                                    <Progress percent={installProgress} stroke={THEME_GREEN} showInfo={true} />

                                                </div>

                                            ) : (

                                                <Button

                                                    theme="solid"

                                                    size="large"

                                                    style={{ backgroundColor: THEME_GREEN, color: '#fff', width: '100%', fontWeight: 'bold' }}

                                                    icon={<IconPlay />}

                                                    onClick={checkAndInstall} // 点击触发检查

                                                >

                                                    开始安装

                                                </Button>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            }

                        />

                    </div>

                    {/* --- 状态展示卡片 (可视化当前的模拟状态) --- */}

                    <Title heading={5} style={{ color: '#fff', marginBottom: 12 }}>当前本地状态 (模拟)</Title>

                    <Row gutter={16}>

                        {Object.keys(LOCAL_STATE_MOCK).map(key => {

                            const item = LOCAL_STATE_MOCK[key];

                            return (

                                <Col span={8} key={key}>

                                    <Card style={{ backgroundColor: CARD_BG, border: 'none' }}>

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>

                                            <Text style={{color:'white', fontWeight:'bold'}}>{key.toUpperCase()}</Text>

                                            <Tag color={item.installed ? 'blue' : 'grey'}>

                                                {item.installed ? `已安装 v${item.version}` : '未安装'}

                                            </Tag>

                                        </div>

                                    </Card>

                                </Col>

                            )

                        })}

                    </Row>

                </Content>

            {/* --- 核心：冲突解决 Modal --- */}

            <Modal

                title={

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff9f43' }}>

                        <IconAlertTriangle size="large" />

                        <span style={{ fontSize: 18, fontWeight: 'bold' }}>发现已安装的模组</span>

                    </div>

                }

                visible={conflictModalVisible}

                onCancel={() => setConflictModalVisible(false)}

                footer={

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>

                        <Button onClick={() => setConflictModalVisible(false)} type="tertiary" style={{color:'#ccc'}}>

                            取消

                        </Button>

                        <Button

                            onClick={startInstallProcess}

                            theme="solid"

                            style={{ backgroundColor: '#ff9f43', color: 'white' }} // 橙色按钮表示警示/覆盖

                        >

                            确认覆盖安装

                        </Button>

                    </div>

                }

                style={{ backgroundColor: '#232326', border: '1px solid #444', maxWidth: 500 }}

                maskStyle={{ backgroundColor: 'rgba(0,0,0,0.6)' }}

                closeIcon={<span style={{color:'white'}}>x</span>}

            >

                <div style={{ color: '#fff' }}>

                    <Paragraph style={{ marginBottom: 16, color: '#ccc' }}>

                        以下模组已经在你的游戏中存在。继续安装将会<strong>覆盖</strong>现有文件，可能会导致之前的设置丢失。

                    </Paragraph>

                    <List

                        dataSource={conflicts}

                        renderItem={(item: ConflictItem) => (

                            <List.Item style={{

                                backgroundColor: '#16161a',

                                borderRadius: 8,

                                marginBottom: 8,

                                padding: '12px',

                                borderLeft: `4px solid ${

                                    item.type === 'upgrade' ? '#6bc786' : (item.type === 'reinstall' ? '#ff9f43' : '#ff4d4f')

                                }`

                            }}>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

                                    {/* 模组名 */}

                                    <Text style={{ color: '#fff', fontWeight: 'bold', width: 60 }}>{item.name}</Text>



                                    {/* 版本对比区 */}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' }}>

                                        <div style={{ textAlign: 'center' }}>

                                            <Text size="small" style={{ color: '#999' }}>当前</Text>

                                            <div style={{ color: '#ccc' }}>v{item.currentVersion}</div>

                                        </div>



                                        <IconArrowRight style={{ color: '#666' }} />



                                        <div style={{ textAlign: 'center' }}>

                                            <Text size="small" style={{ color: '#999' }}>新版</Text>

                                            <div style={{ color: THEME_GREEN, fontWeight: 'bold' }}>v{item.targetVersion}</div>

                                        </div>

                                    </div>

                                    {/* 状态标签 */}

                                    <div style={{ width: 80, textAlign: 'right' }}>

                                        {item.type === 'upgrade' && <Tag color="green" type="ghost">升级</Tag>}

                                        {item.type === 'reinstall' && <Tag color="orange" type="ghost">覆盖</Tag>}

                                        {item.type === 'downgrade' && <Tag color="red" type="ghost">降级</Tag>}

                                    </div>

                                </div>

                            </List.Item>

                        )}

                    />



                    {/* 提示 Pure 这种未安装的会被直接安装 */}

                    {Object.keys(TARGET_PACKAGES).length > conflicts.length && (

                        <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(107, 199, 134, 0.1)', borderRadius: 6 }}>

                            <Text size="small" style={{ color: THEME_GREEN }}>

                                <IconTickCircle style={{ marginRight: 4 }} />

                                其余未冲突的模组 (如 Pure) 将正常安装。

                            </Text>

                        </div>

                    )}

                </div>

            </Modal>

        </Layout>

    );

}
