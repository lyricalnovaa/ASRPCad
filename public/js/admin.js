document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }

    function renderUsers(users) {
        const container = document.getElementById('users-container');
        container.innerHTML = `
            <h3>User Management</h3>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.role}</td>
                            <td>
                                <select onchange="updateUserRole('${user.id}', this.value)">
                                    <option value="">Select Role</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Police Officer">Police Officer</option>
                                    <option value="Dispatch">Dispatch</option>
                                    <option value="Fire/EMS">Fire/EMS</option>
                                    <option value="Civilian">Civilian</option>
                                    <option value="DOT">DOT</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    window.updateUserRole = async (userId, newRole) => {
        if (!newRole) return;
        try {
            const response = await fetch('/api/admin/users/assign-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, role: newRole })
            });
            const data = await response.json();
            console.log(data.message);
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Failed to update user role:', error);
        }
    };

    fetchUsers();
});
