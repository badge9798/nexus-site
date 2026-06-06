NEXUS website — file layout
============================

Open index.html in a browser (keep css/ and js/ folders next to it).

Files:
  index.html      — main page, loads scripts and styles
  css/styles.css  — all site styles (unchanged from original)
  js/admin.js     — admin password storage and checks
  js/app.jsx      — React app (admin login + change password in Settings)

Admin password: set on first login. Change or reset only via verification code sent to owner Gmail (see NETLIFY-DEPLOY.txt).

To change the admin password:
  1. Log in via sidebar → Admin Login
  2. Go to Settings
  3. Scroll to "Admin Security" → enter current password, new password, confirm → Update admin password

Password is saved in this browser's localStorage (key: nexus_admin_password).
