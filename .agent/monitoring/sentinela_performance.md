# Monitoramento de Performance - Sentinela Audit

## Telemetria de Erros e Performance

### Console Patterns para Observar

#### ❌ Sinais de Lentidão
```javascript
// Padrões que indicam problemas de performance:
[SLOW_QUERY] > 1000ms        // Query Supabase lenta
[RENDER_LOOP] Component re-rendered 10+ times in 1s
[MEMORY_LEAK] Subscription not cleaned up
[LARGE_PAYLOAD] Response size > 1MB
```

#### ⚠️ Alertas de OCR
```javascript
// Problemas específicos do overlay Sentinela:
[OCR_TIMEOUT] Nota fiscal não processada em 30s
[OCR_ERROR] Tesseract.js failed to initialize
[VALIDATION_FAIL] Campos obrigatórios não extraídos
[API_RATE_LIMIT] Google Vision API quota exceeded
```

### Métricas de Performance Alvo

```typescript
const PERFORMANCE_TARGETS = {
  // Carregamento de Dashboards
  INITIAL_LOAD: 2000, // 2s para First Contentful Paint
  
  // Queries Supabase
  QUERY_SIMPLE: 500, // 500ms para queries simples
  QUERY_JOIN: 1500, // 1.5s para queries com joins
  
  // OCR e Processamento de NF
  OCR_PROCESSING: 10000, // 10s por nota fiscal
  PDF_RENDER: 3000, // 3s para renderizar PDF
  
  // Upload de Arquivos
  UPLOAD_1MB: 2000, // 2s para 1MB
  UPLOAD_5MB: 8000, // 8s para 5MB
  
  // Operações CRUD
  INSERT: 300, // 300ms para inserir registro
  UPDATE: 500, // 500ms para atualizar
  DELETE_SOFT: 200 // 200ms para soft delete
}
```

## Monitoramento por Componente

### 1. Sentinela Audit Overlay (`components/SentinelaAudit.tsx`)

**Métricas Críticas:**
```typescript
interface SentinelaMetrics {
  notasFiscaisProcessadas: number
  tempoMedioOCR: number // ms
  alertasAtivos: {
    criticos: number
    altos: number
    medios: number
    baixos: number
  }
  notasFalhas: number // notas que falharam OCR
  cacheHitRate: number // % de dados servidos do cache
}

// Implementar no componente:
const trackSentinelaMetrics = () => {
  console.log('[SENTINELA_METRICS]', {
    timestamp: new Date().toISOString(),
    metrics: getSentinelaMetrics()
  })
}
```

**Otimizações Recomendadas:**
```typescript
// ✅ Lazy load do OCR engine
const ocrEngine = useMemo(() => {
  if (notasParaProcessar.length > 0) {
    return import('tesseract.js')
  }
  return null
}, [notasParaProcessar])

// ✅ Processar notas em lote (3 por vez)
const processarNotasEmLote = async (notas: File[]) => {
  const BATCH_SIZE = 3
  for (let i = 0; i < notas.length; i += BATCH_SIZE) {
    const batch = notas.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(processarNota))
  }
}

// ✅ Cache de resultados OCR
const cacheOCR = new Map<string, DadosNF>()
const getOCRResult = async (file: File) => {
  const hash = await hashFile(file)
  if (cacheOCR.has(hash)) {
    console.log('[OCR_CACHE_HIT]', file.name)
    return cacheOCR.get(hash)
  }
  const result = await performOCR(file)
  cacheOCR.set(hash, result)
  return result
}
```

### 2. RBAC e Permissões (`hooks/usePermissions.ts`)

**Cache de Roles para Reduzir Latência:**
```typescript
// ✅ Cache em sessionStorage + SWR
const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  
  useEffect(() => {
    const cachedPerms = sessionStorage.getItem('user_permissions')
    const cachedTime = sessionStorage.getItem('permissions_timestamp')
    
    // Cache válido por 15 minutos
    const CACHE_VALIDITY = 15 * 60 * 1000
    const isCacheValid = cachedTime && 
      (Date.now() - parseInt(cachedTime)) < CACHE_VALIDITY
    
    if (cachedPerms && isCacheValid) {
      console.log('[RBAC_CACHE_HIT]')
      setPermissions(JSON.parse(cachedPerms))
    } else {
      console.log('[RBAC_CACHE_MISS]')
      fetchPermissionsFromDB().then(perms => {
        setPermissions(perms)
        sessionStorage.setItem('user_permissions', JSON.stringify(perms))
        sessionStorage.setItem('permissions_timestamp', Date.now().toString())
      })
    }
  }, [])
  
  return permissions
}
```

### 3. Dashboard Principal (`pages/dashboard.tsx`)

**Alertas de Performance:**
```typescript
// Adicionar ao componente:
useEffect(() => {
  const startTime = performance.now()
  
  return () => {
    const loadTime = performance.now() - startTime
    console.log('[DASHBOARD_LOAD_TIME]', loadTime)
    
    if (loadTime > PERFORMANCE_TARGETS.INITIAL_LOAD) {
      console.warn('[SLOW_DASHBOARD]', {
        loadTime,
        target: PERFORMANCE_TARGETS.INITIAL_LOAD,
        overage: loadTime - PERFORMANCE_TARGETS.INITIAL_LOAD
      })
    }
  }
}, [])
```

## Logs Estruturados para Debug

### Padrão de Log Recomendado
```typescript
// ✅ Use logs estruturados para facilitar análise
const logPerformance = (
  operation: string, 
  duration: number, 
  metadata?: object
) => {
  const log = {
    timestamp: new Date().toISOString(),
    operation,
    duration,
    status: duration > getTarget(operation) ? 'SLOW' : 'OK',
    ...metadata
  }
  
  if (log.status === 'SLOW') {
    console.warn(`[PERF_${operation}]`, log)
  } else {
    console.log(`[PERF_${operation}]`, log)
  }
}

// Uso:
const start = performance.now()
await supabase.from('solicitacoes').select('*')
logPerformance('QUERY_SOLICITACOES', performance.now() - start, {
  table: 'solicitacoes',
  filters: { status: 'AGUARDANDO_SOSFU' }
})
```

## Configuração de Ambiente para Monitoramento

### Development
```env
# .env.local
NEXT_PUBLIC_ENABLE_PERF_LOGGING=true
NEXT_PUBLIC_ENABLE_SENTINELA_TELEMETRY=true
NEXT_PUBLIC_OCR_MAX_PARALLEL=3
NEXT_PUBLIC_CACHE_TTL=900000  # 15 minutos
```

### Production
```env
# .env.production
NEXT_PUBLIC_ENABLE_PERF_LOGGING=false
NEXT_PUBLIC_ENABLE_SENTINELA_TELEMETRY=true
NEXT_PUBLIC_OCR_MAX_PARALLEL=5
NEXT_PUBLIC_CACHE_TTL=1800000  # 30 minutos
```

## Dashboard de Métricas (Futuro)

### Endpoint para Coletar Métricas
```typescript
// pages/api/metrics.ts
export default async function handler(req, res) {
  const metrics = {
    sentinela: await getSentinelaMetrics(),
    database: await getDatabaseMetrics(),
    cache: await getCacheMetrics(),
    errors: await getErrorLogs()
  }
  
  return res.json(metrics)
}
```

### Visualização Recomendada
- **Grafana + Prometheus**: Para deploys em produção
- **Console do Vercel**: Analytics integrado
- **Supabase Dashboard**: Query Performance
- **Sentry**: Error tracking (se implementado)

## Checklist de Otimização Contínua

Revisar mensalmente:
- [ ] Queries lentas no Supabase Dashboard
- [ ] Taxa de cache hit < 70%
- [ ] Componentes com > 5 re-renders por interação
- [ ] Uploads falhando ou lentos
- [ ] OCR com taxa de erro > 10%
- [ ] Sessões expirando antes do esperado
- [ ] Logs de erro recorrentes
