import { useContext } from "react"
import { RegisterCompanyContext } from "../context/registerCompany/RegisterCompanyContext";

export const useRegisterCompany = ()=>{
    const registerContext = useContext(RegisterCompanyContext)

    if(!registerContext){
        throw new Error("[callApiContext] el hook debe estar dentro del contexto")
    }

    return registerContext;
}