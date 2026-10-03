import { useState } from 'react';
import styles from './Settings.module.css';
import { ProfilesTab } from './tabs/profile/ProfilesTab';
import { Users } from './tabs/users/Users';

type TabKey = 'users' | 'profiles' | 'users2';

interface Tab {
  key: TabKey;
  label: string;
}

const tabs: Tab[] = [
  { key: 'users', label: 'Usuarios' },
  { key: 'profiles', label: 'Perfiles' },
];

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <Users />;
      case 'profiles':
        return <ProfilesTab />;
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

export default Settings;
