import React, { useState } from 'react';
import { Layout, Nav, Button, Typography, Card, Row, Col, Breadcrumb, Tag } from '@douyinfe/semi-ui';
import { 
    IconHome, IconDownload, IconArrowLeft, IconFile, IconFolder, IconTickCircle
} from '@douyinfe/semi-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// 导入本地图片资源
import wikiImage1 from '../../../resources/image/shutokowiki/SCR-20251109-teqy.jpeg';
import wikiImage2 from '../../../resources/image/shutokowiki/SCR-20251109-tqkp.jpeg';

// --- 1. 模拟 Wiki 数据 (支持 Markdown) ---
interface WikiArticle {
    id: string;
    title: string;
    subtitle: string;
    cover: string;
    tags: string[];
    content: string;
}

const WIKI_DATA: WikiArticle[] = [
    {
        id: 'overview',
        title: '首都高概览',
        subtitle: 'Shutoko Overview',
        cover: wikiImage1, // 使用本地图片
        tags: ['基础', '历史'],
        content: `
# 首都高复兴计划 (SRP)

**Shutoko Revival Project** 是神力科莎 (Assetto Corsa) 最宏大的模组项目之一，旨在 1:1 还原东京首都高速公路网。

## 项目愿景

该项目不仅还原了道路，还致力于还原 JDM 地下赛车文化、PA (停车区) 聚会氛围以及东京独特的夜景光照系统。

## 包含区域

- **C1 环状线**: 核心区域，技术性弯道多。
- **湾岸线 (Bayshore)**: 著名的 300km/h 直线极速区。
- **横羽线 (Yokohane)**: 连接东京与横滨的重要干道。
        `
    },
    {
        id: 'driving_tech',
        title: '驾驶技巧',
        subtitle: 'Driving Techniques',
        cover: wikiImage2, // 使用本地图片
        tags: ['进阶', '教学'],
        content: `
# 首都高驾驶生存指南

在狭窄的首都高穿梭需要极高的专注力。

## 1. 视线控制

永远看向你**想去的地方**，而不是你害怕撞到的墙。在高速车流中穿梭（Nohesi）时，视线要放远至少 300 米。

## 2. 油门控制

首都高的路面并非平整的赛道。

* 遇到接缝（Bumps）时稍微收油。
* 避免在过弯时剧烈刹车，易导致重心转移失控。

> "直道谁不会踩油门？弯道快才是真的快。" —— DK
        `
    },
    {
        id: 'c1_loop',
        title: 'C1 环线',
        subtitle: 'Inner Circular Route',
        cover: wikiImage1, // 使用本地图片
        tags: ['赛道', '高难度'],
        content: `# C1 环状线\n\n全长约 14.8 公里，是首都高的核心。`
    },
    {
        id: 'new_loop',
        title: '新环状',
        subtitle: 'New Belt Line',
        cover: wikiImage2, // 使用本地图片
        tags: ['赛道', '高速'],
        content: `# 新环状线\n\n连接 C1 与湾岸的关键通道。`
    },
    {
        id: 'bayshore',
        title: '湾岸线',
        subtitle: 'Bayshore Route',
        cover: wikiImage1, // 使用本地图片
        tags: ['极速', '直线'],
        content: `# 湾岸线 (Wangan)\n\n这里是马力的战场。全长 60km+ 的超长直道，是测试极速的圣地。`
    },
    {
        id: 'yokohane',
        title: '横羽线',
        subtitle: 'Yokohane Route',
        cover: wikiImage2, // 使用本地图片
        tags: ['技术', '中速'],
        content: `# 横羽线\n\n路面起伏较大，充满工业区的美感。`
    },
    {
        id: 'others',
        title: '其他线路',
        subtitle: 'Others',
        cover: wikiImage1, // 使用本地图片
        tags: ['探索'],
        content: `# 探索更多\n\n深川线、涉谷线等更多支线区域...`
    },
    {
        id: 'pa_guide',
        title: '停车场介绍',
        subtitle: 'PA Guide',
        cover: wikiImage2, // 使用本地图片
        tags: ['聚会', '休闲'],
        content: `# 停车场 (Parking Areas)\n\n**大黑 PA (Daikoku)**: 传奇的聚会圣地。\n**辰巳 PA (Tatsumi)**: 欣赏东京夜景的最佳位置。`
    }
];

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// 模拟地图 SVG 路径 (为了视觉效果)
const MAP_SVG_PATH = "M50 10 C 20 20, 10 50, 30 80 S 80 120, 100 100 S 140 50, 110 20 Z";

export default function ShutokoWiki(): React.JSX.Element {
    // 状态：当前视图 'grid' | 'detail'
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);

    // 进入详情
    const openArticle = (article: WikiArticle): void => {
        setActiveArticle(article);
        setView('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 返回列表
    const goBack = (): void => {
        setView('grid');
        setTimeout(() => setActiveArticle(null), 300);
    };

    // 样式常量
    const BG_DARK = '#16161a';
    const CARD_BG = '#232326';
    const THEME_ACCENT = '#00f2fe'; // 赛博青

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            <Sider style={{ backgroundColor: '#232326', width: 240 }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: '#333', borderRadius: '50%' }}></div>
                    <Title heading={4} style={{ color: '#fff', margin: 0 }}>东濠涌</Title>
                </div>
                <Nav
                    defaultSelectedKeys={['Wiki']}
                    items={[
                        { itemKey: 'Install', text: '模组安装', icon: <IconDownload /> },
                        { itemKey: 'Wiki', text: '首都高百科', icon: <IconFile /> },
                    ]}
                />
            </Sider>

            <Layout>
                <Header style={{ padding: '20px 40px', background: BG_DARK }}>
                    <Breadcrumb>
                        <Breadcrumb.Item icon={<IconHome />} onClick={goBack} style={{cursor:'pointer'}}>首页</Breadcrumb.Item>
                        <Breadcrumb.Item onClick={goBack} style={{cursor:'pointer'}}>首都高百科</Breadcrumb.Item>
                        {view === 'detail' && <Breadcrumb.Item>{activeArticle?.title}</Breadcrumb.Item>}
                    </Breadcrumb>
                </Header>

                <Content style={{ padding: '0 40px 40px 40px', overflowY: 'auto' }}>
                    {/* --- 视图 1: 首页网格 --- */}
                    {view === 'grid' && (
                        <div className="wiki-grid-container animate-fade-in">
                            <div style={{ marginBottom: 30 }}>
                                <Title heading={2} style={{ color: '#fff' }}>首都高百科 Wiki</Title>
                                <Text style={{ color: '#888' }}>探索东京地下赛车网络，掌握每一条路线与技巧。</Text>
                            </div>

                            <Row gutter={[24, 24]}>
                                {WIKI_DATA.map(item => (
                                    <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                                        <div 
                                            className="wiki-card"
                                            onClick={() => openArticle(item)}
                                            style={{
                                                height: 220,
                                                borderRadius: 16,
                                                position: 'relative',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                border: '1px solid #333',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {/* 背景图 */}
                                            <div 
                                                className="card-bg"
                                                style={{
                                                    backgroundImage: `url(${item.cover})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    transition: 'transform 0.5s ease',
                                                    filter: 'brightness(0.6)'
                                                }}
                                            />
                                            
                                            {/* 内容层 */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                zIndex: 2,
                                                padding: 20,
                                                background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
                                            }}>
                                                {/* 模拟地图 SVG (发光效果) */}
                                                <svg width="60" height="60" viewBox="0 0 150 150" className="map-icon" style={{fill: 'none', stroke: '#fff', strokeWidth: 4, opacity: 0.8, marginBottom: 15, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>
                                                    <path d={MAP_SVG_PATH} />
                                                </svg>

                                                <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 4, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>{item.title}</Text>
                                                </div>
                                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, textTransform: 'uppercase' }}>{item.subtitle}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}

                    {/* --- 视图 2: 详情页 (Markdown 阅读器) --- */}
                    {view === 'detail' && activeArticle && (
                        <div className="wiki-detail-container animate-slide-up" style={{ maxWidth: 900, margin: '0 auto' }}>
                            {/* 详情页头部 Hero */}
                            <div style={{ 
                                height: 200, 
                                borderRadius: 16, 
                                overflow: 'hidden', 
                                position: 'relative', 
                                marginBottom: 30,
                                border: '1px solid #333'
                            }}>
                                <img src={activeArticle.cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={activeArticle.title} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 30, background: 'linear-gradient(to top, #16161a 10%, transparent)' }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        {activeArticle.tags.map(tag => (
                                            <Tag key={tag} color="cyan" type="solid" style={{borderRadius: 4}}>{tag}</Tag>
                                        ))}
                                    </div>
                                    <Title heading={1} style={{ color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{activeArticle.title}</Title>
                                    <Text style={{ color: '#ccc', fontSize: 16 }}>{activeArticle.subtitle}</Text>
                                </div>
                                <Button 
                                    icon={<IconArrowLeft />} 
                                    theme="solid" 
                                    style={{ position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white' }}
                                    onClick={goBack}
                                >
                                    返回列表
                                </Button>
                            </div>

                            {/* Markdown 内容区 */}
                            <div style={{ 
                                padding: '0 20px', 
                                color: '#e0e0e0', 
                                lineHeight: 1.8 
                            }} className="markdown-body">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {activeArticle.content}
                                </ReactMarkdown>
                            </div>
                            
                            <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #333', textAlign: 'center', color: '#666' }}>
                                <Text>本文档由社区维护，最后更新于 2023-10-24</Text>
                            </div>
                        </div>
                    )}
                </Content>
            </Layout>

            {/* --- 全局 CSS --- */}
            <style>{`
                /* 卡片交互动画 */
                .wiki-card:hover {
                    border-color: ${THEME_ACCENT} !important;
                    box-shadow: 0 0 20px rgba(0, 242, 254, 0.2);
                    transform: translateY(-4px);
                }
                .wiki-card:hover .card-bg {
                    transform: scale(1.1);
                    filter: brightness(0.8) !important;
                }
                .wiki-card:hover .map-icon {
                    stroke: ${THEME_ACCENT} !important;
                    filter: drop-shadow(0 0 8px ${THEME_ACCENT});
                }

                /* 简单的进场动画 */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                .animate-slide-up { animation: slideUp 0.4s ease-out; }

                /* Markdown 样式适配 (Dark Mode) */
                .markdown-body h1 { color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 30px; }
                .markdown-body h2 { color: ${THEME_ACCENT}; margin-top: 24px; }
                .markdown-body p { margin-bottom: 16px; font-size: 16px; }
                .markdown-body strong { color: #fff; }
                .markdown-body ul { padding-left: 20px; }
                .markdown-body li { margin-bottom: 8px; }
                .markdown-body blockquote { 
                    border-left: 4px solid ${THEME_ACCENT}; 
                    padding-left: 16px; 
                    color: #999; 
                    background: rgba(255,255,255,0.05);
                    padding: 10px 16px;
                    border-radius: 4px;
                }
            `}</style>
        </Layout>
    );
}
