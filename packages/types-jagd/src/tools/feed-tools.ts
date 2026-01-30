export interface PublishPostArgs {
  postType: 'sighting' | 'story' | 'strecke' | 'invite' | 'lesson';
  title?: string;
  content: string;
  photos?: string[];
  tags?: string[];
  timeDelayHours?: number;
}

export interface PostDraft {
  id: string;
  postType: string;
  title?: string;
  content: string;
  photos: string[];
  tags: string[];
  moderationStatus: 'pending' | 'approved' | 'redacted' | 'rejected';
}
