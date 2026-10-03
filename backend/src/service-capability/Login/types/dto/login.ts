export interface loginResponseCompany {
  accessToken?: string;
  refresh?:string;
  verified: boolean;
  blocked: boolean;
  newUsers: boolean;
  companies?: Company[];
}

export interface UserRecord {
  id: number;
  rut: string;
  dv: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  verified: boolean;
  blocked: boolean;
  newusers: boolean;
}


export interface Company {
  favorite: boolean;
  blocked: boolean;
  tenant_id: string;
  logo: string;
  rut: string;
  dv: string;
  id:number;
  name: string;
  type: string;
  active: boolean;
}