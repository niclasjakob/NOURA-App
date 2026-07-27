import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { BackgroundGradient, StatusBar } from './components/ui'
import { Activation, Home, Intro, Onboarding, SelectPlan } from './screens/screens'
import { PlanSheet, ProfileSheet, SupportSheet, type SheetId } from './sheets/sheets'

type ScreenId = 'intro' | 'onboarding' | 'selectPlan' | 'activation' | 'home'

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('intro')
  const [planIdx, setPlanIdx] = useState(0)
  const [sheet, setSheet] = useState<SheetId>(null)
  const [actMessages, setActMessages] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2600)
  }

  const startActivation = (login: boolean) => {
    /* Texte wortgleich aus Figma (Komponente "Animation v2", 1330:2404) */
    setActMessages(
      login
        ? ['Account wird eingerichtet...', 'Willkommen zurück, Marcel! 👋🏼']
        : [
            'Account wird eingerichtet...',
            'eSim wird konfiguriert...',
            'Konfiguration wird übermittelt...',
            'Deine eSim ist bereit!',
          ],
    )
    setScreen('activation')
  }

  return (
    <div className="stage">
      <div className="phone">
        <BackgroundGradient />
        {/* On the native build iOS draws the real status bar, so skip the mock one */}
        {!Capacitor.isNativePlatform() && <StatusBar />}

        <Intro
          active={screen === 'intro'}
          onStart={() => setScreen('onboarding')}
          onLogin={() => startActivation(true)}
        />
        <Onboarding
          active={screen === 'onboarding'}
          onBack={() => setScreen('intro')}
          onDone={() => setScreen('selectPlan')}
        />
        <SelectPlan
          active={screen === 'selectPlan'}
          planIdx={planIdx}
          onPlanChange={setPlanIdx}
          onBack={() => setScreen('onboarding')}
          onChoose={() => startActivation(false)}
        />
        <Activation
          active={screen === 'activation'}
          messages={actMessages}
          onDone={() => setScreen('home')}
        />
        <Home
          active={screen === 'home'}
          planIdx={planIdx}
          onOpenProfile={() => setSheet('profile')}
          onOpenSupport={() => setSheet('support')}
          onOpenPlan={() => setSheet('plan')}
        />

        <div className={`sheet-backdrop${sheet ? ' on' : ''}`} onClick={() => setSheet(null)} />
        <SupportSheet open={sheet === 'support'} />
        <ProfileSheet
          open={sheet === 'profile'}
          onLogout={() => {
            setSheet(null)
            setScreen('intro')
          }}
        />
        <PlanSheet
          open={sheet === 'plan'}
          planIdx={planIdx}
          onSwitchPlan={() => {
            setSheet(null)
            setScreen('selectPlan')
          }}
          onCancelPlan={() => showToast('Schade! Dein Plan bleibt bis zum Monatsende aktiv.')}
        />

        <div className={`toast${toast ? ' on' : ''}`}>{toast}</div>
      </div>
    </div>
  )
}
