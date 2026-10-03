import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import style from './Users.module.css'
import { useCallApi } from '../../../../../../hooks/useCallApi'
import { columnas, type UserRow } from './usersUtils'
import AddUser from './addUser/AddUser'
import AssignProfile from './assignProfile/AssignProfile'
import Spinner from '../../../../../transversal/ui/Spinner/Spinner'
import ServiceError from '../../../../../transversal/ui/ServiceError/ServiceError'
import ButtonInitium from '../../../../../transversal/ui/Button/ButtonInitium'
import { DataTable } from '../../../../../transversal/ui/DataTable'
import CenterModal from '../../../../../transversal/modal/central/CenterModal'

type Modal = 'addUser' | 'deleteUser' | 'assingProfile' | 'resetPass' | '';

export const Users = () => {
    const [open, setOpen] = useState(false)
    const [titleModal, setTitleModal] = useState("")
    const [typeModal, settypeModal] = useState<Modal>("")
    const [refreshKey, setRefreshKey] = useState(0)
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
    const { useFetch } = useCallApi();

    const { data, isLoading, error } = useFetch<UserRow[]>({
        clientType: 'InitiumSaaS-Private',
        path: `settings/users?_r=${refreshKey}`
    })
    function openModal(title: string, type: Modal, user?: UserRow) {
        setOpen(true)
        setTitleModal(title)
        settypeModal(type)
        if (user) setSelectedUser(user)
    }

    function closeModal() {
        setOpen(false)
        setTitleModal("")
        settypeModal("")
        setSelectedUser(null)
    }

    if (isLoading && !data) return <Spinner size="lg" isVisibleModule />
    if (error && !data) return <ServiceError />
    // Row action buttons
    const renderActions = (row: UserRow) => {
        if (row.profiles.includes("Creador")) return <></>
        return <>
            <ButtonInitium variant="outlined" size="sm" onClick={() => openModal("Asignar Perfiles", 'assingProfile', row)}>
                Perfiles
            </ButtonInitium>
            <ButtonInitium variant="outlined" size="sm" onClick={() => openModal("Resetear Clave", 'resetPass')}>
                Resetear
            </ButtonInitium>
            <ButtonInitium
                variant="outlined"
                size="sm"
                className={style.btnDanger}
                onClick={() => openModal(`Eliminar a ${row.name}`, 'deleteUser')}
            >
                Eliminar
            </ButtonInitium>
        </>
    }
    return (
        <>
            <ButtonInitium
                className={style.add}
                startIcon={<AddIcon />}
                onClick={() => openModal("Agregar usuario", 'addUser')}
            >
                Agregar usuario
            </ButtonInitium>
            <DataTable<UserRow>
                columns={columnas(data ?? [], style)}
                data={data ?? []}
                rowKey={(row) => row.id}
                pageSizeOptions={[5, 10, 50]}
                defaultPageSize={5}
                emptyMessage="No se encontraron usuarios con los filtros aplicados."
                renderActions={renderActions}
            />
            <CenterModal open={open} title={titleModal} onClose={closeModal}>
                {typeModal === 'addUser' && <AddUser onSuccess={() => { setRefreshKey(k => k + 1); closeModal(); }} />}
                {typeModal === 'deleteUser' && <h2>Eliminar Usuario</h2>}
                {typeModal === 'assingProfile' && selectedUser && (
                    <AssignProfile
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                        onSuccess={() => { setRefreshKey(k => k + 1); closeModal(); }}
                    />
                )}
                {typeModal === 'resetPass' && <h2>Resetear Contraseña</h2>}
            </CenterModal>
        </>
    )
}
