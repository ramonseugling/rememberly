import { useEffect, useState } from 'react';

interface StatusData {
  updated_at: string;
  dependencies: {
    database: {
      version: string;
    };
  };
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/status')
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setError(true));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="mb-4 text-lg font-semibold">Status do sistema</h1>

        {error && (
          <p className="text-sm text-red-400">Erro ao carregar status.</p>
        )}

        {!status && !error && (
          <p className="text-sm text-gray-500">Carregando...</p>
        )}

        {status && (
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-400">Atualizado em</span>
              <span>{new Date(status.updated_at).toLocaleString('pt-BR')}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Banco de dados</span>
              <span className="max-w-[200px] truncate text-right text-xs text-gray-300">
                {status.dependencies.database?.version}
              </span>
            </li>
          </ul>
        )}
      </div>
    </main>
  );
}
