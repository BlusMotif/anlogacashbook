# Records Management System

A modern React-based records management system for efficient data tracking and management, built with Firebase and deployed on Render.

## 🚀 Features

- User authentication with Firebase
- Real-time records management and tracking
- Mobile-responsive design
- Dark/Light theme support
- Excel export functionality
- Secure routing with protected pages

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Firebase (Authentication & Realtime Database)
- **Build Tool**: Vite
- **Deployment**: Render (Static Site)
- **Styling**: Tailwind CSS with custom components

## 📁 Project Structure

```
anloga-cashbook/
├── public/                 # Static assets
│   ├── _redirects         # SPA routing redirects
│   ├── favicon.ico        # App favicon
│   ├── logo.png          # App logo
│   └── vite.svg          # Vite logo
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── Login.jsx      # Authentication page
│   │   ├── Welcome.jsx    # Welcome page
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── CashbookTable.jsx  # Cash entries table
│   │   ├── GoCardTable.jsx    # GoCard entries table
│   │   ├── Settings.jsx   # User settings
│   │   └── SummaryCards.jsx  # Summary statistics
│   ├── firebase.js        # Firebase configuration
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── dist/                  # Build output (generated)
├── render.yaml           # Render deployment config
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies & scripts
└── README.md            # This file
```

## 🚀 Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication and Realtime Database enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BlusMotif/anlogacashbook.git
   cd anlogacashbook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication and Realtime Database
3. Copy your Firebase config to `src/firebase.js`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Deployment to Render

### Prerequisites

- Render account
- GitHub repository connected to Render

### Deployment Steps

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Publish Directory**: `dist`
   - Add environment variables if needed

3. **Deploy**:
   - Render will automatically build and deploy your app
   - Your app will be available at `https://your-app-name.onrender.com`

### Troubleshooting Deployment

If you encounter "Page Not Found" errors:

1. **Check `_redirects` file**: Ensure `public/_redirects` exists with:
   ```
   /*    /index.html   200
   ```

2. **Verify `render.yaml`**: Make sure the routing configuration is correct

3. **Clear cache**: Try clearing your browser cache or use incognito mode

4. **Check build output**: Ensure the `dist` folder contains all necessary files

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile devices:

- Touch-friendly buttons and interactions
- Horizontal scrolling tables
- Optimized layouts for small screens
- Proper touch event handling

## 🔒 Security Features

- Firebase Authentication
- Protected routes
- Secure API calls
- Input validation
- XSS protection headers

## 📊 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run predeploy` - Pre-deployment build
- `npm run deploy` - Deployment confirmation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support or questions, please contact the development team.

---

**Built with ❤️ for efficient records management**