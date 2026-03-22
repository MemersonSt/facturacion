import { Prisma } from "@prisma/client";
import { z } from "zod";

export const DEFAULT_POS_FEATURE_CONFIG = {
  trackInventoryOnSale: true,
} as const;

const posFeatureConfigSchema = z.object({
  trackInventoryOnSale: z
    .boolean()
    .default(DEFAULT_POS_FEATURE_CONFIG.trackInventoryOnSale),
});

export type PosFeatureConfig = z.infer<typeof posFeatureConfigSchema>;

export function parsePosFeatureConfig(
  config: Prisma.JsonValue | null | undefined,
): PosFeatureConfig {
  const normalized =
    config && typeof config === "object" && !Array.isArray(config) ? config : {};
  const parsed = posFeatureConfigSchema.safeParse(normalized);

  if (!parsed.success) {
    return { ...DEFAULT_POS_FEATURE_CONFIG };
  }

  return parsed.data;
}

export function serializePosFeatureConfig(
  config: PosFeatureConfig,
): Prisma.InputJsonValue {
  return {
    trackInventoryOnSale: config.trackInventoryOnSale,
  } satisfies Prisma.InputJsonObject;
}
