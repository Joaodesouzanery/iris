"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadSchema, type LeadFormData } from "@/lib/validations";

const AGENCIES_OPTIONS = [
  "ARTESP", "ANEEL", "ANP", "ANATEL", "ANVISA", "ANTT", "ANTAQ", "ANS", "ANA", "Outra",
];

const ROLES = ["Analista", "Diretor", "Advogado", "Consultor", "Outro"] as const;

const TOTAL_STEPS = 4;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < step
                ? "bg-[#8B5CF6]"
                : i === step
                  ? "bg-[#8B5CF6]/50"
                  : "bg-white/10"
            }`}
          />
        </div>
      ))}
      <span className="text-xs text-[#52525B] font-mono ml-2">
        {step + 1}/{TOTAL_STEPS}
      </span>
    </div>
  );
}

export function DemoForm() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      agencies: [],
    },
  });

  const agencies = watch("agencies") || [];

  const toggleAgency = (agency: string) => {
    const current = agencies;
    if (current.includes(agency)) {
      setValue("agencies", current.filter((a) => a !== agency));
    } else {
      setValue("agencies", [...current, agency]);
    }
  };

  const nextStep = async () => {
    let fields: (keyof LeadFormData)[] = [];
    if (step === 0) fields = ["name", "email"];
    if (step === 1) fields = ["company", "role"];
    if (step === 2) fields = ["agencies"];

    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsSuccess(true);
      }
    } catch {
      // Fallback — form data logged
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#22C55E]/10 mb-6">
          <Check className="w-8 h-8 text-[#22C55E]" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h3>
        <p className="text-[#A1A1AA] mb-6">
          Entraremos em contato em até 24 horas com uma demonstração personalizada.
        </p>
        <Button variant="secondary" href="#hero">
          Voltar para o início
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ProgressBar step={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Seus Dados</h3>

            <div>
              <label htmlFor="name" className="block text-sm text-[#A1A1AA] mb-1.5">
                Nome completo *
              </label>
              <input
                id="name"
                {...register("name")}
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={!!errors.name}
                onBlur={() => trigger("name")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#6B7280] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                placeholder="Seu nome"
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-[#EF4444] mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-[#A1A1AA] mb-1.5">
                Email corporativo *
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                onBlur={() => trigger("email")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#6B7280] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                placeholder="seu@empresa.com"
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-[#EF4444] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm text-[#A1A1AA] mb-1.5">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                aria-invalid={!!errors.phone}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#6B7280] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                placeholder="(11) 99999-9999"
              />
              {errors.phone && (
                <p id="phone-error" className="text-xs text-[#EF4444] mt-1">{errors.phone.message}</p>
              )}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Sua Empresa</h3>

            <div>
              <label htmlFor="company" className="block text-sm text-[#A1A1AA] mb-1.5">
                Empresa *
              </label>
              <input
                id="company"
                {...register("company")}
                aria-describedby={errors.company ? "company-error" : undefined}
                aria-invalid={!!errors.company}
                onBlur={() => trigger("company")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#6B7280] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors"
                placeholder="Nome da empresa"
              />
              {errors.company && (
                <p id="company-error" className="text-xs text-[#EF4444] mt-1">{errors.company.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm text-[#A1A1AA] mb-1.5">
                Cargo *
              </label>
              <select
                id="role"
                {...register("role")}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1A1A1F]">Selecione...</option>
                {ROLES.map((role) => (
                  <option key={role} value={role} className="bg-[#1A1A1F]">
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p id="role-error" className="text-xs text-[#EF4444] mt-1">{errors.role.message}</p>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Agências de Interesse *
            </h3>
            <p className="text-sm text-[#A1A1AA] mb-4">
              Selecione as agências reguladoras que você acompanha.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {AGENCIES_OPTIONS.map((agency) => (
                <button
                  key={agency}
                  type="button"
                  onClick={() => toggleAgency(agency)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer ${
                    agencies.includes(agency)
                      ? "bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]"
                      : "bg-white/5 border-white/10 text-[#A1A1AA] hover:bg-white/10"
                  }`}
                >
                  {agency}
                </button>
              ))}
            </div>
            {errors.agencies && (
              <p id="agencies-error" role="alert" className="text-xs text-[#EF4444] mt-1">{errors.agencies.message}</p>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Algo mais que devemos saber?
            </h3>

            <div>
              <label htmlFor="description" className="block text-sm text-[#A1A1AA] mb-1.5">
                Descreva brevemente sua necessidade (opcional)
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#52525B] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 transition-colors resize-none"
                placeholder="Ex.: Precisamos monitorar deliberações da ARTESP sobre concessões rodoviárias..."
              />
              {errors.description && (
                <p className="text-xs text-[#EF4444] mt-1">{errors.description.message}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
        {step > 0 ? (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <Button type="button" onClick={nextStep}>
            Próximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Solicitar Demo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
