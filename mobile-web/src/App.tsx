import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CameraPage from './pages/CameraPage'
import EnterPage from './pages/EnterPage'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import PhotoReceivePage from './pages/PhotoReceivePage'
import ProfilePage from './pages/ProfilePage'
import ScanPage from './pages/ScanPage'
import StampRallyPage from './pages/StampRallyPage'
import EventsPage from './pages/EventsPage'
import RequireSession from './components/RequireSession'

export default function App() {
  return (
    <BrowserRouter basename="/mobile/app">
      <Routes>
        <Route path="/enter" element={<EnterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route
          path="/map"
          element={
            <RequireSession>
              <MapPage />
            </RequireSession>
          }
        />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/photo/receive" element={<PhotoReceivePage />} />
        <Route
          path="/rally"
          element={
            <RequireSession>
              <StampRallyPage />
            </RequireSession>
          }
        />
        <Route
          path="/scan"
          element={
            <RequireSession>
              <ScanPage />
            </RequireSession>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireSession>
              <ProfilePage />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
