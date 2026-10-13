import { ImageResponse } from 'next/og'

export const alt = 'DriveWise: Control the Wheel. Command the Road.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 35%, #1a2748 0%, #070B14 70%)',
          color: '#EEF1F8',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 48 48" fill="none">
          <g stroke="#D4A93C" strokeWidth="3.2" strokeLinecap="round">
            <path d="M20 4.4A20 20 0 1 0 28 4.4" />
            <path d="M24 24L5.5 28M24 24l18.5 4M24 24v17" />
          </g>
          <circle cx="24" cy="24" r="6.2" fill="#D4A93C" />
          <circle cx="24" cy="24" r="2.4" fill="#070B14" />
        </svg>
        <div style={{ fontSize: 88, fontWeight: 800, marginTop: 28, letterSpacing: -2 }}>DriveWise</div>
        <div style={{ fontSize: 34, color: '#8B96B2', marginTop: 12 }}>Control the Wheel. Command the Road.</div>
      </div>
    ),
    size
  )
}
