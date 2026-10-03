import { useContext } from "react"
import { CallApiContext } from "../context/callApi/CallApiContext"

export const useCallApi = ()=>{
    const apiContext = useContext(CallApiContext)

    if(!apiContext){
        throw new Error("[callApiContext] el hook debe estar dentro del contexto")
    }

    return apiContext;
}