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

    return secret;
  }

  public getJwtSecret(): string {
    return this.jwtSecret;
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
