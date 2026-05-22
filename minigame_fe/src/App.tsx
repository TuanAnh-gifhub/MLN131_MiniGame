import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage'
import { GamePage } from './pages/GamePage'
import { JoinPage } from './pages/JoinPage'
import { ResultPage } from './pages/ResultPage'
import { WaitingRoomPage } from './pages/WaitingRoomPage'
import { AudioPlayer } from './components/AudioPlayer'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<JoinPage />} />
        <Route path="/join/:roomCode" element={<JoinPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/" element={<AdminPage />} />
        <Route path="/room/:roomCode/waiting" element={<WaitingRoomPage />} />
        <Route path="/room/:roomCode/game" element={<GamePage />} />
        <Route path="/room/:roomCode/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AudioPlayer />
    </>
  )
}

