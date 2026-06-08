import { useNavigate } from 'react-router-dom';

interface Props {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function PageHeader({ title, onBack, right }: Props) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 52,
      padding: '0 4px 0 0', borderBottom: '1px solid #F0F0F0',
      background: '#FFF', position: 'sticky', top: 0, zIndex: 10,
      flexShrink: 0,
    }}>
      <button
        onClick={handleBack}
        style={{
          width: 52, height: 52, background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0A0A0A', flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {title && (
        <div style={{
          flex: 1, fontSize: 15, fontWeight: 600, color: '#0A0A0A',
          fontFamily: "'Inter', sans-serif", letterSpacing: '0.1px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </div>
      )}

      {right && (
        <div style={{ marginLeft: 'auto', paddingRight: 12, flexShrink: 0 }}>
          {right}
        </div>
      )}
    </div>
  );
}
