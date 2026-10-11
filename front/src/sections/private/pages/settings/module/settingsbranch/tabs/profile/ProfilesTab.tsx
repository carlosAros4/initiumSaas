import { useState } from 'react';
import style from './ProfilesTab.module.css';
import { useCallApi } from '../../../../../../../../hooks/useCallApi';
import CreateProfileForm from './components/CreateProfileForm';
import EditProfileForm from './components/EditProfileForm';
import DeleteProfileConfirm from './components/DeleteProfileConfirm';
import Spinner from '../../../../../../../transversal/ui/Spinner/Spinner';
import ServiceError from '../../../../../../../transversal/ui/ServiceError/ServiceError';
import AlertInitium from '../../../../../../../transversal/ui/Alert/Alert';
import CenterModal from '../../../../../../../transversal/modal/central/CenterModal';

export interface AccessRuleTree {
  id: number;
  key: string;
  descripcion: string;
  children: AccessRuleTree[];
}

export interface ProfileWithAccess {
  id: number;
  name: string;
  descripcion:string;
  userCount: number;
  accessKeys: string[];
}

interface dataApiProfiles {
  profiles: ProfileWithAccess[];
  // Dos ramas separadas según el scope de la página raíz de cada acceso.
  globalAccessRules: AccessRuleTree[];
  branchAccessRules: AccessRuleTree[];
  // Combinado (compatibilidad hacia atrás).
  accessRules: AccessRuleTree[];
}

type Modal = 'crear' | 'editar' | 'eliminar' | '';

export const ProfilesTab = () => {
  const [open, setOpen] = useState(false)
  const [titleModal, setTitleModal] = useState("")
  const [typeModal, settypeModal] = useState<Modal>("")
  const [successMsg, setSuccessMsg] = useState("")
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithAccess | null>(null)
  const { useFetch } = useCallApi();
  const [refresh, setRefresh] = useState(0)
  const { data, isLoading, error } = useFetch<dataApiProfiles>({
    clientType: 'InitiumSaaS-Private',
    path: `settings/profiles/sections?_r=${refresh}`
  })

  if (isLoading && !data) return <Spinner size="lg" isVisibleModule />

  if (error && !data) return <ServiceError />

  function closeModal() {
    setOpen(false)
    setTitleModal("")
    settypeModal("")
    setSelectedProfile(null)
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  return (
    <div className={style.container}>
      {/* Header */}
      <div className={style.header}>
        <h2 className={style.title}>Perfiles</h2>
        <button className={style.btnPrimary} onClick={() => {
          setTitleModal("Crear perfil")
          settypeModal("crear")
          setOpen(true)
        }}>
          + Crear perfil
        </button>
      </div>

      {successMsg && <AlertInitium variant="success" message={successMsg} />}

      {/* Grid de perfiles */}
      <div className={style.grid}>
        {data?.profiles?.map((profile) => (
          <div key={profile.id} className={style.card}>
            <div className={style.cardHeader}>
              <h3 className={style.cardName}>{profile.name}</h3>
              <span className={style.cardBadge}>{profile.accessKeys.length} permisos</span>
            </div>
            <p className={style.cardDescription}>{profile.descripcion}</p>
            <div className={style.cardPermissions}>
              {profile.accessKeys.map((perm) => (
                <span key={perm} className={style.permTag}>{perm}</span>
              ))}
            </div>
            <div className={style.cardFooter}>
              <span className={style.cardUsers}>{profile.userCount} usuario(s)</span>
              <div className={style.cardActions}>
                <button className={style.btnSmall} onClick={() => {
                  setSelectedProfile(profile)
                  setTitleModal("Editar perfil")
                  settypeModal("editar")
                  setOpen(true)
                }}>
                  Editar
                </button>
                <button
                  className={`${style.btnSmall} ${style.btnDanger}`}
                  onClick={() => {
                    setSelectedProfile(profile)
                    setTitleModal("Eliminar perfil")
                    settypeModal("eliminar")
                    setOpen(true)
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      <CenterModal open={open} title={titleModal} onClose={closeModal}>
        {typeModal === 'crear' && (
          <CreateProfileForm
            onSuccess={()=>{ setRefresh(k => k + 1); closeModal(); showSuccess('Perfil creado exitosamente'); }}
            onCancel={closeModal}
            rules={data.branchAccessRules}
          />
        )}
        {typeModal === 'editar' && selectedProfile && (
          <EditProfileForm
            profile={selectedProfile}
            onSuccess={()=>{ setRefresh(k => k + 1); closeModal(); showSuccess('Perfil editado exitosamente'); }}
            onCancel={closeModal}
            rules={data.branchAccessRules}
          />
        )}
        {typeModal === 'eliminar' && selectedProfile && (
          <DeleteProfileConfirm
            profile={selectedProfile}
            onSuccess={()=>{ setRefresh(k => k + 1); closeModal(); showSuccess('Perfil eliminado exitosamente'); }}
            onCancel={closeModal}
          />
        )}
      </CenterModal>
    </div>
  );
};
