import React, { useState } from 'react'
import { Card, Button, Divider } from '@douyinfe/semi-ui'
import { IconSetting, IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons'
import { useDevMode } from '../contexts/DevModeContext'

export default function DevModePanel(): React.JSX.Element {
  const { isDevMode, devOptions } = useDevMode()
  const [expanded, setExpanded] = useState(false)

  if (!isDevMode || devOptions.length === 0) {
    return <></>
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button
        icon={<IconSetting />}
        theme="borderless"
        type="tertiary"
        size="small"
        onClick={() => setExpanded(!expanded)}
        style={{
          color: isDevMode ? '#6bc786' : '#888',
          border: isDevMode ? '1px solid #6bc786' : '1px solid #444'
        }}
      >
        开发者选项
        {expanded ? <IconChevronUp style={{ marginLeft: 4 }} /> : <IconChevronDown style={{ marginLeft: 4 }} />}
      </Button>

      {expanded && (
        <Card
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            minWidth: 300,
            maxWidth: 500,
            maxHeight: '80vh',
            overflowY: 'auto',
            backgroundColor: '#232326',
            border: '1px solid #444',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>
            开发者选项
          </div>
          <Divider style={{ margin: '12px 0', borderColor: '#444' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {devOptions.map((option, index) => (
              <div key={option.id}>
                <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                  {option.label}
                </div>
                <div>{option.component}</div>
                {index < devOptions.length - 1 && (
                  <Divider style={{ margin: '12px 0', borderColor: '#333' }} />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

