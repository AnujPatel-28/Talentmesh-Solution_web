import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    AI Recruit
                </Link>
                <div className={styles.links}>
                    <Link href="/employers" className={styles.link}>For Employers</Link>
                    <Link href="/job-seekers" className={styles.link}>For Job Seekers</Link>
                    <Link href="/about" className={styles.link}>About Us</Link>
                    <Link href="/contact" className={styles.link}>Contact</Link>
                </div>
                <div className={styles.auth}>
                    <Link href="/login" className={styles.loginBtn}>Login</Link>
                    <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
