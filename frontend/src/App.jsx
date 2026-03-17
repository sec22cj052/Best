import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatbotPortal from './components/ChatbotPortal'
import AdminApp from './components/AdminApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatbotPortal />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  )
}

