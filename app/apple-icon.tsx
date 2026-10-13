import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1020' }}>
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
          <g stroke="#D4A93C" strokeWidth="3.2" strokeLinecap="round">
            <path d="M20 4.4A20 20 0 1 0 28 4.4" />
            <path d="M24 24L5.5 28M24 24l18.5 4M24 24v17" />
          </g>
          <circle cx="24" cy="24" r="6.2" fill="#D4A93C" />
          <circle cx="24" cy="24" r="2.4" fill="#0B1020" />
        </svg>
      </div>
    ),
    size
  )
}
