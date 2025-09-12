# EXCON Dashboard - Project Background

## Project Overview

The **EXCON Dashboard** is a comprehensive emergency exercise control system designed to support emergency management professionals in conducting, monitoring, and managing emergency exercises. Built with modern web technologies (Next.js, React, TypeScript), it provides real-time exercise control capabilities that follow established emergency management standards.

## Purpose & Mission

### Core Mission
To provide emergency management professionals with a powerful, intuitive digital platform for conducting realistic emergency exercises that improve preparedness, response capabilities, and coordination between agencies.

### Key Objectives
- **Exercise Control**: Centralized command and control for exercise coordinators
- **Real-time Monitoring**: Live tracking of exercise progression and participant responses
- **Resource Management**: Dynamic allocation and tracking of emergency resources
- **Documentation**: Comprehensive exercise recording for post-exercise analysis
- **Standards Compliance**: Adherence to established emergency management frameworks
= **Exercise administration**: Loading and saving of existing exercises, allowing the editing and saving of exercises.

## Target Users

### Primary Users
- **Exercise Controllers**: Lead coordinators managing the overall exercise
- **Exercise Directors**: Senior officials overseeing exercise strategy and outcomes
- **Scenario Managers**: Personnel responsible for inject timing and scenario progression
- **Observer/Evaluators**: Officials documenting exercise performance and lessons learned

### Secondary Users
- **Emergency Managers**: Planning and conducting training exercises
- **Training Coordinators**: Developing exercise curricula and scenarios
- **Agency Representatives**: Participating in multi-agency exercises

## Standards & Compliance

### AIDR Framework
The dashboard is designed around the **Australian Institute for Disaster Resilience (AIDR)** emergency exercise standards, which emphasize:
- Structured exercise planning and execution
- Clear roles and responsibilities
- Progressive complexity in exercise scenarios
- Comprehensive evaluation and improvement processes
- These documents for exercising are located in the folder called support docs, they outline how an exercise should run and to what standard.

### International Best Practices
- Australia uses the AIIMS system - Australian Interservice Incident Management System. 

## Core Functionality

### Exercise Management
- **Exercise Configuration**: Set up exercise parameters, objectives, and scope
- **Scenario Development**: Create realistic emergency scenarios with multiple phases
- **Participant Management**: Organize and track exercise participants and their roles

### Real-time Operations
- **Exercise Timer**: Precise timing control with pause/resume capabilities
- **Inject Management**: Timed delivery of scenario information to participants
- **Resource Tracking**: Monitor emergency resource requests, deployment, and status
- **Communication Logs**: Track all exercise communications and decisions.

### Timeline & Visualization
- **Interactive Timeline**: Visual representation of exercise events and milestones
- **Resource Visualization**: Real-time display of resource allocation and movement
- **Progress Tracking**: Monitor exercise objectives and participant responses

### Data Management
- **Import/Export**: Bulk loading of scenarios, injects, and resources from spreadsheets
- **Documentation**: Automatic logging of all exercise events and decisions
- **Reporting**: Generate exercise reports and performance metrics

## Technical Architecture

### Technology Stack
- **Framework**: Next.js 15.5.0 with React 19.1.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS 4.0 with dark theme optimization
- **Data Processing**: XLSX library for spreadsheet import/export
- **Build System**: Turbopack for fast development builds

### Architecture Principles
- **Component-Based Design**: Modular, reusable React components
- **Type Safety**: Complete TypeScript coverage for reliability
- **Performance Optimization**: React.memo and efficient re-render patterns
- **Accessibility**: WCAG-compliant interface for all users
- **Responsive Design**: Mobile-friendly interface for field operations

### Quality Standards
- **Modern React Patterns**: Hooks, functional components, proper state management
- **Clean Code**: Single responsibility principle, clear separation of concerns
- **Maintainability**: Each component under 200 lines, focused functionality
- **Testing Ready**: Component isolation enables comprehensive testing
- **Documentation**: Self-documenting code with clear interfaces

## Documentation and build out.
- **plan.md - contains all of the plan to complete the project, it will contain the phases and sub-phases of each part of the project, it should be read and updated along the way with check lists on current status checked along the way. This ensures we can pickup and start the project at any time. The plan will also include testing of each phase before moving on to ensure it works as intended.
- **error.log - all errors will be recorded here for future fixing.
- **task.log - all completed tasks will be added to this log for tracking purposes.
- **projectbackground.md contains the background briefing. 


## Use Cases & Scenarios

### Emergency Exercise Types
- **Tabletop Exercises**: Discussion-based scenarios for decision-making practice
- **Functional Exercises**: Operational coordination without actual resource deployment
- **Full-Scale Exercises**: Comprehensive simulations with actual resource mobilization
- **Multi-Agency Drills**: Coordination exercises between different organizations

### Typical Exercise Flow
1. **Pre-Exercise Setup**: Configure exercise parameters and load scenario data
2. **Exercise Initiation**: Start timer and begin inject sequence
3. **Scenario Progression**: Deliver timed injects and track participant responses
4. **Resource Management**: Handle resource requests and coordinate deployments
5. **Real-time Monitoring**: Track exercise progress and participant performance
6. **Exercise Conclusion**: Wrap up operations and begin evaluation process
7. **Post-Exercise Analysis**: Generate reports and conduct lessons learned sessions

## Business Value

### For Emergency Management Agencies
- **Improved Preparedness**: Regular, realistic training enhances response capabilities
- **Cost Efficiency**: Digital platform reduces exercise coordination overhead
- **Better Documentation**: Comprehensive logging supports improvement processes
- **Standards Compliance**: Ensures exercises meet regulatory requirements

### For Exercise Participants
- **Realistic Training**: Immersive scenarios that mirror real emergencies
- **Clear Communication**: Structured inject delivery and resource coordination
- **Performance Feedback**: Detailed exercise documentation for learning
- **Multi-Agency Coordination**: Practice working across organizational boundaries

### For the Emergency Management Community
- **Best Practices**: Platform embodies established emergency exercise methodologies
- **Scalability**: Suitable for exercises of varying size and complexity
- **Flexibility**: Adaptable to different emergency types and scenarios
- **Innovation**: Modern web platform brings emergency training into the digital age

## Future Vision

The EXCON Dashboard represents the foundation for a comprehensive emergency exercise ecosystem. Future development will expand capabilities while maintaining the core focus on practical, effective emergency management training that saves lives and protects communities.

---

*This document provides the strategic context and background for the EXCON Dashboard project, informing all development decisions and feature priorities.*