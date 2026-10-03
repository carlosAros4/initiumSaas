import { useState } from 'react';
import styles from './Config.module.css';
import SiteTab from './tabs/site/SiteTab';

type TabKey = 'site' | 'test1' | 'test2';

interface Tab {
  key: TabKey;
  label: string;
}

const tabs: Tab[] = [
  { key: 'site', label: 'Sitio' },
  { key: 'test1', label: 'Test 1' },
  { key: 'test2', label: 'Test 2' },
];

export const Config = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('site');

  const renderContent = () => {
    switch (activeTab) {
      case 'site':
        return <SiteTab />;
      case 'test1':
        return <p>Contenido Test 1</p>;
      case 'test2':
        return <p>Contenido Test 2</p>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Config;
