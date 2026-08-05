import { useCallback, useMemo } from 'react'
import { getMetricsMock } from './futureMetrics.mock'
import type { UseMetricsParams, UseMetricsResult } from './futureMetrics.types'

export function useMetrics(params: UseMetricsParams = {}): UseMetricsResult {
  const {
    period = 'last7Days',
    startDate,
    endDate,
    businessId,
  } = params
  const data = useMemo(() => getMetricsMock(period), [period])

  const refetch = useCallback(async () => {
    // Futuro: metricsApi.getMetrics({ period, startDate, endDate, businessId }).
    void period
    void startDate
    void endDate
    void businessId
  }, [period, startDate, endDate, businessId])

  return {
    data,
    isLoading: false,
    error: null,
    refetch,
  }
}
