import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

export default function Home(): React.JSX.Element {
  return (
    <Layout title="Home" description="Documentation hub">
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>BlackwallDocs</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '3rem', textAlign: 'center', maxWidth: '600px' }}>
          Documentation hub for infrastructure and development projects.
        </p>
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link
            to="/blackwall/intro"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 3rem',
              borderRadius: '8px',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              textDecoration: 'none',
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Blackwall</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Infrastructure & NixOS</span>
          </Link>
          <Link
            to="/development/intro"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 3rem',
              borderRadius: '8px',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              textDecoration: 'none',
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Development</span>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Projects & Workflows</span>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
