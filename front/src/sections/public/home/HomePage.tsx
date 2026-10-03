import { useNavigate } from 'react-router-dom';
import s from './HomePage.module.css';
import ButtonInitium from '../../transversal/ui/Button/ButtonInitium';
import { Headres } from '../components/headers/Headers';


const FEATURES = [
  {
    icon: '⚙️',
    title: 'Gestión Multi-Área',
    desc: 'Centraliza operaciones, equipos y procesos de tu empresa en una sola plataforma.',
    badge: 'Eficiencia +300%',
  },
  {
    icon: '🤝',
    title: 'Colaboración en Tiempo Real',
    desc: 'Tu equipo trabaja sincronizado con accesos por rol, notificaciones y flujos automatizados.',
    badge: 'Productividad +200%',
  },
  {
    icon: '📊',
    title: 'Reportes y Analytics',
    desc: 'Visualiza métricas clave de tu negocio y toma decisiones basadas en datos reales.',
    badge: 'ROI visible +400%',
  },
];

const STATS = [
  { value: '93%', label: 'Reducción en tareas manuales' },
  { value: '12x', label: 'Más capacidad operativa' },
  { value: '39%', label: 'Mejora en productividad' },
  { value: '27%', label: 'Reducción de costos operativos' },
];

const CLIENTS = ['Empresa A', 'Empresa B', 'Empresa C', 'Empresa D', 'Empresa E', 'Empresa F'];

export default function HomePage() {

  return (
    <div className={s.home}>
      <Headres />

      {/* HERO */}
      {/* <section className={s.hero}>
        <div className={s.heroBadge}>PLATAFORMA SAAS PARA EMPRESAS</div>
        <h1 className={s.heroTitle}>
          Multiplica la capacidad<br />operativa de tu empresa
        </h1>
        <p className={s.heroSub}>
          Gestiona equipos, procesos y resultados desde una sola plataforma. Simple, escalable y sin fricciones.
        </p>
        <div className={s.heroStat}>
          <span className={s.heroStatValue}>+39%</span>
          <span className={s.heroStatLabel}>Aumento promedio en productividad de equipos</span>
        </div>
        <div className={s.heroActions}>
          <ButtonInitium onClick={() => navigate('/login')}>Comenzar ahora</ButtonInitium>
          <ButtonInitium variant="outlined" href="#features">Ver funciones</ButtonInitium>
        </div>

      </section> */}

<div className={s.showcase}>
          <p className={s.showcaseLabel}>Variantes</p>
          <div className={s.showcaseRow}>
            <ButtonInitium variant="contained">Contained</ButtonInitium>
            <ButtonInitium variant="outlined">Outlined</ButtonInitium>
            <ButtonInitium variant="text">Text</ButtonInitium>
          </div>

          <p className={s.showcaseLabel}>Tamaños</p>
          <div className={s.showcaseRow}>
            <ButtonInitium size="sm">Small</ButtonInitium>
            <ButtonInitium size="md">Medium</ButtonInitium>
            <ButtonInitium size="lg">Large</ButtonInitium>
          </div>

          <p className={s.showcaseLabel}>Estados</p>
          <div className={s.showcaseRow}>
            <ButtonInitium variant="contained">Activo</ButtonInitium>
            <ButtonInitium variant="contained" disabled>Disabled</ButtonInitium>
            <ButtonInitium variant="outlined" disabled>Disabled</ButtonInitium>
          </div>

          <p className={s.showcaseLabel}>Con iconos</p>
          <div className={s.showcaseRow}>
            <ButtonInitium variant="outlined" startIcon={<span>🗑️</span>}>Delete</ButtonInitium>
            <ButtonInitium variant="contained" endIcon={<span>➤</span>}>Send</ButtonInitium>
            <ButtonInitium variant="text" startIcon={<span>⚙️</span>}>Settings</ButtonInitium>
          </div>

          <p className={s.showcaseLabel}>Como link</p>
          <div className={s.showcaseRow}>
            <ButtonInitium href="#features">Ir a funciones</ButtonInitium>
            <ButtonInitium variant="outlined" href="#clients">Ver clientes</ButtonInitium>
          </div>

          <p className={s.showcaseLabel}>Full width</p>
          <div className={s.showcaseRow}>
            <ButtonInitium fullWidth>Botón full width</ButtonInitium>
          </div>
        </div>


{/* <Spinner />

<Spinner size="lg" />  */}

{/* // Colores: primary | white | green | gray
<Spinner color="white" />   // útil dentro de botones morados */}

{/* <Spinner overlay label="Cargando..." /> */}
{/* <Spinner overlay size="xl" label="Guardando empresa..." />  */}

      {/* CLIENTS MARQUEE */}
      {/* <section className={s.clients} id="clients">
        <p className={s.sectionLabel}>Empresas que confían en nosotros</p>
        <div className={s.marqueeWrapper}>
          <div className={s.marqueeTrack}>
            {[...CLIENTS, ...CLIENTS].map((c, i) => (
              <span key={i} className={s.marqueeItem}>{c}</span>
            ))}
          </div>
        </div>
      </section> */}

      {/* FEATURES */}
      {/* <section className={s.features} id="features">
        <p className={s.sectionLabel}>Tecnología de vanguardia</p>
        <h2 className={s.sectionTitle}>¿Por qué elegir GestiónSaaS?</h2>
        <p className={s.sectionSub}>Herramientas diseñadas para empresas de alto rendimiento</p>
        <div className={s.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={s.featureCard}>
              <span className={s.featureIcon}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className={s.featureBadge}>{f.badge}</span>
            </div>
          ))}
        </div>
      </section> */}

      {/* STATS BAR */}
      {/* <section className={s.statsBar}>
        {STATS.map((stat) => (
          <div key={stat.label} className={s.statItem}>
            <span className={s.statValue}>{stat.value}</span>
            <span className={s.statLabel}>{stat.label}</span>
          </div>
        ))}
      </section> */}

      {/* CTA */}
      {/* <section className={s.cta}>
        <h2>¿Listo para transformar tu empresa?</h2>
        <p>Únete a las empresas que ya están optimizando sus operaciones con GestiónSaaS</p>
        <div className={s.heroActions}>
          <ButtonInitium onClick={() => navigate('/login')}>Comenzar ahora</ButtonInitium>
        </div>
      </section> */}

      {/* FOOTER */}
      {/* <footer className={s.footer}>
        <span>© 2025 GestiónSaaS — Todos los derechos reservados</span>
      </footer> */}
    </div>
  );
}
