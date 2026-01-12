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
            
            if (email && isValidEmail(email)) {
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
                        showMessage('Thank you! We\'ll notify you when we launch.', 'success');
                        
                        // Play success audio
                        if (successAudio) {
                            successAudio.play().catch(err => {
                                console.log('Audio play failed:', err);
                            });
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
                showMessage('Please enter a valid email address.', 'error');
            }
        });
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
        }`;
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
