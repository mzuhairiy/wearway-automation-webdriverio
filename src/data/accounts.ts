// Synthetic local-only seed accounts, verified in docs/sut/QA-HANDOFF.md §3.
// Environment overrides are for synthetic test personas only.
export const accounts = {
  primary: {
    email: process.env.PRIMARY_EMAIL || 'customer@example.com',
    password: process.env.PRIMARY_PASSWORD || 'Customer123!',
  },
  secondary: {
    email: process.env.SECONDARY_EMAIL || 'customer2@example.com',
    password: process.env.SECONDARY_PASSWORD || 'Customer123!',
  },
} as const;

export const invalidLogin = {
  email: accounts.primary.email,
  password: `${accounts.primary.password}-invalid`,
} as const;
