# Component library

Shared, reusable components in `src/components/`. Spec: `docs/FRONTEND.md` §2.

| Component | Key props | Accessibility |
|---|---|---|
| `Button` | `variant` ('primary'\|'secondary'\|'danger'), `isLoading`, plus native `<button>` props (`onClick`, `disabled`, ...) | Visible focus ring; `aria-busy` + disabled while loading |
| `StatusPill` | `status` ('pending'\|'in_progress'\|'success'\|'failed') | Icon + text label, never color alone |
| `ProgressBar` | `value`, `max`, `label` | `role="progressbar"` with `aria-valuenow/min/max`; visible numeric label |
| `EmptyState` | `message`, `action?` | — |
| `Skeleton` | `rows` | `aria-hidden="true"` (decorative placeholder) |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Focus trap, `Esc` closes, focus returns to the trigger on close |
| `FilterBar` | `statusFilter`, `searchValue`, `onChange` | Labeled inputs (`<label for>`), search debounced 300ms |
| `DataTable<T>` | `columns`, `rows`, `rowKey`, `onSort?` (`(key, direction)` - DataTable owns the toggle), `onRowClick?`, `isLoading?` | `<th scope="col">`, sortable headers are real `<button>`s; rows with `onRowClick` are keyboard-focusable (Enter/Space activate); stacked card layout below `md` |
| `AppHeader` | `breadcrumb?` (ReactNode) | Persistent nav: logo/wordmark link to `/`, optional breadcrumb trail (hidden below `sm`), Sign out |
