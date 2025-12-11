import React, { useState, useMemo } from 'react';

import { Layout, Button, Row, Col, Typography, Checkbox, Space, Progress, Tag, Tooltip, Input, Switch, Empty, SideSheet, List, Avatar } from '@douyinfe/semi-ui';

import {

  IconFile, IconInfoCircle, IconSearch, IconAlertTriangle, IconTickCircle, IconList

} from '@douyinfe/semi-icons';
import BackToHomeButton from './components/BackToHomeButton';

// 定义车辆类型
interface Car {
  name: string;
  class: string;
}

// 定义车包类型
interface CarPack {
  id: number;
  name: string;
  sizeStr: string;
  sizeByte: number;
  thumbnail: string;
  isImported: boolean;
  cars: Car[];
}

// 1. 模拟数据：增加了 isImported 状态、sizeByte 和 cars 数组
const MOCK_CAR_PACKS: CarPack[] = [

  {
    id: 1,
    name: 'SRP JDM Pack Vol.1',
    sizeStr: '1.2 GB',
    sizeByte: 1288490188,
    thumbnail: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=400&q=80',
    isImported: true,
    cars: [
      { name: 'Nissan Skyline GT-R R34 V-Spec II', class: 'JDM' },
      { name: 'Toyota Supra MK4 Tuned', class: 'JDM' },
      { name: 'Mazda RX-7 Spirit R', class: 'JDM' },
      { name: 'Honda NSX-R', class: 'JDM' }
    ]
  },

  {
    id: 2,
    name: 'SRP Euro Pack',
    sizeStr: '850 MB',
    sizeByte: 891289600,
    thumbnail: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=400&q=80',
    isImported: false,
    cars: [
      { name: 'BMW M3 E92', class: 'Street' },
      { name: 'Porsche 911 GT3 RS', class: 'Track' }
    ]
  },

  {
    id: 3,
    name: 'Traffic Cars Pack',
    sizeStr: '2.1 GB',
    sizeByte: 2254857830,
    thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80',
    isImported: true,
    cars: [
      { name: 'Toyota Prius (Traffic)', class: 'AI' },
      { name: 'Toyota Crown Taxi', class: 'AI' },
      { name: 'Isuzu Elf Truck', class: 'AI' },
      { name: 'Honda Fit', class: 'AI' },
      { name: 'Nissan Vanette', class: 'AI' }
    ]
  },

  {
    id: 4,
    name: 'Shutoko Revival Project Beta',
    sizeStr: '3.4 GB',
    sizeByte: 3650722201,
    thumbnail: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=400&q=80',
    isImported: true,
    cars: [
      { name: 'Nissan Skyline GT-R R32', class: 'JDM' },
      { name: 'Toyota Chaser JZX100', class: 'JDM' },
      { name: 'Mazda RX-7 FD3S', class: 'JDM' }
    ]
  },

  {
    id: 5,
    name: 'Tatsumi PA Addon',
    sizeStr: '120 MB',
    sizeByte: 125829120,
    thumbnail: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
    isImported: false,
    cars: [
      { name: 'Tatsumi Parking Area Props', class: 'Map' }
    ]
  },

  {
    id: 6,
    name: 'C1 Loop Texture Mod',
    sizeStr: '500 MB',
    sizeByte: 524288000,
    thumbnail: 'https://images.unsplash.com/photo-1580273916550-e323be2ed5d6?auto=format&fit=crop&w=400&q=80',
    isImported: true,
    cars: [
      { name: 'C1 Loop Road Textures', class: 'Texture' },
      { name: 'C1 Loop Signage', class: 'Texture' }
    ]
  },

];

const { Header, Footer, Content } = Layout;

const { Text, Title } = Typography;

// 格式化字节大小

const formatBytes = (bytes: number): string => {

  if (bytes === 0) return '0 B';

  const k = 1024;

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];

};

export default function CarPackInstaller() {

  // 状态管理

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [searchText, setSearchText] = useState<string>('');

  const [hideMissing, setHideMissing] = useState<boolean>(false);

  const [activePack, setActivePack] = useState<CarPack | null>(null); // 当前正在查看详情的车包对象

  // 计算逻辑



  // 1. 过滤后的列表（用于渲染）

  const displayedPacks = useMemo(() => {

    return MOCK_CAR_PACKS.filter(pack => {

      const matchSearch = pack.name.toLowerCase().includes(searchText.toLowerCase());

      const matchImport = hideMissing ? pack.isImported : true;

      return matchSearch && matchImport;

    });

  }, [searchText, hideMissing]);

  // 2. 统计所有"可安装"的车包ID

  const installableIds = useMemo(() =>

    MOCK_CAR_PACKS.filter(p => p.isImported).map(p => p.id),

    []);

  // 3. 计算已选总大小

  const totalSelectedSize = useMemo(() => {

    const total = MOCK_CAR_PACKS

      .filter(p => selectedIds.includes(p.id))

      .reduce((acc, curr) => acc + curr.sizeByte, 0);

    return formatBytes(total);

  }, [selectedIds]);

  // 操作逻辑

  const toggleSelect = (id: number, isImported: boolean) => {

    if (!isImported) return; // 未导入不可选

    if (selectedIds.includes(id)) {

      setSelectedIds(selectedIds.filter(item => item !== id));

    } else {

      setSelectedIds([...selectedIds, id]);

    }

  };

  // 打开侧边栏 (阻止冒泡，防止触发选中)

  const openDetail = (e: React.MouseEvent, pack: CarPack) => {

    e.stopPropagation();

    setActivePack(pack);

  };

  // 智能全选：只选那些 isImported 为 true 的

  const handleSelectAll = () => {

    // 如果当前已经选了所有可选项，则反选清空

    // 这里的逻辑是：只要当前选中的数量等于可选项的数量，就视为"已全选"

    const allInstallableSelected = installableIds.every(id => selectedIds.includes(id));



    if (allInstallableSelected && selectedIds.length > 0) {

      setSelectedIds([]);

    } else {

      setSelectedIds(installableIds);

    }

  };

  // 样式常量

  const THEME_GREEN = '#6bc786';

  const THEME_RED = '#ff4d4f';

  const BG_DARK = '#16161a';

  const CARD_BG = '#232326';

  const CARD_DISABLED = '#1f1f22';

  return (

    <Layout style={{ height: '100%', background: BG_DARK, color: 'white', display: 'flex', flexDirection: 'column' }} className="semi-always-dark">

      <Header style={{ padding: '20px 40px', background: BG_DARK, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <BackToHomeButton variant="minimal" />
            <div style={{ display: 'flex', gap: '30px', fontSize: '12px', color: '#666', justifyContent: 'center', flex: 1 }}>

            <span>管理器安装</span>

            <span>地图安装</span>

            <span style={{ color: THEME_GREEN, borderBottom: `2px solid ${THEME_GREEN}`, paddingBottom: 4 }}>车包安装</span>

            <span>光影安装</span>
            </div>
          </div>
        </Header>

        <Content style={{ padding: '0 40px', overflowY: 'auto', position: 'relative', flex: 1, minHeight: 0 }}>

          {/* 警告 Banner */}

          <div style={{ background: '#2a2a2e', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: 10 }}>

            <IconInfoCircle style={{ color: THEME_GREEN }} />

            <Text style={{ color: '#ccc', fontSize: 13 }}>

              请先确保你有全DLC。带 <IconAlertTriangle style={{ color: THEME_RED, fontSize: 12 }} /> 标记的项目表示本地未检测到压缩包，请先前往"资源导入"页面添加。

            </Text>

          </div>

          {/* 工具栏：全选、搜索、筛选 */}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>

            <Space>

              <Button

                theme='solid'

                style={{

                  backgroundColor: (selectedIds.length > 0 && installableIds.every(id => selectedIds.includes(id))) ? THEME_GREEN : '#333',

                  color: '#fff'

                }}

                onClick={handleSelectAll}

              >

                全选可用 ({installableIds.length})

              </Button>

              <Button

                theme='solid'

                style={{ backgroundColor: selectedIds.length === 0 ? '#444' : '#333', color: '#fff' }}

                onClick={() => setSelectedIds([])}

                disabled={selectedIds.length === 0}

              >

                清空

              </Button>

            </Space>



            <Space>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 13, cursor: 'pointer' }} onClick={() => setHideMissing(!hideMissing)}>

                <Switch checked={hideMissing} size="small" />

                <span>仅显示可安装</span>

              </div>

              <Input

                prefix={<IconSearch />}

                placeholder="搜索车包..."

                style={{ width: 200, backgroundColor: '#232326' }}

                value={searchText}

                onChange={(value) => setSearchText(value)}

              />

            </Space>

          </div>

          {/* 车包网格 */}

          {displayedPacks.length === 0 ? (

            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>

              <Empty image={<IconFile style={{ fontSize: 48, color: '#444' }} />} description="没有找到匹配的车包" />

            </div>

          ) : (

            <Row gutter={[16, 16]} style={{ paddingBottom: 100 }}>

              {displayedPacks.map(pack => {

                const isSelected = selectedIds.includes(pack.id);

                const isDisabled = !pack.isImported;

                return (

                  <Col span={8} key={pack.id} style={{ minWidth: 260 }}>

                    <div

                      onClick={() => toggleSelect(pack.id, pack.isImported)}

                      style={{

                        cursor: isDisabled ? 'not-allowed' : 'pointer',

                        position: 'relative',

                        transition: 'all 0.2s',

                        border: `2px solid ${isSelected ? THEME_GREEN : 'transparent'}`,

                        borderRadius: '12px',

                        overflow: 'hidden',

                        backgroundColor: isDisabled ? CARD_DISABLED : CARD_BG,

                        opacity: isDisabled ? 0.6 : 1,

                        filter: isDisabled ? 'grayscale(0.8)' : 'none'

                      }}

                    >

                      {/* 状态标签 (右上角) */}

                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>

                        {isDisabled ? (

                          <Tooltip content="本地未找到资源文件，无法安装">

                            <Tag color="red" type="solid" style={{ borderRadius: 4 }}>

                              <IconAlertTriangle /> 资源缺失

                            </Tag>

                          </Tooltip>

                        ) : (

                          isSelected && (

                            <Tag color="green" type="solid" style={{ backgroundColor: THEME_GREEN }}>

                              <IconTickCircle /> 已选择

                            </Tag>

                          )

                        )}

                      </div>

                      {/* 图片 */}

                      <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>

                        <img

                          src={pack.thumbnail}

                          alt={pack.name}

                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}

                        />

                        {/* 选中时的绿色蒙层 */}

                        {isSelected && !isDisabled && (

                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(107, 199, 134, 0.15)' }} />

                        )}

                        {/* 详情按钮 (悬浮在图片右下角) */}

                        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 5 }}>

                          <Button

                            theme="solid"

                            type="tertiary"

                            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}

                            size="small"

                            icon={<IconList />}

                            onClick={(e) => openDetail(e, pack)}

                          >

                            包含 {pack.cars.length} 辆

                          </Button>

                        </div>

                      </div>



                      {/* 内容 */}

                      <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between' }}>

                        <div>

                          <Title heading={6} style={{ color: isDisabled ? '#777' : '#eee', marginBottom: 4 }}>{pack.name}</Title>

                          <Text type="tertiary" size="small">{pack.sizeStr}</Text>

                        </div>

                        <Checkbox

                          checked={isSelected}

                          disabled={isDisabled}

                          style={{ pointerEvents: 'none' }}

                        />

                      </div>

                    </div>

                  </Col>

                );

              })}

            </Row>

          )}

        </Content>

        {/* 底部浮动栏 */}

        <Footer style={{

          padding: '16px 40px',

          background: '#232326',

          borderTop: '1px solid #333',

          display: 'flex',

          flexDirection: 'column',

          gap: 12,

          flexShrink: 0

        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            {/* 左侧：信息汇总 */}

            <div>

              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>

                已选车包: <span style={{ color: THEME_GREEN }}>{selectedIds.length}</span> 个

              </Text>

              <div style={{ marginTop: 4 }}>

                <Text type="tertiary" size="small">预计占用空间: {totalSelectedSize}</Text>

              </div>

            </div>

            {/* 右侧：按钮 */}

            <div style={{ display: 'flex', gap: 12 }}>

              <Button

                style={{ backgroundColor: '#444', color: '#fff' }} theme="solid" size="large"

              >

                上一步

              </Button>

              <Button

                style={{

                  backgroundColor: selectedIds.length === 0 ? '#444' : THEME_GREEN,

                  color: selectedIds.length === 0 ? '#999' : '#fff',

                  width: 140

                }}

                theme="solid"

                size="large"

                disabled={selectedIds.length === 0}

              >

                开始安装

              </Button>

            </div>

          </div>

          {/* 进度条 (仅在安装时显示，这里作为静态展示) */}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {/* 模拟一个未开始的进度条，或者显示磁盘空间 */}

            <Progress percent={0} stroke={THEME_GREEN} style={{ flex: 1 }} aria-label="install progress" />

            <Text size="small" type="tertiary">等待开始...</Text>

          </div>

        </Footer>

      {/* --- 侧边抽屉：显示具体车辆列表 --- */}

      <SideSheet

        title={<Title heading={5} style={{ color: '#fff' }}>{activePack?.name}</Title>}

        visible={!!activePack}

        onCancel={() => setActivePack(null)}

        width={400}

        style={{ backgroundColor: '#1f1f22', borderLeft: '1px solid #333' }}

        maskStyle={{ backgroundColor: 'rgba(0,0,0,0.4)' }}

        headerStyle={{ borderBottom: '1px solid #333' }}

        bodyStyle={{ padding: 0 }}

      >

        <div style={{ padding: 20 }}>

          <div style={{ marginBottom: 20, display: 'flex', gap: 16 }}>

            <img

              src={activePack?.thumbnail}

              alt={activePack?.name}

              style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6 }}

            />

            <div>

              <Text style={{ display: 'block', color: '#999', fontSize: 12 }}>文件大小</Text>

              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{activePack?.sizeStr}</Text>

              <div style={{ marginTop: 8 }}>

                <Tag color={activePack?.isImported ? 'green' : 'red'}>

                  {activePack?.isImported ? '资源就绪' : '资源缺失'}

                </Tag>

              </div>

            </div>

          </div>



          <Title heading={6} style={{ color: '#ccc', marginBottom: 12 }}>

            包含车辆 ({activePack?.cars?.length || 0})

          </Title>



          {/* 车辆列表 */}

          {activePack?.cars && activePack.cars.length > 0 ? (

            <List

              dataSource={activePack.cars}

              split={false}

              renderItem={(car: Car) => (

                <List.Item

                  style={{

                    padding: '12px',

                    borderBottom: '1px solid #333',

                    borderRadius: 8,

                    marginBottom: 8,

                    backgroundColor: '#2a2a2e'

                  }}

                >

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                    <Avatar

                      shape="square"

                      size="default"

                      style={{ backgroundColor: '#444', flexShrink: 0 }}

                    >

                      <IconFile />

                    </Avatar>

                    <div style={{ flex: 1 }}>

                      <Text style={{ color: '#fff', display: 'block', marginBottom: 4 }}>{car.name}</Text>

                      <Text style={{ color: '#777', fontSize: 12 }}>类别: {car.class}</Text>

                    </div>

                  </div>

                </List.Item>

              )}

            />

          ) : (

            <Empty description="暂无车辆信息" />

          )}

        </div>

      </SideSheet>

    </Layout>

  );

}
