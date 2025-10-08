# Loan Prediction Frontend

A comprehensive React.js frontend application for the AI-powered loan default prediction system. This application provides loan officers with intuitive tools to assess loan applicant risk, process applications in batches, and make data-driven lending decisions.

## 🏗️ Architecture Overview

The application is built with modern React.js and follows best practices for scalability, performance, and maintainability:

### Tech Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **React Hook Form** for form management
- **Zustand** for state management
- **Heroicons** for consistent iconography

### Key Features Implemented

#### ✅ 1. Batch Processing Interface (`/assess/batch`)
- **Drag-and-drop CSV upload** with file validation
- **Real-time progress tracking** with polling mechanism
- **Results table** with filtering and sorting capabilities
- **Bulk export** functionality (CSV, Excel, PDF)
- **Template download** for correct file format
- **Error handling** with detailed feedback

#### ✅ 2. Dashboard (`/dashboard`)
- **Metrics cards** showing key performance indicators
- **Quick action buttons** for common tasks
- **Recent activity feed** with real-time updates
- **System overview** with approval rates and accuracy

#### ✅ 3. Navigation & Layout
- **Responsive sidebar** with mobile-friendly collapsible menu
- **Header** with notifications and user profile
- **Professional layout** optimized for loan officer workflow

#### ✅ 4. Component Library
- **Reusable components**: LoadingSpinner, RiskBadge, Toast notifications
- **Type-safe interfaces** for all data models
- **Comprehensive API service** with error handling
- **Utility functions** for formatting and validation

### Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # App header with navigation
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Layout.tsx           # Main layout wrapper
│   ├── common/
│   │   ├── LoadingSpinner.tsx   # Loading indicators
│   │   ├── RiskBadge.tsx        # Risk level indicators
│   │   ├── Toast.tsx            # Notification system
│   │   └── Modal.tsx            # Modal dialogs (placeholder)
│   ├── forms/                   # Form components (placeholders)
│   └── charts/                  # Chart components (placeholders)
├── pages/
│   ├── Dashboard.tsx            # Main dashboard
│   ├── SingleAssessment.tsx     # Individual assessment (placeholder)
│   ├── BatchProcessing.tsx      # Batch upload & processing
│   ├── PredictionHistory.tsx    # Historical data (placeholder)
│   ├── Analytics.tsx            # Model insights (placeholder)
│   └── Settings.tsx             # Configuration (placeholder)
├── services/
│   ├── api.ts                   # Centralized API service
│   └── predictionService.ts     # Prediction-specific services (placeholder)
├── types/
│   └── index.ts                 # TypeScript type definitions
├── utils/
│   ├── constants.ts             # Application constants
│   └── formatters.ts            # Utility functions
├── contexts/                    # React contexts (placeholders)
└── hooks/                       # Custom hooks (placeholders)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Backend API server running on port 8000

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd loan-prediction-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.development
   ```
   
   Update `.env.development` with your API configuration:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_WS_URL=ws://localhost:8000/ws
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (not recommended)

## 🎯 Current Implementation Status

### ✅ Completed Features
- [x] **Project Setup & Configuration**
  - React 18 with TypeScript
  - Tailwind CSS configuration
  - React Router setup
  - API service architecture

- [x] **Core Architecture**
  - TypeScript types for all data models
  - Centralized API service with error handling
  - Reusable component library
  - Responsive layout system

- [x] **Batch Processing (Primary Feature)**
  - Complete CSV upload interface
  - Drag-and-drop file handling
  - Real-time progress tracking
  - Results display with filtering
  - Export functionality
  - Error handling and validation

- [x] **Navigation & Layout**
  - Professional sidebar navigation
  - Responsive header
  - Mobile-friendly design
  - Route configuration

- [x] **Dashboard Overview**
  - Metrics display
  - Quick actions
  - Recent activity feed

### 🚧 Planned Features (Ready for Implementation)
- [ ] **Single Assessment Form**
  - Multi-section applicant form
  - Real-time risk scoring
  - Interactive risk gauge
  - Feature importance display

- [ ] **Prediction History**
  - Searchable history table
  - Detailed prediction views
  - Comparison tools
  - Audit trail

- [ ] **Analytics Dashboard**
  - Model performance metrics
  - Feature importance charts
  - Confusion matrix visualization
  - Trend analysis

## 🔧 API Integration

The application integrates with a backend API through a centralized service layer:

### Expected API Endpoints

```typescript
POST /api/predict/single     // Single applicant prediction
POST /api/predict/batch      // Batch file upload
GET  /api/batch/:id          // Batch job status
GET  /api/batch/:id/results  // Batch results with pagination
GET  /api/predictions        // Historical predictions
GET  /api/model/metrics      // Model performance data
GET  /api/dashboard/metrics  // Dashboard statistics
POST /api/export            // Data export
GET  /api/batch/template     // CSV template download
```

## 📱 Responsive Design

The application is built mobile-first with responsive breakpoints:
- **Mobile**: Single-column layout, collapsible navigation
- **Tablet**: Adapted multi-column layouts
- **Desktop**: Full sidebar navigation, multi-column views

## 🎨 Design System

### Color Scheme
- **Primary**: Blue (#3B82F6) for professional trust
- **Risk Indicators**: 
  - Green (#10B981) for low risk
  - Yellow (#F59E0B) for medium risk  
  - Red (#EF4444) for high risk

### Typography
- **Font**: Inter for modern readability
- **Clear hierarchy** with consistent spacing

---

**Built with ❤️ for loan officers who need powerful, intuitive tools for data-driven lending decisions.**