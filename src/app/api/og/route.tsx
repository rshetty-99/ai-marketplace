/**
 * Dynamic OpenGraph Image Generation
 * Creates custom OG images for social sharing based on page content
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const title = searchParams.get('title') || 'AI Marketplace';
    const description = searchParams.get('description') || 'Find the perfect AI solution for your business';
    const category = searchParams.get('category');
    const price = searchParams.get('price');
    const rating = searchParams.get('rating');
    const type = searchParams.get('type') || 'default';

    // Different templates based on type
    if (type === 'service') {
      return new ImageResponse(
        (
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '60px',
                width: '90%',
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              }}
            >
              {category && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '24px',
                    alignSelf: 'flex-start',
                    fontWeight: 'bold',
                  }}
                >
                  {category}
                </div>
              )}
              
              <h1
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>
              
              <p
                style={{
                  fontSize: '32px',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
              
              <div
                style={{
                  display: 'flex',
                  gap: '40px',
                  marginTop: '20px',
                }}
              >
                {price && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '28px', color: '#64748b' }}>From</span>
                    <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
                      ${price}
                    </span>
                  </div>
                )}
                
                {rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '36px' }}>⭐</span>
                    <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#334155' }}>
                      {rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                fontSize: '24px',
                color: 'white',
                opacity: 0.8,
              }}
            >
              AI Marketplace
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Default template for catalog/general pages
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              AI
            </div>
            
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {title}
            </h1>
            
            {description && (
              <p
                style={{
                  fontSize: '32px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.4,
                  maxWidth: '800px',
                }}
              >
                {description}
              </p>
            )}
            
            {category && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  padding: '15px 30px',
                  borderRadius: '50px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {category}
              </div>
            )}
          </div>
          
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              fontSize: '28px',
              color: 'white',
              opacity: 0.9,
            }}
          >
            <span>🚀</span>
            <span>AI Marketplace</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}