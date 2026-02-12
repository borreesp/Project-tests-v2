import { expect, test, type Page } from "@playwright/test";

const coachMe = {
  id: "user-coach-1",
  email: "coach@local.com",
  role: "COACH",
  status: "ACTIVE",
};

async function mockApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith("/api/v1/me")) {
      await route.fulfill({ status: 200, body: JSON.stringify(coachMe) });
      return;
    }

    if (path.endsWith("/api/v1/coach/overview")) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          gymId: "gym-1",
          athletesCount: 12,
          pendingSubmissions: 2,
          validatedToday: 4,
        }),
      });
      return;
    }

    if (path.endsWith("/api/v1/coach/workouts")) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: "w-test-1", title: "Test de fuerza", isTest: true, type: "AMRAP", visibility: "GYMS_ONLY", publishedAt: "2026-01-10T10:00:00Z", scoreType: "REPS" },
          { id: "w-train-1", title: "Workout normal", isTest: false, type: "AMRAP", visibility: "GYMS_ONLY", scoreType: "REPS" },
        ]),
      });
      return;
    }

    if (path.endsWith("/api/v1/movements")) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: "movement-1",
            name: "DB Push Press",
            pattern: "PUSH",
            unitPrimary: "REPS",
            requiresLoad: true,
            requiresBodyweight: false,
          },
        ]),
      });
      return;
    }

    if (path.endsWith("/api/v1/workouts/w-test-1") && method === "GET") {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: "w-test-1",
          title: "Test de fuerza",
          description: "Smoke test detail",
          isTest: true,
          type: "AMRAP",
          visibility: "GYMS_ONLY",
          scoreType: "REPS",
          scales: [
            { code: "RX", label: "RX", notes: "", referenceLoads: {} },
            { code: "SCALED", label: "Scaled", notes: "", referenceLoads: {} },
          ],
          blocks: [
            {
              id: "block-1",
              ord: 1,
              name: "Main",
              blockType: "WORK",
              repeatInt: 1,
              timeSeconds: 600,
              movements: [
                {
                  id: "block-mov-1",
                  ord: 1,
                  movement: {
                    id: "movement-1",
                    name: "DB Push Press",
                    pattern: "PUSH",
                    unitPrimary: "REPS",
                    requiresLoad: true,
                    requiresBodyweight: false,
                  },
                  reps: 10,
                  loadRule: "ATHLETE_CHOICE",
                  notes: "",
                },
              ],
            },
          ],
          capacityWeights: [
            { capacityType: "STRENGTH", weight: 0.5 },
            { capacityType: "MUSCULAR_ENDURANCE", weight: 0.2 },
            { capacityType: "RELATIVE_STRENGTH", weight: 0.2 },
            { capacityType: "WORK_CAPACITY", weight: 0.1 },
          ],
        }),
      });
      return;
    }

    if (path.endsWith("/api/v1/coach/workouts/w-test-1/ideal-scores")) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          community: null,
          gyms: [{ gymId: "gym-1", gymName: "Gym 1", idealScoreBase: 100, notes: "" }],
        }),
      });
      return;
    }

    if (path.endsWith("/api/v1/auth/login") && method === "POST") {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          accessToken: "access-token",
          refreshToken: "refresh-token",
          role: "COACH",
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, body: JSON.stringify({}) });
  });
}

test.describe("QA-006 smoke tests rutas críticas", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("login renderiza y navega al módulo coach", async ({ page }) => {
    await page.route("**/api/v1/me", async (route) => {
      await route.fulfill({ status: 401, body: JSON.stringify({ detail: "unauthorized" }) });
    });

    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/coach\/overview/);
    await expect(page.getByRole("heading", { name: "Coach" })).toBeVisible();
  });

  test("/coach/workouts muestra listado de tests", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("hf_access_token", "access-token");
      window.localStorage.setItem("hf_refresh_token", "refresh-token");
    });

    await page.goto("/coach/workouts");

    await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Test de fuerza" })).toBeVisible();
    await expect(page.getByText("Workout normal")).toHaveCount(0);
  });

  test("builder de creación renderiza pantalla principal", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("hf_access_token", "access-token");
      window.localStorage.setItem("hf_refresh_token", "refresh-token");
    });

    await page.goto("/coach/workouts/new");

    await expect(page.getByRole("heading", { name: "Crear Test" })).toBeVisible();
    await expect(page.getByText("Paso 1: Identidad")).toBeVisible();
  });

  test("builder de edición carga test existente", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("hf_access_token", "access-token");
      window.localStorage.setItem("hf_refresh_token", "refresh-token");
    });

    await page.goto("/coach/workouts/w-test-1/edit");

    await expect(page.getByRole("heading", { name: "Editar Test" })).toBeVisible();
    await expect(page.getByDisplayValue("Test de fuerza")).toBeVisible();
  });
});
