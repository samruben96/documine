# Reporting Issues

## Chart Data Population Bug (Epic 23, Story 23.6, 2025-12-10)

**Issue:** Report generation succeeded but charts showed "No data available for chart" error. Console logged:
```
[ReportChart] Validation failed: "No data available for chart"
```

**Root Cause:** The `parseAIResponse()` function in both API route and report-generator service created chart configurations with empty data arrays:
```typescript
// Bug - charts created with empty data
const charts: ChartConfig[] = (parsed.charts || [])
  .map((chart, idx) => ({
    id: `chart-${idx + 1}`,
    type: validateChartType(chart.type),
    xKey: chart.xKey,
    yKey: chart.yKey,
    data: [], // Empty! Comment said "Will be populated by frontend"
  }));
```

The comment "Will be populated by frontend from parsed data" was never implemented.

**Resolution:** Added `buildChartData()` function that aggregates row data by xKey and sums yKey values:

```typescript
function buildChartData(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string | string[]
): Record<string, unknown>[] {
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];
  const grouped = new Map<string, Record<string, number>>();

  for (const row of rows) {
    const xValue = String(row[xKey] ?? 'Unknown');
    if (!grouped.has(xValue)) {
      const initial: Record<string, number> = {};
      for (const yk of yKeys) initial[yk] = 0;
      grouped.set(xValue, initial);
    }
    const agg = grouped.get(xValue)!;
    for (const yk of yKeys) {
      const val = row[yk];
      if (typeof val === 'number') {
        agg[yk] = (agg[yk] ?? 0) + val;
      } else if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/[$,]/g, ''));
        if (!isNaN(parsed)) agg[yk] = (agg[yk] ?? 0) + parsed;
      }
    }
  }

  // Convert to array, sort, limit to top 20
  const result: Record<string, unknown>[] = [];
  for (const [xValue, yValues] of grouped) {
    result.push({ [xKey]: xValue, ...yValues });
  }
  result.sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey])));
  return result.slice(0, 20);
}
```

**Files Changed:**
- `src/app/api/reporting/generate/route.ts` - Added `buildChartData()`, called when creating each chart config
- `src/lib/reporting/report-generator.ts` - Same fix for the standalone service function

**Key Learning:** When AI generates chart configurations (xKey, yKey, chart type), the backend must transform the raw data into chart-ready format. Don't rely on frontend to do data aggregation.
