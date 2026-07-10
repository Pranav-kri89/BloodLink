import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    const [scene, setScene] = useState(0);

    useEffect(() => {
        // Timeline Orchestration (6 seconds total)
        const t1 = setTimeout(() => setScene(1), 0);       // Scene 1: 0.0s (Background, dust, heartbeats)
        const t2 = setTimeout(() => setScene(2), 1000);    // Scene 2: 1.0s (Silhouettes fade in)
        const t3 = setTimeout(() => setScene(3), 2000);    // Scene 3: 2.0s (Connection line traces)
        const t4 = setTimeout(() => setScene(4), 3000);    // Scene 4: 3.0s (Particles assemble into logo)
        const t5 = setTimeout(() => setScene(5), 4200);    // Scene 5: 4.2s (Logo moves up, typography reveals)
        const t6 = setTimeout(() => setScene(6), 5200);    // Scene 6: 5.2s (ECG line behind logo, final pulse)
        
        const exit = setTimeout(() => {
            setScene(7); // 6.0s Transition out
            setTimeout(onComplete, 800); // Wait for transition out
        }, 6000);

        return () => {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
            clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); 
            clearTimeout(exit);
        };
    }, [onComplete]);

    // Silhouette SVG Component
    const Silhouette = ({ isDonor }) => (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 1, ease: "easeInOut" }} 
            className="relative flex flex-col items-center mx-16"
        >
            <svg width="60" height="120" viewBox="0 0 24 48" stroke="#A0A0A0" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                {/* Minimal Head */}
                <circle cx="12" cy="8" r="4" />
                {/* Minimal Body */}
                <path d="M12,12 C12,12 18,14 18,22 C18,30 15,40 12,48 C9,40 6,30 6,22 C6,14 12,12 12,12 Z" />
                {/* Arms */}
                <path d="M6,16 C3,24 4,32 4,32" />
                <path d="M18,16 C21,24 20,32 20,32" />
            </svg>
            {/* Heart inside chest */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                    scale: [0.8, 1.1, 0.8], 
                    opacity: isDonor ? (scene >= 3 ? 1 : 0.8) : (scene >= 3 ? 1 : 0.4),
                    filter: scene >= 3 ? "drop-shadow(0 0 10px #E30613)" : "none"
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[32px]"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E30613">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            </motion.div>
        </motion.div>
    );

    return (
        <AnimatePresence>
            {scene < 7 && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white"
                >
                    {/* SCENE 1: Ambient Dust Particles */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={`dust-${i}`}
                                className="absolute bg-[#E30613] rounded-full"
                                style={{
                                    width: Math.random() * 3 + 1,
                                    height: Math.random() * 3 + 1,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -30 - Math.random() * 50],
                                    x: [0, Math.random() * 20 - 10],
                                    opacity: [0, Math.random() * 0.5 + 0.2, 0],
                                }}
                                transition={{
                                    duration: Math.random() * 4 + 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: Math.random() * 5
                                }}
                            />
                        ))}
                    </div>

                    {/* SCENE 1: Heartbeat entry lines */}
                    {scene >= 1 && scene < 4 && (
                        <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none opacity-30">
                            <motion.div 
                                initial={{ opacity: 0, x: -100, width: 0 }} 
                                animate={{ opacity: 1, x: 0, width: "30%" }} 
                                transition={{ delay: 0.3, duration: 2, ease: "easeOut" }} 
                                className="h-[1px] bg-[#E30613]" style={{ filter: "drop-shadow(0 0 5px #E30613)" }}
                            />
                            <motion.div 
                                initial={{ opacity: 0, x: 100, width: 0 }} 
                                animate={{ opacity: 1, x: 0, width: "30%" }} 
                                transition={{ delay: 0.3, duration: 2, ease: "easeOut" }} 
                                className="h-[1px] bg-[#E30613]" style={{ filter: "drop-shadow(0 0 5px #E30613)" }}
                            />
                        </div>
                    )}

                    {/* SCENE 2 & 3: Strangers & Connection Line */}
                    <AnimatePresence>
                        {scene >= 2 && scene < 4 && (
                            <motion.div 
                                className="relative z-10 flex items-center justify-center w-full max-w-lg"
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 1 } }}
                            >
                                <Silhouette isDonor={true} />
                                
                                {/* SCENE 3: Glowing Connection Line */}
                                {scene >= 3 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 mt-16">
                                        <svg width="180" height="60" viewBox="0 0 180 60" className="overflow-visible">
                                            <defs>
                                                <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#E30613" stopOpacity="0" />
                                                    <stop offset="50%" stopColor="#ff4d4d" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                                                </linearGradient>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>
                                            <motion.path
                                                d="M 10 30 Q 90 -20 170 30"
                                                fill="none"
                                                stroke="url(#beam)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                filter="url(#glow)"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 1, ease: "easeInOut" }}
                                            />
                                            {/* Flowing particles on the line */}
                                            {[...Array(5)].map((_, i) => (
                                                <motion.circle 
                                                    key={`flow-${i}`}
                                                    r="1.5" fill="#FFFFFF" 
                                                    initial={{ offsetDistance: "0%", opacity: 0 }}
                                                    animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                                                    transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: "easeInOut" }}
                                                    style={{ filter: "drop-shadow(0 0 4px #FFFFFF)", offsetPath: "path('M 10 30 Q 90 -20 170 30')" }}
                                                />
                                            ))}
                                        </svg>
                                    </div>
                                )}
                                
                                <Silhouette isDonor={false} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SCENE 4: Magical Assembly (Logo) */}
                    {scene >= 4 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.2, filter: "blur(20px) brightness(2)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", y: scene >= 5 ? -30 : 0 }}
                                transition={{ duration: 1.2, ease: "easeOut", layout: { duration: 1, ease: "easeInOut" } }}
                                className="relative flex items-center justify-center w-36 h-36"
                            >
                                {/* Soft white halo behind logo */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1.5 }}
                                    transition={{ delay: 0.8, duration: 1.5 }}
                                    className="absolute inset-0 bg-white rounded-full pointer-events-none"
                                    style={{ filter: "blur(30px)", boxShadow: "0 0 60px rgba(255,255,255,0.8)" }}
                                />
                                <motion.img layoutId="brand-logo" src="/logo_transparent.png" alt="BloodLink" className="relative w-full h-full object-contain drop-shadow-xl z-10" />
                                
                                {/* Scene 4 Swirling Particles (Implosion) */}
                                {scene === 4 && Array.from({ length: 80 }).map((_, i) => (
                                    <motion.div
                                        key={`implosion-${i}`}
                                        className="absolute rounded-full"
                                        style={{ 
                                            width: Math.random() * 5 + 1, 
                                            height: Math.random() * 5 + 1,
                                            backgroundColor: Math.random() > 0.8 ? '#FFFFFF' : '#E30613',
                                            boxShadow: Math.random() > 0.5 ? '0 0 8px rgba(227, 6, 19, 0.8)' : 'none'
                                        }}
                                        initial={{ 
                                            x: Math.cos(i) * (Math.random() * 300 + 100), 
                                            y: Math.sin(i) * (Math.random() * 300 + 100), 
                                            opacity: 0, scale: 0 
                                        }}
                                        animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: [0, 1.5, 0.5] }}
                                        transition={{ duration: 0.9, delay: Math.random() * 0.3, ease: "circIn" }}
                                    />
                                ))}

                                {/* Scene 6 Final Pulse Explosion */}
                                {scene >= 6 && (
                                    <motion.div
                                        initial={{ opacity: 0.8, scale: 1 }}
                                        animate={{ opacity: 0, scale: 2 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-full border-4 border-[#E30613]"
                                        style={{ filter: "drop-shadow(0 0 10px #E30613)" }}
                                    />
                                )}
                            </motion.div>

                            {/* SCENE 5: Typography Reveal */}
                            <div className="absolute top-1/2 mt-12 flex flex-col items-center h-24">
                                {scene >= 5 && (
                                    <div className="text-4xl font-[800] tracking-tight flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        <motion.span 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} 
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="text-[#2E2E2E]"
                                        >
                                            Blood
                                        </motion.span>
                                        <motion.span 
                                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} 
                                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                            className="text-[#E30613]"
                                        >
                                            Link
                                        </motion.span>
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} 
                                            transition={{ duration: 0.4, delay: 0.6, type: "spring" }}
                                            className="absolute w-2 h-2 bg-[#E30613] rounded-full -top-1 right-[26px]"
                                            style={{ filter: "drop-shadow(0 0 4px #E30613)" }}
                                        />
                                    </div>
                                )}

                                {scene >= 5 && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                        transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                                        className="text-[#A0A0A0] text-sm text-center mt-2 font-medium"
                                    >
                                        Connecting Donors. Saving Lives.
                                    </motion.p>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
