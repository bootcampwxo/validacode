import React, { useEffect, useRef } from 'react';
import { InlineNotification, Tag } from '@carbon/react';

// Orchestrate web-chat embed configuration
// Values come from VITE_WXO_* env vars — Vite substitutes these at build time
const WXO_HOST_URL  = import.meta.env.VITE_WXO_HOST_URL   || '';
const WXO_ORCH_ID   = import.meta.env.VITE_WXO_ORCHESTRATION_ID || '';
const WXO_CRN       = import.meta.env.VITE_WXO_CRN          || '';
const WXO_AGENT_ID  = import.meta.env.VITE_WXO_AGENT_ID     || '';

const isConfigured = !!(WXO_HOST_URL && WXO_ORCH_ID && WXO_CRN && WXO_AGENT_ID);

export default function AgentChatPage() {
  const loaderInjected = useRef(false);

  useEffect(() => {
    if (!isConfigured || loaderInjected.current) return;
    loaderInjected.current = true;

    // The wxoLoader reads window.wxOConfiguration when init() is called with no args.
    // Setting the global BEFORE injecting the script ensures the loader picks it up
    // regardless of which internal path the bundle takes (some versions ignore the arg).
    window.wxOConfiguration = {
      orchestrationID:    WXO_ORCH_ID,
      hostURL:            WXO_HOST_URL,
      rootElementID:      'wxo-chat-container',
      deploymentPlatform: 'ibmcloud',
      crn:                WXO_CRN,
      chatOptions: {
        agentId: WXO_AGENT_ID,
      },
    };

    const script = document.createElement('script');
    script.src = `${WXO_HOST_URL}/wxochat/wxoLoader.js?embed=true`;
    script.addEventListener('load', () => {
      if (window.wxoLoader) {
        // Call init() with the config object (new API).
        // The global above is a belt-and-suspenders fallback for older bundles.
        window.wxoLoader.init(window.wxOConfiguration);
      }
    });
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.wxOConfiguration;
    };
  }, []);

  if (!isConfigured) {
    return (
      <div className="demo-page">
        <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
          AI Governance Agent — Live Chat
        </h2>

        <InlineNotification
          kind="warning"
          title="Orchestrate embed not configured"
          subtitle="Fill VITE_WXO_HOST_URL, VITE_WXO_ORCHESTRATION_ID, VITE_WXO_CRN, and VITE_WXO_AGENT_ID in frontend/.env to activate the live agent embed."
          hideCloseButton
          lowContrast
          style={{ marginBottom: '1.5rem' }}
        />

        <div style={{
          background: 'var(--cds-layer, #262626)',
          padding: '2rem',
          borderLeft: '4px solid var(--cds-interactive, #0f62fe)',
          maxWidth: '700px',
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--cds-text-primary)' }}>
            governance_agent — Deployed to watsonx Orchestrate
          </h3>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
            Agent ID: <code style={{ color: 'var(--cds-link-primary)' }}>cff37e58-9a7a-40d1-9151-80365b59d8a3</code>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {['classify_complaint', 'lookup_customer', 'draft_response', 'escalate_to_human'].map((t) => (
              <Tag key={t} type="blue" size="md">{t}</Tag>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        AI Governance Agent — Live Chat
      </h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <Tag type="green" size="md">governance_agent</Tag>
        {['classify_complaint', 'lookup_customer', 'draft_response', 'escalate_to_human'].map((t) => (
          <Tag key={t} type="blue" size="md">{t}</Tag>
        ))}
      </div>
      {/* Orchestrate web-chat widget mounts here */}
      <div
        id="wxo-chat-container"
        style={{ flex: 1, minHeight: '500px', border: '1px solid var(--cds-border-subtle)' }}
      />
    </div>
  );
}
