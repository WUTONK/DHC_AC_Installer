import React from 'react'
import { useState } from 'react'
import { Layout, Card } from '@douyinfe/semi-ui'
import Markdown from 'react-markdown'
import shutokoOverview from './wikiPage/shutokoWiki/shutokoOverview'
import drivingSkills from './wikiPage/shutokoWiki/drivingSkills'
import c1LoopLine from './wikiPage/shutokoWiki/c1LoopLine'
import NewLoop from './wikiPage/shutokoWiki/NewLoop'
import wanganLine from './wikiPage/shutokoWiki/wanganLine'
import yokohaLine from './wikiPage/shutokoWiki/yokohaLine'


// const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>
function ShutokoWiki(): React.JSX.Element {

  // 帮我局中创建6个卡片 他们各自间隔20px 大小是100*100px 他们分别写着 首都高概览 驾驶技巧 C1环线 新环状 湾岸线 横羽线 (shutokoOverview drivingSkills c1LoopLine NewLoop wanganLine yokohaLine)
  // 如果没有这些md页面 创建它 位置参考wanganLine 然后引用
  // 然后可以通过点击这些矩形进入对应的markdown页面

  const cards = [
    { key: 'shutokoOverview', title: '首都高概览', content: shutokoOverview },
    { key: 'drivingSkills', title: '驾驶技巧', content: drivingSkills },
    { key: 'c1LoopLine', title: 'C1环线', content: c1LoopLine },
    { key: 'NewLoop', title: '新环状', content: NewLoop },
    { key: 'wanganLine', title: '湾岸线', content: wanganLine },
    { key: 'yokohaLine', title: '横羽线', content: yokohaLine }
  ]

  const [activeKey, setActiveKey] = useState<string>('shutokoOverview')
  const activeCard = cards.find(card => card.key === activeKey)

  return(
    <Layout className="min-h-screen bg-gray-100 flex items-center justify-center py-10 px-5">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-5">
          {cards.map(card => (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => setActiveKey(card.key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setActiveKey(card.key)
                }
              }}
              className={`h-[100px] w-[100px] cursor-pointer select-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeKey === card.key ? 'scale-105' : ''
              }`}
            >
              <Card
                bodyStyle={{ padding: '8px' }}
                className={`flex h-full w-full items-center justify-center text-center font-semibold ${
                  activeKey === card.key
                    ? 'border-2 border-blue-500 shadow-lg'
                    : 'border border-gray-300 shadow'
                }`}
              >
                {card.title}
              </Card>
            </div>
          ))}
        </div>
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg text-black">
          {activeCard ? <Markdown>{activeCard.content}</Markdown> : <div>未找到内容</div>}
        </div>
      </div>
    </Layout>
  )
}

export default ShutokoWiki

