import { test, expect, type Page } from '@playwright/test';

/**
 * Shopping cart management E2E tests
 * Implements: frontend/tests/features/cart-management.feature
 *
 * Covers:
 * - Empty cart state with prompt to continue shopping
 * - Navigation badge item count
 * - Navigating to cart via the nav icon
 * - Item display details (name, unit, quantity)
 * - Increase / decrease quantity controls
 * - Minimum quantity boundary (cannot go below 1)
 * - Remove a single item
 * - Clear all cart items
 * - Order summary: subtotal, discount (5%), shipping, total
 * - Coupon code hint visibility
 * - Continue Shopping navigation link
 * - Keyboard navigation accessibility
 */

const CART_STORAGE_KEY = 'octocat.cart.v1';

// Products matching seeded database entries (004_products.sql)
const SMART_FEEDER = {
  productId: 1,
  name: 'SmartFeeder One',
  price: 129.99,
  imgName: 'feeder.png',
  unit: 'piece',
  discount: 0.25,
};

const PAWTRACK_COLLAR = {
  productId: 4,
  name: 'PawTrack Smart Collar',
  price: 79.99,
  imgName: 'smart-collar.png',
  unit: 'piece',
};

type CartItemSeed = typeof SMART_FEEDER & { quantity: number };

/**
 * Seeds cart state in localStorage.
 * Must be called while the page is already on the app origin (not about:blank).
 */
async function seedCart(page: Page, items: CartItemSeed[]) {
  await page.evaluate(
    ({ key, cartState }) => {
      localStorage.setItem(key, JSON.stringify(cartState));
    },
    { key: CART_STORAGE_KEY, cartState: { items } },
  );
}

test.describe('Shopping cart management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate away from about:blank so localStorage is available for the correct origin,
    // then clear any pre-existing cart state.
    await page.goto('/');
    await page.evaluate((key) => localStorage.removeItem(key), CART_STORAGE_KEY);
  });

  // ── Empty cart ──────────────────────────────────────────────────────────────

  test('Empty cart shows a prompt to continue shopping', async ({ page }) => {
    // Given the cart is empty (cleared by beforeEach)
    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // Then I see the empty-state message
    await expect(page.locator('p:has-text("Your cart is empty.")')).toBeVisible();

    // And a prompt to add products
    await expect(
      page.locator('text=Add products to your cart to review quantity and totals here.'),
    ).toBeVisible();

    // And a "Continue Shopping" link
    await expect(page.locator('a:has-text("Continue Shopping")')).toBeVisible();
  });

  test('Continue Shopping link navigates to the product catalog', async ({ page }) => {
    // Given the cart is empty and I am on the cart page
    await page.goto('/cart');
    await expect(page.locator('p:has-text("Your cart is empty.")')).toBeVisible();

    // When I click "Continue Shopping"
    await page.click('a:has-text("Continue Shopping")');

    // Then I land on the product catalog page
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator('h1:has-text("Products")')).toBeVisible();
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  test('Navigate to the cart page via the navigation bar icon', async ({ page }) => {
    // Given I am on the home page
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    // When I click the shopping cart icon in the navigation bar
    await page.click('a[aria-label*="Shopping cart"]');

    // Then I land on the cart page
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();
  });

  test('Navigation badge reflects total item count', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 3
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 3 }]);

    // When I navigate to the home page (triggers a fresh mount that reads localStorage)
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    // Then the cart icon aria-label reflects 3 items
    await expect(page.locator('a[aria-label="Shopping cart with 3 items"]')).toBeVisible();

    // And the badge text is visible
    await expect(
      page.locator('a[aria-label="Shopping cart with 3 items"] span:has-text("3")'),
    ).toBeVisible();
  });

  // ── Item display ────────────────────────────────────────────────────────────

  test('Cart displays item name, unit, and quantity', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 2
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 2 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // Then I see the product name
    await expect(page.locator('text=SmartFeeder One').first()).toBeVisible();

    // And the unit label
    await expect(page.locator('text=Unit: piece')).toBeVisible();

    // And the quantity input reflects the seeded quantity
    const quantityInput = page.locator('input[aria-label="Quantity for SmartFeeder One"]');
    await expect(quantityInput).toHaveValue('2');
  });

  // ── Quantity controls ───────────────────────────────────────────────────────

  test('Increase item quantity using the plus button', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 1
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 1 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // And I click the increase quantity button
    await page.click('button[aria-label="Increase quantity of SmartFeeder One"]');

    // Then the quantity shows 2
    await expect(page.locator('input[aria-label="Quantity for SmartFeeder One"]')).toHaveValue('2');
  });

  test('Decrease item quantity using the minus button', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 3
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 3 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // And I click the decrease quantity button
    await page.click('button[aria-label="Decrease quantity of SmartFeeder One"]');

    // Then the quantity shows 2
    await expect(page.locator('input[aria-label="Quantity for SmartFeeder One"]')).toHaveValue('2');
  });

  test('Item quantity cannot be decreased below one', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 1
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 1 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // And I click the decrease quantity button
    await page.click('button[aria-label="Decrease quantity of SmartFeeder One"]');

    // Then the quantity remains 1 (cannot go below the minimum)
    await expect(page.locator('input[aria-label="Quantity for SmartFeeder One"]')).toHaveValue('1');

    // And the item is still in the cart
    await expect(page.locator('text=SmartFeeder One').first()).toBeVisible();
  });

  // ── Remove / clear ──────────────────────────────────────────────────────────

  test('Remove a single item from a multi-item cart', async ({ page }) => {
    // Given the cart contains two different items
    await seedCart(page, [
      { ...SMART_FEEDER, quantity: 1 },
      { ...PAWTRACK_COLLAR, quantity: 1 },
    ]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();
    await expect(page.locator('text=SmartFeeder One').first()).toBeVisible();
    await expect(page.locator('text=PawTrack Smart Collar').first()).toBeVisible();

    // And I click Remove for SmartFeeder One
    await page.click('button[aria-label="Remove SmartFeeder One from cart"]');

    // Then SmartFeeder One is no longer in the cart
    await expect(page.locator('text=SmartFeeder One')).not.toBeVisible();

    // But PawTrack Smart Collar remains
    await expect(page.locator('text=PawTrack Smart Collar').first()).toBeVisible();
  });

  test('Clear all cart items with the Clear Cart button', async ({ page }) => {
    // Given the cart contains two items
    await seedCart(page, [
      { ...SMART_FEEDER, quantity: 1 },
      { ...PAWTRACK_COLLAR, quantity: 2 },
    ]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();
    await expect(page.locator('text=SmartFeeder One').first()).toBeVisible();

    // And I click the Clear Cart button
    await page.click('button:has-text("Clear Cart")');

    // Then the empty-state message appears
    await expect(page.locator('p:has-text("Your cart is empty.")')).toBeVisible();
  });

  // ── Order summary ───────────────────────────────────────────────────────────

  test('Order summary shows subtotal, discount, shipping, and total', async ({ page }) => {
    // Given the cart contains PawTrack Smart Collar with quantity 1 (no discount, price $79.99)
    await seedCart(page, [{ ...PAWTRACK_COLLAR, quantity: 1 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    const aside = page.locator('aside');

    // Then the "Cart Total" section is visible
    await expect(aside.locator('h2:has-text("Cart Total")')).toBeVisible();

    // And the subtotal reflects the item price ($79.99)
    await expect(aside.locator('text=Subtotal')).toBeVisible();
    await expect(aside.locator(`text=$${PAWTRACK_COLLAR.price.toFixed(2)}`)).toBeVisible();

    // And the 5% discount row is shown
    await expect(aside.locator('text=Discount (5%)')).toBeVisible();

    // And the shipping fee of $10 is shown
    await expect(aside.locator('text=Shipping')).toBeVisible();
    await expect(aside.locator('text=$10.00')).toBeVisible();

    // And the final Total label is present
    await expect(aside.locator('text=Total').first()).toBeVisible();
  });

  // ── Coupon code ─────────────────────────────────────────────────────────────

  test('Coupon code hint appears when a code is entered', async ({ page }) => {
    // Given the cart contains an item
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 1 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // And I type a coupon code
    await page.locator('#coupon').fill('SAVE10');

    // Then the pending-checkout hint is shown
    await expect(
      page.locator(
        'text=Coupon validation will be available when checkout APIs are connected.',
      ),
    ).toBeVisible();
  });

  // ── Accessibility ───────────────────────────────────────────────────────────

  test('Cart page is keyboard navigable', async ({ page }) => {
    // Given the cart contains SmartFeeder One with quantity 1
    await seedCart(page, [{ ...SMART_FEEDER, quantity: 1 }]);

    // When I navigate to the cart page
    await page.goto('/cart');
    await expect(page.locator('h1:has-text("Shopping Cart")')).toBeVisible();

    // Then I can programmatically focus each interactive control

    // Decrease quantity button is focusable
    const decreaseBtn = page.locator(
      'button[aria-label="Decrease quantity of SmartFeeder One"]',
    );
    await decreaseBtn.focus();
    await expect(decreaseBtn).toBeFocused();

    // Increase quantity button is focusable
    const increaseBtn = page.locator(
      'button[aria-label="Increase quantity of SmartFeeder One"]',
    );
    await increaseBtn.focus();
    await expect(increaseBtn).toBeFocused();

    // Remove button is focusable
    const removeBtn = page.locator('button[aria-label="Remove SmartFeeder One from cart"]');
    await removeBtn.focus();
    await expect(removeBtn).toBeFocused();

    // Coupon input is focusable
    const couponInput = page.locator('#coupon');
    await couponInput.focus();
    await expect(couponInput).toBeFocused();

    // Proceed to Checkout button is focusable
    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
    await checkoutBtn.focus();
    await expect(checkoutBtn).toBeFocused();
  });
});
