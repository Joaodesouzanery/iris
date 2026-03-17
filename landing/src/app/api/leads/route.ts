import { NextRequest, NextResponse } from "next/server";
import { leadSchema } from "@/lib/validations";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Try to store in Supabase
    const supabase = getServiceClient();
    if (supabase) {
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company,
        role: data.role,
        agencies_interest: data.agencies,
        description: data.description || null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        // Continue even if Supabase fails — log the lead
      }
    }

    // Log the lead for debugging
    console.log("[LEAD]", JSON.stringify(data));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
