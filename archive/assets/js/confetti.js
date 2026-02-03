// Confetti Animation for Success Celebration - Firework Style from Circle Border
function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;
    
    // Clear any existing confetti
    confettiContainer.innerHTML = '';
    
    const colors = ['#893336', '#faf6ed', '#3d3d3d', '#a8c5a0', '#ffd700', '#ff6b6b', '#4ecdc4'];
    const confettiCount = 200; // Variable pieces for rich effect
    
    // Get hero image position for confetti origin
    const heroImage = document.querySelector('.hero-image-circle');
    if (!heroImage) return;
    
    const heroRect = heroImage.getBoundingClientRect();
    const containerRect = confettiContainer.getBoundingClientRect();
    const centerX = heroRect.left + heroRect.width / 2 - containerRect.left;
    const centerY = heroRect.top + heroRect.height / 2 - containerRect.top;
    const radius = heroRect.width / 2; // Circle radius
    
    // Create batches for staggered release
    const batchCount = 5; // 5 batches
    const piecesPerBatch = Math.ceil(confettiCount / batchCount);
    const batchDelay = 80; // 80ms between batches
    
    // Create confetti from all points around the circle border
    for (let i = 0; i < confettiCount; i++) {
        const batchIndex = Math.floor(i / piecesPerBatch);
        const delay = batchIndex * batchDelay;
        
        setTimeout(() => {
            const confetti = document.createElement('div');
            // Variable sizes for more dynamic effect
            const size = Math.random() * 10 + 3; // 3-13px (variable sizes)
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Variable shapes and styles
            const isCircle = Math.random() > 0.4; // 60% circles, 40% squares
            const opacity = Math.random() * 0.3 + 0.7; // 0.7-1.0 opacity variation
            
            // Calculate starting position on the circle border (360°)
            const angle = (Math.PI * 2 * i) / confettiCount; // Evenly distributed around circle
            const startX = centerX + Math.cos(angle) * radius;
            const startY = centerY + Math.sin(angle) * radius;
            
            // Calculate explosion direction (outward from circle border with more spread)
            // Add more variation for spread-out effect
            const spreadVariation = (Math.random() - 0.5) * 0.8; // Increased spread variation
            const explosionAngle = angle + spreadVariation;
            
            // Variable velocity with force - stronger initial burst
            const baseVelocity = Math.random() * 300 + 250; // 250-550px/s
            const velocityVariation = Math.random() * 150 + 50; // Additional variation
            const velocity = baseVelocity + velocityVariation; // 300-700px/s total
            
            const rotationSpeed = (Math.random() - 0.5) * 540; // Half rotation speed: degrees per second
            
            confetti.style.position = 'absolute';
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.left = `${startX}px`;
            confetti.style.top = `${startY}px`;
            confetti.style.borderRadius = isCircle ? '50%' : (Math.random() > 0.5 ? '20%' : '0'); // Variable shapes
            confetti.style.opacity = '0';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '20';
            confetti.style.transformOrigin = 'center center';
            
            // Store initial opacity for animation
            const finalOpacity = opacity;
            
            confettiContainer.appendChild(confetti);
            
            // Animate confetti - longer duration for slower speed
            const duration = 3000 + Math.random() * 2000; // 3-5 seconds (slower flow)
            
            // Calculate end position - burst outward in all directions with minimal gravity
            // Reduced gravity effect to make it spread more horizontally
            const gravityEffect = 0.3; // Reduced gravity (was 0.5 * 9.8)
            const endX = startX + Math.cos(explosionAngle) * velocity * (duration / 1000);
            const endY = startY + Math.sin(explosionAngle) * velocity * (duration / 1000) + gravityEffect * Math.pow(duration / 1000, 2) * 100;
            
            // Fade in quickly
            confetti.animate([
                { opacity: 0, transform: 'translate(0, 0) rotate(0deg) scale(0)' },
                { opacity: finalOpacity, transform: 'translate(0, 0) rotate(0deg) scale(1)', offset: 0.05 }
            ], {
                duration: 50,
                fill: 'forwards'
            });
            
            // Main explosion animation - burst outward with force
            confetti.animate([
                { 
                    transform: `translate(0, 0) rotate(0deg) scale(1)`,
                    opacity: finalOpacity
                },
                { 
                    transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${rotationSpeed * duration / 1000}deg) scale(0.2)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.2, 0, 0.8, 1)', // Ease-out for burst effect
                fill: 'forwards'
            }).onfinish = () => {
                confetti.remove();
            };
        }, delay);
    }
}

// Export function for use in form handler
if (typeof window !== 'undefined') {
    window.createConfetti = createConfetti;
}
