"use client";
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import styles from './sections.module.css';

const industries = [
    { name: "Accounting", icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 20 }} />, color: "#3b82f6" },
    { name: "Business & consulting", icon: <HandshakeOutlinedIcon sx={{ fontSize: 20 }} />, color: "#10b981" },
    { name: "Human research", icon: <SearchOutlinedIcon sx={{ fontSize: 20 }} />, color: "#f59e0b" },
    { name: "Marketing and finance", icon: <CampaignOutlinedIcon sx={{ fontSize: 20 }} />, color: "#ef4444" },
    { name: "Design & development", icon: <EditOutlinedIcon sx={{ fontSize: 20 }} />, color: "#8b5cf6" },
    { name: "Finance management", icon: <SavingsOutlinedIcon sx={{ fontSize: 20 }} />, color: "#06b6d4" },
    { name: "Project management", icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />, color: "#ec4899" },
    { name: "Customer services", icon: <HeadsetMicOutlinedIcon sx={{ fontSize: 20 }} />, color: "#f97316" }
];

const Industries = () => {
    return (
        <section className={styles.industries}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        Trusted by <span className={styles.highlightText}>industry-leading</span> teams.
                    </h2>
                </div>

                <div className={styles.industryFlex}>
                    {industries.map((ind, i) => (
                        <div
                            key={i}
                            className={styles.industryTag}
                            style={{ '--hover-color': ind.color } as React.CSSProperties}
                        >
                            <span className={styles.tagIcon}>{ind.icon}</span>
                            <span className={styles.tagName}>{ind.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Industries;

