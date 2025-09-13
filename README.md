# EXCON Dashboard

A comprehensive emergency exercise control system designed to support emergency management professionals in conducting, monitoring, and managing emergency exercises. Built with modern web technologies (Next.js, React, TypeScript) and following established emergency management standards.

## Overview

The EXCON Dashboard provides real-time exercise control capabilities including:
- **Exercise Timer Control**: Precision timing with pause/resume capabilities
- **Inject Management**: Timed delivery of scenario information to participants
- **Resource Tracking**: Monitor emergency resource requests, deployment, and status
- **Interactive Timeline**: Visual representation of exercise events and milestones
- **Import/Export**: Bulk loading of scenarios and resources from spreadsheets
- **Real-time Documentation**: Automatic logging of all exercise events

## Technology Stack

- **Framework**: Next.js 15.5.0 with React 19.1.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 4.0 with dark theme optimization
- **Data Processing**: XLSX library for spreadsheet import/export
- **Build System**: Turbopack for fast development builds

## Architecture

The project follows a modern component-based architecture:

```
app/
 dashboard/page.tsx          # Main dashboard (384 lines, refactored from 2,312)
 components/
    exercise/               # Exercise management components
       ExerciseHeader.tsx
       ExerciseOverview.tsx
    dashboard/              # Dashboard widgets
       TimerControls.tsx
       ResourceRequestBoard.tsx
       InjectList.tsx
    timeline/               # Timeline visualization
       Timeline.tsx
       TimelineFilterBar.tsx
    forms/                  # Data entry forms
       AddInjectForm.tsx
       AddResourceForm.tsx
    modals/                 # Import/export modals
       ImportInjectsModal.tsx
       ImportResourcesModal.tsx
    shared/
        types.ts            # TypeScript type definitions
 utils/                      # Utility libraries
     timeUtils.ts           # Time formatting and parsing
     styleUtils.ts          # Component styling helpers
     validation.ts          # Data validation utilities
     importExportUtils.ts   # Spreadsheet processing
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to access the EXCON Dashboard.

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Features

### Exercise Management
- Configure exercise parameters and objectives
- Set exercise finish times and milestones
- Real-time exercise overview display

### Timeline Visualization
- Interactive timeline showing all exercise events
- Visual stacking of simultaneous events
- Comprehensive filtering system
- Real-time progress tracking

### Inject System
- Timed delivery of scenario information
- Multiple inject types (radio/phone, in-person, electronic, map inject)
- Automatic status tracking (pending, completed, missed, skipped)
- Bulk import from CSV/Excel files

### Resource Management
- Track emergency resource requests and deployment
- Multiple status states (requested, tasked, enroute, arrived, cancelled)
- ETA calculation and automatic arrival detection
- Visual status indicators with color coding

### Data Import/Export
- Template download for structured data entry
- CSV and Excel file support
- Data validation with error reporting
- Duplicate detection and handling
- Preview functionality before import

## Standards Compliance

The dashboard is designed around the **Australian Institute for Disaster Resilience (AIDR)** emergency exercise standards and incorporates international best practices including:
- FEMA Exercise Evaluation Methodology (EEM)
- Multi-Agency Coordination (MAC) principles
- Incident Command System (ICS) integration
- Emergency Support Functions (ESF) alignment

## Project Status

**Phase 1: Architecture Refactoring  COMPLETED**

Successfully transformed from a monolithic 2,312-line file into a modern, maintainable React application with:
- 16 focused components with single responsibilities
- 100% TypeScript coverage with strict type checking
- Performance optimization with React.memo and useCallback
- Enterprise-ready code quality and organization

**Phase 2: Core Feature Enhancement** - Ready to Begin

See `plan.md` for detailed Phase 2 roadmap including user experience improvements, exercise management features, enhanced data handling, and mobile optimization.

## Documentation

- `projectbackground.md` - Comprehensive project overview and context
- `plan.md` - Development roadmap and feature planning

## Contributing

The EXCON Dashboard follows established emergency management methodologies and is designed for scalability and extensibility. All contributions should maintain the focus on practical, effective emergency management training.

## License

Private project for emergency management professional use.

## Icon Strategy

Default icons are inline SVGs for clarity and performance. Set `NEXT_PUBLIC_ICON_MODE=ascii` to force ASCII labels. All icons come from `app/utils/iconHelpers.tsx`.
 - Inject types: person, phone, envelope, map, dot
 - Resource types: truck, ambulance, helicopter, police, fire, medical, generic
 - Resource status: shown as a colored ring around the icon

## Environment Variables

- `NEXT_PUBLIC_ICON_MODE`: `svg` (default) or `ascii` to switch icon rendering.

## Persistence

Session state (exercise info, timer, injects, resources) persists to `localStorage`. A restore banner appears on load if a previous session is found. Use Export/Import Session buttons on the Dashboard to backup or load JSON.

## How To Test

- Lint: `npm run lint`
- Build: `npm run build`
- Run: `npm run dev` then open `/dashboard`
- Suggested tests (to add): time parsing/formatting utils, validation, and key component render tests.

## Known Limitations

- No automated test suite yet; see suggestions above.
- Resource type is inferred from label if `kind` is not provided.
- Persistence uses browser `localStorage` (cleared by browser policies/private mode).

## References

- Support documents: see `support docs/` for AIDR-aligned materials.
- Contributor guide: see `AGENTS.md` for project conventions.


