import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, Card, Row, Col, Progress, Select, Banner, Tag, Slider, InputNumber } from '@douyinfe/semi-ui';
import {
    IconBolt, IconSetting, IconServer, IconArticle,
    IconInfoCircle, IconYoutube, IconPlay,
    IconAlertTriangle
} from '@douyinfe/semi-icons';
import { useDevMode } from './contexts/DevModeContext';

const { Title, Text, Paragraph } = Typography;

// =================================================================
// 模拟后端数据与逻辑 (对应 Go 代码 dirSet.go)
// =================================================================

// 模拟磁盘数据 (对应 Go: driveInfo)
interface DriveInfo {
    label: string;
    name: string;
    freeBytes: number;
    totalBytes: number;
    isSSD: boolean;
    isRemovable: boolean;
}

// 默认磁盘信息（动态版本在组件内通过 DevMode 调整）

// 阈值常量 (对应 Go const)
const MB = 1024 * 1024;
const GB = 1024 * MB;
const MAX_PACKAGE_SIZE_MB = 5000; // 5GB
const MAX_PACKAGE_DECOMPRESSED_SIZE_MB = 10000; // 10GB
const MIN_PACKAGE_SIZE_MB = 1000; // 1GB
const MIN_PACKAGE_DECOMPRESSED_SIZE_MB = 2000; // 2GB
const ONE_GB_IN_MB = 1024;
const RECOMMEND_CHANGE_GAME_DIR_THRESHOLD_MB = MAX_PACKAGE_DECOMPRESSED_SIZE_MB + 5 * ONE_GB_IN_MB;

// 获取包体积需求 (对应 Go: getPackageSizeRequirements)
const getPackageSizeRequirements = (): { resourceDirRecommendedMB: number; cacheDirRecommendedMB: number; resourceDirMinMB: number; cacheDirMinMB: number } => {
    const resourceDirRecommendedMB = MAX_PACKAGE_SIZE_MB + ONE_GB_IN_MB;
    const cacheDirRecommendedMB = MAX_PACKAGE_DECOMPRESSED_SIZE_MB + ONE_GB_IN_MB;
    const resourceDirMinMB = MIN_PACKAGE_SIZE_MB + ONE_GB_IN_MB;
    const cacheDirMinMB = MIN_PACKAGE_DECOMPRESSED_SIZE_MB + ONE_GB_IN_MB;
    return { resourceDirRecommendedMB, cacheDirRecommendedMB, resourceDirMinMB, cacheDirMinMB };
};

// 按照优先级对盘符进行排序 (对应 Go: sortDrivesByPriority)
const sortDrivesByPriority = (drives: DriveInfo[]): DriveInfo[] => {
    return [...drives].sort((a: DriveInfo, b: DriveInfo): number => {
        // 优先级1: SSD > HDD
        if (a.isSSD !== b.isSSD) {
            return a.isSSD ? -1 : 1;
        }
        // 优先级2: 固定设备 > 可拔插设备
        if (a.isRemovable !== b.isRemovable) {
            return a.isRemovable ? 1 : -1;
        }
        // 优先级3: 剩余空间大小（从大到小）
        return b.freeBytes - a.freeBytes;
    });
};

// 模拟 AutoSetResouceDirLocal 逻辑
const autoSetResourceDirLocal = (drives: DriveInfo[], gamePathDrive: string): {
    recommendedResourceDrive: string;
    recommendedCacheDrive: string;
    recommendChangeGameDir: boolean;
    gameDriveSpaceMB: number;
} => {
    const { resourceDirRecommendedMB, cacheDirRecommendedMB, resourceDirMinMB, cacheDirMinMB } = getPackageSizeRequirements();

    // 检测游戏盘符空间
    const gameDrive = drives.find(d => d.label === gamePathDrive);
    const gameDriveSpaceMB = gameDrive ? Math.floor(gameDrive.freeBytes / MB) : 0;
    const recommendChangeGameDir = gameDriveSpaceMB < RECOMMEND_CHANGE_GAME_DIR_THRESHOLD_MB;

    // 构建所有盘符空间映射
    const allDriveSpace = new Map<string, number>();
    drives.forEach(d => {
        allDriveSpace.set(d.label, Math.floor(d.freeBytes / MB));
    });

    // 检测是否有盘符同时塞得下这两个
    const totalRequiredMB = resourceDirRecommendedMB + cacheDirRecommendedMB;
    const drivesCanFitBoth = drives.filter(d => Math.floor(d.freeBytes / MB) >= totalRequiredMB);

    let recommendedResourceDrive = '';
    let recommendedCacheDrive = '';

    if (drivesCanFitBoth.length > 0) {
        // 有盘符可以同时容纳，按照优先级排序
        const sorted = sortDrivesByPriority(drivesCanFitBoth);
        recommendedResourceDrive = sorted[0].label;
        recommendedCacheDrive = sorted[0].label;
    } else {
        // 没有盘符可以同时容纳，分别查找
        const drivesCanFitResource = drives.filter(d => Math.floor(d.freeBytes / MB) >= resourceDirRecommendedMB);
        const drivesCanFitCache = drives.filter(d => Math.floor(d.freeBytes / MB) >= cacheDirRecommendedMB);

        // 选择资源文件夹盘符：优先选择非游戏盘符
        if (drivesCanFitResource.length > 0) {
            const nonGameDrives = drivesCanFitResource.filter(d => d.label !== gamePathDrive);
            if (nonGameDrives.length > 0) {
                const sorted = sortDrivesByPriority(nonGameDrives);
                recommendedResourceDrive = sorted[0].label;
            } else {
                recommendedResourceDrive = gamePathDrive;
            }
        }

        // 选择缓存文件夹盘符：优先选择与资源文件夹不同的盘符
        if (drivesCanFitCache.length > 0) {
            const differentDrives = drivesCanFitCache.filter(d => d.label !== recommendedResourceDrive);
            if (differentDrives.length > 0) {
                const sorted = sortDrivesByPriority(differentDrives);
                recommendedCacheDrive = sorted[0].label;
            } else {
                recommendedCacheDrive = recommendedResourceDrive;
            }
        }
    }

    // 如果仍然没有找到合适的盘符，使用最小空间要求再次尝试
    if (!recommendedResourceDrive) {
        const drivesWithMinSpace = drives.filter(d => Math.floor(d.freeBytes / MB) >= resourceDirMinMB);
        if (drivesWithMinSpace.length > 0) {
            const sorted = sortDrivesByPriority(drivesWithMinSpace);
            recommendedResourceDrive = sorted[0].label;
        }
    }

    if (!recommendedCacheDrive) {
        const drivesWithMinSpace = drives.filter(d => Math.floor(d.freeBytes / MB) >= cacheDirMinMB);
        const differentDrives = drivesWithMinSpace.filter(d => d.label !== recommendedResourceDrive);
        if (differentDrives.length > 0) {
            const sorted = sortDrivesByPriority(differentDrives);
            recommendedCacheDrive = sorted[0].label;
        } else {
            const sameDrive = drivesWithMinSpace.find(d => d.label === recommendedResourceDrive);
            if (sameDrive) {
                recommendedCacheDrive = sameDrive.label;
            }
        }
    }

    return {
        recommendedResourceDrive,
        recommendedCacheDrive,
        recommendChangeGameDir,
        gameDriveSpaceMB
    };
};

interface WelcomePageProps {
    region: 'zhCN' | 'enUS';
    onNavigate?: (page: string) => void;
}

export default function WelcomePage({ region, onNavigate }: WelcomePageProps): React.JSX.Element {
    // --- 状态管理 ---
    const [config, setConfig] = useState<{
        resourceDrive: string;
        cacheDrive: string;
    }>({
        resourceDrive: '',
        cacheDrive: ''
    });
    const [gamePathStatus, setGamePathStatus] = useState<{ path: string; isLowSpace: boolean }>({
        path: 'D:\\Steam\\...\\assettocorsa',
        isLowSpace: false
    });

    const { registerDevOption, unregisterDevOption } = useDevMode();

    // [开发者模式] 磁盘空间调整（GB）- 分别控制三个磁盘
    const [devDiskC_FreeGB, setDevDiskC_FreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskC_FreeGB');
        return saved !== null ? Number(saved) : 50; // 默认 50GB
    });
    const [devDiskD_FreeGB, setDevDiskD_FreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskD_FreeGB');
        return saved !== null ? Number(saved) : 400; // 默认 400GB
    });
    const [devDiskE_FreeGB, setDevDiskE_FreeGB] = useState<number>(() => {
        const saved = localStorage.getItem('devDiskE_FreeGB');
        return saved !== null ? Number(saved) : 100; // 默认 100GB
    });

    // 持久化磁盘空间设置
    useEffect(() => {
        localStorage.setItem('devDiskC_FreeGB', String(devDiskC_FreeGB));
    }, [devDiskC_FreeGB]);
    useEffect(() => {
        localStorage.setItem('devDiskD_FreeGB', String(devDiskD_FreeGB));
    }, [devDiskD_FreeGB]);
    useEffect(() => {
        localStorage.setItem('devDiskE_FreeGB', String(devDiskE_FreeGB));
    }, [devDiskE_FreeGB]);

    // 动态生成磁盘信息
    const DRIVE_INFO: DriveInfo[] = useMemo(() => [
        { label: 'C:', name: '系统盘', freeBytes: devDiskC_FreeGB * GB, totalBytes: 500 * GB, isSSD: true, isRemovable: false },
        { label: 'D:', name: '游戏盘', freeBytes: devDiskD_FreeGB * GB, totalBytes: 1000 * GB, isSSD: true, isRemovable: false },
        { label: 'E:', name: '仓库盘', freeBytes: devDiskE_FreeGB * GB, totalBytes: 2000 * GB, isSSD: false, isRemovable: false },
    ], [devDiskC_FreeGB, devDiskD_FreeGB, devDiskE_FreeGB]);

    // 注册开发者选项
    useEffect(() => {
        registerDevOption({
            id: 'welcome-page-disk-space',
            label: '模拟磁盘可用空间（Home 页）',
            component: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* C 盘 */}
                    <div>
                        <span style={{ color: '#ccc', fontSize: 12, marginBottom: 4, display: 'block' }}>C: 系统盘</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Slider
                                value={devDiskC_FreeGB}
                                onChange={(value) => setDevDiskC_FreeGB(value as number)}
                                min={0}
                                max={500}
                                step={1}
                                style={{ flex: 1 }}
                            />
                            <InputNumber
                                value={devDiskC_FreeGB}
                                onChange={(value) => setDevDiskC_FreeGB(value as number)}
                                min={0}
                                max={500}
                                suffix="GB"
                                style={{ width: 90 }}
                                size="small"
                            />
                        </div>
                    </div>
                    {/* D 盘 */}
                    <div>
                        <span style={{ color: '#ccc', fontSize: 12, marginBottom: 4, display: 'block' }}>D: 游戏盘</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Slider
                                value={devDiskD_FreeGB}
                                onChange={(value) => setDevDiskD_FreeGB(value as number)}
                                min={0}
                                max={1000}
                                step={1}
                                style={{ flex: 1 }}
                            />
                            <InputNumber
                                value={devDiskD_FreeGB}
                                onChange={(value) => setDevDiskD_FreeGB(value as number)}
                                min={0}
                                max={1000}
                                suffix="GB"
                                style={{ width: 90 }}
                                size="small"
                            />
                        </div>
                    </div>
                    {/* E 盘 */}
                    <div>
                        <span style={{ color: '#ccc', fontSize: 12, marginBottom: 4, display: 'block' }}>E: 仓库盘</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Slider
                                value={devDiskE_FreeGB}
                                onChange={(value) => setDevDiskE_FreeGB(value as number)}
                                min={0}
                                max={2000}
                                step={1}
                                style={{ flex: 1 }}
                            />
                            <InputNumber
                                value={devDiskE_FreeGB}
                                onChange={(value) => setDevDiskE_FreeGB(value as number)}
                                min={0}
                                max={2000}
                                suffix="GB"
                                style={{ width: 90 }}
                                size="small"
                            />
                        </div>
                    </div>
                    {/* 快捷预设按钮 */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        <Button size="small" onClick={() => { setDevDiskC_FreeGB(5); setDevDiskD_FreeGB(8); setDevDiskE_FreeGB(3); }} style={{ fontSize: 11 }}>
                            全部空间不足
                        </Button>
                        <Button size="small" onClick={() => { setDevDiskC_FreeGB(50); setDevDiskD_FreeGB(400); setDevDiskE_FreeGB(100); }} style={{ fontSize: 11 }}>
                            恢复默认
                        </Button>
                    </div>
                </div>
            ),
            order: 1
        });

        return () => {
            unregisterDevOption('welcome-page-disk-space');
        };
    }, [registerDevOption, unregisterDevOption, devDiskC_FreeGB, devDiskD_FreeGB, devDiskE_FreeGB]);

    // --- 模拟后端 AutoSetResouceDirLocal 的逻辑 ---
    useEffect(() => {
        // 模拟游戏路径
        const gamePathDrive = 'C:';

        // 执行自动推荐逻辑 (使用动态的 DRIVE_INFO)
        const result = autoSetResourceDirLocal(DRIVE_INFO, gamePathDrive);

        // 设置推荐配置
        setConfig({
            resourceDrive: result.recommendedResourceDrive,
            cacheDrive: result.recommendedCacheDrive
        });

        // 设置游戏路径状态
        setGamePathStatus({
            path: `${gamePathDrive}\\Steam\\...\\assettocorsa`,
            isLowSpace: result.recommendChangeGameDir
        });
    }, [DRIVE_INFO]);

    // 格式化函数
    const formatSize = (bytes: number): string => (bytes / GB).toFixed(1) + ' GB';

    // --- 样式常量 ---
    const THEME_BG = '#16161a';
    const THEME_CARD = '#232326';
    const THEME_GREEN = '#6bc786';

    // 地区相关文本
    const isCN = region === 'zhCN';
    const texts = {
        heroTitle: isCN ? '一键式智能安装' : 'One-Click Install',
        heroDesc: isCN
            ? '自动检测游戏环境，智能配置 CSP、Sol、Pure 及首都高地图。无需繁琐操作。'
            : 'Automatically detect environment and install CSP, Sol, Pure and SRP maps.',
        startButton: isCN ? '立即开始' : 'Start Now',
        recommended: isCN ? '新手推荐' : 'Recommended',
        moreFeatures: isCN ? '更多功能' : 'Features',
        customInstall: isCN ? '自定义安装' : 'Custom Install',
        customInstallDesc: isCN ? '手动选择特定模组' : 'Manually select specific mods',
        serverRecommend: isCN ? '服务器推荐' : 'Server Recommendations',
        serverRecommendDesc: isCN ? '精选联机服务器' : 'Curated multiplayer servers',
        shutokoWiki: isCN ? '首都高百科' : 'Shutoko Wiki',
        shutokoWikiDesc: isCN ? '赛道攻略与技巧' : 'Track guides and tips',
        systemSettings: isCN ? '系统设置' : 'System Settings',
        systemSettingsDesc: isCN ? '语言、存储路径与日志' : 'Language, storage path & logs',
        aboutUs: isCN ? '关于我们' : 'About Us',
        aboutUsDesc: isCN ? '赞助与开发日志' : 'Sponsors and dev logs',
        tutorial: isCN ? '新手必看' : 'Tutorial',
        tutorialTitle: isCN ? '本安装器视频教程' : 'Shutoko Install Guide 2024',
        tutorialAuthor: isCN ? 'Bilibili @东濠涌车队' : 'YouTube @ShutokoRevival',
        watchNow: isCN ? '点击观看' : 'Watch Now',
        environmentConfig: isCN ? '环境自检与配置' : 'Environment & Config',
        currentDiskStatus: isCN ? '当前磁盘状态' : 'Current Disk Status',
        librarySettings: isCN ? '资源库设置 (自动推荐)' : 'Library Settings (Auto)',
        resourcePath: isCN ? '资源下载位置 (Package Path)' : 'Resource Download Path (Package Path)',
        resourcePathDesc: isCN ? '用于存放下载的压缩包 (推荐 >5GB 空间)' : 'For storing downloaded packages (Recommended >5GB)',
        cachePath: isCN ? '缓存解压位置 (Cache Path)' : 'Cache Decompression Path (Cache Path)',
        cachePathDesc: isCN ? '用于临时解压文件，安装后会自动清理 (推荐 >10GB 空间)' : 'For temporary decompression, auto-cleaned after install (Recommended >10GB)',
        gameDirWarning: isCN ? '游戏所在磁盘空间不足，建议迁移游戏或清理空间。' : 'Game disk space is low, consider migrating game or cleaning space.',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1example',
        youtubeUrl: 'https://www.youtube.com/watch?v=example'
    };

    // --- 渲染辅助 ---
    const renderVideoCard = (): React.JSX.Element => {
        const videoUrl = isCN ? texts.bilibiliUrl : texts.youtubeUrl;
        return (
            <div
                onClick={() => window.open(videoUrl, '_blank')}
                style={{ cursor: 'pointer', height: '100%' }}
            >
            <Card
                style={{
                    height: '100%',
                    backgroundColor: isCN ? '#fb7299' : '#ff0000',
                    borderRadius: 12,
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
            >
                {/* 装饰背景 */}
                <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.2, transform: 'rotate(-20deg)' }}>
                    {isCN ? <IconPlay size="extra-large" style={{fontSize: 100, color: 'white'}} /> : <IconYoutube style={{fontSize: 100, color: 'white'}} />}
                </div>

                <div>
                    <Tag style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: 10 }}>
                        {texts.tutorial}
                    </Tag>
                    <Title heading={4} style={{ color: '#fff' }}>
                        {texts.tutorialTitle}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8, display: 'block' }}>
                        {texts.tutorialAuthor}
                    </Text>
                </div>

                <Button theme="solid" type="tertiary" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: isCN ? '#fb7299' : '#ff0000', fontWeight: 'bold' }}>
                    {texts.watchNow}
                </Button>
            </Card>
            </div>
        );
    };

    return (
        <div style={{ height: '100%', background: THEME_BG, color: 'white', padding: '40px', overflowY: 'auto' }}>

            {/* Hero 区域：一键安装 + 视频入口 */}
            <div style={{ marginBottom: 30 }}>
                <Row gutter={20}>
                    <Col span={16}>
                        {/* 一键安装大卡片 */}
                        <div
                            style={{
                                height: 240,
                                background: `linear-gradient(135deg, ${THEME_GREEN} 0%, #3d9e5a 100%)`,
                                borderRadius: 16,
                                padding: 40,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(107, 199, 134, 0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                transition: 'transform 0.3s ease'
                            }}
                            className="hero-card"
                            onClick={() => onNavigate && onNavigate('OneClickInstaller')}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* 装饰背景图标 */}
                            <IconBolt style={{ position: 'absolute', right: -20, bottom: -40, fontSize: 200, color: 'rgba(255,255,255,0.15)', transform: 'rotate(-15deg)' }} />

                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <Tag style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: 16, border: 'none' }}>
                                    {texts.recommended}
                                </Tag>
                                <Title heading={1} style={{ color: '#fff', fontSize: 36, marginBottom: 8 }}>
                                    {texts.heroTitle}
                                </Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, maxWidth: 500 }}>
                                    {texts.heroDesc}
                                </Paragraph>
                                <Button
                                    size="large"
                                    theme="solid"
                                    style={{ marginTop: 24, backgroundColor: 'white', color: '#2a7e43', fontWeight: 'bold', borderRadius: 8, padding: '12px 32px', height: 'auto' }}
                                    icon={<IconBolt />}
                                >
                                    {texts.startButton}
                                </Button>
                            </div>
                        </div>
                    </Col>
                    <Col span={8}>
                        {/* 视频教程入口 */}
                        {renderVideoCard()}
                    </Col>
                </Row>
            </div>

            {/* 次级入口：网格导航 */}
            <div style={{ marginBottom: 40 }}>
                <Title heading={5} style={{ color: '#fff', marginBottom: 16 }}>
                    {texts.moreFeatures}
                </Title>
                <Row gutter={[16, 16]}>
                    {[
                        {
                            title: texts.customInstall,
                            icon: <IconSetting />,
                            desc: texts.customInstallDesc,
                            color: '#4facfe',
                            page: 'CustomInstallWizard'
                        },
                        {
                            title: texts.serverRecommend,
                            icon: <IconServer />,
                            desc: texts.serverRecommendDesc,
                            color: '#a06cd5',
                            page: 'NetDemo'
                        },
                        {
                            title: texts.shutokoWiki,
                            icon: <IconArticle />,
                            desc: texts.shutokoWikiDesc,
                            color: '#ff9f43',
                            page: 'ShutokoWiki'
                        },
                        {
                            title: texts.systemSettings,
                            icon: <IconSetting />,
                            desc: texts.systemSettingsDesc,
                            color: '#00b5ad',
                            page: 'SettingsPage'
                        },
                        {
                            title: texts.aboutUs,
                            icon: <IconInfoCircle />,
                            desc: texts.aboutUsDesc,
                            color: '#888',
                            page: 'AboutPage'
                        },
                    ].map((item, idx) => (
                        <Col span={6} key={idx}>
                            <div
                                onClick={() => onNavigate && onNavigate(item.page)}
                                onMouseEnter={(e) => {
                                    const card = e.currentTarget.querySelector('.nav-card') as HTMLElement;
                                    if (card) {
                                        card.style.backgroundColor = '#2a2a2e';
                                        card.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const card = e.currentTarget.querySelector('.nav-card') as HTMLElement;
                                    if (card) {
                                        card.style.backgroundColor = THEME_CARD;
                                        card.style.transform = 'translateY(0)';
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                            <Card
                                style={{
                                    backgroundColor: THEME_CARD,
                                    border: 'none',
                                    borderRadius: 12,
                                    transition: 'all 0.2s'
                                }}
                                bodyStyle={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}
                                className="nav-card"
                            >
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {React.cloneElement(item.icon, { style: { fontSize: 24, color: item.color } })}
                                </div>
                                <div>
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, display: 'block' }}>{item.title}</Text>
                                    <Text style={{ color: '#666', fontSize: 12 }}>{item.desc}</Text>
                                </div>
                            </Card>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* 底部面板：环境配置与磁盘检测 (Go 后端逻辑可视化) */}
            <div style={{ backgroundColor: THEME_CARD, borderRadius: 16, padding: 24, border: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <IconServer style={{ color: THEME_GREEN }} size="large" />
                    <Title heading={4} style={{ color: '#fff', margin: 0 }}>
                        {texts.environmentConfig}
                    </Title>
                </div>

                <Row gutter={40}>
                    {/* 左侧：磁盘用量概览 */}
                    <Col span={10} style={{ borderRight: '1px solid #333', paddingRight: 40 }}>
                        <div style={{ marginBottom: 16 }}>
                            <Text style={{ color: '#ccc', marginBottom: 12, display: 'block' }}>{texts.currentDiskStatus}</Text>
                            {DRIVE_INFO.map(drive => {
                                const percent = ((drive.totalBytes - drive.freeBytes) / drive.totalBytes) * 100;
                                const isRecommendedDrive = drive.label === config.resourceDrive || drive.label === config.cacheDrive;

                                return (
                                    <div key={drive.label} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span>
                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{drive.label}</Text>
                                                <Text style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{drive.name}</Text>
                                                {drive.isSSD && <Tag size="small" style={{marginLeft: 8, backgroundColor: '#333', color: '#ccc'}}>SSD</Tag>}
                                                {isRecommendedDrive && <Tag size="small" color="green" style={{marginLeft: 8}}>{isCN ? '推荐' : 'Recommended'}</Tag>}
                                            </span>
                                            <Text style={{ color: '#666', fontSize: 12 }}>
                                                {isCN ? '剩余' : 'Free'} {formatSize(drive.freeBytes)}
                                            </Text>
                                        </div>
                                        <Progress
                                            percent={Math.floor(percent)}
                                            stroke={isRecommendedDrive ? THEME_GREEN : '#555'}
                                            style={{ height: 6 }}
                                            showInfo={false}
                                        />
                                    </div>
                                )
                            })}
                        </div>

                        {/* 游戏目录警告 (对应 recommendChangeGameDir) */}
                        {gamePathStatus.isLowSpace && (
                            <Banner
                                type="warning"
                                bordered
                                icon={<IconAlertTriangle />}
                                description={
                                    <div style={{ fontSize: 12 }}>
                                        <IconInfoCircle style={{ marginRight: 4 }} />
                                        {texts.gameDirWarning}
                                    </div>
                                }
                                style={{ backgroundColor: 'rgba(255, 159, 67, 0.1)', borderColor: '#ff9f43', padding: 8 }}
                            />
                        )}
                    </Col>

                    {/* 右侧：资源路径设置 (Go AutoSetResouceDirLocal) */}
                    <Col span={14}>
                        <Text style={{ color: '#ccc', marginBottom: 20, display: 'block' }}>
                            {texts.librarySettings}
                        </Text>

                        {/* 资源下载位置 */}
                        <div style={{ marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8, display: 'block' }}>
                                {texts.resourcePath}
                            </Text>
                            <Select
                                style={{ width: '100%', backgroundColor: '#111' }}
                                value={config.resourceDrive}
                                onChange={(v) => setConfig({...config, resourceDrive: v as string})}
                                renderSelectedItem={(n) => <span style={{color: 'white'}}>{n.label}</span>}
                            >
                                {DRIVE_INFO.map(d => {
                                    const spaceMB = Math.floor(d.freeBytes / MB);
                                    const { resourceDirRecommendedMB } = getPackageSizeRequirements();
                                    const hasEnoughSpace = spaceMB >= resourceDirRecommendedMB;

                                    return (
                                        <Select.Option value={d.label} key={d.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <span>{d.label} ({d.name})</span>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {d.isSSD && hasEnoughSpace && <Tag color="green" size="small">{isCN ? '推荐 (SSD)' : 'Recommended (SSD)'}</Tag>}
                                                    {!hasEnoughSpace && <Tag color="orange" size="small">{isCN ? '空间不足' : 'Low Space'}</Tag>}
                                                </div>
                                            </div>
                                        </Select.Option>
                                    );
                                })}
                            </Select>
                            <Text style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
                                {texts.resourcePathDesc}
                            </Text>
                        </div>

                        {/* 缓存解压位置 */}
                        <div>
                            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8, display: 'block' }}>
                                {texts.cachePath}
                            </Text>
                            <Select
                                style={{ width: '100%', backgroundColor: '#111' }}
                                value={config.cacheDrive}
                                onChange={(v) => setConfig({...config, cacheDrive: v as string})}
                                renderSelectedItem={(n) => <span style={{color: 'white'}}>{n.label}</span>}
                            >
                                {DRIVE_INFO.map(d => {
                                    const spaceMB = Math.floor(d.freeBytes / MB);
                                    const { cacheDirRecommendedMB } = getPackageSizeRequirements();
                                    const hasEnoughSpace = spaceMB >= cacheDirRecommendedMB;

                                    return (
                                        <Select.Option value={d.label} key={d.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <span>{d.label} ({d.name})</span>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {hasEnoughSpace && <Tag color="blue" size="small">{isCN ? '空间充足' : 'Sufficient Space'}</Tag>}
                                                    {!hasEnoughSpace && <Tag color="orange" size="small">{isCN ? '空间不足' : 'Low Space'}</Tag>}
                                                </div>
                                            </div>
                                        </Select.Option>
                                    );
                                })}
                            </Select>
                            <Text style={{ color: '#666', fontSize: 12, marginTop: 4, display: 'block' }}>
                                {texts.cachePathDesc}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </div>

        </div>
    );
}

