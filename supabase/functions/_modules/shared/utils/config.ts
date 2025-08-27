enum AppEnvironment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
  TEST = "TEST",
}

const DENO_ENV = "DENO_ENV";

class AppConfiguration {
  private static instance: AppConfiguration;
  private constructor() {}

  public static getInstance(): AppConfiguration {
    if (!AppConfiguration.instance) {
      AppConfiguration.instance = new AppConfiguration();
    }
    return AppConfiguration.instance;
  }

  private get env(): AppEnvironment {
    const env = Deno.env.get(DENO_ENV) ?? AppEnvironment.DEVELOPMENT;
    return env as AppEnvironment;
  }

  private get jwtSecret(): string {
    const secret = Deno.env.get("JWT_SECRET");

    if (!secret) {
      throw new Error("JWT_SECRET is not set", { cause: "JWT_SECRET_NOT_SET" });
    }

    // JWT secret 길이 및 복잡도 검증
    if (secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long", {
        cause: "JWT_SECRET_TOO_SHORT",
      });
    }

    return secret;
  }

  // JWT secret을 안전하게 반환 (로깅 시 노출 방지)
  public getJwtSecret(): string {
    return this.jwtSecret;
  }

  // 디버깅용 마스킹된 secret 반환
  public getJwtSecretMasked(): string {
    const secret = this.jwtSecret;
    return (
      secret.slice(0, 4) + "*".repeat(secret.length - 8) + secret.slice(-4)
    );
  }

  public get isProduction(): boolean {
    return this.env === AppEnvironment.PRODUCTION;
  }

  public get isDevelopment(): boolean {
    return this.env === AppEnvironment.DEVELOPMENT;
  }

  public get isTest(): boolean {
    return this.env === AppEnvironment.TEST;
  }
}

export const AppConfig = AppConfiguration.getInstance();
