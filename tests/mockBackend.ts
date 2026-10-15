import { Page } from "@playwright/test";

type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: { role: string }[];
};

export async function mockBackend(page: Page) {
  const users: MockUser[] = [
    {
      id: "1",
      name: "Admin User",
      email: "a@jwt.com",
      password: "admin",
      roles: [{ role: "admin" }],
    },
  ];
  for (let i = 1; i <= 12; i++) {
    users.push({
      id: String(100 + i),
      name: `Diner ${i}`,
      email: `diner${i}@jwt.com`,
      password: "diner",
      roles: [{ role: "diner" }],
    });
  }
  let nextId = 2;
  let loggedIn: MockUser | null = null;

  const publicUser = (u: MockUser) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.roles,
  });

  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();
    if (method === "DELETE") {
      loggedIn = null;
      await route.fulfill({ json: { message: "logout successful" } });
    } else if (method === "POST") {
      const body = route.request().postDataJSON();
      const u: MockUser = {
        id: String(nextId++),
        name: body.name,
        email: body.email,
        password: body.password,
        roles: [{ role: "diner" }],
      };
      users.push(u);
      loggedIn = u;
      await route.fulfill({ json: { user: publicUser(u), token: "abc123" } });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      const u = users.find(
        (x) => x.email === body.email && x.password === body.password,
      );
      if (!u) {
        await route.fulfill({ status: 404, json: { message: "unknown user" } });
        return;
      }
      loggedIn = u;
      await route.fulfill({ json: { user: publicUser(u), token: "abc123" } });
    }
  });

  await page.route("*/**/api/user/*", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: loggedIn ? publicUser(loggedIn) : null });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      const u = users.find(
        (x) => x.id === route.request().url().split("/").pop(),
      );
      if (u) {
        u.name = body.name ?? u.name;
        u.email = body.email ?? u.email;
        if (body.password) u.password = body.password;
      }
      await route.fulfill({
        json: { user: u ? publicUser(u) : null, token: "abc123" },
      });
    } else if (method === "DELETE") {
      const id = route.request().url().split("/").pop();
      const i = users.findIndex((x) => x.id === id);
      if (i >= 0) users.splice(i, 1);
      await route.fulfill({ json: { message: "user deleted" } });
    }
  });

  await page.route("*/**/api/order", async (route) => {
    await route.fulfill({ json: { dinerId: 1, orders: [] } });
  });

  // list users (admin dashboard)
  await page.route(/\/api\/user(\?.*)?$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const url = new URL(route.request().url());
    const page_ = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const nameFilter = (url.searchParams.get("name") ?? "*")
      .replace(/\*/g, "")
      .toLowerCase();

    const matches = users.filter((u) =>
      u.name.toLowerCase().includes(nameFilter),
    );
    const start = (page_ - 1) * limit;
    const slice = matches.slice(start, start + limit).map(publicUser);
    await route.fulfill({
      json: { users: slice, more: start + limit < matches.length },
    });
  });
}
