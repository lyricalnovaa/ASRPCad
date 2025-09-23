document.getElementById('register-form').addEventListener('submit', async (e) => {
    // Prevent the default form submission
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Redirect to the login page after successful registration
            window.location.href = '/login.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration failed:', error);
        alert('An error occurred during registration.');
    }
});
