import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ce1156',
          borderRadius: '36px',
          color: 'white',
          fontFamily: 'serif',
          fontWeight: 800,
          fontSize: '92px',
          letterSpacing: '-4px',
        }}
      >
        NyS
      </div>
    ),
    {
      ...size,
    }
  );
}
