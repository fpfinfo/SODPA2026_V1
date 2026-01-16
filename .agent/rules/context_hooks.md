---
description: Regras de performance e reatividade para hooks React
applies_to: ["**/hooks/**", "**/components/**/*.tsx"]
---

# Modo Reatividade - Performance React Hooks

## Quando Ativo
Esta regra se aplica automaticamente quando você está trabalhendo em:
- `hooks/*.ts`
- `components/*.tsx`
- Custom hooks e componentes React

## Prioridades de Performance

### 1. Prevenir Re-renders Desnecessários
✅ **SEMPRE use:**
```typescript
// Memoize valores computados pesados
const expensiveValue = useMemo(() => {
  return heavyComputation(data)
}, [data])

// Memoize callbacks para evitar re-criar funções
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### 2. Evitar Loops Infinitos em useEffect
✅ **SEMPRE valide dependências:**
```typescript
// ❌ ERRADO - loop infinito
useEffect(() => {
  setData(processData(data))
}, [data])

// ✅ CORRETO - dependências controladas
useEffect(() => {
  if (!dataLoaded) {
    loadData()
  }
}, [dataLoaded])
```

### 3. Otimizar Queries Supabase em Hooks

✅ **Padrão SOSFU para Data Fetching:**
```typescript
const useSOSFUData = (filters: Filters) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      setLoading(true)
      
      // ✅ Query seletiva - busque apenas campos necessários
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, numero_pc, status, created_at, profiles(nome)')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(50) // ✅ SEMPRE limite resultados
      
      if (isMounted) {
        setData(data || [])
        setLoading(false)
      }
    }
    
    fetchData()
    return () => { isMounted = false }
  }, [filters]) // ✅ Dependências explícitas
  
  return { data, loading }
}
```

### 4. Cache Local para Dados Mestres
✅ **Para tabelas de referência (comarcas, unidades, elementos):**
```typescript
// ✅ Carregue UMA VEZ e reutilize
const useComarcas = () => {
  const [comarcas, setComarcas] = useState<Comarca[]>([])
  
  useEffect(() => {
    const cached = sessionStorage.getItem('comarcas')
    if (cached) {
      setComarcas(JSON.parse(cached))
    } else {
      loadComarcasFromDB().then(data => {
        setComarcas(data)
        sessionStorage.setItem('comarcas', JSON.stringify(data))
      })
    }
  }, []) // ✅ Array vazio - carrega apenas uma vez
  
  return comarcas
}
```

### 5. Debouncing para Inputs de Busca
✅ **SEMPRE debounce buscas em tempo real:**
```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useMemo(
  () => debounce((value: string) => performSearch(value), 300),
  []
)

useEffect(() => {
  debouncedSearch(searchTerm)
}, [searchTerm, debouncedSearch])
```

## Checklist de Performance - Hooks

Antes de commit em `hooks/`:
- [ ] Dependências de `useEffect` estão corretas e mínimas
- [ ] Valores computados pesados usam `useMemo`
- [ ] Callbacks usam `useCallback` quando passados como props
- [ ] Queries Supabase têm `.select()` seletivo (não `*`)
- [ ] Queries Supabase têm `.limit()` apropriado
- [ ] Cleanup functions implementadas onde necessário
- [ ] Cache implementado para dados de referência

## Padrões SOSFU Específicos

### Hook de Supabase Realtime
```typescript
// ✅ SEMPRE faça cleanup de subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('solicitacoes-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'solicitacoes' },
      handleChange
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe() // ✅ CRÍTICO
  }
}, [])
```

### Hook de RBAC Check
```typescript
// ✅ Cache de roles para evitar queries repetidas
const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null)
  
  useEffect(() => {
    const cachedRole = sessionStorage.getItem('user_role')
    if (cachedRole) {
      setRole(cachedRole)
    } else {
      fetchUserRole().then(r => {
        setRole(r)
        sessionStorage.setItem('user_role', r)
      })
    }
  }, [])
  
  return role
}
```

## ⚠️ NUNCA FAÇA
- ❌ `useEffect` sem array de dependências (roda em todo render)
- ❌ `useState` dentro de loops ou condicionais
- ❌ Queries com `.select('*')` e sem `.limit()`
- ❌ Subscriptions realtime sem cleanup
- ❌ Estado derivado sem `useMemo` para computações pesadas
