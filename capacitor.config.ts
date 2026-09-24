import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.niclasjakob.noura',
  appName: 'NOURA',
  webDir: 'dist',
  /* Die Farbe, die der Webview zeigt, bevor die Seite ihren ersten Frame
     malt. Voreingestellt ist Weiss — ein weisses Aufblitzen zwischen
     Startbildschirm und Intro. #513f6e ist der Mittelwert des
     Startbildschirms (aus splash.jpg gerechnet, nicht geschaetzt): der
     eine Farbwert, der dem Bild am naechsten kommt. */
  backgroundColor: '#513f6e'
};

export default config;
