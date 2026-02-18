export default function Signup() {
    return (
        <div style={{ padding: '8rem 2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <h1>Sign Up</h1>
            <p>Join thousands of professionals and companies.</p>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <input type="text" placeholder="Full Name / Company Name" style={{ padding: '0.5rem', fontSize: '1rem' }} />
                <input type="email" placeholder="Email" style={{ padding: '0.5rem', fontSize: '1rem' }} />
                <input type="password" placeholder="Password" style={{ padding: '0.5rem', fontSize: '1rem' }} />
                <button type="submit" style={{
                    padding: '0.75rem',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}>
                    Create Account
                </button>
            </form>
        </div>
    );
}
