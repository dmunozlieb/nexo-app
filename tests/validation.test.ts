/// <reference types="jest" />

import {
  authLoginSchema,
  authRegisterSchema,
  commentSchema,
  postFormSchema,
  usernameSchema,
} from "../src/utils/validation";
import { sanitizePlainText } from "../src/utils/sanitize";

describe("validaciones de Nexo", () => {
  it("normaliza usernames validos", () => {
    expect(usernameSchema.parse("  Luna_123  ")).toBe("luna_123");
  });

  it("rechaza usernames demasiado cortos", () => {
    expect(() => usernameSchema.parse("nx")).toThrow();
  });

  it("limita comentarios a 1000 caracteres", () => {
    expect(() =>
      commentSchema.parse({ body: "x".repeat(1001), parentId: null }),
    ).toThrow();
  });

  it("valida posts con comunidad, tipo y cuerpo", () => {
    const parsed = postFormSchema.parse({
      communityId: "bbbbbbbb-0000-4000-8000-000000000001",
      type: "debate",
      title: "Idea",
      body: "Texto",
      mediaUrls: [],
    });

    expect(parsed.type).toBe("debate");
  });

  it("valida login con email", () => {
    expect(() =>
      authLoginSchema.parse({ email: "bad", password: "Password123!" }),
    ).toThrow();
  });

  it("valida registro con email y confirmacion", () => {
    const parsed = authRegisterSchema.parse({
      email: "luna@nexo.local",
      password: "Password123",
      confirmPassword: "Password123",
    });

    expect(parsed.email).toBe("luna@nexo.local");
  });

  it("rechaza registro si la contrasena no coincide", () => {
    expect(() =>
      authRegisterSchema.parse({
        email: "luna@nexo.local",
        password: "Password123",
        confirmPassword: "Password124",
      }),
    ).toThrow();
  });

  it("sanitiza texto plano para web", () => {
    expect(sanitizePlainText(" <script>hola</script> ")).toBe(
      "scripthola/script",
    );
  });
});
