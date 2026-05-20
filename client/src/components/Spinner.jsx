function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '64px 0',
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #004e9f',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Spinner;