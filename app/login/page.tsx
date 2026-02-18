export default function Login() {
    return (
        <div style={{ padding: '8rem 2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <h1>Login</h1>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    Sign In
                </button>
            </form>
        </div>
    );
}
