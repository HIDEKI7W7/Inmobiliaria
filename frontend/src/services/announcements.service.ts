import { apiClient } from './api.client';

export interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  content: string; // JSON string containing cierre and reglas text
  isActive: boolean;
}

export const announcementsService = {
  async getLatestAnnouncement(): Promise<Announcement | null> {
    try {
      const response = await apiClient.get<Announcement>('/announcements/latest');
      return response;
    } catch (error) {
      console.warn('API de backend inalcanzable o error al cargar el comunicado. Usando fallbacks.');
      return null;
    }
  },

  async saveAnnouncement(
    data: { id?: string; title: string; subtitle: string; content: string; isActive: boolean },
    token: string
  ): Promise<Announcement> {
    const response = await apiClient.postWithAuth<Announcement>(
      '/announcements',
      data,
      token
    );
    return response;
  }
};
