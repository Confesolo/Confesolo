import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VoiceRecorder from './assets/components/VoiceRecorder'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <VoiceRecorder></VoiceRecorder>
    </>
  )
}

export default App
