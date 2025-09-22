const socket = io();

// Event listeners for incoming real-time data
socket.on('live_calls_update', (data) => {
    // This event handler will be managed by the dashboard.js file
    const event = new CustomEvent('callsUpdate', { detail: data });
    window.dispatchEvent(event);
});

socket.on('live_units_update', (data) => {
    // This event handler will be managed by the dashboard.js file
    const event = new CustomEvent('unitsUpdate', { detail: data });
    window.dispatchEvent(event);
});

// You can add more listeners for panic buttons, chat messages, etc.

export { socket };
