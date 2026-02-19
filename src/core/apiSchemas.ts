
import { z } from 'zod'

// --- Classroom Schemas ---

export const createClassroomSchema = z.object({
    teacherUserId: z.string().cuid(),
    schoolName: z.string().min(2).optional(),
    classroomName: z.string().min(2).max(50),
    grade: z.string().optional(),
})

export const joinClassroomSchema = z.object({
    studentUserId: z.string().cuid(),
    joinCode: z.string().length(6), // Enforce 6-char code
})

export const removeStudentSchema = z.object({
    teacherUserId: z.string().cuid(),
    classroomId: z.string().cuid(),
    studentUserId: z.string().cuid(),
})

// --- Assignment Schemas ---

export const createAssignmentSchema = z.object({
    teacherUserId: z.string().cuid(),
    classroomId: z.string().cuid(),
    title: z.string().min(3).max(100),
    skillId: z.string(),
    mode: z.enum(['PRACTICE', 'MASTERY']),
    targetTier: z.enum(['NOVICE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'MASTER', 'GRANDMASTER']).optional(),
    minMastery: z.number().min(0).max(100).optional(),
    dueAt: z.string().datetime().optional(), // ISO string from frontend
})

export const startAssignmentSchema = z.object({
    studentUserId: z.string().cuid(),
    assignmentId: z.string().cuid(),
})

export const submitAssignmentSchema = z.object({
    studentUserId: z.string().cuid(),
    assignmentId: z.string().cuid(),
    sessionId: z.string().cuid(),
    metrics: z.object({
        questionsAttempted: z.number(),
        correct: z.number(),
        durationMs: z.number(),
    })
})
