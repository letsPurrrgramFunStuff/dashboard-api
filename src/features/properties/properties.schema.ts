import { Type } from "@sinclair/typebox";

export const CreatePropertySchema = Type.Object({
  addressLine1: Type.String(),
  addressLine2: Type.Optional(Type.String()),
  city: Type.String(),
  state: Type.String(),
  zip: Type.String(),
  country: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  propertyType: Type.Optional(
    Type.Enum({
      residential: "residential",
      commercial: "commercial",
      mixed_use: "mixed_use",
      industrial: "industrial",
      other: "other",
    }),
  ),
  yearBuilt: Type.Optional(Type.Number()),
  floors: Type.Optional(Type.Number()),
  units: Type.Optional(Type.Number()),
});

export const UpdatePropertySchema = Type.Partial(CreatePropertySchema);

export const PropertyParamsSchema = Type.Object({
  id: Type.String(),
});

export const PropertyQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ default: 1 })),
  pageSize: Type.Optional(Type.Number({ default: 25 })),
  search: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  minRiskScore: Type.Optional(Type.Number()),
  riskLevel: Type.Optional(
    Type.Union([
      Type.Literal("high"),
      Type.Literal("medium"),
      Type.Literal("low"),
    ]),
  ),
});
