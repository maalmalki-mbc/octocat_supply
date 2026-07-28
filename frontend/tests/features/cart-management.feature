Feature: Shopping Cart Management
  As a supply chain planner
  I want to manage items in my shopping cart
  So that I can review quantities and totals before proceeding to checkout

  # ─── Coverage Matrix ────────────────────────────────────────────────────────
  # Scenario                                  │ Happy │ Edge │ Error │ A11y
  # ─────────────────────────────────────────────────────────────────────────────
  # Empty cart state                          │       │  ✓   │       │
  # Continue Shopping link                    │  ✓    │      │       │
  # Navigate to cart via nav icon             │  ✓    │      │       │
  # Navigation badge item count               │  ✓    │      │       │
  # Display item details                      │  ✓    │      │       │
  # Increase quantity                         │  ✓    │      │       │
  # Decrease quantity                         │  ✓    │      │       │
  # Quantity cannot go below one              │       │  ✓   │       │
  # Remove a single item                      │  ✓    │      │       │
  # Clear all cart items                      │  ✓    │      │       │
  # Order summary: subtotal/discount/shipping │  ✓    │      │       │
  # Coupon code hint                          │       │  ✓   │       │
  # Keyboard navigation                       │       │      │       │  ✓
  # ─────────────────────────────────────────────────────────────────────────────

  Scenario: Empty cart shows a prompt to continue shopping
    Given the cart is empty
    When I navigate to the cart page
    Then I see the message "Your cart is empty."
    And I see a prompt to add products to the cart
    And I see a "Continue Shopping" link

  Scenario: Continue Shopping link navigates to the product catalog
    Given the cart is empty
    And I am on the cart page
    When I click the "Continue Shopping" link
    Then I land on the product catalog page
    And I see the catalog header "Products"

  Scenario: Navigate to the cart page via the navigation bar icon
    Given I am on the home page
    When I click the shopping cart icon in the navigation bar
    Then I land on the cart page
    And I see the header "Shopping Cart"

  Scenario: Navigation badge reflects the total item count
    Given the cart contains "SmartFeeder One" with quantity 3
    When I navigate to the home page
    Then the cart icon badge shows 3 items

  Scenario: Cart displays item name, unit, and quantity
    Given the cart contains "SmartFeeder One" with quantity 2
    When I navigate to the cart page
    Then I see the product name "SmartFeeder One"
    And I see the unit "piece"
    And the quantity input shows 2

  Scenario: Increase an item quantity using the plus button
    Given the cart contains "SmartFeeder One" with quantity 1
    When I navigate to the cart page
    And I click the increase quantity button for "SmartFeeder One"
    Then the quantity for "SmartFeeder One" shows 2

  Scenario: Decrease an item quantity using the minus button
    Given the cart contains "SmartFeeder One" with quantity 3
    When I navigate to the cart page
    And I click the decrease quantity button for "SmartFeeder One"
    Then the quantity for "SmartFeeder One" shows 2

  Scenario: Item quantity cannot be decreased below one
    Given the cart contains "SmartFeeder One" with quantity 1
    When I navigate to the cart page
    And I click the decrease quantity button for "SmartFeeder One"
    Then the quantity for "SmartFeeder One" still shows 1
    And "SmartFeeder One" remains in the cart

  Scenario: Remove a single item from the cart
    Given the cart contains "SmartFeeder One" with quantity 1
    And the cart contains "PawTrack Smart Collar" with quantity 1
    When I navigate to the cart page
    And I click Remove for "SmartFeeder One"
    Then "SmartFeeder One" is no longer shown in the cart
    And "PawTrack Smart Collar" is still shown in the cart

  Scenario: Clear all cart items with the Clear Cart button
    Given the cart contains "SmartFeeder One" with quantity 1
    And the cart contains "PawTrack Smart Collar" with quantity 2
    When I navigate to the cart page
    And I click the "Clear Cart" button
    Then I see the message "Your cart is empty."

  Scenario: Order summary shows subtotal, discount, shipping, and total
    Given the cart contains "PawTrack Smart Collar" with quantity 1
    When I navigate to the cart page
    Then I see the "Cart Total" section
    And the subtotal shows "$79.99"
    And the discount row shows "Discount (5%)"
    And the shipping row shows "$10.00"
    And the total row is visible

  Scenario: Coupon code hint appears when a code is entered
    Given the cart contains "SmartFeeder One" with quantity 1
    And I am on the cart page
    When I type a coupon code "SAVE10"
    Then a hint appears that coupon validation will be available when checkout APIs are connected

  Scenario: Cart page is keyboard navigable
    Given the cart contains "SmartFeeder One" with quantity 1
    When I navigate to the cart page
    Then I can focus the decrease quantity button for "SmartFeeder One"
    And I can focus the increase quantity button for "SmartFeeder One"
    And I can focus the remove button for "SmartFeeder One"
    And I can focus the coupon code input
    And I can focus the "Proceed to Checkout" button
