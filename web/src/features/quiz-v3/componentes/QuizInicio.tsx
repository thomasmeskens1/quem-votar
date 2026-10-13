import Link from "next/link";

export interface QuizInicioProps {
  total: number;
  exemplo: boolean;
  onComecar: () => void;
}

/** Tela inicial: o que o quiz mede, o que ele não é e como as respostas são tratadas. */
export function QuizInicio({ total, exemplo, onComecar }: QuizInicioProps) {
  return (
    <section aria-labelledby="quiz-titulo" className="mx-auto max-w-2xl">
      <h1 id="quiz-titulo" className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Quiz de afinidade com as propostas
      </h1>
      <p className="mt-3 text-base text-gray-800">
        Você verá {total} situações do dia a dia, uma por vez, em ordem aleatória. Cada uma traz dois
        caminhos, o caminho A e o caminho B, escritos a partir das{" "}
        <strong>propostas dos planos de governo registrados no TSE</strong>, sem indicar de qual plano vem
        cada um. Ao final, o quiz mostra o quanto as suas respostas se aproximam das propostas escritas em
        cada plano e lista os trechos correspondentes, com a página do documento oficial.
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-base text-gray-800">
        <li>
          <strong>Não é pesquisa eleitoral nem recomendação de voto.</strong> O quiz é apartidário e o
          resultado mede apenas a afinidade com propostas escritas nos planos.
        </li>
        <li>
          Os nomes dos candidatos só aparecem no resultado, junto com o caminho que corresponde a cada
          plano. Quando um plano não trata do tema de uma situação, ela aparece como &quot;sem proposta
          registrada&quot; e não entra no cálculo daquele candidato.
        </li>
        <li>
          <strong>Suas respostas ficam só neste navegador</strong>, enquanto a página estiver aberta. Elas
          não são armazenadas nem enviadas a ninguém. Ao recarregar a página, o quiz recomeça.
        </li>
        <li>
          Todas as perguntas pedem uma resposta. Você não precisa escolher só A ou B: responda numa escala
          de cinco posições, de &quot;Totalmente o caminho A&quot; a &quot;Totalmente o caminho B&quot;,
          passando por &quot;Mais para o caminho A&quot;, &quot;Não tenho uma opinião formada sobre o
          tema&quot; e &quot;Mais para o caminho B&quot;. Se não tiver opinião formada, a pergunta fica
          fora do cálculo.
        </li>
        <li>
          <strong>Como a pontuação funciona:</strong> em cada situação, o plano que corresponde ao caminho
          da sua resposta recebe <strong>1 ponto</strong> se você respondeu &quot;totalmente&quot; e{" "}
          <strong>meio ponto</strong> se respondeu &quot;mais para&quot;; o plano do outro caminho não
          recebe ponto. A afinidade é a média desses pontos nas situações em que o plano tem proposta
          registrada. Você pode marcar uma pergunta como &quot;Importante para mim&quot; (vale o dobro) e
          voltar à pergunta anterior.
        </li>
      </ul>

      <p className="mt-4 text-sm text-gray-700">
        {/* O link da Política de Privacidade volta quando a página for publicada. */}
        Saiba mais na{" "}
        <Link href="/metodologia" prefetch={false} className="lk">
          Metodologia
        </Link>
        .
      </p>

      {exemplo ? (
        <p className="mt-4 rounded border border-dashed border-gray-500 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          Conteúdo provisório: estas são perguntas de exemplo para desenvolvimento, ainda não revisadas.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onComecar}
        className="mt-6 min-h-11 w-full rounded-md bg-gray-900 px-6 py-3 text-base font-semibold text-white hover:bg-gray-800 sm:w-auto"
      >
        Começar
      </button>
    </section>
  );
}
