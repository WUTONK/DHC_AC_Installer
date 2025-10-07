import React from 'react'
import { useState } from 'react'
import { Layout } from '@douyinfe/semi-ui'
import Markdown from 'react-markdown'
import wanganLine from './wikiPage/line/wanganLine'


const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>


function ShutokoWiki(): React.JSX.Element {

  // 页面选择
  const renderPage = (key: string): React.JSX.Element => {
    switch (key) {
      case '1':
        return  <div><Markdown>{wanganLine}</Markdown></div>
      default:
        return <div>Not Found</div>
    }
  }

  const [activeKey, setActiveKey] = useState<string>('1')

  return(
    <Layout>
       {renderPage(activeKey)}
    </Layout>
  )
}

export default ShutokoWiki

