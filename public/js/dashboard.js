document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    const socket = io();

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
            if (error.status === 401) {
                window.location.href = '/';
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

    socket.on('live_calls_update', updateCalls);
    socket.on('live_units_update', updateUnits);

    window.updateStatus = (status) => {
        const callsign = '101'; 
        socket.emit('update_status', { callsign, status });
        fetch('/api/cad/units/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ callsign, status })
        });
    };

    fetchData();
});
