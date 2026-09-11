/**
 * Walnut SDK Type Definitions
 * Generated from manifest v2.0.0
 * DO NOT EDIT — run "npm run generate:sdk" in walnut-agent to regenerate.
 */

/** Response object returned by HTTP methods */
export interface ApiResponse {
  /** HTTP status code */
  status: number;
  /** HTTP status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response body (JSON object or string) */
  body: any;
  /** Response time in milliseconds */
  responseTime: number;
}

/** Options for HTTP request methods */
export interface RequestOptions {
  /** Additional request headers */
  headers?: Record<string, string>;
  /** URL query parameters */
  params?: Record<string, string>;
  /** Request timeout in seconds */
  timeout?: number;
  /** Per-request authentication override */
  auth?: { type: 'bearer' | 'basic' | 'apiKey'; token?: string; username?: string; password?: string; key?: string; value?: string; in?: 'header' | 'query' };
}

/** Shared context available on all platforms */
export interface WalnutBaseContext {
  /** Platform discriminator — "web", "api", etc. */
  readonly platform: string;
  /** Base URL of the application under test */
  testBaseUrl: string;
  /** Resolved step arguments — values from ${...} placeholders in the step description, in order */
  readonly args: string[];
  /** Shared variable store across steps (read/write) */
  variableContext: Record<string, any>;

  /** Resolve {{variable}} placeholders in a string */
  replacePlaceholders(text: string): string;
  /** Output a debug log message from the custom method */
  log(message: string): void;
  /** Output a warning log message from the custom method */
  warn(message: string): void;
  /** Store a value in the shared variable context for use across steps */
  setVariable(name: string, value: any): void;
  /** Retrieve a value from the shared variable context */
  getVariable(name: string): any;
}

/** Browser automation via Playwright (platform: 'web') */
export interface WalnutWebContext extends WalnutBaseContext {
  readonly platform: 'web';

  /** Raw Playwright Page instance for advanced operations not covered by helper methods */
  page: any;

  // --- Element ---
  /** Click an element identified by a CSS/XPath selector */
  click(selector: string): Promise<void>;
  /** Type text into an input element (clears first) */
  type(selector: string, text: string): Promise<void>;
  /** Fill an input element with text (clears first, fires input event) */
  fill(selector: string, text: string): Promise<void>;
  /** Select an option from a <select> element */
  selectOption(selector: string, value: string): Promise<void>;
  /** Hover over an element */
  hover(selector: string): Promise<void>;
  /** Double-click an element */
  dblclick(selector: string): Promise<void>;
  /** Focus an element */
  focus(selector: string): Promise<void>;
  /** Blur (unfocus) an element */
  blur(selector: string): Promise<void>;
  /** Press a keyboard key or combination (e.g. "Enter", "Control+A") */
  pressKey(key: string): Promise<void>;
  /** Drag from source element to target element */
  drag(sourceSelector: string, targetSelector: string): Promise<void>;
  /** Upload a file to a file input element */
  fileUpload(selector: string, filePath: string): Promise<void>;
  /** Tap an element (for touch-enabled contexts) */
  tap(selector: string): Promise<void>;
  /** Check a checkbox element */
  check(selector: string): Promise<void>;
  /** Uncheck a checkbox element */
  uncheck(selector: string): Promise<void>;
  /** Clear the value of an input element */
  clear(selector: string): Promise<void>;

  // --- Navigation ---
  /** Navigate to a URL */
  navigate(url: string): Promise<void>;
  /** Navigate back in browser history */
  navigateBack(): Promise<void>;
  /** Reload the current page */
  reload(): Promise<void>;
  /** Navigate forward in browser history */
  goForward(): Promise<void>;
  /** Close the current page/tab */
  close(): Promise<void>;

  // --- Verification ---
  /** Assert that an element is visible (throws on failure) */
  verifyElementVisible(selector: string): Promise<void>;
  /** Assert that an element is hidden or absent (throws on failure) */
  verifyElementHidden(selector: string): Promise<void>;
  /** Assert that the given text is visible on the page (throws on failure) */
  verifyTextVisible(text: string): Promise<void>;
  /** Assert that an input element has the expected value (throws on failure) */
  verifyValue(selector: string, expectedValue: string): Promise<void>;
  /** Assert that the current URL contains the given substring (throws on failure) */
  verifyUrlContains(substring: string): Promise<void>;
  /** Wait for URL to match a pattern (throws on timeout) */
  verifyNavigation(urlPattern: string): Promise<void>;

  // --- Wait ---
  /** Wait for an element to become visible */
  waitForVisible(selector: string, opts?: { timeout?: number }): Promise<void>;
  /** Wait for an element to become hidden */
  waitForHidden(selector: string, opts?: { timeout?: number }): Promise<void>;
  /** Wait for a fixed number of milliseconds */
  wait(ms: number): Promise<void>;
  /** Wait for page navigation to complete */
  waitForNavigation(opts?: { timeout?: number }): Promise<void>;
  /** Wait until the URL matches the given pattern */
  waitForUrl(urlPattern: string, opts?: { timeout?: number }): Promise<void>;
  /** Wait for an element to be attached to the DOM */
  waitForAttached(selector: string, opts?: { timeout?: number }): Promise<void>;
  /** Wait for an element to be detached from the DOM */
  waitForDetached(selector: string, opts?: { timeout?: number }): Promise<void>;

  // --- Query ---
  /** Get the text content of an element */
  getText(selector: string): Promise<string>;
  /** Get an attribute value from an element */
  getAttribute(selector: string, attribute: string): Promise<string | null>;
  /** Get the current value of an input element */
  getInputValue(selector: string): Promise<string>;
  /** Get the current page URL */
  getUrl(): string;
  /** Get the current page title */
  getTitle(): Promise<string>;
  /** Count the number of elements matching a selector */
  count(selector: string): Promise<number>;
  /** Check if an element is visible (returns boolean, does not throw) */
  isVisible(selector: string): Promise<boolean>;
  /** Check if an element is enabled (returns boolean, does not throw) */
  isEnabled(selector: string): Promise<boolean>;
  /** Check if a checkbox is checked (returns boolean, does not throw) */
  isChecked(selector: string): Promise<boolean>;

  // --- Mouse ---
  /** Click at absolute page coordinates (x, y) */
  mouseClick(x: number, y: number): Promise<void>;
  /** Move the mouse to absolute page coordinates (x, y) */
  mouseMove(x: number, y: number): Promise<void>;
  /** Drag from one coordinate to another */
  mouseDrag(fromX: number, fromY: number, toX: number, toY: number): Promise<void>;

  // --- Layout ---
  /** Set the browser viewport dimensions for responsive testing */
  setViewportSize(width: number, height: number): Promise<void>;

  // --- Tab ---
  /** Switch to a browser tab by index (0-based) */
  switchToTab(index: number): Promise<void>;
  /** Get the number of open browser tabs */
  getTabCount(): number;

  // --- Advanced ---
  /** Execute JavaScript in the browser context and return the result */
  evaluate(script: string): Promise<any>;
  /** Take a screenshot of the current page */
  screenshot(opts?: { fullPage?: boolean }): Promise<Buffer>;
  /** Scroll the page or a specific element */
  scroll(opts?: { selector?: string; direction?: 'up' | 'down'; amount?: number }): Promise<void>;
  /** Handle a browser dialog (alert, confirm, prompt). Call BEFORE the dialog appears. */
  handleDialog(action: 'accept' | 'dismiss', promptText?: string): Promise<void>;

}

/** HTTP request automation (platform: 'api') */
export interface WalnutApiContext extends WalnutBaseContext {
  readonly platform: 'api';

  // --- HTTP ---
  /** Send an HTTP request with any method */
  request(method: string, url: string, body?: any, opts?: RequestOptions): Promise<ApiResponse>;
  /** Send an HTTP GET request */
  get(url: string, opts?: RequestOptions): Promise<ApiResponse>;
  /** Send an HTTP POST request */
  post(url: string, body?: any, opts?: RequestOptions): Promise<ApiResponse>;
  /** Send an HTTP PUT request */
  put(url: string, body?: any, opts?: RequestOptions): Promise<ApiResponse>;
  /** Send an HTTP PATCH request */
  patch(url: string, body?: any, opts?: RequestOptions): Promise<ApiResponse>;
  /** Send an HTTP DELETE request */
  delete(url: string, opts?: RequestOptions): Promise<ApiResponse>;

  // --- State ---
  /** Set a default header for all subsequent requests in this method */
  setHeader(name: string, value: string): void;
  /** Set authentication for all subsequent requests in this method */
  setAuth(type: 'bearer' | 'basic' | 'apiKey', credentials: Record<string, string>): void;
  /** Get cookies from the cookie jar for a URL */
  getCookies(url?: string): Promise<string>;
  /** Set a cookie in the cookie jar */
  setCookie(cookie: string, url: string): Promise<void>;

  // --- Response ---
  /** Extract a value from response body using JSON path (e.g. "data.user.id") */
  extractFromBody(response: ApiResponse, jsonPath: string): any;

  // --- Assertion ---
  /** Assert response status code equals expected (throws on mismatch) */
  assertStatus(response: ApiResponse, expected: number): void;
  /** Assert response body contains a text substring (throws on mismatch) */
  assertBodyContains(response: ApiResponse, text: string): void;
  /** Assert response time is within limit (throws if exceeded) */
  assertResponseTime(response: ApiResponse, maxMs: number): void;
  /** Assert a response header equals expected value (throws on mismatch) */
  assertHeader(response: ApiResponse, headerName: string, expected: string): void;
  /** Assert a JSON path value equals expected (throws on mismatch) */
  assertBodyEquals(response: ApiResponse, jsonPath: string, expected: any): void;
  /** Assert a JSON path value matches a regex pattern (throws on mismatch) */
  assertBodyMatches(response: ApiResponse, jsonPath: string, regex: string): void;

}

/** Context passed to custom method functions */
export type WalnutContext = WalnutWebContext | WalnutApiContext;
