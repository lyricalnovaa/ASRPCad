import { socket } from './socket.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Check if the user is an admin and redirect
    try {
        const response = await fetch('/api/auth/check-admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.isAdmin) {
            window.location.href = '/admin.html';
            return;
        }
    } catch (error) {
        // Log the error but don't stop the application
        console.error('Failed to check admin status:', error);
    }

    // All logic below this point is for regular users
    async function fetchData() {
        try {
            const [callsResponse, unitsResponse] = await Promise.all([
                fetch('/api/cad/calls', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/cad/units', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const callsData = await callsResponse.json();
            const unitsData = await unitsResponse.json();

            updateCalls(callsData);
            updateUnits(unitsData);

        } catch (error) {
            console.error('Error fetching data:', error);
            // Check for unauthorized access
            if (error.response && error.response.status === 401) {
                window.location.href = '/login.html';
            }
        }
    }

    function updateCalls(calls) {
        const container = document.getElementById('calls-container');
        container.innerHTML = calls.map(call => `
            <div class="card" style="margin-bottom: 15px;">
                <h4><span style="color: var(--blue-highlight);">Type:</span> ${call.type}</h4>
                <p><span style="color: var(--blue-highlight);">Location:</span> ${call.location}</p>
                <p><span style="color: var(--blue-highlight);">Status:</span> ${call.status}</p>
                <p><span style="color: var(--blue-highlight);">Notes:</span> ${call.notes}</p>
            </div>
        `).join('');
    }

    function updateUnits(units) {
        const container = document.getElementById('units-container');
        container.innerHTML = units.map(unit => `
            <div class="unit-card" style="margin-bottom: 10px;">
                <p><span style="color: var(--blue-highlight);">Callsign:</span> ${unit.callsign}</p>
                <p><span style="color: var(--blue-highlight);">Status:</span> ${unit.status}</p>
            </div>
        `).join('');
    }

    window.addEventListener('callsUpdate', (e) => updateCalls(e.detail));
    window.addEventListener('unitsUpdate', (e) => updateUnits(e.detail));

    window.updateStatus = (status) => {
        const callsign = '101'; // Needs to be dynamic
        socket.emit('update_status', { callsign, status });
        fetch('/api/cad/units/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ callsign, status })
        });
    };

    fetchData();
});
