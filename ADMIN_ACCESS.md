## Admin Panel Access Instructions

The admin panel is accessible at: **http://localhost:8081/admin**

### Login Credentials
- **Username**: `admin`
- **Password**: `admin`

### If You See Continuous Loading

1. **Hard Refresh the Page**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

2. **Clear Browser Cache**:
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Clear localStorage**:
   - Open DevTools Console (F12)
   - Run: `localStorage.clear()`
   - Refresh the page

4. **Direct Login**:
   - If still stuck, open Console (F12) and run:
   ```javascript
   localStorage.setItem("promysr_admin_mock", "true");
   window.location.reload();
   ```

This will bypass the login screen and take you directly to the admin dashboard.
