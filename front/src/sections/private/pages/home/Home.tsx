
import { useSession } from "../../../../hooks/useSession";
import styles from "./Home.module.css";

export const Home = () => {
  const { companySelect, cliente } = useSession();

  return (
    <div>
      <div className={styles.banner}>
        <span className={styles.bannerIcon}>👋</span>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>
            ¡Bienvenido{cliente?.firstName ? `, ${cliente.firstName}` : ""}!
          </h1>
          <p className={styles.bannerSubtitle}>
            Bienvenido a  <strong>{companySelect?.name}</strong>. Aquí tienes
            un resumen de tu espacio de trabajo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
