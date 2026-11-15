# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-11-15

### Added
- **Google Consent Mode v2 Default Signals**: `ConsentProvider` and `AdSenseScript` now automatically initialize `gtag('consent', 'default', ...)` on mount.
- **IAB TCF & GPP Compliance**: Added `gdprApplies` handling to avoid blocking non-EEA traffic, updated purpose checking, and added GPP section query support for CCPA/CPRA opt-out signals.
- **Active GAM & Ezoic Adapters**: Implemented actual `googletag` command queue dispatching for Google Ad Manager and `ezstandalone` queue lifecycle for Ezoic.
- **Unfill Detection**: Added `MutationObserver` on `data-ad-status` attributes to immediately trigger fallbacks when AdSense unfill occurs.
- **Dev Sanity Warnings**: Emits helpful development warnings when ad units or clients are missing or defaulting to dummy placeholders.
- **Deterministic Keys**: `injectPortableTextAds` and `injectPortableTextAffiliate` now use deterministic paragraph-based keys, eliminating React hydration mismatches.
- **Package Metadata**: Added `sideEffects: false`, `engines`, and `./package.json` to exports.

### Fixed
- **Quickstart Ad Delivery**: Fixed issue where `ConsentProvider` defaulted to unknown status and blocked ad tags from rendering in quickstart examples.
- **RSC Module Boundaries**: Fixed `"use client"` directive being stamped across root exports, allowing Server Components to cleanly import transformers and config client.
- **Dead CLS Guard & Unfill Effects**: Fixed effect dependency bugs in `AdSenseSlot` that prevented unfill detection and CLS warnings from executing.
- **Paragraph Spacing**: Fixed `startOffset` placement calculation and implemented missing `minParagraphsTotal` checks in in-article inserters.
- **Feed Cache Safety**: Replaced unbounded map in `feed-inserter` with a bounded LRU cache that correctly invalidates on items changes or rule toggles.
- **Timer Leaks**: Fixed un-cleared intervals in `useAdMetrics` when crossing viewability thresholds.
- **Tailwind Coupling**: Replaced Tailwind v4-exclusive utilities with standard fallbacks and added solid inline styles for unstyled environments.

## [1.3.2] - Previous Release
- Enhanced PortableTextBlock types and Sanity integration.
