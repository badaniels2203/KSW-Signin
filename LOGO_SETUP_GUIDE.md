# Logo Setup Guide

This guide explains how to add your custom logo to the KSW Attendance System.

## Where the Logo Appears

1. **Student Sign-In Page**: Centered at the top of the sign-in card
2. **Admin Login Page**: Top-left corner  
3. **Admin Dashboard**: Top-left corner of the header

## Adding Your Logo

### Step 1: Prepare Your Logo File

1. **Recommended format**: PNG with transparent background
2. **Recommended dimensions**: 
   - Width: 300-500px
   - Height: 300-500px (square or rectangular)
3. **File name**: `logo.png` (lowercase, exactly this name)

**Alternative formats**: JPG, SVG, or GIF also work - just update the references if not using PNG.

### Step 2: Place the Logo File

You need to place your logo in the **public** folder of the frontend:

```
KSW-Signin/
└── frontend/
    └── public/
        └── logo.png  ← Put your logo file here
```

### Step 3: Add Logo to Docker Container

If you're using Docker, the logo will automatically be included when you rebuild the frontend container.

**Rebuild the frontend:**

```bash
cd /path/to/KSW-Signin
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

**Or in Portainer:**
1. Go to Stacks → Your Stack
2. Click "Editor"
3. Check "Re-pull image and redeploy"
4. Click "Update the stack"

## Logo Sizes and Styling

The logo automatically scales based on screen size:

### Student Sign-In Page
- Desktop: Max width 180px
- Mobile: Max width 140px
- Position: Centered, top of card

### Admin Login & Dashboard
- Desktop: Max width 100-120px
- Mobile: Max width 70-80px
- Position: Top-left corner

## Customizing Logo Size

If you want to adjust the logo size, edit the CSS files:

### Student Sign-In Page
Edit `frontend/src/components/SignIn.css`:

```css
.signin-logo {
  max-width: 180px;  /* Change this value */
  height: auto;
  display: inline-block;
}
```

### Admin Login Page
Edit `frontend/src/components/AdminLogin.css`:

```css
.admin-login-logo img {
  max-width: 120px;  /* Change this value */
  height: auto;
}
```

### Admin Dashboard
Edit `frontend/src/components/AdminDashboard.css`:

```css
.dashboard-logo img {
  max-width: 100px;  /* Change this value */
  height: auto;
}
```

## Using a Different File Name

If your logo has a different name (e.g., `school-logo.svg`), update the references:

### 1. Update SignIn.js
```javascript
<img src="/school-logo.svg" alt="KSW Logo" className="signin-logo" />
```

### 2. Update AdminLogin.js
```javascript
<img src="/school-logo.svg" alt="KSW Logo" />
```

### 3. Update AdminDashboard.js
```javascript
<img src="/school-logo.svg" alt="KSW Logo" />
```

## Troubleshooting

### Logo Not Appearing

1. **Check file location**: Make sure `logo.png` is in `frontend/public/` folder
2. **Check file name**: Must be exactly `logo.png` (lowercase)
3. **Rebuild container**: Run `docker-compose build --no-cache frontend`
4. **Clear browser cache**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
5. **Check console**: Open browser DevTools → Console tab for errors

### Logo Too Large or Too Small

Edit the CSS files as described in the "Customizing Logo Size" section above.

### Logo Looks Blurry

1. Use a higher resolution image (at least 500px width)
2. Use PNG or SVG format for best quality
3. Ensure the image isn't being stretched

### Logo Has White Background

1. Use PNG format with transparency
2. Edit your logo in an image editor to remove the background
3. Or adjust the CSS to add a background color that matches

## Testing Your Logo

After adding the logo:

1. **Student Sign-In Page**: http://your-ip:8080
   - Logo should appear centered at the top
   
2. **Admin Login**: http://your-ip:8080/admin/login
   - Logo should appear in top-left corner
   
3. **Admin Dashboard**: http://your-ip:8080/admin/dashboard
   - Logo should appear in top-left of header

## Example Logo Specifications

Here are some recommended settings for different logo types:

### Square Logo (e.g., 500x500px)
- Works great centered
- Scales proportionally
- Recommended for sign-in page

### Horizontal Logo (e.g., 800x300px)
- Works well in all positions
- May need width adjustments
- Good for brand names with text

### Vertical Logo (e.g., 300x800px)
- May need custom CSS adjustments
- Best to convert to square or horizontal

## Advanced Customization

### Different Logos for Different Pages

If you want different logos on different pages:

1. Add multiple logo files to `frontend/public/`:
   - `logo-signin.png`
   - `logo-admin.png`

2. Update the component files:

**SignIn.js:**
```javascript
<img src="/logo-signin.png" alt="KSW Logo" className="signin-logo" />
```

**AdminLogin.js and AdminDashboard.js:**
```javascript
<img src="/logo-admin.png" alt="KSW Logo" />
```

### Adding a Clickable Logo

To make the logo clickable (e.g., link to home page):

**AdminDashboard.js:**
```javascript
<div className="dashboard-logo">
  <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
    <img src="/logo.png" alt="KSW Logo" />
  </a>
</div>
```

Then add to CSS:
```css
.dashboard-logo a {
  display: inline-block;
  cursor: pointer;
}
```

## Quick Start Checklist

- [ ] Prepare logo file (PNG, 300-500px)
- [ ] Rename to `logo.png`
- [ ] Place in `frontend/public/` folder
- [ ] Rebuild Docker containers
- [ ] Clear browser cache
- [ ] Test on all three pages
- [ ] Adjust sizes if needed

## Need Help?

If you're having trouble with the logo:

1. Check the browser console for errors
2. Verify the file path is correct
3. Ensure the file has proper permissions
4. Try a different image file
5. Check the CSS is loading correctly

Your logo should now appear throughout the application!
