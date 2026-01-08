// import z from "zod";

// import { getYearRange } from "@/app/utils/date.util";

// import { budgetAutoSaveSchema, budgetSchema } from "./budget.schema";
// import {
//   autoriseeCurrentYearSchema,
//   autoriseeY2Schema,
// } from "./budget/budget.autorisee.schema";
// import { sansCpomSchema } from "./budget/budget.cpom.schema";
// import { avecCpomSchema } from "./budget/budget.cpom.schema";
// import {
//   subventionneeFirstYearsSchema,
//   subventionneeSansCpomSchema,
// } from "./budget/budget.subventionee.schema";

// const { years } = getYearRange();

// const yearsWithoutFirstTwo = years.slice(2);

// const budgetSchemas = years.map(() => budgetSchema) as [
//   typeof budgetSchema,
//   ...(typeof budgetSchema)[],
// ];

// export const basicSchema = z.object({
//   budgets: z.tuple(budgetSchemas),
// });

// const basicAutoSaveSchemas = years.map(() => budgetAutoSaveSchema) as [
//   typeof budgetAutoSaveSchema,
//   ...(typeof budgetAutoSaveSchema)[],
// ];
// export const basicAutoSaveSchema = z
//   .object({
//     budgets: z.tuple(basicAutoSaveSchemas),
//   })
//   .partial();

// const sansCpomSchemas = yearsWithoutFirstTwo.map(() => sansCpomSchema) as [
//   typeof sansCpomSchema,
//   ...(typeof sansCpomSchema)[],
// ];

// export const autoriseeSchema = z.object({
//   budgets: z.tuple([
//     autoriseeCurrentYearSchema,
//     autoriseeY2Schema,
//     ...sansCpomSchemas,
//   ]),
// });

// const avecCpomSchemas = yearsWithoutFirstTwo.map(() => avecCpomSchema) as [
//   typeof avecCpomSchema,
//   ...(typeof avecCpomSchema)[],
// ];

// export const autoriseeAvecCpomSchema = z.object({
//   budgets: z.tuple([
//     autoriseeCurrentYearSchema,
//     autoriseeY2Schema,
//     ...avecCpomSchemas,
//   ]),
// });

// const subventionneeSansCpomSchemas = yearsWithoutFirstTwo.map(
//   () => subventionneeSansCpomSchema
// ) as [
//   typeof subventionneeSansCpomSchema,
//   ...(typeof subventionneeSansCpomSchema)[],
// ];

// export const subventionneeSchema = z.object({
//   budgets: z.tuple([
//     subventionneeFirstYearsSchema,
//     subventionneeFirstYearsSchema,
//     ...subventionneeSansCpomSchemas,
//   ]),
// });

// export const subventionneeAvecCpomSchema = z.object({
//   budgets: z.tuple([
//     subventionneeFirstYearsSchema,
//     subventionneeFirstYearsSchema,
//     ...avecCpomSchemas,
//   ]),
// });

// type budgetSchemaTypeFormValues = z.infer<typeof budgetSchema>;

// export type budgetsSchemaTypeFormValues = budgetSchemaTypeFormValues[];

// export type basicSchemaTypeFormValues = z.infer<typeof basicSchema>;
// export type autoriseeSchemaTypeFormValues = z.infer<typeof autoriseeSchema>;
// export type autoriseeAvecCpomSchemaTypeFormValues = z.infer<
//   typeof autoriseeAvecCpomSchema
// >;
// export type subventionneeSchemaTypeFormValues = z.infer<
//   typeof subventionneeSchema
// >;
// type subventionneeAvecCpomSchemaTypeFormValues = z.infer<
//   typeof subventionneeAvecCpomSchema
// >;

// export type anyFinanceFormValues =
//   | basicSchemaTypeFormValues
//   | autoriseeSchemaTypeFormValues
//   | autoriseeAvecCpomSchemaTypeFormValues
//   | subventionneeSchemaTypeFormValues
//   | subventionneeAvecCpomSchemaTypeFormValues;

// export type basicAutoSaveFormValues = z.infer<typeof basicAutoSaveSchema>;
