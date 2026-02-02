// Form Handler for Email Notifications with Formspree Integration
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('notify-form');
    const emailInput = document.getElementById('email-input');
    const successAudio = document.getElementById('success-audio');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            if (email && (isValidEmail(email) || isValidPhoneNumber(email))) {
                // Disable button and show loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
                submitButton.classList.add('opacity-75', 'cursor-not-allowed');
                
                try {
                    // Submit to Formspree
                    const formData = new FormData(form);
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        // Show success message
                        showMessage('You have Pawered up! We are happy to have you.', 'success');
                        
                        // Play success audio
                        if (successAudio) {
                            successAudio.play().catch(err => {
                                console.log('Audio play failed:', err);
                            });
                        }
                        
                        // Trigger confetti animation
                        if (typeof window.createConfetti === 'function') {
                            window.createConfetti();
                        }
                        
                        // Reset form
                        emailInput.value = '';
                    } else {
                        const data = await response.json();
                        if (data.errors) {
                            showMessage('There was an error submitting your email. Please try again.', 'error');
                        } else {
                            showMessage('Something went wrong. Please try again later.', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    showMessage('Network error. Please check your connection and try again.', 'error');
                } finally {
                    // Re-enable button
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    submitButton.classList.remove('opacity-75', 'cursor-not-allowed');
                }
            } else {
                showMessage('Please enter a valid email address or 10-digit phone number.', 'error');
            }
        });
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhoneNumber(phone) {
        // Remove all non-digit characters for validation
        const digitsOnly = phone.replace(/\D/g, '');
        // Check if it's exactly 10 digits
        return digitsOnly.length === 10 && /^\d{10}$/.test(digitsOnly);
    }
    
    function showMessage(message, type) {
        // Remove existing message if any
        const existingMessage = document.querySelector('.notification-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `notification-message fixed top-4 right-4 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg z-50 max-w-xs sm:max-w-sm ${
            type === 'success' 
                ? '' 
                : 'bg-red-500 text-white'
        }`;
        
        // Apply pastel sage green styling for success messages
        if (type === 'success') {
            messageEl.style.backgroundColor = '#a8c5a0'; // Pastel sage green
            messageEl.style.color = '#1f3d1f'; // Dark green for contrast
        }
        
        messageEl.textContent = message;
        messageEl.style.fontSize = '0.875rem';
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transition = 'opacity 0.3s';
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }
});
