import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-gray-900">Página não encontrada</h1>
      <p className="text-gray-800">O endereço acessado não existe neste site.</p>
      <Link href="/" className="text-blue-800 underline underline-offset-2">
        Voltar ao início
      </Link>
    </div>
  );
}
