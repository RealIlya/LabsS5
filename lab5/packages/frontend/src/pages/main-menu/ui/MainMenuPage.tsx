import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../shared/ui/button";
import { translations } from "../../../shared/i18n";
import {
  useCreateLobbyMutation,
  useJoinLobbyMutation,
} from "../../../entities/lobby/model/useLobbyMutations";
import { useProfileStore } from "../../../entities/profile/model/useProfileStore";
import "./MainMenuPage.css";

const mockConnection = {
  status: "online" as const,
  latencyMs: 42,
};

const queuedMatch = {
  id: "SR-2048",
  description: "В очереди на матч",
};

export function MainMenuPage() {
  const navigate = useNavigate();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isTutorialOpen, setTutorialOpen] = useState(false);
  const [isJoinOpen, setJoinOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [profileNickname, setProfileNickname] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const t = useMemo(() => translations.ru.mainMenu, []);
  const createLobbyMutation = useCreateLobbyMutation();
  const joinLobbyMutation = useJoinLobbyMutation();
  const isJoining = joinLobbyMutation.isPending;
  const isCreating = createLobbyMutation.isPending;
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const profileLabel = profile?.nickname ?? t.profileModal.placeholderName;

  useEffect(() => {
    if (!profile) {
      setProfileModalOpen(true);
      return;
    }
    setProfileNickname(profile.nickname);
  }, [profile]);

  const generatePlayerId = () => {
    if (profile?.id) {
      return profile.id;
    }
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `player-${Date.now()}`;
  };

  const ensureProfile = () => {
    if (profile) {
      return profile;
    }
    setProfileModalOpen(true);
    setProfileError(null);
    return null;
  };

  const handleCreate = () => {
    const currentProfile = ensureProfile();
    if (!currentProfile) {
      return;
    }
    createLobbyMutation.mutate(
      { hostId: currentProfile.id, nickname: currentProfile.nickname },
      {
        onSuccess: () => {
          navigate("/lobby");
        },
      }
    );
  };

  const handleJoin = () => {
    setJoinOpen(true);
  };

  const submitJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!joinCode.trim()) {
      setJoinError(t.joinModal.error);
      return;
    }
    setJoinError(null);
    const currentProfile = ensureProfile();
    if (!currentProfile) {
      return;
    }
    joinLobbyMutation.mutate(
      {
        code: joinCode.trim(),
        nickname: currentProfile.nickname,
        playerId: currentProfile.id,
      },
      {
        onSuccess: () => {
          setJoinOpen(false);
          setJoinCode("");
          navigate("/lobby");
        },
        onError: () => {
          setJoinError(t.joinModal.error);
        },
      }
    );
  };

  const submitProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileNickname.trim()) {
      setProfileError(t.profileModal.nameError);
      return;
    }
    if (!profilePassword.trim()) {
      setProfileError(t.profileModal.passwordError);
      return;
    }
    setProfile({
      id: generatePlayerId(),
      nickname: profileNickname.trim(),
      password: profilePassword,
    });
    setProfileError(null);
    setProfilePassword("");
    setProfileModalOpen(false);
  };

  return (
    <div className="main-menu">
      <div className="main-menu__profile-card">
        <div>
          <p className="main-menu__profile-label">{t.profileLabel}</p>
          <p className="main-menu__profile-name">{profileLabel}</p>
        </div>
        <Button
          variant="secondary"
          className="main-menu__profile-edit"
          onClick={() => {
            setProfileModalOpen(true);
            setProfileError(null);
            setProfileNickname(profile?.nickname ?? "");
            setProfilePassword("");
          }}
        >
          {profile ? t.profileModal.edit : t.profileModal.create}
        </Button>
      </div>

      <header className="main-menu__hero">
        <p className="main-menu__hero-tagline">{t.tagline}</p>
        <h1>{t.title}</h1>
        <p className="main-menu__hero-subtitle">{t.subtitle}</p>
      </header>

      <div className="main-menu__actions">
        <Button onClick={handleCreate} disabled={isCreating}>
          {t.create}
        </Button>
        <Button onClick={handleJoin}>{t.join}</Button>
        {queuedMatch ? (
          <Button variant="secondary">
            {t.returnToLobby}: {queuedMatch.description} ({queuedMatch.id})
          </Button>
        ) : null}
        <div className="main-menu__secondary-actions">
          <Button
            variant="secondary"
            onClick={() => setTutorialOpen(true)}
            aria-label="Открыть учебник"
          >
            {t.training}
          </Button>
          <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
            {t.settings}
          </Button>
        </div>
      </div>

      <footer className="main-menu__footer">
        <div className="main-menu__connection">
          <span
            className={`main-menu__connection-dot main-menu__connection-dot--${mockConnection.status}`}
          />
          <span>
            {mockConnection.status === "online"
              ? t.connectionStable
              : t.connectionLost}
            {" · "}
            {mockConnection.latencyMs} мс
          </span>
        </div>
        <div className="main-menu__footer-info">
          <p className="main-menu__version">{t.versionLabel}: v0.1.0</p>
          <p className="main-menu__credits">{t.credits}</p>
        </div>
      </footer>

      {isProfileModalOpen ? (
        <div className="main-menu__modal" role="dialog" aria-modal="true">
          <div className="main-menu__modal-content">
            <h2>{t.profileModal.title}</h2>
            <p>{t.profileModal.description}</p>
            <form onSubmit={submitProfile} className="main-menu__form">
              <input
                type="text"
                value={profileNickname}
                onChange={(event) => setProfileNickname(event.target.value)}
                placeholder={t.profileModal.namePlaceholder}
              />
              <input
                type="password"
                value={profilePassword}
                onChange={(event) => setProfilePassword(event.target.value)}
                placeholder={t.profileModal.passwordPlaceholder}
              />
              {profileError ? (
                <span className="main-menu__form-error">{profileError}</span>
              ) : null}
              <div className="main-menu__form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setProfileError(null);
                    setProfilePassword("");
                    if (!profile) {
                      setProfileNickname("");
                    }
                  }}
                >
                  {t.profileModal.cancel}
                </Button>
                <Button type="submit">{t.profileModal.submit}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="main-menu__modal" role="dialog" aria-modal="true">
          <div className="main-menu__modal-content">
            <h2>{t.settingsModal.title}</h2>
            <p>{t.settingsModal.description}</p>
            <ul>
              {t.settingsModal.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              {t.settingsModal.close}
            </Button>
          </div>
        </div>
      ) : null}

      {isJoinOpen ? (
        <div className="main-menu__modal" role="dialog" aria-modal="true">
          <div className="main-menu__modal-content">
            <h2>{t.joinModal.title}</h2>
            <p>{t.joinModal.description}</p>
            <form onSubmit={submitJoin} className="main-menu__form">
              <input
                type="text"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder={t.joinModal.placeholder}
              />
              {joinError ? (
                <span className="main-menu__form-error">{joinError}</span>
              ) : null}
              <div className="main-menu__form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setJoinOpen(false);
                    setJoinCode("");
                    setJoinError(null);
                  }}
                >
                  {t.joinModal.cancel}
                </Button>
                <Button type="submit" disabled={isJoining}>
                  {isJoining ? t.joinModal.loading : t.joinModal.submit}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isTutorialOpen ? (
        <div className="main-menu__modal" role="dialog" aria-modal="true">
          <div className="main-menu__modal-content">
            <h2>{t.tutorialModal.title}</h2>
            <p>{t.tutorialModal.description}</p>
            <ol>
              {t.tutorialModal.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Button variant="secondary" onClick={() => setTutorialOpen(false)}>
              {t.tutorialModal.close}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MainMenuPage;
