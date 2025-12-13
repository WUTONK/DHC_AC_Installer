
import React, { useState } from 'react';
import { Layout, Button, Typography, Row, Col, Breadcrumb, Tag } from '@douyinfe/semi-ui';
import { IconHome, IconArrowLeft } from '@douyinfe/semi-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 导入本地图片资源 (保持你原有的引用)
import wikiImage1 from '../../../resources/image/shutokowiki/SCR-20251109-teqy.jpeg';
import wikiImage2 from '../../../resources/image/shutokowiki/SCR-20251109-tqkp.jpeg';
// 导入地图资源
import c1Map from '../../../resources/image/shutokowiki/map/c1_full_map.svg';
import newCircularMap from '../../../resources/image/shutokowiki/map/new_circular_full_map.svg';

// --- 1. 数据定义 ---
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
        cover: wikiImage1,
        tags: ['基础', '历史'],
        content: `# 首都高复兴计划 (SRP)

**Shutoko Revival Project** 是神力科莎 (Assetto Corsa) 最宏大的模组项目之一，旨在 1:1 还原东京首都高速公路网。

## 项目愿景

该项目不仅还原了道路，还致力于还原 JDM 地下赛车文化、PA (停车区) 聚会氛围以及东京独特的夜景光照系统。

## 包含区域

- **C1 环状线**: 核心区域，技术性弯道多。
- **湾岸线 (Bayshore)**: 著名的 300km/h 直线极速区。
- **横羽线 (Yokohane)**: 连接东京与横滨的重要干道。`
    },
    {
        id: 'driving_tech',
        title: '驾驶技巧',
        subtitle: 'Driving Techniques',
        cover: wikiImage2,
        tags: ['进阶', '教学'],
        content: `# 首都高驾驶生存指南

在狭窄的首都高穿梭需要极高的专注力。

## 1. 视线控制

永远看向你**想去的地方**，而不是你害怕撞到的墙。在高速车流中穿梭（Nohesi）时，视线要放远至少 300 米。

## 2. 油门控制

首都高的路面并非平整的赛道。

* 遇到接缝（Bumps）时稍微收油。
* 避免在过弯时剧烈刹车，易导致重心转移失控。

> "直道谁不会踩油门？弯道快才是真的快。" —— DK`
    },
    {
        id: 'c1_loop',
        title: 'C1 环线',
        subtitle: 'Inner Circular Route',
        cover: wikiImage1,
        tags: ['赛道', '高难度'],
        content: `# C1 环状线

全长约 14.8 公里，是首都高的核心。`
    },
    {
        id: 'new_loop',
        title: '新环状',
        subtitle: 'New Belt Line',
        cover: wikiImage2,
        tags: ['赛道', '高速'],
        content: `# 新环状线

连接 C1 与湾岸的关键通道。`
    },
    {
        id: 'bayshore',
        title: '湾岸线',
        subtitle: 'Bayshore Route',
        cover: wikiImage1,
        tags: ['极速', '直线'],
        content: `# 湾岸线 (Wangan)

这里是马力的战场。全长 60km+ 的超长直道，是测试极速的圣地。`
    },
    {
        id: 'yokohane',
        title: '横羽线',
        subtitle: 'Yokohane Route',
        cover: wikiImage2,
        tags: ['技术', '中速'],
        content: `# 横羽线

路面起伏较大，充满工业区的美感。`
    },
    {
        id: 'others',
        title: '其他线路',
        subtitle: 'Others',
        cover: wikiImage1,
        tags: ['探索'],
        content: `# 探索更多

深川线、涉谷线等更多支线区域...`
    },
    {
        id: 'pa_guide',
        title: '停车场介绍',
        subtitle: 'PA Guide',
        cover: wikiImage2,
        tags: ['聚会', '休闲'],
        content: `# 停车场 (Parking Areas)

**大黑 PA (Daikoku)**: 传奇的聚会圣地。
**辰巳 PA (Tatsumi)**: 欣赏东京夜景的最佳位置。`
    }
];

// --- 分类配置 ---
const CATEGORIES = [
    {
        title: '必读指南',
        enTitle: 'MUST READ',
        ids: ['overview', 'driving_tech']
    },
    {
        title: '经典线路',
        enTitle: 'CLASSIC ROUTES',
        ids: ['c1_loop', 'new_loop', 'bayshore', 'yokohane']
    },
    {
        title: '其他',
        enTitle: 'OTHERS',
        ids: ['others', 'pa_guide']
    }
];

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const MAP_SVG_PATH = "M50 10 C 20 20, 10 50, 30 80 S 80 120, 100 100 S 140 50, 110 20 Z";
const BG_DARK = '#16161a';
const THEME_ACCENT = '#00f2fe'; // 赛博青

export default function ShutokoWiki(): React.JSX.Element {
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);

    const openArticle = (article: WikiArticle): void => {
        setActiveArticle(article);
        setView('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = (): void => {
        setView('grid');
        setTimeout(() => setActiveArticle(null), 300);
    };

    // 辅助函数：根据ID获取文章数据
    const getArticleById = (id: string): WikiArticle | undefined => WIKI_DATA.find(item => item.id === id);

    // --- 组件：未读提示红点 ---
    const UnreadBadge = (): React.JSX.Element => (
        <div className="unread-indicator">
            <div className="red-dot"></div>
            <div className="white-ripple"></div>
        </div>
    );

    // --- 组件：分类分隔线 ---
    const SectionDivider = ({ title, enTitle }: { title: string, enTitle: string }): React.JSX.Element => (
        <div className="section-divider">
            <div className="line"></div>
            <div className="content">
                <span className="dot">•</span>
                <span className="zh">{title}</span>
                <span className="en">{enTitle}</span>
                <span className="dot">•</span>
            </div>
            <div className="line"></div>
        </div>
    );

    return (
        <Layout style={{ height: '100vh', background: BG_DARK, color: 'white' }} className="semi-always-dark">
            <Header style={{ padding: '20px 40px', background: BG_DARK }}>
                <Breadcrumb>
                    <Breadcrumb.Item icon={<IconHome />} onClick={goBack} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
                    <Breadcrumb.Item onClick={goBack} style={{ cursor: 'pointer' }}>首都高百科</Breadcrumb.Item>
                    {view === 'detail' && <Breadcrumb.Item>{activeArticle?.title}</Breadcrumb.Item>}
                </Breadcrumb>
            </Header>

            <Content style={{ padding: '0 40px 40px 40px', overflowY: 'auto' }}>
                {/* --- 视图 1: 首页网格 --- */}
                {view === 'grid' && (
                    <div className="wiki-grid-container animate-fade-in">
                        <div style={{ marginBottom: 10 }}>
                            <Title heading={2} style={{ color: '#fff' }}>首都高百科 Wiki</Title>
                            <Text style={{ color: '#888' }}>探索东京地下赛车网络，掌握每一条路线与技巧。</Text>
                        </div>

                        {/* 遍历分类进行渲染 */}
                        {CATEGORIES.map((category, catIndex) => {
                            // --- 判断是否为“必读指南”分类 ---
                            const isMustRead = category.title === '必读指南';

                            // --- 动态调整栅格布局 ---
                            // 如果是必读指南，使用 lg={12} (一行两列)，否则保持 lg={6} (一行四列)
                            const colProps = isMustRead
                                ? { xs: 24, sm: 24, md: 12, lg: 12 }
                                : { xs: 24, sm: 12, md: 8, lg: 6 };

                            // --- 动态调整卡片高度 ---
                            // 必读指南卡片更高 (320px)，以体现“放大”效果
                            const cardHeight = isMustRead ? 320 : 220;

                            return (
                                <div key={catIndex} style={{ marginBottom: 40 }}>
                                    {/* 分隔线 */}
                                    <SectionDivider title={category.title} enTitle={category.enTitle} />

                                    {/* 恢复左对齐，移除居中属性 */}
                                    <Row gutter={[24, 24]}>
                                        {category.ids.map(id => {
                                            const item = getArticleById(id);
                                            if (!item) return null;

                                            // --- 逻辑控制：只在 'overview' 显示红点 (driving_tech 移除) ---
                                            const showUnread = item.id === 'overview';

                                            return (
                                                <Col {...colProps} key={item.id}>
                                                    <div
                                                        className="wiki-card"
                                                        onClick={() => openArticle(item)}
                                                        style={{
                                                            height: cardHeight,
                                                            borderRadius: 16,
                                                            position: 'relative',
                                                            cursor: 'pointer',
                                                            overflow: 'hidden', // 恢复隐藏溢出
                                                            border: '1px solid #333',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {/* 未读红点提示 (放大版) */}
                                                        {showUnread && <UnreadBadge />}

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
                                                            {/* 图标/SVG 渲染逻辑 */}
                                                            {item.id === 'c1_loop' ? (
                                                                <img src={c1Map} alt="C1 Map" className="map-icon" style={{ width: 60, height: 60, opacity: 0.8, marginBottom: 15, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))', objectFit: 'contain' }} />
                                                            ) : item.id === 'new_loop' ? (
                                                                <img src={newCircularMap} alt="New Circular Map" className="map-icon" style={{ width: 60, height: 60, opacity: 0.8, marginBottom: 15, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))', objectFit: 'contain' }} />
                                                            ) : (
                                                                <svg width="60" height="60" viewBox="0 0 150 150" className="map-icon" style={{ fill: 'none', stroke: '#fff', strokeWidth: 4, opacity: 0.8, marginBottom: 15, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>
                                                                    <path d={MAP_SVG_PATH} />
                                                                </svg>
                                                            )}

                                                            <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 4, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>{item.title}</Text>
                                                            </div>
                                                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, textTransform: 'uppercase' }}>{item.subtitle}</Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </div>
                            );
                        })}
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
                                        <Tag key={tag} color="cyan" type="solid" style={{ borderRadius: 4 }}>{tag}</Tag>
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

            {/* --- 全局 CSS --- */}
            <style>{`
                /* 分隔线样式 */
                .section-divider {
                    display: flex;
                    align-items: center;
                    margin: 40px 0 24px 0;
                    opacity: 0.8;
                }
                .section-divider .line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #444, transparent);
                }
                .section-divider .content {
                    margin: 0 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #aaa;
                    font-family: 'PingFang SC', sans-serif;
                }
                .section-divider .dot {
                    color: ${THEME_ACCENT};
                    font-size: 12px;
                    text-shadow: 0 0 5px ${THEME_ACCENT};
                }
                .section-divider .zh {
                    font-size: 16px;
                    font-weight: 500;
                    color: #fff;
                    letter-spacing: 1px;
                }
                .section-divider .en {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-top: 2px;
                }

                /* 未读红点与波纹动画 (放大版) */
                .unread-indicator {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 36px;  /* 20px -> 36px */
                    height: 36px; /* 20px -> 36px */
                    z-index: 10;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .unread-indicator .red-dot {
                    width: 12px;  /* 6px -> 12px */
                    height: 12px; /* 6px -> 12px */
                    background-color: #ff4d4f;
                    border-radius: 50%;
                    z-index: 2;
                    box-shadow: 0 0 8px #ff4d4f; /* 增强发光 */
                }
                .unread-indicator .white-ripple {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    opacity: 0;
                    animation: ripple 2s infinite ease-out;
                }
                @keyframes ripple {
                    0% {
                        transform: scale(0.2);
                        opacity: 0.8;
                        border-width: 2px;
                    }
                    50% {
                        opacity: 0.4;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                        border-width: 0px;
                    }
                }

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
                    filter: drop-shadow(0 0 8px ${THEME_ACCENT}) brightness(1.2);
                }
                .wiki-card:hover .map-icon svg {
                    stroke: ${THEME_ACCENT} !important;
                }

                /* 简单的进场动画 */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                .animate-slide-up { animation: slideUp 0.4s ease-out; }

                /* Markdown 样式适配 */
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
