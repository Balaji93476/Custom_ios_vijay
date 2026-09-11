import type { WalnutIosContext } from './walnut';

/** @walnut_method
 * name: iOS Type Text into Element
 * description: Type ${text} into the linked element
 * actionType: custom_ios_type_text
 * context: ios
 * needsLocator: true
 * category: iOS Device
 */
export async function iosTypeText(ctx: WalnutIosContext) {
  // ctx.locator — XPath of the linked object (available because needsLocator: true)
  // ctx.args[0] — resolved value of ${text} from the step description
  const text = ctx.args[0];

  if (!ctx.locator) {
    throw new Error('No element linked to this step. Please link an object in the test step.');
  }

  if (!text) {
    throw new Error('Missing parameter: ${text} must be provided in the step description.');
  }

  await ctx.clear(ctx.locator);
  await ctx.type(ctx.locator, text);
  ctx.log('Typed "' + text + '" into element: ' + ctx.locator);
}
