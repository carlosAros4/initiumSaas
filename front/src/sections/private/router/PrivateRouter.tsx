import { Routes, Route, Navigate } from 'react-router-dom';
import componentRegistry from './componentRegistry';
import { useSession } from '../../../context/session/SessionContext';
import { Layout } from '../layout/Layout';
import NotFound from '../pages/notFound/NotFound';
import { slugify } from '../../../utils/slugify';
import TestDocumentTemplates from '../pages/settings/module/documentTemplates/TestDocumentTemplates';

export function PrivateRouter() {
  const { modules, companySelect } = useSession();
  const companyName = companySelect ? slugify(companySelect.name) : "";
  return (    
      <Routes>
       
        <Route index element={<Navigate to={`${companyName}/home`} replace />} />
        <Route path={`${companyName}/*`} element={<Layout />}>
        
          {modules.map((map) => {
            const Component = componentRegistry[map.module];

            if (!Component) {
              console.warn(`[PrivateRouter] No se encontró componente para key: "${map.module}"`);
              return null;
            }
            const relativePath = map.url.startsWith('/') ? map.url.slice(1) : map.url;
            return (
              <Route
                key={map.module}
                path={relativePath}
                element={<Component />}
              />
            );
          })}
          <Route index element={<Navigate to="home" replace />} />
          <Route path="*" element={<NotFound />} />
          <Route path={`test`} element={<TestDocumentTemplates/>}/>
        </Route>
         
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>    
  );
}
