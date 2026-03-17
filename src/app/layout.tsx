import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRIS — Plataforma de Inteligência Regulatória | Dados que Geram Vantagem",
  description:
    "Transforme milhares de decisões regulatórias em inteligência acionável. Coleta automática, jurimetria de votos, detecção de anomalias. Para ARTESP, ANEEL, ANP e mais.",
  keywords:
    "inteligência regulatória, jurimetria, ARTESP, ANEEL, compliance regulatório, análise regulatória, deliberações, agências reguladoras",
  authors: [{ name: "IRIS" }],
  openGraph: {
    title: "IRIS — Inteligência Regulatória para Quem Decide",
    description:
      "Transforme milhares de decisões regulatórias em inteligência acionável. Coleta automática, jurimetria de votos, detecção de anomalias.",
    type: "website",
    locale: "pt_BR",
    siteName: "IRIS",
  },
  twitter: {
    card: "summary_large_image",
    title: "IRIS — Inteligência Regulatória para Quem Decide",
    description:
      "Transforme milhares de decisões regulatórias em inteligência acionável.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "IRIS",
              applicationCategory: "BusinessApplication",
              description:
                "Plataforma de Inteligência Regulatória com coleta automática, jurimetria e detecção de anomalias.",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                category: "Enterprise",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "IRIS",
              description: "Inteligência Regulatória Inteligente",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "O que a IRIS faz que eu não consigo com uma planilha?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Planilhas armazenam dados. A IRIS gera inteligência: classifica automaticamente, detecta padrões, mapeia conexões e identifica anomalias que análise manual jamais encontraria.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Quais agências reguladoras são cobertas?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Atualmente a IRIS processa dados da ARTESP com arquitetura pronta para expandir para ANEEL, ANP, ANATEL, ANVISA, ANTT e outras agências federais e estaduais.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Os dados são atualizados em tempo real?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "A IRIS faz varredura automática a cada 30 minutos e processa novos documentos assim que publicados.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Preciso instalar algum software?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Não. A IRIS é 100% web, acessível por qualquer navegador moderno.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className="font-sans antialiased bg-[#09090B] text-[#FAFAFA]"
      >
        {children}
      </body>
    </html>
  );
}
