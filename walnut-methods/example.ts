import type { WalnutWebContext } from './walnut';

/** @walnut_method
 * name: Login to Application
 * description: Login with ${username} and ${password}
 * actionType: custom_login
 * context: web
 * needsLocator: false
 * category: Authentication
 */
export async function login(ctx: WalnutWebContext) {
  // ctx.args contains resolved values from ${...} placeholders in the description, in order
  await ctx.navigate(ctx.testBaseUrl + '/login');
  await ctx.type('[data-testid="username"]', ctx.args[0]);
  await ctx.type('[data-testid="password"]', ctx.args[1]);
  await ctx.click('[data-testid="submit"]');
  await ctx.verifyTextVisible('Dashboard');
}
