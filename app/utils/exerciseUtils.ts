// Exercise management utilities for save/load and templates
import type { InjectItem, ResourceItem, ExerciseInfo } from '../components/shared/types'
import { logTaskCompleted, logError, logInfo } from './loggingUtils'

export interface ExerciseData {
  id: string
  name: string
  controllerName: string
  finishTime: string
  injects: InjectItem[]
  resources: ResourceItem[]
  currentSeconds: number
  isRunning: boolean
  createdAt: string
  lastModified: string
  description?: string
}

export interface ExerciseTemplate {
  id: string
  name: string
  description: string
  injects: Omit<InjectItem, 'id' | 'status'>[]
  resources: Omit<ResourceItem, 'id' | 'status' | 'etaSeconds'>[]
  defaultFinishTime: string
  createdAt: string
  category?: string
}

class ExerciseManager {
  private readonly STORAGE_KEY = 'excon_exercises'
  private readonly TEMPLATES_KEY = 'excon_templates'

  // Exercise Save/Load Operations
  saveExercise(exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'lastModified'>): string {
    try {
      const exercise: ExerciseData = {
        ...exerciseData,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }

      const exercises = this.getAllExercises()
      exercises.push(exercise)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(exercises))

      logTaskCompleted('Exercise Save', `Saved exercise: ${exercise.name}`)
      logInfo('ExerciseManager', `Exercise saved with ID: ${exercise.id}`)
      
      return exercise.id
    } catch (error) {
      logError('ExerciseManager', 'Failed to save exercise', error as Error)
      throw new Error('Failed to save exercise')
    }
  }

  loadExercise(exerciseId: string): ExerciseData | null {
    try {
      const exercises = this.getAllExercises()
      const exercise = exercises.find(ex => ex.id === exerciseId)
      
      if (exercise) {
        logInfo('ExerciseManager', `Exercise loaded: ${exercise.name}`)
        return exercise
      } else {
        logError('ExerciseManager', `Exercise not found: ${exerciseId}`)
        return null
      }
    } catch (error) {
      logError('ExerciseManager', 'Failed to load exercise', error as Error)
      return null
    }
  }

  updateExercise(exerciseId: string, updates: Partial<ExerciseData>): boolean {
    try {
      const exercises = this.getAllExercises()
      const index = exercises.findIndex(ex => ex.id === exerciseId)
      
      if (index === -1) {
        logError('ExerciseManager', `Cannot update: Exercise not found: ${exerciseId}`)
        return false
      }

      exercises[index] = {
        ...exercises[index],
        ...updates,
        lastModified: new Date().toISOString()
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(exercises))
      logTaskCompleted('Exercise Update', `Updated exercise: ${exercises[index].name}`)
      return true
    } catch (error) {
      logError('ExerciseManager', 'Failed to update exercise', error as Error)
      return false
    }
  }

  deleteExercise(exerciseId: string): boolean {
    try {
      const exercises = this.getAllExercises()
      const filteredExercises = exercises.filter(ex => ex.id !== exerciseId)
      
      if (filteredExercises.length === exercises.length) {
        logError('ExerciseManager', `Cannot delete: Exercise not found: ${exerciseId}`)
        return false
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredExercises))
      logTaskCompleted('Exercise Delete', `Deleted exercise: ${exerciseId}`)
      return true
    } catch (error) {
      logError('ExerciseManager', 'Failed to delete exercise', error as Error)
      return false
    }
  }

  getAllExercises(): ExerciseData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      logError('ExerciseManager', 'Failed to get exercises', error as Error)
      return []
    }
  }

  // Template Operations
  saveTemplate(templateData: Omit<ExerciseTemplate, 'id' | 'createdAt'>): string {
    try {
      const template: ExerciseTemplate = {
        ...templateData,
        id: this.generateId(),
        createdAt: new Date().toISOString()
      }

      const templates = this.getAllTemplates()
      templates.push(template)
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates))

      logTaskCompleted('Template Save', `Saved template: ${template.name}`)
      return template.id
    } catch (error) {
      logError('ExerciseManager', 'Failed to save template', error as Error)
      throw new Error('Failed to save template')
    }
  }

  loadTemplate(templateId: string): ExerciseTemplate | null {
    try {
      const templates = this.getAllTemplates()
      const template = templates.find(t => t.id === templateId)
      
      if (template) {
        logInfo('ExerciseManager', `Template loaded: ${template.name}`)
        return template
      } else {
        logError('ExerciseManager', `Template not found: ${templateId}`)
        return null
      }
    } catch (error) {
      logError('ExerciseManager', 'Failed to load template', error as Error)
      return null
    }
  }

  createExerciseFromTemplate(templateId: string, exerciseName: string): ExerciseData | null {
    try {
      const template = this.loadTemplate(templateId)
      if (!template) return null

      const exercise: ExerciseData = {
        id: this.generateId(),
        name: exerciseName,
        controllerName: '',
        finishTime: template.defaultFinishTime,
        injects: template.injects.map(inject => ({
          ...inject,
          id: this.generateId(),
          status: 'pending' as const
        })),
        resources: template.resources.map(resource => ({
          ...resource,
          id: this.generateId(),
          status: 'requested' as const,
          etaSeconds: 0 // Will be set when resource is requested
        })),
        currentSeconds: 0,
        isRunning: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        description: `Created from template: ${template.name}`
      }

      logTaskCompleted('Exercise from Template', `Created exercise "${exerciseName}" from template "${template.name}"`)
      return exercise
    } catch (error) {
      logError('ExerciseManager', 'Failed to create exercise from template', error as Error)
      return null
    }
  }

  deleteTemplate(templateId: string): boolean {
    try {
      const templates = this.getAllTemplates()
      const filteredTemplates = templates.filter(t => t.id !== templateId)
      
      if (filteredTemplates.length === templates.length) {
        logError('ExerciseManager', `Cannot delete: Template not found: ${templateId}`)
        return false
      }

      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filteredTemplates))
      logTaskCompleted('Template Delete', `Deleted template: ${templateId}`)
      return true
    } catch (error) {
      logError('ExerciseManager', 'Failed to delete template', error as Error)
      return false
    }
  }

  getAllTemplates(): ExerciseTemplate[] {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      logError('ExerciseManager', 'Failed to get templates', error as Error)
      return []
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  exportExercise(exerciseId: string): string | null {
    try {
      const exercise = this.loadExercise(exerciseId)
      if (!exercise) return null

      const exportData = {
        ...exercise,
        exportedAt: new Date().toISOString(),
        version: '2.0'
      }

      logTaskCompleted('Exercise Export', `Exported exercise: ${exercise.name}`)
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      logError('ExerciseManager', 'Failed to export exercise', error as Error)
      return null
    }
  }

  importExercise(jsonData: string): string | null {
    try {
      const exerciseData = JSON.parse(jsonData)
      
      // Validate basic structure
      if (!exerciseData.name || !exerciseData.injects || !exerciseData.resources) {
        throw new Error('Invalid exercise data format')
      }

      // Create new exercise with imported data
      const newExercise: Omit<ExerciseData, 'id' | 'createdAt' | 'lastModified'> = {
        name: exerciseData.name + ' (Imported)',
        controllerName: exerciseData.controllerName || '',
        finishTime: exerciseData.finishTime || '',
        injects: exerciseData.injects,
        resources: exerciseData.resources,
        currentSeconds: 0, // Reset timer for imported exercise
        isRunning: false,
        description: exerciseData.description
      }

      const exerciseId = this.saveExercise(newExercise)
      logTaskCompleted('Exercise Import', `Imported exercise: ${newExercise.name}`)
      return exerciseId
    } catch (error) {
      logError('ExerciseManager', 'Failed to import exercise', error as Error)
      return null
    }
  }

  // Quick access methods for common operations
  getRecentExercises(limit: number = 5): ExerciseData[] {
    const exercises = this.getAllExercises()
    return exercises
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, limit)
  }

  searchExercises(query: string): ExerciseData[] {
    const exercises = this.getAllExercises()
    const lowerQuery = query.toLowerCase()
    
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.controllerName.toLowerCase().includes(lowerQuery) ||
      (exercise.description && exercise.description.toLowerCase().includes(lowerQuery))
    )
  }
}

// Global exercise manager instance
export const exerciseManager = new ExerciseManager()

// Convenience functions
export const saveExercise = (exerciseData: Omit<ExerciseData, 'id' | 'createdAt' | 'lastModified'>) =>
  exerciseManager.saveExercise(exerciseData)

export const loadExercise = (exerciseId: string) =>
  exerciseManager.loadExercise(exerciseId)

export const getAllExercises = () =>
  exerciseManager.getAllExercises()

export const saveTemplate = (templateData: Omit<ExerciseTemplate, 'id' | 'createdAt'>) =>
  exerciseManager.saveTemplate(templateData)

export const loadTemplate = (templateId: string) =>
  exerciseManager.loadTemplate(templateId)

export const getAllTemplates = () =>
  exerciseManager.getAllTemplates()

export const createExerciseFromTemplate = (templateId: string, exerciseName: string) =>
  exerciseManager.createExerciseFromTemplate(templateId, exerciseName)