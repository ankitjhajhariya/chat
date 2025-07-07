import { useState } from 'react'
import './App.css'
import Chat from './page/chatApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section className='chat-background'>
        <Chat />
      </section>
    </>
  )
}

export default App
