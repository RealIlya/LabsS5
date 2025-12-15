import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { useNavigate } from "react-router-dom";
import {
  useCreateLobbyMutation,
  useJoinLobbyMutation,
} from "../../../entities/lobby/model/useLobbyMutations";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import { useProfileAuthMutation } from "../../../entities/profile/model/useProfileAuth";
import { useProfileStore } from "../../../entities/profile/model/useProfileStore";
import { useConnectionStatus } from "../../../shared/hooks/useConnectionStatus";
import { translations } from "../../../shared/i18n";
import { Button } from "../../../shared/ui/button";
import { TrainingModal } from "../../../shared/ui/training-modal";

import "./MainMenuPage.css";

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
  const [isRegisterMode, setRegisterMode] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const t = useMemo(() => translations.ru.mainMenu, []);
  const createLobbyMutation = useCreateLobbyMutation();
  const joinLobbyMutation = useJoinLobbyMutation();
  const isJoining = joinLobbyMutation.isPending;
  const isCreating = createLobbyMutation.isPending;
  const ongoingGameId = useLobbyStore((state) => state.currentGameId);
  const resetLobby = useLobbyStore((state) => state.reset);
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const authProfileMutation = useProfileAuthMutation();
  const profileLabel = profile?.nickname ?? t.profileModal.placeholderName;
  const { isOnline } = useConnectionStatus();

  useEffect(() => {
    if (!profile) {
      setProfileModalOpen(true);
      setRegisterMode(true);
      return;
    }
    setProfileNickname(profile.nickname);
    setProfilePassword(profile.password ?? "");
    setRegisterMode(false);
  }, [profile]);

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
      console.error("Profile ensure failed");

      return;
    }
    createLobbyMutation.mutate(
      {
        playerId: currentProfile.id,
        playerName: currentProfile.nickname,
      },
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
    authProfileMutation.mutate(
      {
        nickname: profileNickname.trim(),
        password: profilePassword,
        register: isRegisterMode,
      },
      {
        onSuccess: (data) => {
          setProfile({
            id: data.id,
            nickname: data.nickname,
            password: profilePassword,
          });
          setProfileError(null);
          setProfilePassword("");
          setProfileModalOpen(false);
          setRegisterMode(false);
        },
        onError: (error) => {
          setProfileError(
            error instanceof Error
              ? error.message
              : t.profileModal.authUnknownError
          );
        },
      }
    );
  };

  const handleLogout = () => {
    clearProfile();
    resetLobby();
    setProfileModalOpen(false);
    setSettingsOpen(false);
    navigate("/");
  };

  const handleOpenProfileModal = () => {
    setSettingsOpen(false);
    setProfileModalOpen(true);
    setProfileNickname(profile?.nickname ?? "");
    setProfilePassword(profile?.password ?? "");
    setRegisterMode(!profile);
    setProfileError(null);
  };

  const handleReturn = () => {
    const gameId = ongoingGameId;
    if (!gameId) return;
    navigate(`/game?gameId=${gameId}`);
  };

  return (
    <div className="main-menu">
      <div className="main-menu__profile-card">
        <div>
          <p className="main-menu__profile-label">{t.profileLabel}</p>
          <p className="main-menu__profile-name">{profileLabel}</p>
        </div>
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
        {ongoingGameId ? (
          <Button variant="secondary" onClick={handleReturn}>
            {t.returnToLobby}: {ongoingGameId}
          </Button>
        ) : null}
        <div className="main-menu__secondary-actions">
          <Button
            variant="secondary"
            onClick={() => setTutorialOpen(true)}
            aria-label={t.aria.openTutorial}
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
            className={cn(
              "main-menu__connection-dot",
              `main-menu__connection-dot--${isOnline ? "online" : "offline"}`
            )}
          />
          <span>{isOnline ? t.connectionStable : t.connectionLost}</span>
        </div>
        <div className="main-menu__footer-info">
          {/* <p className="main-menu__version">{t.versionLabel}: v0.1.0</p> */}
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
              <label className="main-menu__form-checkbox">
                <input
                  type="checkbox"
                  checked={isRegisterMode}
                  onChange={(event) => setRegisterMode(event.target.checked)}
                />
                <span>{t.profileModal.registerLabel}</span>
              </label>
              {profileError ? (
                <span className="main-menu__form-error">{profileError}</span>
              ) : null}
              <div className="main-menu__form-actions">
                <Button type="submit" disabled={authProfileMutation.isPending}>
                  {authProfileMutation.isPending
                    ? t.profileModal.loading
                    : isRegisterMode
                    ? t.profileModal.submitRegister
                    : t.profileModal.submitLogin}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setProfileError(null);
                    setProfilePassword("");
                    setRegisterMode(!profile);
                    if (!profile) {
                      setProfileNickname("");
                    }
                  }}
                >
                  {t.profileModal.cancel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="main-menu__modal" role="dialog" aria-modal="true">
          <div className="main-menu__modal-content">
            <h2>{t.settingsModal.title}</h2>

            <div className="main-menu__form-actions">
              <div className="main-menu__form-profile-actions">
                <Button variant="secondary" onClick={handleOpenProfileModal}>
                  {t.profileModal.edit}
                </Button>
                <Button variant="secondary" onClick={handleLogout}>
                  {t.logout}
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSettingsOpen(false)}
              >
                {t.settingsModal.close}
              </Button>
            </div>
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
                <Button type="submit" disabled={isJoining}>
                  {isJoining ? t.joinModal.loading : t.joinModal.submit}
                </Button>
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
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isTutorialOpen ? (
        <TrainingModal
          open={isTutorialOpen}
          onClose={() => setTutorialOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default MainMenuPage;
