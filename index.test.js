import {
  jest,
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";
import Cookies from "./src/index.js";

const addCookiesToDocument = (document) => {
  let _cookies = {};
  document.__defineGetter__("cookie", () => {
    return Object.keys(_cookies)
      .map((key) => `${key}=${_cookies[key]}`)
      .join("; ");
  });
  document.__defineSetter__("cookie", (s) => {
    const keyValue = s.trim().split("=");
    const key = keyValue[0].trim();
    const values = keyValue[1].trim().split(";");
    const value = values[0];
    _cookies[key] = value;
    return `${key}=${value}`;
  });
  document.clearAllCookies = () => {
    _cookies = {};
  };
};

addCookiesToDocument(document);

describe("No existing cookies", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  afterEach(() => {
    document.clearAllCookies();
    new Cookies().destroyInstance();
  });

  test("Initialisation", async () => {
    expect(document.cookie).toEqual("");

    const cookies = new Cookies();
    expect(cookies).toHaveProperty("all");
    expect(cookies).toBeInstanceOf(Cookies);

    expect(document.cookie).not.toEqual("");
  });

  test("Initialisation with custom properties", async () => {
    expect(document.cookie).toEqual("");

    const cookies = new Cookies({
      defaultDomain: "example.com",
      defaultPath: "/custom",
      secure: true,
      policiesKey: "cookies_policy_custom",
      defaultAge: 300,
    });
    expect(cookies.defaultDomain).toEqual("example.com");
    expect(cookies.defaultPath).toEqual("/custom");
    expect(cookies.secure).toEqual(true);
    expect(cookies.policiesKey).toEqual("cookies_policy_custom");
    expect(cookies.defaultAge).toEqual(300);

    expect(document.cookie).not.toEqual("");
  });

  test("Initialisation with debug", async () => {
    expect(document.documentElement.dataset.tnaFrontendDebug).toEqual(
      undefined,
    );
    document.documentElement.dataset.tnaFrontendDebug = true;
    expect(document.documentElement.dataset.tnaFrontendDebug).toEqual("true");

    const cookies = new Cookies();
    expect(cookies.debug).toEqual(true);
    expect(cookies.events.debug).toEqual(true);

    const mockDebug = jest.fn();
    cookies.log = mockDebug;
    const mockEventsDebug = jest.fn();
    cookies.events.log = mockEventsDebug;

    const testKey = "foo";
    const testValue = "bar";

    cookies.on("set", () => {
      console.log("Set!");
    });
    cookies.set(testKey, testValue);

    expect(mockDebug.mock.calls).toHaveLength(2);
    expect(mockDebug.mock.calls[0][0]).toStrictEqual(
      "Adding event listener for: set",
    );
    expect(mockDebug.mock.calls[1][0]).toStrictEqual("Set cookie:");
    expect(mockDebug.mock.calls[1][1]).toStrictEqual({
      cookie:
        "foo=bar; domain=localhost; samesite=Lax; path=/; max-age=31536000; secure",
      domain: "localhost",
      key: "foo",
      maxAge: 31536000,
      path: "/",
      sameSite: "Lax",
      secure: true,
      session: false,
      value: "bar",
    });

    // expect(mockEventsDebug.mock.calls).toHaveLength(2);
    // expect(mockEventsDebug.mock.calls[0][0]).toStrictEqual(
    //   "Adding event listener for: set",
    // );
    // expect(mockEventsDebug.mock.calls[1][0]).toStrictEqual("Set cookie:");
    // expect(mockEventsDebug.mock.calls[1][1]).toStrictEqual({
    //   cookie:
    //     "foo=bar; domain=localhost; samesite=Lax; path=/; max-age=31536000; secure",
    //   domain: "localhost",
    //   key: "foo",
    //   maxAge: 31536000,
    //   path: "/",
    //   sameSite: "Lax",
    //   secure: true,
    //   session: false,
    //   value: "bar",
    // });
  });

  test("Initialisation with new instance shares events", async () => {
    const cookies1 = new Cookies();
    expect(cookies1.events.events).not.toHaveProperty("set");
    cookies1.on("set", () => {});
    expect(cookies1.events.events).toHaveProperty("set");
    expect(cookies1.events.events.set).toHaveLength(1);

    const cookies2 = new Cookies();
    expect(cookies2.events.events).toHaveProperty("set");
    expect(cookies2.events.events.set).toHaveLength(1);

    const cookies3 = new Cookies({ newInstance: true });
    expect(cookies3.events.events).toHaveProperty("set");
    expect(cookies3.events.events.set).toHaveLength(1);

    cookies1.destroyInstance();
    cookies2.destroyInstance();
    cookies3.destroyInstance();

    const cookies4 = new Cookies({ newInstance: true });
    expect(cookies4.events.events).toHaveProperty("set");
    expect(cookies4.events.events.set).toHaveLength(1);
  });

  test("Getting/setting", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("get");
    expect(cookies).toHaveProperty("set");
    expect(cookies).toHaveProperty("exists");
    expect(cookies).toHaveProperty("hasValue");

    expect(Object.keys(cookies.all)).toHaveLength(1);

    const testKey = "foo";
    const testValue = "bar";

    expect(cookies.all).not.toHaveProperty(testKey);
    expect(cookies.exists(testKey)).toEqual(false);

    cookies.set(testKey, testValue);

    expect(Object.keys(cookies.all)).toHaveLength(2);

    expect(cookies.all).toHaveProperty(testKey);
    expect(cookies.all[testKey]).toEqual(testValue);
    expect(cookies.exists(testKey)).toEqual(true);
    expect(cookies.get(testKey)).toEqual(testValue);
    expect(cookies.hasValue(testKey, testValue)).toEqual(true);
    expect(cookies.hasValue(testKey, "different")).toEqual(false);
  });

  test("Initial policies", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("policies");

    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.policies.essential).toEqual(true);
    expect(JSON.parse(cookies.get("cookies_policy"))).toHaveProperty(
      "essential",
    );
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.policies.settings).toEqual(false);
    expect(JSON.parse(cookies.get("cookies_policy"))).toHaveProperty(
      "settings",
    );
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.policies.usage).toEqual(false);
    expect(JSON.parse(cookies.get("cookies_policy"))).toHaveProperty("usage");
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.policies.marketing).toEqual(false);
    expect(JSON.parse(cookies.get("cookies_policy"))).toHaveProperty(
      "marketing",
    );
  });

  test("Get policies", async () => {
    const cookies = new Cookies();

    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(() => cookies.isPolicyAccepted("foobar")).toThrow(
      new Error("Policy 'foobar' does not exist"),
    );
  });

  test("Accept policy", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("isPolicyAccepted");

    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);

    cookies.acceptPolicy("settings");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);

    cookies.acceptPolicy("usage");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);

    cookies.acceptPolicy("marketing");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);
  });

  test("Accept non-existent policy", async () => {
    const cookies = new Cookies();

    expect(() => cookies.acceptPolicy("foobar")).toThrow(Error);
  });

  test("Reject non-existent policy", async () => {
    const cookies = new Cookies();

    expect(() => cookies.rejectPolicy("foobar")).toThrow(Error);
  });

  test("Set non-existent policy", async () => {
    const cookies = new Cookies();

    expect(() => cookies.setPolicy("foobar", true)).toThrow(Error);
  });

  test("Accept all policies", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("acceptAllPolicies");

    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);

    cookies.acceptAllPolicies();
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);
  });

  test("Reject policy", async () => {
    const cookies = new Cookies();

    cookies.acceptPolicy("settings");
    cookies.acceptPolicy("usage");
    cookies.acceptPolicy("marketing");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);

    cookies.rejectPolicy("settings");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);

    cookies.rejectPolicy("usage");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);

    cookies.rejectPolicy("marketing");
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });

  test("Reject all policies", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("rejectAllPolicies");

    cookies.acceptAllPolicies();
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies.usage).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies.marketing).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);

    cookies.rejectAllPolicies();
    expect(cookies.policies.essential).toEqual(true);
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies.settings).toEqual(false);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies.usage).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies.marketing).toEqual(false);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });

  test("Protected essential policy", async () => {
    const cookies = new Cookies();

    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);

    cookies.acceptPolicy("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);

    cookies.rejectPolicy("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);

    cookies.rejectAllPolicies();
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
  });

  test("Basic events", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("on");

    const mockCallback = jest.fn();
    cookies.on("setCookie", mockCallback);
    const testKey = "foo";
    const testValue = "bar";

    cookies.set(testKey, testValue);

    expect(mockCallback.mock.calls).toHaveLength(1);
    expect(mockCallback.mock.calls[0][0]).toStrictEqual({
      key: testKey,
      value: testValue,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
      secure: true,
      maxAge: 31536000,
      session: false,
      cookie: `${testKey}=${testValue}; domain=localhost; samesite=Lax; path=/; max-age=31536000; secure`,
    });

    cookies.set(testKey, testValue, { session: true });

    expect(mockCallback.mock.calls).toHaveLength(2);
    expect(mockCallback.mock.calls[1][0]).toStrictEqual({
      key: testKey,
      value: testValue,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
      secure: true,
      maxAge: 31536000,
      session: true,
      cookie: `${testKey}=${testValue}; domain=localhost; samesite=Lax; path=/; secure`,
    });

    cookies.set(testKey, testValue, { secure: false });

    expect(mockCallback.mock.calls).toHaveLength(3);
    expect(mockCallback.mock.calls[2][0]).toStrictEqual({
      key: testKey,
      value: testValue,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
      secure: false,
      maxAge: 31536000,
      session: false,
      cookie: `${testKey}=${testValue}; domain=localhost; samesite=Lax; path=/; max-age=31536000`,
    });
  });

  test("All events", async () => {
    const cookies = new Cookies();

    const mockSetCookieCallback = jest.fn();
    cookies.on("setCookie", mockSetCookieCallback);
    const mockDeleteCookieCallback = jest.fn();
    cookies.on("deleteCookie", mockDeleteCookieCallback);
    const mockDeleteAllCookiesCallback = jest.fn();
    cookies.on("deleteAllCookies", mockDeleteAllCookiesCallback);
    const mockAcceptPolicyCallback = jest.fn();
    cookies.on("acceptPolicy", mockAcceptPolicyCallback);
    const mockRejectPolicyCallback = jest.fn();
    cookies.on("rejectPolicy", mockRejectPolicyCallback);
    const mockAcceptAllPoliciesCallback = jest.fn();
    cookies.on("acceptAllPolicies", mockAcceptAllPoliciesCallback);
    const mockRejectAllPoliciesCallback = jest.fn();
    cookies.on("rejectAllPolicies", mockRejectAllPoliciesCallback);
    const mockChangePolicyCallback = jest.fn();
    cookies.on("changePolicy", mockChangePolicyCallback);

    const testKey = "foo";
    const testValue = "bar";
    cookies.set(testKey, testValue);
    cookies.delete(testKey);
    cookies.acceptPolicy("settings");
    cookies.rejectPolicy("settings");
    cookies.setPolicy("settings", true);
    cookies.acceptAllPolicies();
    cookies.rejectAllPolicies();
    cookies.deleteAll();

    expect(mockSetCookieCallback.mock.calls).toHaveLength(9);
    expect(mockDeleteCookieCallback.mock.calls).toHaveLength(3);
    expect(mockDeleteAllCookiesCallback.mock.calls).toHaveLength(1);
    expect(mockAcceptPolicyCallback.mock.calls).toHaveLength(1);
    expect(mockRejectPolicyCallback.mock.calls).toHaveLength(1);
    expect(mockAcceptAllPoliciesCallback.mock.calls).toHaveLength(1);
    expect(mockRejectAllPoliciesCallback.mock.calls).toHaveLength(1);
    expect(mockChangePolicyCallback.mock.calls).toHaveLength(7);
  });

  test("Shared events", async () => {
    const mockCallback = jest.fn();

    const cookies1 = new Cookies();

    const cookies2 = new Cookies();
    cookies2.on("setCookie", mockCallback);

    const testKey = "foo";
    const testValue = "bar";

    expect(mockCallback.mock.calls).toHaveLength(0);

    cookies1.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(1);

    cookies1.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(2);

    cookies2.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(3);
  });

  test("One-time events", async () => {
    const mockCallback = jest.fn();

    const cookies = new Cookies();

    cookies.once("setCookie", mockCallback);

    const testKey = "foo";
    const testValue = "bar";

    expect(mockCallback.mock.calls).toHaveLength(0);

    cookies.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(1);

    cookies.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(1);
  });

  test("Custom policy key", async () => {
    const cookies = new Cookies({ policiesKey: ["custom"] });

    expect(cookies.all).not.toHaveProperty("cookies_policy");
    expect(cookies.all).toHaveProperty("custom");

    expect(cookies.policies.settings).toEqual(false);

    cookies.acceptAllPolicies();
    expect(cookies.policies.settings).toEqual(true);
  });
});

describe("Existing cookies", () => {
  beforeEach(() => {
    document.clearAllCookies();
    document.cookie =
      "cookies_policy=%7B%22usage%22%3Afalse%2C%22settings%22%3Atrue%2C%22essential%22%3Atrue%2C%22marketing%22%3Afalse%7D";
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies.policiesCorrectOnInit).toEqual(true);
    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });

  test("Update policies", async () => {
    const cookies = new Cookies();
    cookies.acceptPolicy("usage");
    cookies.rejectPolicy("settings");
    cookies.acceptPolicy("marketing");

    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);
  });
});

describe("Existing empty cookie policies", () => {
  beforeEach(() => {
    document.clearAllCookies();
    document.cookie = "cookies_policy=%7B%7D";
    new Cookies().destroyInstance();
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });
});

describe("Existing partial cookie policies", () => {
  beforeEach(() => {
    document.clearAllCookies();
    document.cookie = "cookies_policy=%7B%22usage%22%3Atrue%7D";
    new Cookies().destroyInstance();
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });
});

describe("Existing unknown cookie policies", () => {
  beforeEach(() => {
    document.clearAllCookies();
    document.cookie = "cookies_policy=%7B%22custom%22%3Atrue%7D";
    new Cookies().destroyInstance();
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
    expect(cookies.policies).not.toHaveProperty("custom");
  });
});

describe("Existing malformed cookie policies", () => {
  beforeEach(() => {
    document.clearAllCookies();
    document.cookie = "cookies_policy=foobar";
    new Cookies().destroyInstance();
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.policies).toHaveProperty("essential");
    expect(cookies.isPolicyAccepted("essential")).toEqual(true);
    expect(cookies.policies).toHaveProperty("settings");
    expect(cookies.isPolicyAccepted("settings")).toEqual(false);
    expect(cookies.policies).toHaveProperty("usage");
    expect(cookies.isPolicyAccepted("usage")).toEqual(false);
    expect(cookies.policies).toHaveProperty("marketing");
    expect(cookies.isPolicyAccepted("marketing")).toEqual(false);
  });
});

describe("No initialisation", () => {
  beforeEach(() => {
    document.clearAllCookies();
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Initialisation", async () => {
    const cookies = new Cookies({ noInit: true });

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).not.toHaveProperty("cookies_policy");
  });
});

describe("Custom cookies", () => {
  beforeEach(() => {
    document.cookie = "foo=bar; alpha=";
    delete document.documentElement.dataset.tnaFrontendDebug;
    delete window.TNAFrontendCookies;
    delete window.TNAFrontendCookieEvents;
  });

  test("Get", async () => {
    const cookies = new Cookies();

    expect(cookies.get("foo")).toEqual("bar");
  });

  test("Get non-existant", async () => {
    const cookies = new Cookies();

    expect(cookies.get("bar")).toEqual(undefined);
  });

  test("Get with no key", async () => {
    const cookies = new Cookies();

    expect(cookies.get(null)).toEqual(undefined);
    expect(cookies.get("")).toEqual(undefined);
  });

  test("Get empty value", async () => {
    const cookies = new Cookies();

    expect(cookies.get("alpha")).toEqual(undefined);
  });

  test("Set with no key or value", async () => {
    const cookies = new Cookies();

    cookies.set(null, "foobar");
    cookies.set(null);
  });

  // TODO
  // test("Deletion", async () => {
  //   const cookies = new Cookies();
  //   expect(cookies).toHaveProperty("delete");

  //   const testKey = "foo2";
  //   const testValue = "bar2";

  //   cookies.set(testKey, testValue);

  //   expect(cookies.all).toHaveProperty(testKey);
  //   expect(cookies.all[testKey]).toEqual(testValue);
  //   expect(cookies.exists(testKey)).toEqual(true);
  //   expect(cookies.get(testKey)).toEqual(testValue);

  //   cookies.delete(testKey);

  //   expect(cookies.all).not.toHaveProperty(testKey);
  //   expect(cookies.exists(testKey)).toEqual(false);
  //   expect(cookies.get(testKey)).toEqual("");
  // });

  test("Deletion of all", async () => {
    const cookies = new Cookies();

    const testKeys = ["foo", "bar"];
    const testValue = "testValue";

    testKeys.forEach((testKey) => cookies.set(testKey, testValue));

    testKeys.forEach((testKey) => {
      expect(cookies.get(testKey)).toEqual(testValue);
    });

    cookies.deleteAll();

    testKeys.forEach((testKey) => {
      expect(cookies.get(testKey)).toEqual("");
    });
  });
});
