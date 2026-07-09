import React from 'react'
import { Timeline } from './components/Timeline'

// Data injected by generator
declare global {
  interface Window {
    __TIMELINE_DATA__?: any
    __TIMELINE_CONFIG__?: any
  }
}

export const App: React.FC = () => {
  const data = window.__TIMELINE_DATA__ || []
  const config = window.__TIMELINE_CONFIG__ || { title: 'Timeline' }

  return <Timeline tasks={data} title={config.title} extraFields={config.extraFields} sheetUrl={config.sheetUrl} />
}

export default App
