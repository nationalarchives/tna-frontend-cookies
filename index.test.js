import { vi, expect, test, describe, beforeEach, afterEach } from "vitest";
import Cookies from "./src/index.js";

const clearAllCookies = () =>
  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });

beforeEach(() => {
  delete window.TNAFrontendCookies;
  delete window.TNAFrontendCookieEvents;
  delete document.documentElement.dataset.tnaCookiesDomain;
  delete document.documentElement.dataset.tnaCookiesPath;
  delete document.documentElement.dataset.tnaCookiesSecure;
  delete document.documentElement.dataset.tnaCookiesPoliciesKey;
  delete document.documentElement.dataset.tnaCookiesDefaultAge;
});

afterEach(() => {
  clearAllCookies();
});

describe("Basic functions", () => {
  test("Class properties", async () => {
    const cookies = new Cookies();

    expect(cookies).toHaveProperty("get");
    expect(cookies).toHaveProperty("set");
    expect(cookies).toHaveProperty("exists");
    expect(cookies).toHaveProperty("hasValue");
  });

  test("Add", async () => {
    const cookies = new Cookies();

    const testKey = "foo";
    const testValue = "bar";

    expect(cookies.all).not.toHaveProperty(testKey);
    expect(cookies.exists(testKey)).toEqual(false);

    cookies.set(testKey, testValue);

    expect(cookies.all).toHaveProperty(testKey);
    expect(cookies.all[testKey]).toEqual(testValue);
    expect(cookies.exists(testKey)).toEqual(true);
    expect(cookies.get(testKey)).toEqual(testValue);
    expect(cookies.hasValue(testKey, testValue)).toEqual(true);
  });

  test("Update", async () => {
    const testKey = "foo";
    const testValue = "bar";

    const cookies = new Cookies();

    cookies.set(testKey, testValue);
    expect(cookies.hasValue(testKey, testValue)).toEqual(true);

    const newTestValue = "baz";
    cookies.set(testKey, newTestValue);
    expect(cookies.hasValue(testKey, newTestValue)).toEqual(true);
  });

  test("Delete", async () => {
    const testKey = "foo";
    const testValue = "bar";

    const cookies = new Cookies();
    cookies.set(testKey, testValue);
    expect(cookies.exists(testKey)).toEqual(true);

    cookies.delete(testKey);
    expect(cookies.exists(testKey)).toEqual(false);
  });

  test("Delete all", async () => {
    const testKey = "foo";
    const testValue = "bar";

    const cookies = new Cookies();
    cookies.set(testKey, testValue);
    expect(cookies.exists(testKey)).toEqual(true);

    cookies.deleteAll();
    expect(cookies.exists(testKey)).toEqual(false);
  });

  describe("Existing cookies", () => {
    beforeEach(() => {
      document.cookie = "foo=bar; alpha=";
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

    test("Deletion", async () => {
      const cookies = new Cookies();
      expect(cookies).toHaveProperty("delete");

      const testKey = "foo2";
      const testValue = "bar2";

      cookies.set(testKey, testValue);

      expect(cookies.all).toHaveProperty(testKey);
      expect(cookies.all[testKey]).toEqual(testValue);
      expect(cookies.exists(testKey)).toEqual(true);
      expect(cookies.get(testKey)).toEqual(testValue);

      cookies.delete(testKey);

      expect(cookies.all).not.toHaveProperty(testKey);
      expect(cookies.exists(testKey)).toEqual(false);
      expect(cookies.get(testKey)).toEqual(undefined);
    });

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
        expect(cookies.get(testKey)).toEqual(undefined);
      });
    });
  });
});

describe("IIFE", () => {
  test("Singleton", async () => {
    expect(window.TNAFrontendCookies).toBeFalsy();

    const cookies1 = (await import("./src/iife.js")).default;

    expect(window.TNAFrontendCookies).not.toBeFalsy();

    expect(cookies1).not.toHaveProperty("customProperty");
    cookies1.customProperty = "testValue";
    expect(cookies1).toHaveProperty("customProperty");

    const cookies2 = (await import("./src/iife.js")).default;

    expect(window.TNAFrontendCookies).not.toBeFalsy();

    const { policiesCorrectOnInit1, ...cookies1Properties } = cookies1;
    const { policiesCorrectOnInit2, ...cookies2Properties } = cookies2;
    expect(cookies1Properties).toEqual(cookies2Properties);
    expect(cookies2).toHaveProperty("customProperty");
  });

  test("Instance added to window object", async () => {
    expect(window.TNAFrontendCookies).toBeFalsy();
    expect(window.TNAFrontendCookieEvents).toBeFalsy();

    const cookies = (await import("./src/iife.js?2")).default;

    expect(window.TNAFrontendCookies).toBeTruthy();
    expect(window.TNAFrontendCookieEvents).toBeTruthy();
  });

  test("Destroy instance", async () => {
    expect(window.TNAFrontendCookies).toBeFalsy();

    const cookies = (await import("./src/iife.js?3")).default;

    expect(window.TNAFrontendCookies).toEqual(cookies);

    cookies.destroyInstance();

    expect(window.TNAFrontendCookies).toBeFalsy();
  });

  test("Destroy instance doesn't remove events", async () => {
    expect(window.TNAFrontendCookieEvents).toBeFalsy();

    const cookies = (await import("./src/iife.js?4")).default;

    expect(window.TNAFrontendCookieEvents).not.toBeFalsy();

    cookies.destroyInstance();

    expect(window.TNAFrontendCookieEvents).not.toBeFalsy();
  });
});

describe("Events", () => {
  test("Add and trigger events", async () => {
    const cookies = new Cookies();
    expect(cookies).toHaveProperty("on");

    const mockCallback = vi.fn();
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

  test("Instances share events", async () => {
    const cookies1 = new Cookies();

    expect(cookies1.events.events).not.toHaveProperty("set");

    const mockCallback = vi.fn();

    cookies1.on("set", mockCallback);
    expect(cookies1.events.events).toHaveProperty("set");
    expect(cookies1.events.events.set).toHaveLength(1);
    expect(cookies1.events.events.set[0]).toEqual(mockCallback);

    const cookies2 = new Cookies();
    expect(cookies2.events.events).toHaveProperty("set");
    expect(cookies2.events.events.set).toHaveLength(1);
    expect(cookies2.events.events.set[0]).toEqual(mockCallback);

    // const cookies3 = new Cookies({ newInstance: true });
    // expect(cookies3.events.events).toHaveProperty("set");
    // expect(cookies3.events.events.set).toHaveLength(1);
    // expect(cookies3.events.events.set[0]).toEqual(mockCallback);
  });

  test("Shared events are triggered", async () => {
    const mockCallback = vi.fn();

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

  test("All events", async () => {
    const cookies = new Cookies();

    const mockSetCookieCallback = vi.fn();
    cookies.on("setCookie", mockSetCookieCallback);
    const mockDeleteCookieCallback = vi.fn();
    cookies.on("deleteCookie", mockDeleteCookieCallback);
    const mockDeleteAllCookiesCallback = vi.fn();
    cookies.on("deleteAllCookies", mockDeleteAllCookiesCallback);
    const mockAcceptPolicyCallback = vi.fn();
    cookies.on("acceptPolicy", mockAcceptPolicyCallback);
    const mockRejectPolicyCallback = vi.fn();
    cookies.on("rejectPolicy", mockRejectPolicyCallback);
    const mockAcceptAllPoliciesCallback = vi.fn();
    cookies.on("acceptAllPolicies", mockAcceptAllPoliciesCallback);
    const mockRejectAllPoliciesCallback = vi.fn();
    cookies.on("rejectAllPolicies", mockRejectAllPoliciesCallback);
    const mockChangePolicyCallback = vi.fn();
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

    expect(mockSetCookieCallback.mock.calls).toHaveLength(8);
    expect(mockDeleteCookieCallback.mock.calls).toHaveLength(2);
    expect(mockDeleteAllCookiesCallback.mock.calls).toHaveLength(1);
    expect(mockAcceptPolicyCallback.mock.calls).toHaveLength(1);
    expect(mockRejectPolicyCallback.mock.calls).toHaveLength(1);
    expect(mockAcceptAllPoliciesCallback.mock.calls).toHaveLength(1);
    expect(mockRejectAllPoliciesCallback.mock.calls).toHaveLength(1);
    expect(mockChangePolicyCallback.mock.calls).toHaveLength(7);
  });

  test("One-time events", async () => {
    const mockCallback = vi.fn();

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

  test("Clear events", async () => {
    const mockCallback = vi.fn();

    const cookies = new Cookies();

    expect(cookies.events.events).not.toHaveProperty("setCookie");

    cookies.on("setCookie", mockCallback);

    expect(cookies.events.events).toHaveProperty("setCookie");

    const testKey = "foo";
    const testValue = "bar";

    expect(mockCallback.mock.calls).toHaveLength(0);

    cookies.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(1);

    cookies.events.clearAll();
    expect(cookies.events.events).not.toHaveProperty("setCookie");
    expect(mockCallback.mock.calls).toHaveLength(1);

    cookies.set(testKey, testValue);
    expect(mockCallback.mock.calls).toHaveLength(1);
  });
});

describe("Initialisation", () => {
  test("With custom properties", async () => {
    const cookies = new Cookies({
      defaultDomain: ".localhost",
      secure: true,
      policiesKey: "cookies_policy_custom",
      defaultAge: 300,
    });
    expect(cookies.defaultDomain).toEqual(".localhost");
    expect(cookies.secure).toEqual(true);
    expect(cookies.policiesKey).toEqual("cookies_policy_custom");
    expect(cookies.defaultAge).toEqual(300);

    expect(document.cookie).not.toEqual("");

    expect(cookies.exists("cookies_policy_custom")).toEqual(true);
    cookies.acceptAllPolicies();
    expect(cookies.isPolicyAccepted("settings")).toEqual(true);
    expect(cookies.isPolicyAccepted("usage")).toEqual(true);
    expect(cookies.isPolicyAccepted("marketing")).toEqual(true);
  });

  test("With a different path", async () => {
    const cookies = new Cookies({
      defaultPath: "/custom",
    });
    expect(cookies.defaultPath).toEqual("/custom");

    expect(document.cookie).toEqual("");
  });

  test("Properties from HTML attributes", async () => {
    document.documentElement.dataset.tnaCookiesDomain = ".localhost";
    document.documentElement.dataset.tnaCookiesPoliciesKey =
      "cookies_policy_custom";
    document.documentElement.dataset.tnaCookiesDefaultAge = 300;
    document.documentElement.dataset.tnaCookiesInsecure = true;

    const cookies = new Cookies();

    expect(cookies.defaultDomain).toEqual(".localhost");
    expect(cookies.secure).toEqual(false);
    expect(cookies.policiesKey).toEqual("cookies_policy_custom");
    expect(cookies.defaultAge).toEqual(300);
  });

  test("Explicit properties overwrite HTML attributes", async () => {
    document.documentElement.dataset.tnaCookiesDomain = ".localhost";
    document.documentElement.dataset.tnaCookiesPoliciesKey =
      "cookies_policy_custom";
    document.documentElement.dataset.tnaCookiesDefaultAge = 300;
    document.documentElement.dataset.tnaCookiesInsecure = true;

    const cookies = new Cookies({
      defaultDomain: "localhost",
      policiesKey: "cookies_policy_custom2",
      secure: true,
      defaultAge: 600,
    });

    expect(cookies.defaultDomain).toEqual("localhost");
    expect(cookies.secure).toEqual(true);
    expect(cookies.policiesKey).toEqual("cookies_policy_custom2");
    expect(cookies.defaultAge).toEqual(600);
  });
});

describe("Policies", () => {
  test("Default preferences on initialisation", async () => {
    const cookies = new Cookies();

    expect(cookies).toHaveProperty("policies");

    expect(cookies.all).toHaveProperty("cookies_policy");
    expect(cookies.exists("cookies_policy")).toEqual(true);

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

  test("Get non-existent policy", async () => {
    const cookies = new Cookies();

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

  test("Custom policy key", async () => {
    const cookies = new Cookies({ policiesKey: ["custom"] });

    expect(cookies.all).not.toHaveProperty("cookies_policy");
    expect(cookies.all).toHaveProperty("custom");

    expect(cookies.policies.settings).toEqual(false);

    cookies.acceptAllPolicies();
    expect(cookies.policies.settings).toEqual(true);
  });

  describe("With existing cookies", () => {
    test("Valid policy", async () => {
      document.cookie =
        "cookies_policy=%7B%22essential%22%3Atrue%2C%22settings%22%3Atrue%2C%22usage%22%3Atrue%2C%22marketing%22%3Atrue%7D";

      const cookies = new Cookies();

      expect(cookies.policiesCorrectOnInit).toEqual(true);
      expect(cookies.all).toHaveProperty("cookies_policy");
      expect(cookies.policies).toHaveProperty("essential");
      expect(cookies.isPolicyAccepted("essential")).toEqual(true);
      expect(cookies.policies).toHaveProperty("settings");
      expect(cookies.isPolicyAccepted("settings")).toEqual(true);
      expect(cookies.policies).toHaveProperty("usage");
      expect(cookies.isPolicyAccepted("usage")).toEqual(true);
      expect(cookies.policies).toHaveProperty("marketing");
      expect(cookies.isPolicyAccepted("marketing")).toEqual(true);
    });

    test("Empty policy", async () => {
      document.cookie = "cookies_policy=%7B%7D";

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

    test("Invalid policy", async () => {
      document.cookie = "cookies_policy=foobar";

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

    test("Partial policy", async () => {
      document.cookie = "cookies_policy=%7B%22usage%22%3Atrue%7D";

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

    test("Unknown policy", async () => {
      document.cookie = "cookies_policy=%7B%22custom%22%3Atrue%7D";

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

  test("No initialisation", async () => {
    const cookies = new Cookies({ noInit: true });

    expect(cookies.policiesCorrectOnInit).toEqual(false);
    expect(cookies.all).not.toHaveProperty("cookies_policy");
  });
});
