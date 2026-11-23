import React from 'react';
import { InlineNotification } from '@carbon/react';

export default function DemoBanner() {
  return (
    <InlineNotification
      kind="info"
      title="Demonstration Environment"
      subtitle="All data is synthetic. No real client data or PII is used. Built with IBM watsonx."
      hideCloseButton
      lowContrast={false}
      style={{ position: 'sticky', top: '48px', zIndex: 100, maxWidth: '100%' }}
      aria-label="Demo environment notice"
    />
  );
}
