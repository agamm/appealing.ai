import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expandDomains, checkDomainAvailability, expandMoreDomains, type ExpandResponse } from '@/lib/api'

// Hook for expanding domains
export function useExpandDomains(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['domains', 'expand', query],
    queryFn: () => expandDomains(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for checking domain availability
export function useCheckDomain(domain: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['domains', 'check', domain],
    queryFn: () => checkDomainAvailability(domain),
    enabled: enabled && domain.trim().length > 0,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  })
}

// Hook for expanding more domains
export function useExpandMoreDomains() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: expandMoreDomains,
    onSuccess: (data, variables) => {
      // Update the cache with new pattern results
      queryClient.setQueryData(
        ['domains', 'expand', variables.query],
        (oldData: ExpandResponse | undefined) => {
          if (!oldData) return data
          return {
            ...oldData,
            patternResults: data.patternResults,
          }
        }
      )
    },
  })
}