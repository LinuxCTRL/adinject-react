"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type {
	ConsentContextValue,
	ConsentProviderProps,
	ConsentStatus,
} from "../types";

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
		dataLayer?: unknown[];
		__tcfapi?: (
			command: string,
			version: number,
			callback: (tcData: unknown, success: boolean) => void,
		) => void;
		__gpp?: (
			command: string,
			callback?: (evt: unknown, success: boolean) => void,
			parameter?: unknown,
		) => void;
	}
}

const ConsentContext = createContext<ConsentContextValue>({
	status: "granted", // Default to granted when no ConsentProvider wraps the tree
	mode: "google-consent-v2",
	grant: () => {},
	deny: () => {},
	reset: () => {},
});

/**
 * Updates Google Consent Mode v2 via gtag('consent', 'update', ...)
 */
function syncGoogleConsentMode(status: ConsentStatus) {
	if (typeof window === "undefined") return;

	const consentValue = status === "granted" ? "granted" : "denied";

	if (typeof window.gtag === "function") {
		window.gtag("consent", "update", {
			ad_storage: consentValue,
			ad_user_data: consentValue,
			ad_personalization: consentValue,
			analytics_storage: consentValue,
		});
	} else if (Array.isArray(window.dataLayer)) {
		window.dataLayer.push([
			"consent",
			"update",
			{
				ad_storage: consentValue,
				ad_user_data: consentValue,
				ad_personalization: consentValue,
				analytics_storage: consentValue,
			},
		]);
	}
}

/**
 * Provider for GDPR / IAB TCF / Google Consent Mode v2 gating
 */
export function ConsentProvider({
	mode = "google-consent-v2",
	getConsent,
	listenEvent,
	initialStatus = "unknown",
	children,
}: ConsentProviderProps) {
	const [status, setStatus] = useState<ConsentStatus>(initialStatus);

	const grant = useCallback(() => {
		setStatus("granted");
		if (mode === "google-consent-v2") {
			syncGoogleConsentMode("granted");
		}
	}, [mode]);

	const deny = useCallback(() => {
		setStatus("denied");
		if (mode === "google-consent-v2") {
			syncGoogleConsentMode("denied");
		}
	}, [mode]);

	const reset = useCallback(() => {
		setStatus("unknown");
	}, []);

	// Initial check with CMP / custom resolver
	useEffect(() => {
		if (getConsent) {
			const check = async () => {
				try {
					const result = await getConsent();
					if (result === "granted" || result === "denied") {
						setStatus(result);
						if (mode === "google-consent-v2") {
							syncGoogleConsentMode(result);
						}
					}
				} catch (err) {
					console.warn("[AdInject Consent] getConsent error:", err);
				}
			};
			check();
		}
	}, [getConsent, mode]);

	// Listen for CMP updates
	useEffect(() => {
		if (typeof window === "undefined") return;

		// IAB GPP (Global Privacy Platform) Listener
		if (mode === "gpp" && typeof window.__gpp === "function") {
			window.__gpp("addEventListener", (evt: unknown) => {
				const gppEvt = evt as {
					eventName?: string;
					pingData?: { applicableSections?: number[]; gppVersion?: string };
				};
				if (
					gppEvt?.eventName === "sectionChange" ||
					gppEvt?.eventName === "signalStatus"
				) {
					const applicableSections = gppEvt?.pingData?.applicableSections || [];
					const hasConsent =
						applicableSections.length > 0 && !!gppEvt?.pingData?.gppVersion;
					setStatus(hasConsent ? "granted" : "denied");
				}
			});
		}

		// IAB TCF Listener
		if (mode === "tcf" && typeof window.__tcfapi === "function") {
			window.__tcfapi(
				"addEventListener",
				2,
				(tcData: unknown, success: boolean) => {
					const tcf = tcData as {
						eventStatus?: string;
						purpose?: { consents?: Record<number, boolean> };
					};
					if (success && tcf?.eventStatus === "tcloaded") {
						const hasConsent = tcf?.purpose?.consents?.[1] === true;
						setStatus(hasConsent ? "granted" : "denied");
					}
				},
			);
		}

		if (!listenEvent) return;

		const handleEvent = () => {
			if (getConsent) {
				const check = async () => {
					try {
						const result = await getConsent();
						setStatus(result);
						if (mode === "google-consent-v2") {
							syncGoogleConsentMode(result);
						}
					} catch (e) {
						console.warn("[AdInject Consent] event check error:", e);
					}
				};
				check();
			}
		};

		window.addEventListener(listenEvent, handleEvent);
		return () => window.removeEventListener(listenEvent, handleEvent);
	}, [listenEvent, getConsent, mode]);

	const value = useMemo(
		() => ({
			status,
			mode,
			grant,
			deny,
			reset,
		}),
		[status, mode, grant, deny, reset],
	);

	return (
		<ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
	);
}

/**
 * Hook to access current consent status and controls
 */
export function useConsent(): ConsentContextValue {
	return useContext(ConsentContext);
}
