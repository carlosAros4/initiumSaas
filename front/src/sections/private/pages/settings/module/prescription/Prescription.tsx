import { useCallApi } from "../../../../../../hooks/useCallApi";
import ButtonInitium from "../../../../../transversal/ui/Button/ButtonInitium";



export const Prescription=()=>{
 const {fetcher}=useCallApi(); 


 const generatePDF=()=>{

 }
    return(
        <div>
            modulo de recetas
            <ButtonInitium onClick={()=>{generatePDF()}}> descargar PDF</ButtonInitium>
        </div>
    )
}


export default Prescription;