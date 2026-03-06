import { apiClient, ApiError } from './api/client';

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: string;
}

export class TemplatesService {
  async listTemplates(): Promise<Template[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: Template[] }>('/templates');
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to fetch templates');
      }
      throw error;
    }
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    try {
      const response = await apiClient.post<{ success: boolean; data: Template }>('/templates', data);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to create template');
      }
      throw error;
    }
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    try {
      const response = await apiClient.put<{ success: boolean; data: Template }>(`/templates/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to update template');
      }
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`/templates/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Failed to delete template');
      }
      throw error;
    }
  }
}

export const templatesService = new TemplatesService();
