

import style from './Headers.module.css'
import Modal from '../../../transversal/modal/lateral/ModalLateral'
import { useState } from 'react'
import ButtonInitium from '../../../transversal/ui/Button/ButtonInitium'
import CenterModal from '../../../transversal/modal/central/CenterModal'
import Login from '../login/Login'
import { RegisterCompanyContextProvider } from '../../../../context/registerCompany/RegisterCompanyProvider'
import RegisterCompany from '../RegisterCompany/RegisterCompany'


export const Headres = () => {
    const [openModalRegister, setOpenModalRegister] = useState<boolean>(false);
    const [openModalLogin, setOpenModalLogin] = useState<boolean>(false)
    return (
        <>
            <div className={style.headers}>
                <span className={style.logo}>Logo</span>
                <div className={style.acciones}>

                    <ButtonInitium variant="outlined" onClick={() => { setOpenModalRegister(true) }}>
                        Registrar Empresa
                    </ButtonInitium>
                    <ButtonInitium variant="contained" onClick={() => { setOpenModalLogin(true); }}>
                        Ingresar
                    </ButtonInitium>
                </div>
            </div >

            {openModalRegister && <Modal
                open={openModalRegister}
                onClose={() => setOpenModalRegister(false)}
                title={'Crea tu Empresa'}>
                <RegisterCompanyContextProvider>
                    <RegisterCompany />
                </RegisterCompanyContextProvider>
            </Modal>
            }
            {openModalLogin && <CenterModal
                open={openModalLogin}
                onClose={() => setOpenModalLogin(false)}
                title={'Login Usuario'}>
                <Login onSuccess={() => { setOpenModalLogin(false); }} />
            </CenterModal>
            }
        </>
    )
}