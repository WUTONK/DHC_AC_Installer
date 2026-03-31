import React from 'react';
import { Button, Typography, Steps, Card, Banner, Checkbox, List, Progress } from '@douyinfe/semi-ui';
import { IconArrowRight, IconSave, IconRefresh } from '@douyinfe/semi-icons';
import { GAME_PATH } from './constants';

const { Title, Text } = Typography;

interface CleanInstallWizardProps {
    wizardStep: number;
    setWizardStep: (step: number) => void;
    backupItems: string[];
    setBackupItems: (items: string[]) => void;
    isBackingUp: boolean;
    backupProgress: number;
    startBackup: () => void;
    restoreBackup: () => void;
    setMode: (mode: 'normal' | 'clean_install') => void;
}

export default function CleanInstallWizard({
    wizardStep, setWizardStep, backupItems, setBackupItems,
    isBackingUp, backupProgress, startBackup, restoreBackup, setMode
}: CleanInstallWizardProps): React.JSX.Element {
    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: 30 }}>
                <Button
                    icon={<IconArrowRight style={{transform: 'rotate(180deg)'}}/>}
                    onClick={() => setMode('normal')}
                    theme="borderless"
                    style={{color:'#999', marginBottom: 10}}
                >
                    返回常规模式
                </Button>
                <Title heading={3} style={{ color: 'var(--semi-color-text-0)' }}>纯净重装向导</Title>
                <Steps current={wizardStep} style={{ marginTop: 20 }}>
                    <Steps.Step title="资源备份" description="保存重要资产" />
                    <Steps.Step title="清理游戏" description="卸载并重装" />
                    <Steps.Step title="恢复环境" description="还原备份" />
                </Steps>
            </div>
            <Card style={{ borderRadius: 12 }}>
                {wizardStep === 0 && (
                    <>
                        <Title heading={5}>1. 选择要备份的内容</Title>
                        <Banner
                            type="warning"
                            style={{ margin: '16px 0', borderRadius: 8 }}
                            description={
                                <div>
                                    注意：除了以下勾选的内容，<strong>所有其他 MOD、配置、截图和回放都将被清空</strong>。请确保您知晓此操作的后果。
                                </div>
                            }
                        />
                        <div style={{ backgroundColor: 'var(--semi-color-fill-0)', padding: 16, borderRadius: 8 }}>
                            <Checkbox.Group value={backupItems} onChange={(values) => setBackupItems(values as string[])} style={{ width: '100%' }}>
                                <List>
                                    <List.Item
                                        style={{ padding: 10, borderBottom: '1px solid var(--semi-color-border)' }}
                                        header={<Checkbox value="cars">车辆 (content/cars)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留所有已安装的第三方车辆模组</Text>}
                                    />
                                    <List.Item
                                        style={{ padding: 10, borderBottom: '1px solid var(--semi-color-border)' }}
                                        header={<Checkbox value="tracks">赛道 (content/tracks)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留所有已安装的第三方地图/赛道</Text>}
                                    />
                                    <List.Item
                                        style={{ padding: 10 }}
                                        header={<Checkbox value="dashes">仪表盘 (apps/python)</Checkbox>}
                                        main={<Text type="tertiary" style={{ fontSize:12, marginLeft: 24 }}>保留 SimHub 或其他仪表盘插件配置</Text>}
                                    />
                                </List>
                            </Checkbox.Group>
                        </div>
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            {isBackingUp ? (
                                <div>
                                    <Text type="tertiary">正在备份资源到临时目录...</Text>
                                    <Progress percent={backupProgress} style={{marginTop: 8}} stroke="#6bc786" />
                                </div>
                            ) : (
                                <Button
                                    theme="solid"
                                    icon={<IconSave />}
                                    style={{ backgroundColor: '#6bc786', color: '#fff' }}
                                    onClick={startBackup}
                                >
                                    开始备份
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {wizardStep === 1 && (
                    <>
                        <Title heading={5}>2. 彻底清理游戏文件</Title>
                        <div style={{ color: 'var(--semi-color-text-1)', margin: '20px 0', lineHeight: 1.8 }}>
                            <p>备份已完成。为了解决光影崩溃问题，请严格按照以下步骤操作：</p>
                            <ol style={{ paddingLeft: 20 }}>
                                <li>打开 Steam，右键 Assetto Corsa -&gt; 管理 -&gt; <strong>卸载</strong>。</li>
                                <li>打开文件夹：<Text code>{GAME_PATH}</Text></li>
                                <li><strong>手动删除</strong>该目录下剩余的所有文件（非常重要，Steam 卸载不干净）。</li>
                                <li>回到 Steam，点击<strong>安装</strong>，等待下载完成。</li>
                            </ol>
                        </div>
                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <Button theme="solid" type="primary" onClick={() => setWizardStep(2)}>
                                我已完成重装，下一步
                            </Button>
                        </div>
                    </>
                )}

                {wizardStep === 2 && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <IconRefresh size="extra-large" style={{ color: '#6bc786', marginBottom: 20 }} />
                        <Title heading={5}>3. 恢复备份与环境</Title>
                        <p style={{ color: 'var(--semi-color-text-1)', marginBottom: 20 }}>
                            我们将把刚才备份的车辆和赛道还原到新安装的游戏中。
                        </p>
                        {isBackingUp ? (
                             <Progress percent={66} stroke="#6bc786" aria-label="restoring" />
                        ) : (
                            <Button
                                theme="solid"
                                size="large"
                                style={{ backgroundColor: '#6bc786', color: '#fff' }}
                                onClick={restoreBackup}
                            >
                                恢复备份并进入安装页面
                            </Button>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}
