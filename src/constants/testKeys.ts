// Exact values from SUT 4073126 + user's Categories key attachment on 2026-11-03.
export const testKeys = {
  homeScreen: 'home_screen',
  categoriesScreen: 'categories_screen',
  bottomNavBar: 'bottom_nav_bar',
  navHome: 'nav_home',
  navCategories: 'nav_categories',
  navProfile: 'nav_profile',
  profileScreen: 'profile_screen',
  profileEmail: 'profile_email',
  loginPromptButton: 'login_prompt_button',
  logoutButton: 'logout_button',
  loginScreen: 'login_screen',
  loginEmailInput: 'login_email_input',
  loginPasswordInput: 'login_password_input',
  loginSubmitButton: 'login_submit_button',
  loginErrorMessage: 'login_error_message',
  categoryGridItem: (slug: string) => `category_grid_item_${slug}`,
} as const;
