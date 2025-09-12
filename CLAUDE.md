# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The EXCON Dashboard is an emergency exercise control system for emergency management professionals. It follows Australian Institute for Disaster Resilience (AIDR) standards and provides real-time exercise control, inject management, resource tracking, and timeline visualization.

**Recently Refactored**: The project was transformed from a 2,312-line monolithic file to a modular component-based architecture with 16 focused components.

**Current Phase**: Phase 1 (Architecture Refactoring) complete. Phase 2 focuses on core feature enhancements including user experience improvements, exercise templates, mobile optimization, and testing framework implementation.

## Development Commands

```bash
# Development server (with Turbopack for fast builds)
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting (basic ESLint)
npm run lint
```

**Main Dashboard**: Access at `http://localhost:3000/dashboard`

## Architecture Overview

### Core Domain Concepts

**Exercise Management**: Emergency exercises have three main entities:
- **Injects**: Timed scenario information delivered to participants (5 types: in-person, radio/phone, electronic, map inject, other)
- **Resources**: Emergency resources with ETA tracking (5 status states: requested, tasked, enroute, arrived, cancelled) 
- **Timeline**: Visual representation with automatic stacking for simultaneous events

**State Management**: All state is managed in the main Dashboard component using React hooks. No external state management library is used.

### Component Architecture

```
app/dashboard/page.tsx (384 lines) - Main dashboard with all state management
├── components/exercise/ - Exercise configuration
├── components/dashboard/ - Timer, resources, inject management
├── components/timeline/ - Timeline visualization with complex stacking logic
├── components/forms/ - Add inject/resource forms
├── components/modals/ - Import functionality with XLSX processing
├── components/shared/types.ts - Complete TypeScript definitions
└── utils/ - Time formatting, validation, import/export, styling
```

### Key Technical Patterns

**Component Optimization**: All components use `React.memo()` and `useCallback()` for performance. This is critical due to frequent timer updates.

**Time Management**: All times stored as seconds (number), displayed as HH:MM:SS. Core utilities in `timeUtils.ts`.

**Data Processing**: XLSX import/export with validation, duplicate detection, and error handling in `importExportUtils.ts`.

**TypeScript**: Strict typing throughout. Key types in `components/shared/types.ts`:
- `InjectItem` - Scenario information with due times
- `ResourceItem` - Emergency resources with ETA tracking  
- `FilterState` - Complex filtering for timeline visibility

### Timeline Component Complexity

The Timeline component (`timeline/Timeline.tsx`) contains sophisticated event stacking logic:
- Groups simultaneous events at same time points
- Calculates visual positioning to prevent overlaps  
- Handles real-time current time indicator
- Manages comprehensive filtering system

## Import/Export System

**Template Downloads**: System generates CSV/Excel templates for bulk data entry.

**File Processing**: Supports CSV and Excel with flexible column mapping (normalizes headers to find "title", "duetime", "eta" etc.).

**Validation**: Comprehensive validation with user-friendly error messages showing specific row/column issues.

## Component State Patterns

**Auto-Updates**: Timer drives automatic state updates:
- Injects transition from "pending" → "missed" when due time passes
- Resources transition from "enroute" → "arrived" when ETA reached

**Status Transitions**: Controlled state machines for inject and resource status changes with validation in `validation.ts`.

## Emergency Exercise Domain

**AIDR Compliance**: Features align with emergency management standards including inject timing, resource coordination, and exercise documentation.

**Exercise Flow**: 
1. Configure exercise parameters
2. Start timer and begin inject sequence  
3. Track resource requests and deployments
4. Monitor via timeline visualization
5. Export exercise data for post-analysis

**Multi-Agency Focus**: Designed for coordination between different emergency organizations with clear communication tracking (to/from fields).

## Development Notes

**No Test Framework**: Project currently has no test setup. When adding tests, consider Jest + React Testing Library.

**Styling**: Uses Tailwind CSS 4.0 with dark theme. Utility functions in `styleUtils.ts` for consistent status colors.

**Performance**: Timer updates every second, so all components are heavily optimized with memoization.

**TypeScript**: Uses strict mode. All components have full type coverage.

## File Import Templates

The system provides template downloads for:
- **Injects Template**: Title, DueTime (HH:MM:SS), Type, To, From
- **Resources Template**: Label, ETA (minutes), Status