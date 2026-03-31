import React from 'react';
import { Button, Typography, Card, Row, Col, Divider } from '@douyinfe/semi-ui';
import { IconTickCircle, IconHelpCircle, IconServer, IconArrowRight } from '@douyinfe/semi-icons';

const { Title, Text, Paragraph } = Typography;

interface PostInstallPageProps {
    onNavigate?: (page: string) => void;
    setCurrentStep: (step: any) => void;
}

export default function PostInstallPage({ onNavigate, setCurrentStep }: PostInstallPageProps): React.JSX.Element {
    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <IconTickCircle size="extra-large" style={{ color: '#6bc786', fontSize: 54, marginBottom: 12 }} />
                <Title heading={3} style={{ color: '#fff', marginBottom: 4 }}>安装完成！</Title>
                <Text type="tertiary">环境已配置完成，挑选一个服务器上路吧。</Text>
            </div>

            <Row gutter={[16, 16]}>
                <Col span={14}>
                    <Card
                        style={{ backgroundColor: '#232326', border: '1px solid #444', height: '100%' }}
                        bodyStyle={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                    >
                        <IconServer size="extra-large" style={{ color: '#6bc786', fontSize: 64, marginBottom: 20 }} />
                        <Title heading={4} style={{ color: '#fff', marginBottom: 12 }}>探索服务器</Title>
                        <Text style={{ color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
                            浏览热门服务器推荐，找到适合你的服务器加入游戏
                        </Text>
                        <Button
                            theme="solid"
                            size="large"
                            icon={<IconArrowRight />}
                            style={{ backgroundColor: '#6bc786', color: '#fff', fontWeight: 'bold', minWidth: 200 }}
                            onClick={() => {
                                if (onNavigate) {
                                    onNavigate('ServerListPage')
                                }
                            }}
                        >
                            前往服务器推荐页面
                        </Button>
                    </Card>
                </Col>
                <Col span={10}>
                    <Card
                        style={{
                            background: 'linear-gradient(135deg, #a06cd5 0%, #6bc786 100%)',
                            border: 'none',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                        bodyStyle={{ padding: 20 }}
                    >
                        <IconHelpCircle style={{ fontSize: 42, color: '#fff', marginBottom: 10 }} />
                        <Title heading={4} style={{ color: '#fff' }}>赞助我们</Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.9)' }}>
                            如果这个安装器帮助到你，欢迎请开发者喝杯咖啡。赞助非强制，但能让项目走得更远。
                        </Paragraph>
                        <Button theme="solid" style={{ backgroundColor: '#fff', color: '#a06cd5', fontWeight: 'bold' }} block>
                            ☕ 赞助一杯咖啡
                        </Button>
                    </Card>
                </Col>
            </Row>

            <Divider style={{ borderColor: '#333', margin: '36px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <Button onClick={() => setCurrentStep('SELECT_MODE')}>返回主页</Button>
                <Button theme="solid" type="primary" onClick={() => window.close()}>启动 CM 并关闭</Button>
            </div>
        </div>
    );
}
