import { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    useEffect(() => {
        // Complete the splash screen after exactly 4.5 seconds
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 4500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                background: 'linear-gradient(135deg, #2b0000 0%, #7a0000 50%, #2b0000 100%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                overflow: 'hidden'
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                
                {/* 0-1.5s: Glowing ECG Heartbeat Line */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <svg width="600" height="150" viewBox="0 0 600 150" style={{ overflow: 'visible' }}>
                        <motion.path
                            d="M 0,75 L 200,75 L 230,25 L 270,125 L 310,15 L 350,135 L 380,75 L 600,75"
                            fill="none"
                            stroke="rgba(255, 50, 50, 0.9)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.8))' }}
                        />
                    </svg>
                </div>

                {/* 1-2s: Blood drop falling and transforming to heart */}
                <div style={{ position: 'relative', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
                    {/* Blood Drop */}
                    <motion.div
                        initial={{ y: -200, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                        transition={{ duration: 1.2, delay: 1, ease: "easeIn" }}
                        style={{ position: 'absolute' }}
                    >
                        <svg width="40" height="60" viewBox="0 0 30 40" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,0,0.8))' }}>
                            <path d="M15 0 C15 0 0 20 0 30 C0 38 7 40 15 40 C23 40 30 38 30 30 C30 20 15 0 15 0 Z" fill="#ff3333" />
                        </svg>
                    </motion.div>

                    {/* Heart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [0, 1.5, 1] }}
                        transition={{ duration: 0.8, delay: 2.1, ease: "backOut" }}
                        style={{ position: 'absolute', fontSize: '4.5rem', textShadow: '0 0 30px rgba(255,0,0,0.8)' }}
                    >
                        ❤️
                    </motion.div>
                </div>
                
                {/* Visual Text: Blood Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.5 }}
                >
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '4px', textShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>
                        Blood Link
                    </h1>
                    <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', width: '80%', margin: '0.5rem auto' }} />
                </motion.div>

                {/* Text fade in */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 3 }}
                    style={{ marginTop: '1rem' }}
                >
                    <p style={{ fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, letterSpacing: '1px', opacity: 0.9, textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
                        "Every Drop Counts. Every Second Matters."
                    </p>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default SplashScreen;
