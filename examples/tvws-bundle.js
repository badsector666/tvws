// Simple TVWS Bundle Test for Bun
// This creates a bundled version that includes TVWS directly

import { createClient, connect, EventEmitter, TVWSClient, ChartSession, QuoteSession, ReplaySession, StudySession } from '../dist/tvws.esm.js';

// Make everything available globally for browser testing
if (typeof window !== 'undefined') {
    window.tvws = {
        createClient,
        connect,
        EventEmitter,
        TVWSClient,
        ChartSession,
        QuoteSession,
        ReplaySession,
        StudySession
    };

    console.log('✅ TVWS loaded and available globally');
    console.log('Available functions:', Object.keys(window.tvws));
}
