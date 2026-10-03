import SalesHeader4 from './components/SalesHeader/headers4/SalesHeader4';
import styles from './Sales.module.css';

interface Props {
  nameSite: string;
}

export const Sales = ({ nameSite }: Props) => {
  return (
    <SalesHeader4 siteName={nameSite}>
      <div className={styles.contentDark}>
        <h1 className={styles.titleDark}>Bienvenido a {nameSite}</h1>
        <p className={styles.subtitleDark}>
          Explora nuestra documentación y recursos para comenzar.
        </p>
      </div>
    </SalesHeader4>
  );
};

export default Sales;
