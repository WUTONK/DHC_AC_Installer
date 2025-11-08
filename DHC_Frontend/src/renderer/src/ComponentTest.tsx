import React from 'react'
import ServerCard from "./components/serverCard"



// const markdown = '# Hi, *Pluto*!'
// <Markdown>{markdown}</Markdown>
function ComponentTest(): React.JSX.Element {

  return(
    <div style={{margin:20,flexDirection:'column',alignItems: 'center', display: 'flex'}}>
      <div style={{margin:20,flexDirection:'row',alignItems: 'center',display: 'flex', gap: 10}}>
        <ServerCard/>
        <ServerCard />
        <ServerCard />
      </div>
      <div style={{margin:20,flexDirection:'row',alignItems: 'center',display: 'flex', gap: 10}}>
        <ServerCard/>
        <ServerCard />
        <ServerCard />
      </div>
    </div>
  )
}

export default ComponentTest

