function Hero({ keyword, setKeyword, location, setLocation, type, setType, onSearch }) {
  return (
    <section style={{ textAlign: 'center', padding: '60px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '56px', fontWeight: '600', lineHeight: '1.07', letterSpacing: '-0.02em', color: '#1b1b1d', maxWidth: '800px', margin: '0 0 16px' }}>
        Find the work that <span style={{ color: '#004e9f' }}>fits your skills.</span>
      </h1>
      <p style={{ fontSize: '21px', lineHeight: '1.3', color: '#6e6e73', maxWidth: '600px', margin: '0 0 32px' }}>
        Intelligence-led career matching for the next generation of academic talent. GIU Nexus extracts your core strengths to find perfect opportunities.
      </p>
      <form onSubmit={onSearch} style={{ width: '100%', maxWidth: '980px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: '9999px',
          padding: '8px', display: 'flex', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: '#727784', fontSize: '20px' }}>search</span>
            <input
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '17px', width: '100%', color: '#1b1b1d' }}
              placeholder="Job title or keyword"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="material-symbols-outlined" style={{ color: '#727784', fontSize: '20px' }}>location_on</span>
            <input
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '17px', width: '100%', color: '#1b1b1d' }}
              placeholder="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#727784', fontSize: '20px' }}>work</span>
            <select
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '17px', width: '100%', color: '#1b1b1d', appearance: 'none' }}
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <button type="submit" style={{
            background: '#004e9f', color: '#fff', padding: '12px 32px',
            borderRadius: '9999px', border: 'none', fontWeight: '600',
            fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Search
          </button>
        </div>
      </form>
    </section>
  );
}

export default Hero;