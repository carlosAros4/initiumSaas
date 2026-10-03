import { useMemo, useState, type ReactNode } from 'react'
import FilterListIcon from '@mui/icons-material/FilterList'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CenterModal from '../../modal/central/CenterModal'
import ButtonInitium from '../Button/ButtonInitium'
import style from './DataTable.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterType = 'text' | 'select'

export interface FilterOption {
    value: string
    label: string
}

export interface ColumnDef<T> {
    key: string
    label: string
    sortable?: boolean
    filterable?: boolean
    filterType?: FilterType
    filterOptions?: FilterOption[]
    filterPlaceholder?: string
    filterDefaultValue?: string
    render?: (row: T) => ReactNode
    sortFn?: (a: T, b: T) => number
    filterFn?: (row: T, filterValue: string) => boolean
    flex?: number
    mobileExpand?: boolean
}

export interface DataTableProps<T> {
    columns: ColumnDef<T>[]
    data: T[]
    rowKey: (row: T) => string | number
    pageSizeOptions?: number[]
    defaultPageSize?: number
    emptyMessage?: string
    renderActions?: (row: T) => ReactNode
    actionsFlex?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DataTable<T>({
    columns,
    data,
    rowKey,
    pageSizeOptions = [5, 10, 50],
    defaultPageSize = 5,
    emptyMessage = 'No se encontraron resultados.',
    renderActions,
    actionsFlex = 1.5,
}: DataTableProps<T>) {
    // State
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [filters, setFilters] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        columns.forEach(col => {
            if (col.filterable) {
                initial[col.key] = col.filterDefaultValue ?? ''
            }
        })
        return initial
    })
    const [tempFilterValue, setTempFilterValue] = useState('')
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({})
    const [filterColumn, setFilterColumn] = useState<string | null>(null)
    const [filterAllOpen, setFilterAllOpen] = useState(false)
    const [pageSize, setPageSize] = useState(defaultPageSize)
    const [currentPage, setCurrentPage] = useState(1)
    const [expandedKey, setExpandedKey] = useState<string | number | null>(null)

    // Derived
    const filterableColumns = columns.filter(c => c.filterable)
    const summaryColumns = columns.filter(c => !c.mobileExpand)
    const expandColumns = columns.filter(c => c.mobileExpand)

    const hasActiveFilters = filterableColumns.some(col => {
        const val = filters[col.key]
        const defaultVal = col.filterDefaultValue ?? ''
        return val !== defaultVal
    })

    // Sort handler
    function handleSort(key: string) {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
        setCurrentPage(1)
    }

    // Filter per column
    function openColumnFilter(col: ColumnDef<T>) {
        setFilterColumn(col.key)
        setTempFilterValue(filters[col.key] ?? '')
    }

    function closeColumnFilter() {
        setFilterColumn(null)
        setTempFilterValue('')
    }

    function applyColumnFilter() {
        if (!filterColumn) return
        setFilters(prev => ({ ...prev, [filterColumn]: tempFilterValue }))
        setCurrentPage(1)
        closeColumnFilter()
    }

    function clearColumnFilter() {
        if (!filterColumn) return
        const col = columns.find(c => c.key === filterColumn)
        const defaultVal = col?.filterDefaultValue ?? ''
        setFilters(prev => ({ ...prev, [filterColumn]: defaultVal }))
        setCurrentPage(1)
        closeColumnFilter()
    }

    // Filter all (mobile)
    function openAllFilters() {
        setTempFilters({ ...filters })
        setFilterAllOpen(true)
    }

    function closeAllFilters() {
        setFilterAllOpen(false)
    }

    function applyAllFilters() {
        setFilters({ ...tempFilters })
        setCurrentPage(1)
        closeAllFilters()
    }

    function clearAllFilters() {
        const empty: Record<string, string> = {}
        filterableColumns.forEach(col => {
            empty[col.key] = col.filterDefaultValue ?? ''
        })
        setTempFilters(empty)
        setFilters(empty)
        setCurrentPage(1)
        closeAllFilters()
    }

    // Process data (filter + sort)
    const processedData = useMemo(() => {
        let result = [...data]

        // Apply filters
        filterableColumns.forEach(col => {
            const val = filters[col.key]
            const defaultVal = col.filterDefaultValue ?? ''
            if (val && val !== defaultVal) {
                if (col.filterFn) {
                    result = result.filter(row => col.filterFn!(row, val))
                } else {
                    // Default text includes
                    result = result.filter(row => {
                        const cellValue = String((row as Record<string, unknown>)[col.key] ?? '')
                        return cellValue.toLowerCase().includes(val.toLowerCase())
                    })
                }
            }
        })

        // Apply sort
        if (sortKey) {
            const col = columns.find(c => c.key === sortKey)
            if (col) {
                result.sort((a, b) => {
                    let compare = 0
                    if (col.sortFn) {
                        compare = col.sortFn(a, b)
                    } else {
                        const aVal = String((a as Record<string, unknown>)[col.key] ?? '')
                        const bVal = String((b as Record<string, unknown>)[col.key] ?? '')
                        compare = aVal.localeCompare(bVal)
                    }
                    return sortDir === 'asc' ? compare : -compare
                })
            }
        }

        return result
    }, [data, filters, sortKey, sortDir, columns, filterableColumns])

    // Pagination
    const totalPages = Math.ceil(processedData.length / pageSize)
    const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // Current filter column def (for modal)
    const activeFilterCol = filterColumn ? columns.find(c => c.key === filterColumn) : null

    return (
        <>
            {/* Mobile filter button */}
            {filterableColumns.length > 0 && (
                <ButtonInitium
                    variant="outlined"
                    size="sm"
                    className={`${style.mobileFilterBtn} ${hasActiveFilters ? style.mobileFilterBtnActive : ''}`}
                    startIcon={<FilterListIcon />}
                    onClick={openAllFilters}
                >
                    Filtrar
                </ButtonInitium>
            )}

            <div className={style.container}>
                <div className={style.tableWrapper}>
                    {/* Headers */}
                    <div className={style.headers}>
                        {columns.map(col => (
                            <span
                                key={col.key}
                                className={`${style.cell} ${style.headerCell}`}
                                style={{ flex: col.flex ?? 1 }}
                            >
                                <span
                                    className={style.headerLabel}
                                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                    style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                                >
                                    {col.label}
                                    {col.sortable && (
                                        <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                                    )}
                                </span>
                                {col.filterable && (
                                    <button
                                        type="button"
                                        className={`${style.filterIcon} ${(filters[col.key] && filters[col.key] !== (col.filterDefaultValue ?? '')) ? style.filterIconActive : ''}`}
                                        onClick={() => openColumnFilter(col)}
                                        aria-label={`Filtrar por ${col.label}`}
                                    >
                                        <FilterListIcon fontSize="inherit" />
                                    </button>
                                )}
                            </span>
                        ))}
                        {renderActions && (
                            <span className={style.cellActions} style={{ flex: actionsFlex }}>
                                Acciones
                            </span>
                        )}
                    </div>

                    {/* Empty state */}
                    {paginatedData.length === 0 && (
                        <div className={style.emptyState}>{emptyMessage}</div>
                    )}

                    {/* Rows */}
                    {paginatedData.map(row => {
                        const key = rowKey(row)
                        return (
                            <div key={key} className={style.row}>
                                <div
                                    className={style.rowSummary}
                                    onClick={() => setExpandedKey(prev => prev === key ? null : key)}
                                >
                                    {summaryColumns.map(col => (
                                        <span
                                            key={col.key}
                                            className={style.cell}
                                            style={{ flex: col.flex ?? 1 }}
                                            data-label={col.label}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key] ?? '')
                                            }
                                        </span>
                                    ))}
                                    {expandColumns.length > 0 && (
                                        <span className={`${style.expandIcon} ${expandedKey === key ? style.expandIconOpen : ''}`}>
                                            <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
                                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                                {expandColumns.length > 0 && (
                                    <div className={`${style.rowDetails} ${expandedKey === key ? style.rowDetailsOpen : ''}`}>
                                        {expandColumns.map(col => (
                                            <span
                                                key={col.key}
                                                className={style.cell}
                                                data-label={col.label}
                                            >
                                                {col.render
                                                    ? col.render(row)
                                                    : String((row as Record<string, unknown>)[col.key] ?? '')
                                                }
                                            </span>
                                        ))}
                                        {renderActions && (
                                            <span className={`${style.cell} ${style.cellActions}`}>
                                                {renderActions(row)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Desktop actions when no expand columns */}
                                {expandColumns.length === 0 && renderActions && (
                                    <span
                                        className={style.cellActions}
                                        style={{ flex: actionsFlex }}
                                    >
                                        {renderActions(row)}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Pagination */}
                {processedData.length > 0 && (
                    <div className={style.pagination}>
                        <div className={style.paginationInfo}>
                            <span>Filas por página:</span>
                            <select
                                className={style.pageSizeSelect}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                            >
                                {pageSizeOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className={style.paginationControls}>
                            <span className={style.paginationText}>
                                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processedData.length)} de {processedData.length}
                            </span>
                            <button
                                className={style.paginationBtn}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                aria-label="Página anterior"
                            >
                                ‹
                            </button>
                            <button
                                className={style.paginationBtn}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                aria-label="Página siguiente"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Column filter modal */}
            <CenterModal
                open={filterColumn !== null}
                title={activeFilterCol ? `Filtrar por ${activeFilterCol.label}` : ''}
                onClose={closeColumnFilter}
                width="400px"
            >
                {activeFilterCol && (
                    <div className={style.filterForm}>
                        <div className={style.filterField}>
                            <label className={style.filterLabel}>{activeFilterCol.label}</label>
                            {activeFilterCol.filterType === 'select' ? (
                                <select
                                    className={style.filterInput}
                                    value={tempFilterValue}
                                    onChange={(e) => setTempFilterValue(e.target.value)}
                                    autoFocus
                                >
                                    {activeFilterCol.filterOptions?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className={style.filterInput}
                                    placeholder={activeFilterCol.filterPlaceholder ?? `Buscar...`}
                                    value={tempFilterValue}
                                    onChange={(e) => setTempFilterValue(e.target.value)}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className={style.filterActions}>
                            <ButtonInitium variant="outlined" size="sm" onClick={clearColumnFilter}>
                                Limpiar
                            </ButtonInitium>
                            <ButtonInitium onClick={applyColumnFilter}>
                                Aplicar
                            </ButtonInitium>
                        </div>
                    </div>
                )}
            </CenterModal>

            {/* Mobile: all filters modal */}
            <CenterModal
                open={filterAllOpen}
                title="Filtrar"
                onClose={closeAllFilters}
                width="400px"
            >
                <div className={style.filterForm}>
                    {filterableColumns.map(col => (
                        <div key={col.key} className={style.filterField}>
                            <label className={style.filterLabel}>{col.label}</label>
                            {col.filterType === 'select' ? (
                                <select
                                    className={style.filterInput}
                                    value={tempFilters[col.key] ?? col.filterDefaultValue ?? ''}
                                    onChange={(e) => setTempFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                                >
                                    {col.filterOptions?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className={style.filterInput}
                                    placeholder={col.filterPlaceholder ?? `Buscar...`}
                                    value={tempFilters[col.key] ?? ''}
                                    onChange={(e) => setTempFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                                />
                            )}
                        </div>
                    ))}
                    <div className={style.filterActions}>
                        <ButtonInitium variant="outlined" size="sm" onClick={clearAllFilters}>
                            Limpiar filtros
                        </ButtonInitium>
                        <ButtonInitium onClick={applyAllFilters}>
                            Aplicar filtros
                        </ButtonInitium>
                    </div>
                </div>
            </CenterModal>
        </>
    )
}


function SortIcon({ colKey, sortKey, sortDir }: { colKey: string; sortKey: string | null; sortDir: 'asc' | 'desc' }) {
    const isActive = sortKey === colKey
    return (
        <span className={`${style.sortIcon} ${isActive ? style.sortIconActive : ''}`}>
            {isActive && sortDir === 'asc' && <ArrowUpwardIcon fontSize="inherit" />}
            {isActive && sortDir === 'desc' && <ArrowDownwardIcon fontSize="inherit" />}
            {!isActive && <ArrowUpwardIcon fontSize="inherit" />}
        </span>
    )
}
