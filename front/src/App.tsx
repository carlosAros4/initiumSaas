import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './sections/public/home/HomePage';
import { useAuth } from './context/login/AuthContext';
import { SessionProvider } from './context/session/SessionContextProvider';
import { useSession } from './context/session/SessionContext';
import { useCallApi } from './hooks/useCallApi';
import Transition from './transition';
import Sales from './sections/sales/Sales';
import NotFound from './sections/public/notFound/NotFound';

interface SiteNameItem {
  nameSite: string;
}

function TransitionWrapper() {
  const { sessionKey } = useSession();
  return <Transition key={sessionKey} />;
}

function App() {
  const { flagLogin } = useAuth();
  // const { useFetch } = useCallApi();


  // const {data,isLoading} =  useFetch<SiteNameItem[]>({
  //     clientType: 'InitiumSaaS-Public',
  //     path: 'sales-company/public/sites',
  //     method: 'GET',
  //   })

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* {!isLoading && data.length != 0 &&  data.map((site) => (
          <Route
            key={site.nameSite}
            path={`public/${site.nameSite}`}
            element={<Sales nameSite={site.nameSite} />}
          />
        ))
      } */}
      <Route
        path="/site/*"
        element={
          flagLogin ? (
            <SessionProvider>
              <TransitionWrapper />
            </SessionProvider>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
       <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;



