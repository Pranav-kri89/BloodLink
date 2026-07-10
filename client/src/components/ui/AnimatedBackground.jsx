import React, { useCallback } from 'react';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const AnimatedBackground = () => {
    const particlesInit = useCallback(async (engine) => {
        // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        await loadFull(engine);
    }, []);

    const particlesLoaded = useCallback(async (container) => {
        // console.log(container);
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            loaded={particlesLoaded}
            options={{
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onHover: {
                            enable: true,
                            mode: "bubble",
                        },
                        resize: true,
                    },
                    modes: {
                        bubble: {
                            distance: 250,
                            duration: 2,
                            opacity: 0.15,
                            size: 15,
                        },
                    },
                },
                particles: {
                    color: {
                        value: ["#E63946", "#A80010", "#FF5A5F", "#ffd1d6"],
                    },
                    links: {
                        color: "#E63946",
                        distance: 150,
                        enable: false,
                        opacity: 0.2,
                        width: 1,
                    },
                    collisions: {
                        enable: false,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "bounce",
                        },
                        random: true,
                        speed: 0.8,
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 40,
                    },
                    opacity: {
                        value: 0.1,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 0.5,
                            opacity_min: 0.05,
                            sync: false
                        }
                    },
                    shape: {
                        type: ["circle", "polygon"],
                        options: {
                            polygon: {
                                sides: 6
                            }
                        }
                    },
                    size: {
                        value: { min: 3, max: 12 },
                        random: true,
                        anim: {
                            enable: true,
                            speed: 1,
                            size_min: 3,
                            sync: false
                        }
                    },
                },
                detectRetina: true,
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
};

export default AnimatedBackground;
