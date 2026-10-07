import { useState } from "react";
import { useCallApi } from "../../../../../../hooks/useCallApi";
import ButtonInitium from "../../../../../transversal/ui/Button/ButtonInitium";



export const Prescription = () => {
    const { fetcher } = useCallApi();
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        setLoading(true)
        await fetcher({
            clientType: 'InitiumSaaS-Private',
            path: 'settings/prescription',
            method: 'POST',
            document: true,
            body: {
                nombre: 'Juan Pérez',
                edad: 30,
                medico: 'Dra. González',
            },
        }).finally(() => {
            setLoading(false)

        });
    }
    return (
        <div>
            modulo de recetas
            <ButtonInitium loading={loading} onClick={() => { generatePDF() }}> descargar PDF</ButtonInitium>
        </div>
    )
}


export default Prescription;
