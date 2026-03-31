import React from 'react';
import { IconDownload, IconTickCircle, IconFile } from '@douyinfe/semi-icons';
import { DiskInfo, InstallMode, RequirementConfig } from './types';

export const GAME_PATH = "D:\\SteamLibrary\\steamapps\\common\\assettocorsa";

export const DEFAULT_DISK_INFO: DiskInfo = {
    label: 'D:',
    total: 1024 * 1024 * 1024 * 1024, // 1TB
    used: 600 * 1024 * 1024 * 1024,   // 600GB Used
    free: 424 * 1024 * 1024 * 1024    // 424GB Free
};

export const INSTALL_MODES: InstallMode[] = [
    {
        id: 'minimal',
        name: '基础极速版',
        icon: <IconDownload size="extra-large" />,
        size: 5.2 * 1024 * 1024 * 1024,
        desc: '仅包含 CSP + Sol + 基础联机车包。适合硬盘空间紧张或仅需最低联机要求的玩家。',
        color: '#00b5ad'
    },
    {
        id: 'standard',
        name: '标准推荐版',
        icon: <IconTickCircle size="extra-large" />,
        size: 15.8 * 1024 * 1024 * 1024,
        desc: '包含首都高地图 + 常用车流 + 基础光影。最平衡的选择，推荐大多数玩家使用。',
        color: '#6bc786',
        recommended: true
    },
    {
        id: 'full',
        name: '豪华全享版',
        icon: <IconFile size="extra-large" />,
        size: 28.5 * 1024 * 1024 * 1024,
        desc: '包含 Pure 高级光影 + 4K 材质包 + 全套车包。体验极致画质，需要较好显卡。',
        color: '#a06cd5'
    }
];

export const EXISTING_RESOURCES = ['extension', 'content/weather/sol'];

export const REQUIREMENTS_MAP: Record<string, RequirementConfig> = {
    minimal: {
        title: '入门级配置',
        cpu: 'Intel Core i3-8100 或 AMD Ryzen 3 1200',
        gpu: 'NVIDIA GTX 1050 Ti (4GB) 或同级显卡',
        ram: '8 GB RAM',
        note: '可流畅运行联机模式，低画质。'
    },
    standard: {
        title: '推荐配置',
        cpu: 'Intel Core i5-9600K 或 AMD Ryzen 5 3600',
        gpu: 'NVIDIA GTX 1660 Super (6GB) 或 RTX 3050',
        ram: '16 GB RAM',
        note: '流畅运行首都高 + CSP 光影，中高画质。'
    },
    full: {
        title: '极致配置',
        cpu: 'Intel Core i7-10700K 或 AMD Ryzen 7 5800X',
        gpu: 'NVIDIA RTX 3070 (8GB) 或更高',
        ram: '32 GB RAM',
        note: '开启 Pure 高级光影 + 4K 材质 + 极致画质 (2K/4K分辨率)。'
    }
};

export const MD_CM_CONFIG = `# Content Manager 配置指南

1. 打开 Settings -> Content Manager。
2. 勾选 Custom Shaders Patch 并完成登录。
3. 重启游戏后测试光影是否正常。`;

export const MD_CDKEY_USAGE = `# Steam CDKey 激活教程

1. 打开 Steam 客户端左下角「添加游戏」。
2. 选择「在 Steam 上激活产品」。
3. 输入购买的 CDKey 并确认激活。`;

export const MD_TAOBAO_TUTORIAL = (
    <div>
        <p>1. 点击下方“前往淘宝购买”按钮。</p>
        <p>2. 在搜索结果中选择“Assetto Corsa Ultimate”或“神力科莎 终极版”。</p>
        <p>3. 推荐选择销量较高、价格合理的店铺（通常 15 元左右）。</p>
        <div style={{ margin: '16px 0', textAlign: 'center' }}>
            <img
                src="https://placehold.co/600x300/png?text=Taobao+Search+Example"
                alt="淘宝搜索示例"
                style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>示例：搜索结果页示意图</div>
        </div>
        <p>4. 购买后您将获得 Steam 激活码 (CDKey)。</p>
        <p>5. 拿到激活码后，请参考界面的“如何使用 CDKey?”教程进行激活。</p>
    </div>
);
