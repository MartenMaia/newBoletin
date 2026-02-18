import { Navigate, useParams } from 'react-router-dom';

// Compat: histórico linkava para /app/boletins/execucoes/:execId
export function BoletinsExecucaoStandalonePage() {
  const p = useParams();
  if (!p.execId) return <Navigate to="/app/boletins" replace />;
  // Sem configId no URL, redireciona para a página de execução usando route já existente
  // A página de execução consegue carregar somente pelo execId, então usamos configId dummy
  return <Navigate to={'/app/boletins/_/execucoes/' + p.execId} replace />;
}
