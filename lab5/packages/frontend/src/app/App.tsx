import { Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { GameMapPage } from "../pages/game";
import { LobbyPage } from "../pages/lobby";
import { MainMenuPage } from "../pages/main-menu";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenuPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game" element={<GameMapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
