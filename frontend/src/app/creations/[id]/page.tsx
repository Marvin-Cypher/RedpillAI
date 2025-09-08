'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CreationDetailPage() {
  const params = useParams();
  const creationId = params?.id as string;
  const [creation, setCreation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreation() {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8001/api/v1/creations/default/${creationId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch creation: ${response.statusText}`);
        }
        
        const creationDetail = await response.json();
        setCreation(creationDetail);
      } catch (err) {
        console.error('Creation fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load creation');
      } finally {
        setLoading(false);
      }
    }

    if (creationId) {
      fetchCreation();
    }
  }, [creationId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p>Loading creation {creationId}...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !creation) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '32px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Error</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
            {error || 'Creation not found'}
          </p>
          <button 
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              {creation.title}
            </h1>
            <p style={{
              color: '#6b7280',
              margin: '0',
              fontSize: '1rem'
            }}>
              {creation.description}
            </p>
          </div>
          <span style={{
            padding: '4px 12px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {creation.creation_type}
          </span>
        </div>

        {/* Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>
              Created
            </p>
            <p style={{ fontSize: '0.875rem', color: '#111827', margin: '0' }}>
              {new Date(creation.created_at).toLocaleString()}
            </p>
          </div>

          {creation.symbols && creation.symbols.length > 0 && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>
                Companies
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {creation.symbols.map((symbol) => (
                  <span key={symbol} style={{
                    padding: '2px 8px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    border: '1px solid #d1d5db'
                  }}>
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>
              Category
            </p>
            <p style={{ fontSize: '0.875rem', color: '#111827', margin: '0', textTransform: 'capitalize' }}>
              {creation.category.replace('_', ' ')}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 4px 0' }}>
              Source
            </p>
            <p style={{ fontSize: '0.875rem', color: '#111827', margin: '0' }}>
              {creation.openbb_tool}
            </p>
          </div>
        </div>

        {/* Tags */}
        {creation.tags && creation.tags.length > 0 && (
          <div style={{
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            marginTop: '16px'
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>
              Tags
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {creation.tags.map((tag) => (
                <span key={tag} style={{
                  padding: '4px 8px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {creation.creation_type === 'analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {creation.summary && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Summary
              </h2>
              <div style={{
                color: '#374151',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {creation.summary}
              </div>
            </div>
          )}

          {creation.data?.content && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Full Analysis
              </h2>
              <div style={{
                fontSize: '0.875rem',
                color: '#374151',
                whiteSpace: 'pre-wrap',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: '1.6',
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                overflow: 'auto'
              }}>
                {creation.data.content}
              </div>
            </div>
          )}

          {creation.key_insights && creation.key_insights.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Key Insights
              </h2>
              <ul style={{
                margin: '0',
                paddingLeft: '24px',
                lineHeight: '1.6'
              }}>
                {creation.key_insights.map((insight, index) => (
                  <li key={index} style={{
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Debug Info (Creation ID: {creationId})
        </h3>
        <pre style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          overflow: 'auto',
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          margin: '0'
        }}>
          {JSON.stringify(creation, null, 2)}
        </pre>
      </div>
    </div>
  );
}