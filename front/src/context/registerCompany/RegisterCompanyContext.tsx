import { createContext } from "react";

export interface DataRegisterCompany{
  accessToken:string,
  refresh:string,
  verify:boolean,
  rutClient:string | null;
}

export interface IRegisterCompanyContext {
  data:DataRegisterCompany
  setData:(data:DataRegisterCompany)=>void
}

export const RegisterCompanyContext = createContext<IRegisterCompanyContext | null>(null);
