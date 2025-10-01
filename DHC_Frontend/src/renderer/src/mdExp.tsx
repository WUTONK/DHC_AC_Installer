import React from 'react'
import Markdown from 'react-markdown'

const markdown = '# Hi, *Pluto*!'

function mdExp(): React.JSX.Element {
  return(
    <Markdown>{markdown}</Markdown>
  )
}

export default mdExp()

