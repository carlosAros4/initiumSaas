import { useState } from "react";
import { RegisterCompanyContext, type DataRegisterCompany, } from "./RegisterCompanyContext";


export interface Props {
  children: React.ReactNode;
}


export const RegisterCompanyContextProvider = ({ children }: Props) => {
 const [dataRegisterCompany,setDataRegisterCompany] = useState<DataRegisterCompany>(null)


  const setting=(data:DataRegisterCompany)=>{
    setDataRegisterCompany({
      accessToken:data.accessToken,
      refresh:data.refresh,
      verify:data.verify,
      rutClient:data.rutClient
    })
  }

  return (
    <RegisterCompanyContext.Provider value={{ data:dataRegisterCompany,setData:setting }}>
      {children}
    </RegisterCompanyContext.Provider>
  );
};
