import React from 'react';
import { Card, Button, Typography, Tag } from '@douyinfe/semi-ui';
import { IconYoutube, IconPlay } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

export type PlatformType = 'bilibili' | 'youtube';

interface TutorialCardProps {
    platform: PlatformType;
    title: string;
    author: string;
    url: string;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ platform, title, author, url }) => {
    const isBilibili = platform === 'bilibili';
    const bgColor = isBilibili ? '#fb7299' : '#ff0000';
    const Icon = isBilibili ? IconPlay : IconYoutube;

    return (
        <div
            onClick={() => window.open(url, '_blank')}
            style={{ cursor: 'pointer', width: '100%' }}
        >
            <Card
                style={{
                    backgroundColor: bgColor,
                    borderRadius: 12,
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    height: 180
                }}
                bodyStyle={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between'
                }}
            >
                {/* Decorative Background Icon */}
                <div style={{
                    position: 'absolute',
                    right: -20,
                    bottom: -20,
                    opacity: 0.2,
                    transform: 'rotate(-20deg)'
                }}>
                    <Icon style={{ fontSize: 100, color: 'white' }} />
                </div>

                <div>
                    <Tag style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: 10 }}>
                        新手必看
                    </Tag>
                    <Title heading={4} style={{ color: '#fff', fontSize: 18 }}>
                        {title}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8, display: 'block' }}>
                        {author}
                    </Text>
                </div>

                <Button
                    theme="solid"
                    type="tertiary"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: bgColor,
                        fontWeight: 'bold',
                        width: 'fit-content'
                    }}
                >
                    点击观看
                </Button>
            </Card>
        </div>
    );
};

export default TutorialCard;
