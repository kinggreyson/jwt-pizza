import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { Role, User } from '../src/service/pizzaService';

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
  'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
  'f@jwt.com': { id: '4', name: 'Frank Fran', email: 'f@jwt.com', password: 'f', roles: [{ role: Role.Franchisee }] },
  'a@jwt.com': { id: '1', name: 'Ada Admin', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
};

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();

    if (method === 'DELETE') {
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
      return;
    }

    const req = route.request().postDataJSON();

    if (method === 'POST') {
      loggedInUser = { id: '9', name: req.name, email: req.email, roles: [{ role: Role.Diner }] } as User;
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      return;
    }

    // PUT = login
    const user = validUsers[req.email];
    if (!user || user.password !== req.password) {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
      return;
    }
    loggedInUser = user;
    await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
  });

  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
  if (route.request().method() === 'POST') {
    const req = route.request().postDataJSON();
    await route.fulfill({ json: { id: 9, name: req.name, admins: req.admins, stores: [] } });
    return;
  }
  const franchiseRes = {
    franchises: [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ],
    more: false,
  };
  await route.fulfill({ json: franchiseRes });
});

  await page.route('*/**/api/order', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          dinerId: 3,
          orders: [
            {
              id: 23,
              franchiseId: 2,
              storeId: 4,
              date: '2024-06-05T05:14:40.000Z',
              items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.0038 }],
            },
          ],
        },
      });
      return;
    }
    const orderReq = route.request().postDataJSON();
    await route.fulfill({ json: { order: { ...orderReq, id: 23 }, jwt: 'eyJpYXQ' } });
  });

  await page.route('*/**/api/order/verify', async (route) => {
    await route.fulfill({ json: { message: 'valid', payload: { vendor: { id: 'test' }, diner: { id: 3 }, order: {} } } });
  });
  // A franchisee's franchises (GET) and close franchise (DELETE)
await page.route(/\/api\/franchise\/\d+$/, async (route) => {
  if (route.request().method() === 'DELETE') {
    await route.fulfill({ json: { message: 'franchise deleted' } });
    return;
  }
  await route.fulfill({
    json: [
      {
        id: 2,
        name: 'LotaPizza',
        admins: [{ id: 4, name: 'Frank Fran', email: 'f@jwt.com' }],
        stores: [
          { id: 4, name: 'Lehi', totalRevenue: 0.5 },
          { id: 5, name: 'Springville', totalRevenue: 0.25 },
        ],
      },
    ],
  });
});

// Create store
await page.route(/\/api\/franchise\/\d+\/store$/, async (route) => {
  const req = route.request().postDataJSON();
  await route.fulfill({ json: { id: 20, name: req.name } });
});

// Close store
await page.route(/\/api\/franchise\/\d+\/store\/\d+$/, async (route) => {
  await route.fulfill({ json: { message: 'store deleted' } });
});
  await page.goto('/');
}

async function login(page: Page, email = 'd@jwt.com', password = 'a') {
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test('login', async ({ page }) => {
  await basicInit(page);
  await login(page);
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  await expect(page.getByText('0.008')).toBeVisible();
});

test('not found page', async ({ page }) => {
  await basicInit(page);
  await page.goto('/nope');
  await expect(page.getByText('Oops')).toBeVisible();
});

test('about and history pages', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/about/);
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page).toHaveURL(/history/);
});

test('logout', async ({ page }) => {
  await basicInit(page);
  await login(page);
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('register', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Full name').fill('Pat Lee');
  await page.getByPlaceholder('Email address').fill('p@jwt.com');
  await page.getByPlaceholder('Password').fill('pw');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'PL' })).toBeVisible();
});

test('diner dashboard', async ({ page }) => {
  await basicInit(page);
  await login(page);
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page).toHaveURL(/diner-dashboard/);
  await expect(page.getByRole('main')).toContainText('d@jwt.com');
  await expect(page.getByRole('main')).toContainText('23');
});

test('franchisee dashboard, create and close store', async ({ page }) => {
  await basicInit(page);
  await login(page, 'f@jwt.com', 'f');

  // "Franchise" appears in both the header and footer, so take the first (header)
  await page.getByRole('link', { name: 'Franchise' }).first().click();
  await expect(page.getByRole('main')).toContainText('LotaPizza');
  await expect(page.getByRole('main')).toContainText('Lehi');

  // Create store
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').fill('Provo');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(/franchise-dashboard/);

  // Close store
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/franchise-dashboard/);
});

test('admin dashboard, create and close franchise', async ({ page }) => {
  await basicInit(page);
  await login(page, 'a@jwt.com', 'admin');

  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('main')).toContainText('LotaPizza');
  await expect(page.getByRole('main')).toContainText('PizzaCorp');

  // Create franchise
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByPlaceholder('franchise name').fill('NewPizza');
  await page.getByPlaceholder('franchisee admin email').fill('f@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page).toHaveURL(/admin-dashboard/);

  // Close franchise
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/admin-dashboard/);
});