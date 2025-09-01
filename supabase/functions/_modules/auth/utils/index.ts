import { AppConfig } from "../../shared/utils/config.ts";
import { createJwtDependencies } from "./jwt.ts";

export const jwtDependencies = createJwtDependencies(AppConfig.getJwtSecret());
