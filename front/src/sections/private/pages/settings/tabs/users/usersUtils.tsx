import type { ColumnDef } from "../../../../../transversal/ui/DataTable"


export interface UserRow {
    id: number
    name: string
    email: string
    rut: string
    profiles: string[]
    active: boolean
}


export function columnas(users:UserRow[],style:any){

    // Get unique profiles for the select filter
    const allProfiles = [...new Set(users.flatMap(u => u.profiles))].sort()

    const columns: ColumnDef<UserRow>[] = [
    {
        key: 'name',
        label: 'Usuario',
        sortable: true,
        filterable: true,
        filterType: 'text',
        filterPlaceholder: 'Ej: Juan, María...',
        render: (row) => (
            <div className={style.userInfo}>
                <span className={style.userName}>{row.name}</span>
                <span className={style.userEmail}>{row.email}</span>
            </div>
        ),
        filterFn: (row, value) => row.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
        key: 'rut',
        label: 'RUT',
        sortable: true,
        filterable: true,
        filterType: 'text',
        
        filterPlaceholder: 'Ej: 12.345',
    },
    {
        key: 'profiles',
        label: 'Perfiles',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
            { value: '', label: 'Todos' },
            ...allProfiles.map(p => ({ value: p, label: p })),
        ],
        filterDefaultValue: '',
        mobileExpand: true,
        render: (row) => (
            <div className={style.profileTags}>
                {row.profiles.map(p => (
                    <span key={p} className={style.profileTag}>{p}</span>
                ))}
            </div>
        ),
        sortFn: (a, b) => a.profiles.join(',').localeCompare(b.profiles.join(',')),
        filterFn: (row, value) => row.profiles.some(p => p.toLowerCase().includes(value.toLowerCase())),
    },
    {
        key: 'active',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
            { value: 'all', label: 'Todos' },
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
        ],
        filterDefaultValue: 'all',
        mobileExpand: true,
        render: (row) => (
            <span className={`${style.badge} ${row.active ? style.badgeActive : style.badgeInactive}`}>
                {row.active ? 'Activo' : 'Inactivo'}
            </span>
        ),
        sortFn: (a, b) => Number(a.active) - Number(b.active),
        filterFn: (row, value) => {
            if (value === 'all') return true
            return value === 'active' ? row.active : !row.active
        },
    },
]
return  columns;
}