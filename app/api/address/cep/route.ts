import { NextResponse } from "next/server";
import { isValidCep, onlyDigits } from "@/lib/validators";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cep = onlyDigits(url.searchParams.get("cep"));

  if (!isValidCep(cep)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_CEP", message: "Informe um CEP válido." },
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch("https://viacep.com.br/ws/" + cep + "/json/", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.erro) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "CEP_NOT_FOUND", message: "CEP não encontrado." },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cep,
        street: String(body?.logradouro || ""),
        neighborhood: String(body?.bairro || ""),
        city: String(body?.localidade || ""),
        state: String(body?.uf || ""),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CEP_LOOKUP_UNAVAILABLE",
          message: "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
        },
      },
      { status: 503 },
    );
  }
}
