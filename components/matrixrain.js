import React, { useRef, useEffect } from 'react';

const MatrixRain = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function getRandomChar() {
            const n = Math.random();
            if (n < 0.5) {
                return String.fromCharCode(0x30A0 + Math.random() * 96);
            } else {
                return String.fromCharCode(0x0021 + Math.random() * 94);
            }
        }

        function draw() {
            context.fillStyle = 'rgba(0, 0, 0, 0.05)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#0F0';
            context.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = getRandomChar();
                context.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        }

        const interval = setInterval(draw, 30);

        return () => clearInterval(interval);
    }, []);

    return <canvas ref={canvasRef} />;
};

export default MatrixRain;
