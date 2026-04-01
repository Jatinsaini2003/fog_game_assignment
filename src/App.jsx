import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GameSelection from './pages/GameSelection'
import GridGame from './pages/GridGame'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelection />} />
        <Route path="/grid-game" element={<GridGame />} />
      </Routes>
    </BrowserRouter>
  )
}
