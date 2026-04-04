# REGNIFY: Intelligent Employee Governance & Probation Management Platform

## Executive Summary

**REGNIFY** is an enterprise-grade, AI-powered employee governance and probation management solution designed to transform how organizations handle the critical probation period through intelligent compliance tracking, automated workflows, and immutable audit trails. The system combines a modern React frontend with a robust Express.js backend to provide a comprehensive multi-role governance framework.

## Project Vision

REGNIFY addresses critical gaps in traditional employee probation management by replacing fragmented, manual, spreadsheet-based processes with a structured, AI-assisted governance engine that minimizes compliance risk, eliminates subjective bias, and provides actionable predictive intelligence.

## Core Problems Solved

### Legacy System Challenges
1. **Manual Tracking** – Spreadsheet-based probation tracking leads to missed deadlines, inconsistent evaluations, and scattered documentation
2. **Subjective Evaluation** – Lack of standardized criteria results in biased decisions and legal exposure during compliance reviews
3. **No Audit Trace** – Absence of tamper-proof records creates significant compliance risk during regulatory audits and reviews
4. **No Predictive Intelligence** ��� Purely reactive management with no early warning system for identifying at-risk employees

## Six-Layer Governance Architecture

REGNIFY implements a sophisticated, layered approach to ensure consistency and compliance across the entire probation lifecycle:

### **Layer 1: Onboarding Governance Engine**
- Standardized legal and policy setup for every new hire automatically
- Pre-configured compliance templates aligned with organizational requirements
- Automatic document generation and digital signature collection
- Policy acknowledgment workflows with audit verification

### **Layer 2: Continuous Performance Tracking**
- Real-time data synchronization with probation-specific KPIs (Key Performance Indicators)
- Automated metrics calculation based on tasks, attendance, and manager ratings
- Performance trend analysis and historical benchmarking
- Multi-dimensional performance scoring combining quantitative and qualitative data

### **Layer 3: AI Risk Intelligence**
- Predictive engine detects early warning signs and compliance risks
- Automatic escalation alerts for at-risk employees
- Pattern recognition across multiple performance dimensions
- Anomaly detection for unusual behavior or performance deviations
- Risk scoring with actionable recommendations

### **Layer 4: Policy & Conflict Detection**
- Identify governance conflicts between AI-predicted risks and manager assessments
- Highlight inconsistencies in evaluation patterns
- Flag policy violations and regulatory compliance gaps
- Generate conflict resolution recommendations

### **Layer 5: Multi-Level Approval Workflow**
- Secure, hierarchy-based decision flows with role-based access control
- Structured approval chains: Manager → HR Admin → Site Head
- Legal verification gates within workflow
- Decision audit trail with timestamp and actor information
- Support for conditional workflows based on risk levels

### **Layer 6: Immutable Audit Layer**
- Tamper-proof records for every interaction with cryptographic hash verification
- Complete audit trail with SHA-256 hashing for data integrity
- Digital signatures for critical documents and approvals
- Compliance-ready reporting with full change history
- Export capabilities for regulatory audits

## Multi-Role Architecture

### **HR Admin Role**
- **Capabilities**: Full governance suite access
- **Functions**:
  - Manage employee records with comprehensive onboarding data
  - Monitor and adjust probation parameters
  - Review all performance metrics and AI insights
  - Approve/reject employee progression
  - Configure governance policies and thresholds
  - Access complete audit logs and compliance reports
  - Manage digital signatures and approvals
  - Generate compliance documentation

### **Manager Role**
- **Capabilities**: Team-level governance oversight
- **Functions**:
  - Track team members during probation period
  - Submit evaluations and assessments
  - Create and assign performance-tracking tasks
  - Review AI-generated risk insights and alerts
  - Provide manager ratings and feedback
  - Monitor task completion and performance metrics
  - Respond to governance alerts
  - Escalate concerns through workflow

### **Employee Role**
- **Capabilities**: Personal governance visibility
- **Functions**:
  - View probation status in real-time
  - Review performance metrics and KPIs
  - Acknowledge policies and compliance requirements
  - Submit task completions and progress updates
  - View assigned tasks and deadlines
  - Receive communication from management
  - Access personal performance overview
  - Track governance check status

### **Site Head Role**
- **Capabilities**: Enterprise-wide compliance oversight and final approval authority
- **Functions**:
  - Review pending employee progression decisions
  - Final approval/rejection on probation completion
  - Access enterprise-wide performance analytics
  - Monitor site-level compliance metrics
  - Review critical governance alerts
  - Oversee multi-level approval workflows
  - Generate executive compliance reports
  - Analyze trends across all employees

## Frontend Application Features

### Landing Page & Authentication
- **Public Landing Page**: Marketing-focused hero section explaining the platform value proposition
- **Role-Based Authentication**: Secure login with role selection (HR Admin, Manager, Employee, Site Head)
- **Feature Showcase**: Visual representation of all six governance layers
- **Problem/Solution Messaging**: Clear articulation of legacy pain points vs. REGNIFY benefits

### HR Admin Dashboard
- **Employees Management**: Full CRUD operations for employee records
- **Employee Details**: Comprehensive employee profiles with probation timeline
- **Performance Monitoring**: Aggregate performance metrics across all employees
- **Governance Process**: Monitor the 6-layer governance workflow status
- **Governance Alerts**: Real-time alerts for risk factors and compliance issues
- **Audit Logs**: Complete audit trail with filtering and search capabilities
- **Settings**: Configure governance parameters and thresholds

### Manager Dashboard
- **Team Overview**: Summary of all team members in probation
- **Team Management**: Detailed team member tracking and performance
- **Task Management**: Create, assign, and monitor performance tasks
- **New Task Creation**: Dedicated workflow for creating task assignments
- **Employee Details**: Deep dive into individual employee performance
- **Alerts**: Manager-specific alerts and escalations

### Employee Dashboard
- **Probation Status**: Current probation timeline and milestones
- **Performance Overview**: Personal performance metrics and trends
- **Task Management**: View assigned tasks with due dates and status
- **Task Details**: Detailed view with progress tracking and notes
- **Communication**: Messages from management and HR
- **Personal Profile**: View and update personal information
- **Performance Analytics**: Historical performance data and trends

### Site Head / Executive Dashboard
- **Executive Summary**: High-level compliance and performance KPIs
- **Pending Decisions**: Queue of employee progression decisions requiring approval
- **Employee Review**: Detailed review interface for making final probation decisions
- **Performance Analytics**: Advanced analytics with multiple dimensions
- **Site Insights**: Aggregate insights across the entire organization

## Backend Architecture

### Core API Endpoints

#### Employee Management
- `POST /api/employees` – Create new employee records
- `GET /api/employees` – List all employees (with filtering)
- `GET /api/employees/:id` – Get specific employee details
- `PUT /api/employees/:id` – Update employee information

#### Performance Metrics
- `GET /api/employee-performance` – Retrieve all performance metrics
- `GET /api/employee-performance/:employeeEmail` – Get specific employee performance
- `POST /api/employee-performance` – Create/update performance records
- Real-time metrics synchronization with task and attendance data

#### Digital Signatures
- `GET /api/signatures/:hrId` – Retrieve signatures for HR ID
- `POST /api/signatures/upload` – Upload new signature file
- `POST /api/signatures/revoke` – Revoke existing signature
- Cryptographic verification and PDF embedding

#### Document Audit
- `POST /api/document-audit` – Create audit trail entry
- Immutable records with hash verification
- Compliance-ready reporting

#### System Health
- `GET /api/health` – Health check endpoint

### Backend Technology Stack

**Framework & Runtime**:
- Express.js for RESTful API server
- Node.js with ES modules support

**Database**:
- MongoDB for document storage
- Mongoose ODM for schema management and validation
- Multiple collections for segregated data:
  - `employees` – Employee master data
  - `metrics_one` – Primary performance metrics
  - `metrics_1` – Legacy/Atlas metrics for migration
  - `signatures` – Digital signatures storage
  - `document_audit` – Immutable audit logs
  - `Employee_performance` – Aggregated performance data

**Authentication & Security**:
- Firebase Admin SDK for secure authentication
- SHA-256 hashing for passwords and audit hashes
- JWT token validation on protected endpoints
- Role-based access control (RBAC)

**Integration Services**:
- Nodemailer for email notifications
- node-signpdf for digital PDF signing
- Firebase Admin for authentication verification

**Data Processing**:
- Crypto module for SHA-256 hashing
- Body-parser middleware for request parsing
- CORS middleware for cross-origin requests

### Performance Metrics Calculation

The system calculates comprehensive performance metrics including:
- **Task Completion Ratio** – Percentage of completed vs. assigned tasks
- **Average Delay Days** – Average task completion time variance
- **Attendance Percentage** – On-time attendance and availability
- **Escalation Count** – Number of escalated issues
- **Warning Count** – Count of formal warnings issued
- **Manager Rating** – Manager-provided performance rating
- **Performance Trend** – Upward/downward trend analysis
- **Task Consistency** – Consistency of task completion patterns

### Data Integrity & Audit

- All critical operations logged with SHA-256 hash verification
- Immutable audit trail for compliance
- Timestamp tracking for all modifications
- Actor identification (who made the change)
- Change descriptions and justification

## Database Schema & Collections

### Employees Collection
Stores core employee information:
- Personal details (name, email, phone)
- Employment details (department, manager, hire date)
- Probation timeline and milestones
- Status tracking

### Metrics Collections
Maintains real-time performance indicators:
- Task-based metrics (completion, delay)
- Attendance tracking
- Escalation and warning counts
- Manager ratings
- Performance trends

### Signatures Collection
Manages digital signature data:
- Signature file storage references
- HR ID associations
- Signature status (active/revoked)
- Timestamp information

### Document Audit Collection
Immutable compliance and audit records:
- Audit event descriptions
- SHA-256 hash verification
- Timestamp and actor information
- Document references
- Action type classification

## Frontend Technology Stack

**Core Framework**:
- React 18 with functional components and hooks
- TypeScript for type safety
- Vite for ultra-fast builds and HMR
- React Router for client-side routing

**UI Components & Styling**:
- shadcn-ui component library
- Radix-ui for accessible base components
- Tailwind CSS for utility-first styling
- 25+ pre-built UI components
- Dark mode support with next-themes

**State Management & Data Fetching**:
- React Query (TanStack Query) for server state management
- React Hook Form for complex form handling
- Zod for schema validation
- Context API for authentication state

**Data Visualization**:
- Recharts for interactive performance charts
- Multiple chart types for metrics visualization
- Real-time data updates

**Utilities & Libraries**:
- date-fns for date manipulation
- lucide-react for icons
- class-variance-authority for component variants
- embla-carousel-react for carousels
- input-otp for OTP handling
- sonner for toast notifications
- firebase for client-side authentication

**Development Tools**:
- ESLint for code quality
- Vitest for unit testing
- Testing Library for React components
- JSDOM for DOM testing

## Authentication Flow

1. **Login Page**: User selects role and enters credentials
2. **Firebase Authentication**: Email/password verification via Firebase
3. **Token Generation**: JWT token issued upon successful authentication
4. **Protected Routes**: Role-based route protection ensures access control
5. **Role-Based Redirects**: User directed to appropriate dashboard based on role
6. **Session Management**: Token validation on every protected API request

## Integration Capabilities

### n8n Workflow Integration
The platform supports integration with n8n for advanced automation:
- Automated signature fetching and processing
- PDF document embedding and modification
- Document hashing for integrity verification
- Automatic audit trail persistence
- Workflow trigger points for probation milestones

**Integration Reference**: See `docs/n8n_signature_workflow.md`

## Key Business Features

### Risk Intelligence
- Predictive risk scoring based on multiple factors
- Early warning system for at-risk employees
- Anomaly detection across performance dimensions
- Automated escalation for critical issues

### Compliance Management
- Tamper-proof audit trails
- Regulatory compliance reporting
- Digital signature verification
- Policy acknowledgment tracking

### Task Management
- Granular task assignment and tracking
- Task completion monitoring
- Performance-based task metrics
- Escalation workflows for overdue tasks

### Communication
- Multi-directional messaging between roles
- Notification system for alerts and updates
- Alert aggregation and prioritization
- Escalation path communication

### Analytics & Reporting
- Real-time performance dashboards
- Trend analysis over time
- Site-wide compliance metrics
- Executive summary reports
- Audit report generation

## Project Statistics

- **Primary Language**: TypeScript
- **Frontend Build Tool**: Vite
- **Database**: MongoDB
- **Backend Server**: Express.js
- **Authentication**: Firebase
- **Repository Size**: ~10.8 MB
- **Created**: 23 days ago (February 2026)
- **Last Updated**: March 12, 2026

