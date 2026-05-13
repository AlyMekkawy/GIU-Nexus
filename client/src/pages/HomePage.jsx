const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#f6f8fc',
        color: '#1f2937',
        fontFamily: 'Arial, sans-serif',
    },
    card: {
        width: '100%',
        maxWidth: '640px',
        padding: '2.5rem',
        borderRadius: '16px',
        background: '#ffffff',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        textAlign: 'center',
    },
    label: {
        margin: 0,
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#2563eb',
    },
    title: {
        margin: '0.75rem 0 0',
        fontSize: '2rem',
        lineHeight: 1.2,
    },
    text: {
        margin: '1rem 0 0',
        fontSize: '1rem',
        lineHeight: 1.6,
        color: '#4b5563',
    },
};

function HomePage() {
    return (
        <section style={styles.page}>
                <p style={styles.label}>Route Working</p>
                <h1 style={styles.title}>Home Page Placeholder</h1>
                <p style={styles.text}>
                    This page is a temporary placeholder so you can confirm the home route is
                    wired up correctly.
                </p>
        </section>
    );
}

export default HomePage;