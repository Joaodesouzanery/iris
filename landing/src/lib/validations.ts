import { z } from "zod";

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email: z
    .string()
    .email("Email inválido")
    .max(200, "Email muito longo"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-+()]{8,20}$/.test(val),
      "Telefone inválido"
    ),
  company: z
    .string()
    .min(2, "Empresa deve ter pelo menos 2 caracteres")
    .max(200, "Nome da empresa muito longo"),
  role: z.enum(["Analista", "Diretor", "Advogado", "Consultor", "Outro"], {
    error: "Selecione um cargo",
  }),
  agencies: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma agência"),
  description: z.string().max(1000, "Descrição muito longa").optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const analyticsEventSchema = z.object({
  event_type: z.string(),
  section: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
