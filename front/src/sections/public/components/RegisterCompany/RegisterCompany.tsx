import { useState } from 'react';
import s from './RegisterCompany.module.css';
import StageOne from './stage_one/stageOne';
import StageOneRegister from './stage_one_register/StageOneRegister';
import StageOneLogin from './stage_one_login/StageOneLogin';
import StageOneVerify from './stage_one_verify/StageOneVerify';
import StageTwoCompany from './stage_two_company/StageTwoCompany';

export type Stage = 'choice' | 'register' | 'login' | 'verify' | 'company';

export default function RegisterCompany() {
  const [stage, setStage] = useState<Stage>('choice');

  return (
    <div className={s.wrapper}>
      {stage === 'choice' && (
        <StageOne
          onRegister={() => setStage('register')}
          onLogin={() => setStage('login')}
        />
      )}
      {stage === 'register' && (
        <StageOneRegister
          onBack={() => setStage('choice')}
          onSuccess={() => setStage('verify')}
        />
      )}
      {stage === 'login' && (
        <StageOneLogin
          onBack={() => setStage('choice')}
          onSuccess={(stage:Stage) => { setStage(stage) }}
        />
      )}
      {stage === 'verify' && (
        <StageOneVerify
          onBack={() => setStage('choice')}
          onSuccess={() => setStage('company')}
        />
      )}
      {stage === 'company' && (
        <StageTwoCompany
          onBack={() => setStage('choice')}
          onSuccess={() => { /* próximo stage */ }}
        />
      )}
    </div>
  );
}
