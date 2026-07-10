import { motion } from 'framer-motion';

const AnimatedBackground = ({ children }) => {
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            {/* Animated Gradient Orbs */}
            <motion.div
                className="gradient-orb orb-1"
                animate={{
                    x: [0, 100, 0, -100, 0],
                    y: [0, 100, 200, 100, 0],
                    scale: [1, 1.2, 1, 0.8, 1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
                className="gradient-orb orb-2"
                animate={{
                    x: [0, -150, 0, 150, 0],
                    y: [0, -100, -200, -100, 0],
                    scale: [1, 1.5, 1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
                className="gradient-orb orb-3"
                animate={{
                    x: [0, 200, 0, -200, 0],
                    y: [0, -150, 0, 150, 0],
                    scale: [1, 0.8, 1, 1.2, 1]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />

            {/* Glass effect overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backdropFilter: 'blur(80px)',
                WebkitBackdropFilter: 'blur(80px)',
                backgroundColor: 'rgba(245, 240, 235, 0.4)',
                zIndex: 1
            }}></div>

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 2, minHeight: 'inherit', display: 'flex' }}>
                {children}
            </div>
        </div>
    );
};

export default AnimatedBackground;
