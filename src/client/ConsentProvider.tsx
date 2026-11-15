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
 * Updates Google Consent Mode v2 via gtag('consent', 'default' | 'update', ...)
 */
function syncGoogleConsentMode(status: ConsentStatus, isDefault = false) {
	if (typeof window === "undefined") return;

	const consentValue = status === "granted" ? "granted" : "denied";
	const command = isDefault ? "default" : "update";

	window.dataLayer = window.dataLayer || [];
	if (typeof window.gtag === "function") {
		window.gtag("consent", command, {
			ad_storage: consentValue,
			ad_user_data: consentValue,
			ad_personalization: consentValue,
			analytics_storage: consentValue,
		});
	} else {
		window.dataLayer.push([
			"consent",
			command,
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
	initialStatus,
	children,
}: ConsentProviderProps) {
	// If a custom CMP check (getConsent) or event listener is supplied without an explicit initialStatus,
	// wait in "unknown" until resolved; otherwise default to "granted" so quickstart renders ads.
	const resolvedInitialStatus: ConsentStatus =
		initialStatus ??
		(getConsent || listenEvent || mode === "tcf" || mode === "gpp"
			? "unknown"
			: "granted");
	const [status, setStatus] = useState<ConsentStatus>(resolvedInitialStatus);

	// On mount, establish initial consent signals for Google Consent Mode v2
	useEffect(() => {
		if (mode === "google-consent-v2") {
			syncGoogleConsentMode(resolvedInitialStatus, true);
		}
	}, [mode, resolvedInitialStatus]);

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
					pingData?: {
						applicableSections?: number[];
						gppVersion?: string;
						signalStatus?: "ready" | "not ready";
					};
				};
				if (
					gppEvt?.eventName === "sectionChange" ||
					gppEvt?.eventName === "signalStatus"
				) {
					const pingData = gppEvt?.pingData;
					if (pingData?.signalStatus === "not ready") return;

					const applicableSections = pingData?.applicableSections || [];
					// If no specific privacy sections apply to user, consent is granted
					if (applicableSections.length === 0) {
						setStatus("granted");
						return;
					}

					// Check section data for opt-outs
					try {
						window.__gpp?.(
							"getSection",
							(sectionData: unknown, success: boolean) => {
								if (success && sectionData) {
									const data = sectionData as Record<string, unknown>;
									const isOptedOut =
										data.SaleOptOut === 1 ||
										data.SharingOptOut === 1 ||
										data.PersonalDataConsents === 0;
									setStatus(isOptedOut ? "denied" : "granted");
								} else {
									setStatus("granted");
								}
							},
						);
					} catch {
						setStatus("granted");
					}
				}
			});
		}

		// IAB TCF Listener
		if (mode === "tcf" && typeof window.__tcfapi === "function") {
			window.__tcfapi(
				"addEventListener",
				2,
				(tcData: unknown, success: boolean) => {
					if (!success || !tcData) return;
					const tcf = tcData as {
						gdprApplies?: boolean;
						eventStatus?: "tcloaded" | "cmpuishown" | "useractioncomplete";
						purpose?: { consents?: Record<number, boolean> };
					};
					if (
						tcf.eventStatus === "tcloaded" ||
						tcf.eventStatus === "useractioncomplete"
					) {
						// If GDPR does not apply (e.g. non-EEA traffic), consent is granted
						if (tcf.gdprApplies === false) {
							setStatus("granted");
							return;
						}
						// Purpose 1: Store and/or access information on a device
						const hasConsent = tcf.purpose?.consents?.[1] === true;
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
