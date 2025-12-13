import React, { useState } from 'react';
import { Typography, Radio, RadioGroup } from '@douyinfe/semi-ui';
import TutorialCard, { PlatformType } from './TutorialCard';

const { Title } = Typography;

export interface VideoData {
    platform: PlatformType;
    title: string;
    author: string;
    url: string;
}

interface VideoTutorialSectionProps {
    title?: string;
    videos: VideoData[];
    defaultPlatform?: PlatformType;
}

const VideoTutorialSection: React.FC<VideoTutorialSectionProps> = ({
    title = "安装教程视频",
    videos,
    defaultPlatform
}) => {
    const initialPlatform = defaultPlatform || (videos.length > 0 ? videos[0].platform : 'bilibili');
    const [currentPlatform, setCurrentPlatform] = useState<PlatformType>(initialPlatform);

    // 如果没有视频数据，不渲染
    if (!videos || videos.length === 0) return null;

    // 查找当前选中的视频数据
    const currentVideo = videos.find(v => v.platform === currentPlatform) || videos[0];

    return (
        <div style={{ marginTop: 40, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title heading={3} style={{ color: '#fff' }}>{title}</Title>

                {/* 只有当有多个视频时才显示切换器 */}
                {videos.length > 1 && (
                    <RadioGroup
                        type="button"
                        buttonSize="middle"
                        value={currentPlatform}
                        onChange={(e) => setCurrentPlatform(e.target.value as PlatformType)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                        {videos.map(video => (
                            <Radio key={video.platform} value={video.platform}>
                                {video.platform === 'bilibili' ? 'Bilibili' : 'YouTube'}
                            </Radio>
                        ))}
                    </RadioGroup>
                )}
            </div>

            <TutorialCard
                platform={currentVideo.platform}
                title={currentVideo.title}
                author={currentVideo.author}
                url={currentVideo.url}
            />
        </div>
    );
};

export default VideoTutorialSection;
