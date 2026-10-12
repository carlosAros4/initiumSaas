import { lazy, type ComponentType } from 'react';

/**
 * Registry de componentes de páginas privadas.
 * Cada key corresponde al identificador que viene del backend en module.
 * Se usa lazy() para code-splitting automático.
 */
const componentRegistry: Record<string, React.LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import('../pages/home/Home')),


  productos: lazy(() => import('../pages/Productos/Productos')),
  ventasProductos: lazy(() => import('../pages/Productos/Productos')),
  ventasSettings: lazy(() => import('../pages/ventas/config/Config')),


  //configuracion
  access: lazy(() => import('../pages/settings/module/settingsbranch/Settings')),
  branches: lazy(() => import('../pages/settings/module/branches/Branches')),
  globalAccess: lazy(() => import('../pages/settings/module/globalAccess/GlobalAccess')),
  prescriptionConfig: lazy(() => import('../pages/settings/module/prescription/Prescriptions')),
  doctorSignature: lazy(() =>import('../pages/settings/module/doctorSignature/DoctorSignature')),
  


};
export default componentRegistry;
