import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Query Keys
export const queryKeys = {
  deals: ['deals'] as const,
  deal: (id: string) => ['deals', id] as const,
  companies: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,
  pipelineStats: ['pipeline-stats'] as const,
  conversations: (dealId: string) => ['conversations', dealId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  user: ['user'] as const,
}

// Deal Hooks
export function useDeals(params?: { 
  status?: string 
  stage?: string 
  skip?: number 
  limit?: number 
}) {
  return useQuery({
    queryKey: [...queryKeys.deals, params],
    queryFn: ({ signal }) => apiClient.getDeals(params, { signal }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: queryKeys.deal(id),
    queryFn: ({ signal }) => apiClient.getDeal(id, { signal }),
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createDeal(data),
    onSuccess: () => {
      // Invalidate deals list
      queryClient.invalidateQueries({ queryKey: queryKeys.deals })
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelineStats })
    },
  })
}

export function useUpdateDeal(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.updateDeal(id, data),
    onSuccess: () => {
      // Invalidate both the specific deal and the deals list
      queryClient.invalidateQueries({ queryKey: queryKeys.deal(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.deals })
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelineStats })
    },
  })
}

export function useUpdateDealStatus(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) => 
      apiClient.updateDealStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deal(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.deals })
      queryClient.invalidateQueries({ queryKey: queryKeys.pipelineStats })
    },
  })
}

export function usePipelineStats() {
  return useQuery({
    queryKey: queryKeys.pipelineStats,
    queryFn: ({ signal }) => apiClient.getPipelineStats({ signal }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Company Hooks
export function useCompanies(params?: { 
  sector?: string 
  search?: string 
  skip?: number 
  limit?: number 
}) {
  return useQuery({
    queryKey: [...queryKeys.companies, params],
    queryFn: ({ signal }) => apiClient.getCompanies(params, { signal }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies })
    },
  })
}

// Chat Hooks
export function useConversations(dealId: string) {
  return useQuery({
    queryKey: queryKeys.conversations(dealId),
    queryFn: ({ signal }) => apiClient.getDealConversations(dealId, { signal }),
    enabled: !!dealId,
  })
}

export function useMessages(conversationId: string, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.messages(conversationId), limit],
    queryFn: ({ signal }) => apiClient.getConversationMessages(conversationId, limit, { signal }),
    enabled: !!conversationId,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ content, context }: { content: string; context?: string }) =>
      apiClient.sendMessage(conversationId, content, context),
    onSuccess: () => {
      // Refresh messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages(conversationId) 
      })
    },
  })
}

export function useQuickAnalysis() {
  return useMutation({
    mutationFn: ({ dealId, analysisType }: { dealId: string; analysisType: string }) =>
      apiClient.quickAnalysis(dealId, analysisType),
  })
}

// User Hook
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: ({ signal }) => apiClient.getCurrentUser({ signal }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry user queries to avoid auth loops
  })
}

// Health Check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiClient.healthCheck({ signal }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
  })
}