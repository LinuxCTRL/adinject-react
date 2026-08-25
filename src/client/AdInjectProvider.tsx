"use client";

import React, { createContext, useContext } from "react";
import type { AdInjectProjectConfig } from "../api/config-client";
import type { AdUnit, PlacementRule } from "../types";

interface AdInjectContextValue {
  config?: AdInjectProjectConfig | null;
  projectId?: string;
  rules: PlacementRule[];
  adUnits: Record<string, AdUnit>;
}

const AdInjectContext = createContext<AdInjectContextValue>({
  rules: [],
  adUnits: {},
});

export interface AdInjectProviderProps {
  config?: AdInjectProjectConfig | null;
  projectId?: string;
  children: React.ReactNode;
}

/**
 * AdInjectProvider
 * React Context provider distributing compiled rules and ad units from the AdInject Dashboard
 * to all child components (<AdInjectFeed />, <InFeedAdCard />, <AdSenseSlot />).
 */
export function AdInjectProvider({
  config,
  projectId,
  children,
}: AdInjectProviderProps) {
  const value: AdInjectContextValue = {
    config,
    projectId: projectId || config?.projectId,
    rules: config?.rules || [],
    adUnits: config?.adUnits || {},
  };

  return (
    <AdInjectContext.Provider value={value}>
      {children}
    </AdInjectContext.Provider>
  );
}

/**
 * Hook to access active AdInject configuration in client components
 */
export function useAdInject(): AdInjectContextValue {
  return useContext(AdInjectContext);
}
