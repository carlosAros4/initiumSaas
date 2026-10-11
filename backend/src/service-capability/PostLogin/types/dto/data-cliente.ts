import { Company } from 'src/service-capability/Login/types/dto/login';


export interface DataCliente {
  companies: Company[];
  userId: number;  
  dv:string;
  rut: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' ;
  email: string;
  blocked: boolean;
  verified: boolean;
  newUsers: boolean;
}
