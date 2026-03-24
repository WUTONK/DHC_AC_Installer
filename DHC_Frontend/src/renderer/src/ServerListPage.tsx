import React, { useState, useEffect, useMemo } from 'react'
import {
  Layout,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Switch,
  Modal,
  Toast
} from '@douyinfe/semi-ui'
import {
  IconRefresh,
  IconUserGroup,
  IconGlobe,
  IconAlertTriangle,
  IconFilter
} from '@douyinfe/semi-icons'
import HomeBreadcrumb from './components/HomeBreadcrumb'
import { useDevMode } from './contexts/DevModeContext'
import {
  DEFAULT_SERVER_DISCLAIMER_STATE,
  getServerDisclaimerState,
  setServerDisclaimerState,
  updateServerDisclaimerDevForceShow
} from './services/appStateStore'
import ae86Banner from '../../../resources/image/server/banner/ae86_01.jpeg'
import lightupTopBanner from '../../../resources/image/server/banner/lightup_top_01.png'
import rb04Banner from '../../../resources/image/server/banner/rb_04.jpg'
import tb02Banner from '../../../resources/image/server/banner/tb_02.jpg'
import tb03Banner from '../../../resources/image/server/banner/tb_03.jpg'
import wanganBanner from '../../../resources/image/server/banner/wangan_01.jpg'

// =================================================================
// 类型定义
// =================================================================

interface Server {
  id: number
  name: string
  region: 'CN' | 'OFFICIAL' | 'OTHER'
  location: string
  ping: number
  players: number
  maxPlayers: number
  requiredPack: string | null
  thumbnail: string
  desc: string
}

interface LatencyConfig {
  color: string
  text: string
  status: 'good' | 'fair' | 'poor' | 'bad' | 'offline'
}

interface ServerCardProps {
  server: Server
  onJoin: () => void
}

interface ServerSectionProps {
  title: string
  servers: Server[]
  onJoin: (server: Server) => void
}

interface ServerDisclaimerModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  server: Server | null
}

// =================================================================
// 1. 模拟服务器数据 (MOCK DATA)
// =================================================================

const MOCK_SERVERS: Server[] = [
  {
    id: 1,
    name: '上海湾岸午夜俱乐部服务器 #1',
    region: 'CN', // 大中华区
    location: '亚洲 · 东亚（中国上海）',
    ping: 20,
    players: 10,
    maxPlayers: 32,
    requiredPack: 'SRP JDM Pack',
    thumbnail: ae86Banner,
    desc: '新人友好 | 严禁逆行 | 24小时在线'
  },
  {
    id: 2,
    name: 'SRP Official Asia #1',
    region: 'OFFICIAL', // 官方
    location: '亚洲 · 东南亚（新加坡）',
    ping: 85,
    players: 28,
    maxPlayers: 40,
    requiredPack: 'SRP Main Map',
    thumbnail: lightupTopBanner,
    desc: 'Official Server for Asia region.'
  },
  {
    id: 3,
    name: 'Tokyo Highway Battle',
    region: 'OTHER', // 其他
    location: '亚洲 · 东亚（日本东京）',
    ping: 150,
    players: 5,
    maxPlayers: 24,
    requiredPack: 'Wangan Pack',
    thumbnail: rb04Banner,
    desc: 'High speed battle only.'
  },
  {
    id: 4,
    name: 'US West Drift',
    region: 'OTHER',
    location: '北美洲 · 西海岸（美国加州）',
    ping: 280,
    players: 12,
    maxPlayers: 32,
    requiredPack: null,
    thumbnail: tb02Banner,
    desc: 'Drift practice server.'
  },
  {
    id: 5,
    name: 'EU German Autobahn',
    region: 'OTHER',
    location: '欧洲 · 中欧（德国柏林）',
    ping: 999, // 模拟无法连接
    players: 0,
    maxPlayers: 0,
    requiredPack: 'Euro Pack',
    thumbnail: tb03Banner,
    desc: 'Server Offline.'
  },
  {
    id: 6,
    name: '北京首都高练习服',
    region: 'CN',
    location: '亚洲 · 东亚（中国北京）',
    ping: 5,
    players: 2,
    maxPlayers: 16,
    requiredPack: 'Traffic Pack',
    thumbnail: wanganBanner,
    desc: '测试服务器'
  }
]

const THEME = {
  bg: '#16161a',
  cardBg: '#232326',
  green: '#6bc786',
  orange: '#ff9f43',
  red: '#ff4d4f',
  gray: '#666666',
  border: '#333'
}

const { Header, Content } = Layout
const { Title, Text } = Typography
const DISCLAIMER_MAX_SHOW_COUNT = 2

// =================================================================
// 2. 辅助函数
// =================================================================

const getLatencyConfig = (ping: number): LatencyConfig => {
  if (ping > 500) return { color: THEME.gray, text: '无法连接', status: 'offline' }
  if (ping <= 100) return { color: THEME.green, text: `${ping}ms`, status: 'good' }
  if (ping <= 200) return { color: THEME.orange, text: `${ping}ms`, status: 'fair' }
  if (ping <= 300) return { color: THEME.red, text: `${ping}ms`, status: 'poor' }
  return { color: THEME.gray, text: `${ping}ms`, status: 'bad' }
}

// 从location字符串中提取大洲信息
const extractContinent = (location: string): string => {
  if (location.includes('亚洲')) return 'Asia'
  if (location.includes('欧洲')) return 'Europe'
  if (location.includes('北美洲') || location.includes('南美洲')) return 'Americas'
  if (location.includes('大洋洲') || location.includes('澳洲')) return 'Oceania'
  if (location.includes('非洲')) return 'Africa'
  return 'Unknown'
}

// 检测用户所在大洲（基于时区和语言）
const detectUserContinent = (): string => {
  // 1. 通过时区推断
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneLower = timezone.toLowerCase()

  // 亚洲时区
  if (
    timezoneLower.includes('shanghai') ||
    timezoneLower.includes('beijing') ||
    timezoneLower.includes('hong_kong') ||
    timezoneLower.includes('taipei') ||
    timezoneLower.includes('tokyo') ||
    timezoneLower.includes('seoul') ||
    timezoneLower.includes('singapore') ||
    timezoneLower.includes('bangkok') ||
    timezoneLower.includes('asia')
  ) {
    return 'Asia'
  }

  // 欧洲时区
  if (
    timezoneLower.includes('london') ||
    timezoneLower.includes('paris') ||
    timezoneLower.includes('berlin') ||
    timezoneLower.includes('rome') ||
    timezoneLower.includes('madrid') ||
    timezoneLower.includes('moscow') ||
    timezoneLower.includes('europe')
  ) {
    return 'Europe'
  }

  // 北美洲时区
  if (
    timezoneLower.includes('new_york') ||
    timezoneLower.includes('los_angeles') ||
    timezoneLower.includes('chicago') ||
    timezoneLower.includes('denver') ||
    timezoneLower.includes('america') ||
    timezoneLower.includes('us/')
  ) {
    return 'Americas'
  }

  // 大洋洲时区
  if (
    timezoneLower.includes('sydney') ||
    timezoneLower.includes('melbourne') ||
    timezoneLower.includes('auckland') ||
    timezoneLower.includes('australia')
  ) {
    return 'Oceania'
  }

  // 2. 通过浏览器语言推断（备用方案）
  const language = navigator.language || (navigator as any).userLanguage || ''
  const langLower = language.toLowerCase()

  if (langLower.includes('zh') || langLower.includes('cn') || langLower.includes('tw') || langLower.includes('hk')) {
    return 'Asia'
  }
  if (langLower.includes('ja') || langLower.includes('ko')) {
    return 'Asia'
  }
  if (langLower.includes('en')) {
    // 英语可能是多个大洲，默认返回未知，让时区判断优先
    return 'Unknown'
  }

  return 'Unknown'
}

// =================================================================
// 3. 主页面组件
// =================================================================

interface ServerListPageProps {
  // overrideContinent?: string // 移除此属性
}

export default function ServerListPage({}: ServerListPageProps = {}): React.JSX.Element {
  const { registerDevOption, unregisterDevOption } = useDevMode()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hideUnreachable, setHideUnreachable] = useState(false)
  const [servers] = useState<Server[]>(MOCK_SERVERS)
  const [userContinent, setUserContinent] = useState<string>('Unknown')

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [disclaimerShownCount, setDisclaimerShownCount] = useState<number>(
    DEFAULT_SERVER_DISCLAIMER_STATE.shownCount
  )
  const [devForceShowSuppressedModal, setDevForceShowSuppressedModal] = useState<boolean>(
    DEFAULT_SERVER_DISCLAIMER_STATE.devForceShowSuppressed
  )

  // 检测用户大洲
  useEffect(() => {
    const continent = detectUserContinent()
    setUserContinent(continent)
  }, [])

  // 从统一状态存储加载 serverDisclaimer 配置
  useEffect(() => {
    let mounted = true
    getServerDisclaimerState()
      .then((state) => {
        if (!mounted) return
        setDisclaimerShownCount(state.shownCount)
        setDevForceShowSuppressedModal(state.devForceShowSuppressed)
      })
      .catch(() => {
        // 使用默认值继续运行，避免因状态读取失败阻断核心流程
      })
    return () => {
      mounted = false
    }
  }, [])

  // 模拟刷新
  const handleRefresh = (): void => {
    setIsRefreshing(true)
    setTimeout(() => {
      // 这里可以加入随机改变ping值的逻辑来模拟真实刷新
      setIsRefreshing(false)
      Toast.success('服务器列表已更新')
    }, 1000)
  }

  // 实际执行加入服务器动作
  const proceedJoinServer = (server: Server | null): void => {
    Toast.info(`正在启动 Content Manager 连接至: ${server?.name}`)
  }

  // 打开入服警告弹窗
  const handleJoinClick = async (server: Server): Promise<void> => {
    setSelectedServer(server)
    const latestState = await getServerDisclaimerState().catch(() => ({
      shownCount: disclaimerShownCount,
      devForceShowSuppressed: devForceShowSuppressedModal
    }))
    const shouldSuppressDisclaimer =
      latestState.shownCount >= DISCLAIMER_MAX_SHOW_COUNT && !latestState.devForceShowSuppressed

    if (shouldSuppressDisclaimer) {
      proceedJoinServer(server)
      return
    }

    const nextState = {
      ...latestState,
      shownCount: latestState.shownCount + 1
    }
    await setServerDisclaimerState(nextState).catch(() => undefined)
    setDisclaimerShownCount(nextState.shownCount)
    setDevForceShowSuppressedModal(nextState.devForceShowSuppressed)
    setModalVisible(true)
  }

  // 注册开发者调试选项
  useEffect(() => {
    registerDevOption({
      id: 'server-list-force-show-suppressed-disclaimer',
      label: '显示已达阈值被抑制的入服弹窗',
      component: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={devForceShowSuppressedModal}
              onChange={(checked) => {
                setDevForceShowSuppressedModal(checked)
                updateServerDisclaimerDevForceShow(checked).catch(() => undefined)
              }}
              size="small"
            />
            <span style={{ color: '#ccc', fontSize: 12 }}>
              {devForceShowSuppressedModal
                ? '强制显示已抑制弹窗'
                : `当前弹窗显示计数: ${disclaimerShownCount}/${DISCLAIMER_MAX_SHOW_COUNT}`}
            </span>
          </div>
          <Button
            size="small"
            theme="light"
            type="danger"
            onClick={async () => {
              const nextState = {
                shownCount: 0,
                devForceShowSuppressed: devForceShowSuppressedModal
              }
              await setServerDisclaimerState(nextState).catch(() => undefined)
              setDisclaimerShownCount(0)
              Toast.success('已重置入服弹窗显示计数')
            }}
          >
            重置入服弹窗显示计数
          </Button>
        </div>
      ),
      order: 12
    })

    return () => {
      unregisterDevOption('server-list-force-show-suppressed-disclaimer')
    }
  }, [
    registerDevOption,
    unregisterDevOption,
    devForceShowSuppressedModal,
    disclaimerShownCount
  ])

  // --- 数据分组与排序 ---
  const groupedServers = useMemo(() => {
    let list = [...servers]

    // 1. 筛选
    if (hideUnreachable) {
      list = list.filter((s) => s.ping <= 300)
    }

    // 2. 分组
    const groups: {
      CN: Server[]
      OFFICIAL: Server[]
      OTHER: Server[]
      OTHER_SAME_CONTINENT: Server[] // 与用户同大洲的其他服务器
      OTHER_OTHER_CONTINENT: Server[] // 其他大洲的服务器
    } = {
      CN: [],
      OFFICIAL: [],
      OTHER: [],
      OTHER_SAME_CONTINENT: [],
      OTHER_OTHER_CONTINENT: []
    }

    list.forEach((server) => {
      if (server.region === 'CN') {
        groups.CN.push(server)
      } else if (server.region === 'OFFICIAL') {
        groups.OFFICIAL.push(server)
      } else {
        // 根据用户大洲分类其他服务器
        const serverContinent = extractContinent(server.location)
        if (userContinent !== 'Unknown' && serverContinent === userContinent) {
          groups.OTHER_SAME_CONTINENT.push(server)
        } else {
          groups.OTHER_OTHER_CONTINENT.push(server)
        }
        groups.OTHER.push(server) // 保持向后兼容
      }
    })

    // 3. 按延迟排序
    groups.OTHER.sort((a, b) => a.ping - b.ping)
    groups.OTHER_SAME_CONTINENT.sort((a, b) => a.ping - b.ping)
    groups.OTHER_OTHER_CONTINENT.sort((a, b) => a.ping - b.ping)

    return groups
  }, [servers, hideUnreachable, userContinent])

  // 根据用户大洲确定显示顺序
  const getDisplayOrder = (): Array<{ key: string; title: string; servers: Server[] }> => {
    const sections: Array<{ key: string; title: string; servers: Server[] }> = []
    const isInAsia = userContinent === 'Asia'
    const isInCN = navigator.language.toLowerCase().includes('zh') ||
                   navigator.language.toLowerCase().includes('cn')

    // 如果用户在亚洲（特别是大中华区），优先显示大中华区和官方服务器
    if (isInAsia || isInCN) {
      // 大中华区优先
      if (groupedServers.CN.length > 0) {
        sections.push({ key: 'CN', title: '大中华区 🇨🇳', servers: groupedServers.CN })
      }
      // 官方服务器
      if (groupedServers.OFFICIAL.length > 0) {
        sections.push({ key: 'OFFICIAL', title: 'SRP 官方服务器 🏁', servers: groupedServers.OFFICIAL })
      }
      // 同大洲的其他服务器
      if (groupedServers.OTHER_SAME_CONTINENT.length > 0) {
        sections.push({
          key: 'OTHER_SAME',
          title: `其他地区 - ${userContinent === 'Asia' ? '亚洲' : '同大洲'} (按延迟排序) 🌐`,
          servers: groupedServers.OTHER_SAME_CONTINENT
        })
      }
      // 其他大洲的服务器
      if (groupedServers.OTHER_OTHER_CONTINENT.length > 0) {
        sections.push({
          key: 'OTHER_OTHER',
          title: '其他地区 (按延迟排序) 🌐',
          servers: groupedServers.OTHER_OTHER_CONTINENT
        })
      }
    } else {
      // 如果用户不在大中华区，优先显示官方服务器和同大洲服务器
      // 官方服务器优先
      if (groupedServers.OFFICIAL.length > 0) {
        sections.push({ key: 'OFFICIAL', title: 'SRP 官方服务器 🏁', servers: groupedServers.OFFICIAL })
      }
      // 同大洲的其他服务器
      if (groupedServers.OTHER_SAME_CONTINENT.length > 0) {
        const continentNames: Record<string, string> = {
          Europe: '欧洲',
          Americas: '美洲',
          Oceania: '大洋洲',
          Africa: '非洲'
        }
        sections.push({
          key: 'OTHER_SAME',
          title: `${continentNames[userContinent] || userContinent}地区 (按延迟排序) 🌐`,
          servers: groupedServers.OTHER_SAME_CONTINENT
        })
      }
      // 其他大洲的服务器
      if (groupedServers.OTHER_OTHER_CONTINENT.length > 0) {
        sections.push({
          key: 'OTHER_OTHER',
          title: '其他地区 (按延迟排序) 🌐',
          servers: groupedServers.OTHER_OTHER_CONTINENT
        })
      }
      // 大中华区放在倒数第二（如果还有其他服务器）
      if (groupedServers.CN.length > 0) {
        sections.push({ key: 'CN', title: '大中华区 🇨🇳', servers: groupedServers.CN })
      }
    }

    return sections
  }

  return (
    <Layout
      style={{ height: '100vh', background: THEME.bg, color: 'white', overflow: 'hidden' }}
      className="semi-always-dark"
    >
      {/* Header */}
      <Header
        style={{
          padding: '0 40px',
          height: 64,
          background: THEME.bg,
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <HomeBreadcrumb current="服务器推荐" />
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setHideUnreachable(!hideUnreachable)}
          >
            <Switch size="small" checked={hideUnreachable} />
            <Text style={{ color: hideUnreachable ? '#fff' : '#888', fontSize: 13 }}>
              仅显示可连接
            </Text>
          </div>

          <Button
            icon={
              <IconRefresh
                style={
                  isRefreshing
                    ? { animation: 'spin 1s linear infinite' }
                    : undefined
                }
              />
            }
            theme="solid"
            style={{
              backgroundColor: isRefreshing ? '#333' : THEME.green,
              color: '#fff'
            }}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新状态'}
          </Button>
        </div>
      </Header>

      {/* Content */}
      <Content style={{ padding: '24px 40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 根据用户大洲动态显示服务器分区 */}
          {getDisplayOrder().map((section) => (
            <ServerSection
              key={section.key}
              title={section.title}
              servers={section.servers}
              onJoin={handleJoinClick}
            />
          ))}

          {getDisplayOrder().length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>
              <IconFilter style={{ fontSize: 48, marginBottom: 16 }} />
              <p>没有找到符合条件的服务器</p>
            </div>
          )}
        </div>
      </Content>

      {/* 警告弹窗 */}
      <ServerDisclaimerModal
        visible={modalVisible}
        server={selectedServer}
        onCancel={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false)
          proceedJoinServer(selectedServer)
        }}
      />
    </Layout>
  )
}

// =================================================================
// 4. 分区组件
// =================================================================

const ServerSection: React.FC<ServerSectionProps> = ({ title, servers, onJoin }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{ width: 4, height: 18, background: THEME.green, borderRadius: 2 }}
      />
      <Title heading={5} style={{ color: '#fff' }}>
        {title}
      </Title>
    </div>
    <Row gutter={[24, 24]}>
      {servers.map((server) => (
        <Col span={8} lg={8} xl={6} key={server.id}>
          <ServerCard server={server} onJoin={() => onJoin(server)} />
        </Col>
      ))}
    </Row>
  </div>
)

// =================================================================
// 5. 服务器卡片组件
// =================================================================

const ServerCard: React.FC<ServerCardProps> = ({ server, onJoin }) => {
  const latency = getLatencyConfig(server.ping)
  const isOffline = latency.status === 'offline'

  return (
    <div
      style={{
        backgroundColor: THEME.cardBg,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${THEME.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s',
        position: 'relative'
      }}
      className="server-card-hover" // 可在全局CSS添加 :hover { transform: translateY(-4px); }
    >
      {/* 缩略图 */}
      <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
        <img
          src={server.thumbnail}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isOffline ? 'grayscale(1)' : 'none'
          }}
          alt={server.name}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'
          }}
        />

        {/* 必装包 Tag */}
        {server.requiredPack && (
          <Tag
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            需 {server.requiredPack}
          </Tag>
        )}
      </div>

      {/* 内容区 */}
      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 12 }}>
          <Text
            ellipsis={{ showTooltip: true }}
            style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, display: 'block' }}
          >
            {server.name}
          </Text>
          <Text ellipsis style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
            {server.desc}
          </Text>
        </div>

        {/* 数据行 */}
        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
              fontSize: 12
            }}
          >
            <div>
              <div style={{ color: '#666', marginBottom: 2 }}>服务器位置</div>
              <div style={{ color: '#ccc', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconGlobe size="small" /> {server.location}
              </div>
            </div>
            <div>
              <div style={{ color: '#666', marginBottom: 2 }}>在线玩家</div>
              <div style={{ color: '#ccc', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconUserGroup size="small" />
                <span
                  style={{
                    color: server.players >= server.maxPlayers ? THEME.red : '#ccc'
                  }}
                >
                  {server.players}
                </span>
                /{server.maxPlayers}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#666', marginBottom: 2 }}>延迟(TTS)</div>
              <div style={{ color: latency.color, fontWeight: 'bold' }}>{latency.text}</div>
            </div>
          </div>

          <Button
            block
            theme="solid"
            disabled={isOffline}
            style={{
              backgroundColor: isOffline ? '#333' : 'rgba(107, 199, 134, 0.15)',
              color: isOffline ? '#666' : THEME.green,
              border: isOffline ? 'none' : `1px solid ${THEME.green}`,
              fontWeight: 'bold'
            }}
            onClick={onJoin}
          >
            {isOffline ? '无法连接' : '加入服务器'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// 6. 入服须知弹窗 (核心逻辑)
// =================================================================

const ServerDisclaimerModal: React.FC<ServerDisclaimerModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  server: _server
}) => {
  const [countdown, setCountdown] = useState(10)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // 重置倒计时逻辑
  useEffect(() => {
    if (visible) {
      setCountdown(10) // 重置为10秒
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      closeOnEsc={false}
      maskClosable={false}
      width={700}
      style={{ backgroundColor: '#232326', border: '1px solid #444', padding: 0 }}
      header={null} // 自定义 Header
      footer={
        <div
          style={{
            padding: '16px 24px',
            background: '#2a2a2e',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            borderTop: '1px solid #333'
          }}
        >
          <Button
            onClick={onCancel}
            theme="solid"
            type="tertiary"
            style={{ backgroundColor: '#444', color: '#ccc' }}
          >
            取消
          </Button>
          <Button
            theme="solid"
            disabled={countdown > 0}
            onClick={onConfirm}
            style={{
              backgroundColor: countdown > 0 ? '#555' : THEME.red, // 倒计时结束后变红
              color: '#fff',
              fontWeight: 'bold',
              width: 160,
              transition: 'background-color 0.3s'
            }}
          >
            {countdown > 0 ? `请阅读 (${countdown}s)` : '同意并加入'}
          </Button>
        </div>
      }
    >
      {/* 弹窗内容 */}
      <div style={{ padding: '24px 32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <Title heading={3} style={{ color: '#fff' }}>
            进入服务器须知
          </Title>
          <div style={{ cursor: 'pointer', color: '#666' }} onClick={onCancel}>
            ✕
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 12,
            backgroundColor: '#16161a',
            padding: 32,
            border: '1px solid #333'
          }}
        >
          {/* 背景大三角水印 */}
          <IconAlertTriangle
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 280,
              color: 'rgba(255, 77, 79, 0.05)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ul style={{ color: '#ccc', lineHeight: '2', fontSize: 15, paddingLeft: 20 }}>
              <li>
                您当前进入的是真人玩家参与的服务器{' '}
                <strong style={{ color: '#fff' }}>请尊重其他玩家</strong>{' '}
                请勿进行违反赛事和服务器规则的恶意行为
              </li>
              <li>在进入服务器前，请先进入相关群聊了解规则。</li>
              <li>
                否则，您可能会遭遇 IP/硬件唯一设备标识/
                <strong style={{ color: THEME.red }}>多服务器共享黑名单识别</strong>{' '}
                等封禁手段。
              </li>
              <li style={{ color: THEME.red, fontWeight: 'bold' }}>
                这可能造成您的电脑而非帐号被永久禁止进入某些服务器。
              </li>
              <li>
                如果您已知晓不遵循服务器规则的后果，请点击右下角的"同意并加入"按钮来跳转到服务器链接。
              </li>
              <li>该警告在显示第二次后将永久不再出现。</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}

