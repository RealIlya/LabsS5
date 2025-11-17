import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";

describe("App", () => {
  const renderWithRouter = (initialEntries?: string[]) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("рендерит главное меню по умолчанию", () => {
    renderWithRouter();
    expect(screen.getByRole("heading", { name: /соберите армию/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Создать игру" })
    ).toBeInTheDocument();
  });

  it("показывает обзор юнитов/структур на маршруте overview", () => {
    renderWithRouter(["/overview"]);
    expect(screen.getByRole("heading", { name: "Тайлы" })).toBeInTheDocument();
    expect(screen.getByText("Равнина")).toBeVisible();
  });

  it("рендерит лобби на маршруте /lobby", () => {
    renderWithRouter(["/lobby"]);
    expect(screen.getByRole("heading", { name: /ожидание подключения/i })).toBeInTheDocument();
    expect(screen.getByText(/Командир Nova/)).toBeVisible();
    expect(screen.getByRole("button", { name: /Ждём всех игроков/i })).toBeDisabled();
  });

  it("загружает карту на маршруте /game", () => {
    renderWithRouter(["/game"]);
    expect(screen.getByText(/Выберите юнита/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Действия завершены/i })).toBeDisabled();
  });
});
