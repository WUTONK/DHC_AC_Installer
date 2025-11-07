import React from 'react'
import { Layout } from '@douyinfe/semi-ui'
import ServerCard from "./components/serverCard"



// const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>
function ComponentTest(): React.JSX.Element {

  return(
    <Layout>
       <ServerCard />
    </Layout>
  )
}

export default ComponentTest

