import { cookies } from "next/headers";
import {
  signToken,
  verifyToken,
  getSession,
  requireAuth,
  type JWTPayload,
} from "@/lib/auth";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const cookiesMock = cookies as unknown as jest.Mock;

const payload: JWTPayload = {
  userId: 1,
  username: "jdoe",
  role: "ADMIN",
  name: "Jane Doe",
};

function mockCookieValue(value: string | undefined) {
  cookiesMock.mockReturnValue({
    get: (name: string) =>
      name === "auth_token" && value !== undefined ? { value } : undefined,
  });
}

describe("signToken / verifyToken", () => {
  it("signs a token that verifies back to the original payload fields", async () => {
    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = await verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it("returns null for a malformed token", async () => {
    expect(await verifyToken("not-a-jwt")).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    // Header + payload + a bogus signature.
    const bogus =
      "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.invalidsignaturevalue";
    expect(await verifyToken(bogus)).toBeNull();
  });
});

describe("getSession", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("returns null when no auth_token cookie is present", async () => {
    mockCookieValue(undefined);
    expect(await getSession()).toBeNull();
  });

  it("returns the decoded payload when a valid token cookie is present", async () => {
    const token = await signToken(payload);
    mockCookieValue(token);
    expect(await getSession()).toMatchObject(payload);
  });

  it("returns null when the token cookie is invalid", async () => {
    mockCookieValue("garbage");
    expect(await getSession()).toBeNull();
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws Unauthorized when there is no session", async () => {
    mockCookieValue(undefined);
    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("returns the session when no roles are required", async () => {
    mockCookieValue(await signToken(payload));
    const session = await requireAuth();
    expect(session.username).toBe("jdoe");
  });

  it("returns the session when the role is allowed", async () => {
    mockCookieValue(await signToken(payload));
    const session = await requireAuth(["admin"]);
    expect(session.role).toBe("ADMIN");
  });

  it("normalizes the returned role to uppercase", async () => {
    mockCookieValue(await signToken({ ...payload, role: "  admin " }));
    const session = await requireAuth(["ADMIN"]);
    expect(session.role).toBe("ADMIN");
  });

  it("throws Forbidden when the role is not in the allowed list", async () => {
    mockCookieValue(await signToken({ ...payload, role: "NURSE" }));
    await expect(requireAuth(["ADMIN"])).rejects.toThrow("Forbidden");
  });
});
