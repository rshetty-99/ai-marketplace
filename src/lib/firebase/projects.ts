// Project Management System
// Firebase CRUD operations for projects

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase-config';

export interface Project {
  id?: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP';
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
    startDate?: Date;
    deadline?: Date;
  };
  skills: string[];
  experience: 'entry' | 'intermediate' | 'expert';
  requirements: string[];
  deliverables: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  status: 'draft' | 'published' | 'in_review' | 'active' | 'completed' | 'cancelled';
  visibility: 'public' | 'invite_only' | 'private';
  customer: {
    id: string;
    name: string;
    company?: string;
    avatar?: string;
  };
  assignee?: {
    id: string;
    name: string;
    type: 'freelancer' | 'vendor';
    avatar?: string;
  };
  proposals: number;
  views: number;
  savedBy: string[];
  milestones?: {
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid';
  }[];
  tags: string[];
  location?: {
    type: 'remote' | 'onsite' | 'hybrid';
    country?: string;
    city?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  completedAt?: Date;
}

export interface ProjectFilters {
  category?: string;
  subcategory?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  experience?: 'entry' | 'intermediate' | 'expert';
  skills?: string[];
  location?: 'remote' | 'onsite' | 'hybrid';
  customerId?: string;
  assigneeId?: string;
  status?: Project['status'];
  searchTerm?: string;
}

export interface ProjectSearchResult {
  projects: Project[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  total?: number;
}

const PROJECTS_COLLECTION = 'projects';

// Create a new project
export async function createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date();
    const project: Omit<Project, 'id'> = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
      proposals: 0,
      views: 0,
      savedBy: []
    };

    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...project,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt),
      publishedAt: project.publishedAt ? Timestamp.fromDate(project.publishedAt) : null,
      completedAt: project.completedAt ? Timestamp.fromDate(project.completedAt) : null,
      timeline: {
        ...project.timeline,
        startDate: project.timeline.startDate ? Timestamp.fromDate(project.timeline.startDate) : null,
        deadline: project.timeline.deadline ? Timestamp.fromDate(project.timeline.deadline) : null
      },
      milestones: project.milestones?.map(milestone => ({
        ...milestone,
        dueDate: Timestamp.fromDate(milestone.dueDate)
      }))
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

// Get a project by ID
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        timeline: {
          ...data.timeline,
          startDate: data.timeline?.startDate?.toDate(),
          deadline: data.timeline?.deadline?.toDate()
        },
        milestones: data.milestones?.map((milestone: any) => ({
          ...milestone,
          dueDate: milestone.dueDate?.toDate() || new Date()
        }))
      } as Project;
    }

    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw new Error('Failed to get project');
  }
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Convert Date objects to Timestamps
    if (updates.publishedAt) {
      updateData.publishedAt = Timestamp.fromDate(updates.publishedAt);
    }
    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    if (updates.timeline) {
      updateData.timeline = {
        ...updates.timeline,
        startDate: updates.timeline.startDate ? Timestamp.fromDate(updates.timeline.startDate) : null,
        deadline: updates.timeline.deadline ? Timestamp.fromDate(updates.timeline.deadline) : null
      };
    }
    if (updates.milestones) {
      updateData.milestones = updates.milestones.map(milestone => ({
        ...milestone,
        dueDate: Timestamp.fromDate(milestone.dueDate)
      }));
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

// Search and filter projects
export async function searchProjects(
  filters: ProjectFilters = {},
  pageSize: number = 20,
  lastDocument?: DocumentSnapshot
): Promise<ProjectSearchResult> {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters.subcategory) {
      constraints.push(where('subcategory', '==', filters.subcategory));
    }
    if (filters.customerId) {
      constraints.push(where('customer.id', '==', filters.customerId));
    }
    if (filters.assigneeId) {
      constraints.push(where('assignee.id', '==', filters.assigneeId));
    }
    if (filters.experience) {
      constraints.push(where('experience', '==', filters.experience));
    }
    if (filters.budgetType) {
      constraints.push(where('budget.type', '==', filters.budgetType));
    }
    if (filters.location) {
      constraints.push(where('location.type', '==', filters.location));
    }
    if (filters.skills && filters.skills.length > 0) {
      constraints.push(where('skills', 'array-contains-any', filters.skills));
    }

    // Add ordering
    constraints.push(orderBy('createdAt', 'desc'));

    // Add pagination
    constraints.push(limit(pageSize));
    if (lastDocument) {
      constraints.push(startAfter(lastDocument));
    }

    const q = query(collection(db, PROJECTS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    const projects: Project[] = [];
    let lastDoc: DocumentSnapshot | undefined;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        timeline: {
          ...data.timeline,
          startDate: data.timeline?.startDate?.toDate(),
          deadline: data.timeline?.deadline?.toDate()
        },
        milestones: data.milestones?.map((milestone: any) => ({
          ...milestone,
          dueDate: milestone.dueDate?.toDate() || new Date()
        }))
      } as Project);
      lastDoc = doc;
    });

    return {
      projects,
      hasMore: projects.length === pageSize,
      lastDoc
    };
  } catch (error) {
    console.error('Error searching projects:', error);
    throw new Error('Failed to search projects');
  }
}

// Get projects by customer
export async function getCustomerProjects(
  customerId: string,
  status?: Project['status']
): Promise<Project[]> {
  const filters: ProjectFilters = { customerId };
  if (status) {
    filters.status = status;
  }
  
  const result = await searchProjects(filters, 100);
  return result.projects;
}

// Get projects by assignee (freelancer or vendor)
export async function getAssigneeProjects(
  assigneeId: string,
  status?: Project['status']
): Promise<Project[]> {
  const filters: ProjectFilters = { assigneeId };
  if (status) {
    filters.status = status;
  }
  
  const result = await searchProjects(filters, 100);
  return result.projects;
}

// Publish a project
export async function publishProject(projectId: string): Promise<void> {
  await updateProject(projectId, {
    status: 'published',
    publishedAt: new Date()
  });
}

// Assign project to freelancer/vendor
export async function assignProject(
  projectId: string,
  assignee: Project['assignee']
): Promise<void> {
  await updateProject(projectId, {
    assignee,
    status: 'active'
  });
}

// Complete a project
export async function completeProject(projectId: string): Promise<void> {
  await updateProject(projectId, {
    status: 'completed',
    completedAt: new Date()
  });
}

// Save/unsave project for user
export async function toggleProjectSave(projectId: string, userId: string): Promise<void> {
  try {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const savedBy = project.savedBy || [];
    const isSaved = savedBy.includes(userId);

    if (isSaved) {
      // Remove user from saved list
      await updateProject(projectId, {
        savedBy: savedBy.filter(id => id !== userId)
      });
    } else {
      // Add user to saved list
      await updateProject(projectId, {
        savedBy: [...savedBy, userId]
      });
    }
  } catch (error) {
    console.error('Error toggling project save:', error);
    throw new Error('Failed to save/unsave project');
  }
}

// Increment project views
export async function incrementProjectViews(projectId: string): Promise<void> {
  try {
    const project = await getProject(projectId);
    if (project) {
      await updateProject(projectId, {
        views: (project.views || 0) + 1
      });
    }
  } catch (error) {
    console.error('Error incrementing project views:', error);
  }
}

// Get project statistics
export async function getProjectStats(projectId: string) {
  try {
    const project = await getProject(projectId);
    if (!project) return null;

    return {
      views: project.views || 0,
      proposals: project.proposals || 0,
      saved: project.savedBy?.length || 0,
      status: project.status,
      createdAt: project.createdAt,
      publishedAt: project.publishedAt,
      completedAt: project.completedAt
    };
  } catch (error) {
    console.error('Error getting project stats:', error);
    return null;
  }
}