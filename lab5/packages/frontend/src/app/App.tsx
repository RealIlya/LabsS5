import { Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { MainMenuPage } from "../pages/main-menu";
import { OverviewPage } from "../pages/overview";
import { LobbyPage } from "../pages/lobby";
import { GameMapPage } from "../pages/game";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenuPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/game" element={<GameMapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
