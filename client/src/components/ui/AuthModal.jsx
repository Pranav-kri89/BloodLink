import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';

export default function AuthModal({ isOpen, onClose }) {
    const { isSignedIn } = useClerkAuth();

    useEffect(() => {
        if (isSignedIn && isOpen) {
            onClose();
        }
    }, [isSignedIn, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative z-10"
                >
                    <div className="absolute -top-12 right-0 md:-right-12 md:top-0">
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Clerk SignIn component directly in the modal */}
                    <SignIn routing="hash" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
