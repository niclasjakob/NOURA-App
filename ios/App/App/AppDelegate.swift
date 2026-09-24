import UIKit
import WebKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

/* Ab iOS 26 erzwingt das SDK die UIScene-Adoption: ohne Scene-Manifest bricht
   der Start mit EXC_BREAKPOINT in
   __UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption ab.

   Das Fenster baut UIKit selbst aus Main.storyboard (UISceneStoryboardFile
   im Info.plist); willConnectTo legt deshalb nur die Deckschicht des
   Startbildschirms darueber, mehr nicht. Die beiden Rueckwege am Ende
   reichen durch, was unter Scenes nicht mehr am AppDelegate ankommt —
   sonst verlieren Plugins ihre URL-Callbacks. */
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    /* ---- Uebergabe vom Startbildschirm ----
       Startbildschirm und Intro-Screen zeigen dasselbe Bild an derselben
       Stelle. Dazwischen liegt aber eine Luecke: das System nimmt den
       Startbildschirm weg, sobald das Fenster steht, und der Webview malt
       seinen ersten Frame erst deutlich spaeter. Gemessen am 2026-09-18
       im Simulator (iPhone 17, Aufzeichnung mit simctl, Einzelbilder alle
       16ms): rund 500ms, in denen die flache Hintergrundfarbe des
       Webviews im Bild stand — und der Startbildschirm selbst kam dabei
       gar nicht erst vor.

       Also legt die App ihn selbst noch einmal darueber und nimmt ihn
       weg, wenn der Webview geladen hat. Die Deckschicht kommt aus
       LaunchScreen.storyboard, ist also kein Nachbau: dieselben Bilder,
       dieselben Constraints, und sie folgt automatisch, wenn dort etwas
       geaendert wird.

       Zwei Sicherungen, denn eine haengende Deckschicht macht die App
       unbedienbar: sie nimmt keine Eingaben an, und sie verschwindet
       nach spaetestens drei Sekunden auch ohne jedes Signal. */
    private var cover: UIViewController?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        // Das Fenster baut UIKit aus Main.storyboard (UISceneStoryboardFile),
        // hier kommt nur die Deckschicht dazu.
        guard let window = window,
              let cover = UIStoryboard(name: "LaunchScreen", bundle: nil)
                .instantiateInitialViewController() else { return }
        self.cover = cover
        cover.view.frame = window.bounds
        cover.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cover.view.isUserInteractionEnabled = false
        window.addSubview(cover.view)

        DispatchQueue.main.async { [weak self] in
            // Die Wurzelansicht kann nach unserer Deckschicht ins Fenster
            // gekommen sein; und der Webview entsteht erst mit ihr.
            window.bringSubviewToFront(cover.view)
            guard let bridge = window.rootViewController as? CAPBridgeViewController else { return }
            bridge.loadViewIfNeeded()
            guard let webView = bridge.webView else { return }
            self?.waitForFirstFrame(webView)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in self?.revealApp() }
    }

    /* Gefragt wird nach dem ersten gezeichneten Frame, nicht nach dem Ende
       des Ladens. Der Unterschied ist gemessen und betraegt rund 350ms:
       `isLoading` faellt, waehrend der Webview noch nichts im Bild hat.
       Wer darauf abblendet, zeigt genau die Luecke, die er schliessen
       soll — im Mitschnitt vom 2026-09-18 war der Schirm dabei fuer drei
       Einzelbilder vollstaendig leer.

       Die Seite meldet sich deshalb selbst: index.html setzt
       window.nouraPainted, sobald ihr erster Frame steht. Gefragt wird
       alle 40ms; nach spaetestens zwei Sekunden gilt die Antwort als
       gegeben. */
    private func waitForFirstFrame(_ webView: WKWebView, attempt: Int = 0) {
        webView.evaluateJavaScript("window.nouraPainted === true") { [weak self] value, _ in
            guard let self = self, self.cover != nil else { return }
            if (value as? Bool) == true || attempt >= 50 {
                self.revealApp()
                return
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.04) {
                self.waitForFirstFrame(webView, attempt: attempt + 1)
            }
        }
    }

    /* Dass beide Bilder gleich aussehen, macht die Blende unsichtbar; sie
       ist trotzdem da, damit ein Rest Abweichung nicht als Sprung liest. */
    private func revealApp() {
        guard let cover = cover else { return }
        self.cover = nil
        UIView.animate(withDuration: 0.2, delay: 0, options: [.curveEaseOut]) {
            cover.view.alpha = 0
        } completion: { _ in
            cover.view.removeFromSuperview()
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let context = URLContexts.first else { return }
        var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
        if let source = context.options.sourceApplication {
            options[.sourceApplication] = source
        }
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: options)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity,
                                                        restorationHandler: { _ in })
    }
}
