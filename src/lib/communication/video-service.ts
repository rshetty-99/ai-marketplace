/**
 * Video Communication Service
 * Integrates with Zoom and Google Meet APIs for video calls
 */

export interface VideoCallSettings {
  duration: number; // in minutes
  password?: string;
  waitingRoom: boolean;
  recording: boolean;
  joinBeforeHost: boolean;
}

export interface VideoCall {
  id: string;
  meetingId: string;
  topic: string;
  startTime: Date;
  duration: number;
  timezone: string;
  joinUrl: string;
  hostUrl: string;
  password?: string;
  provider: 'zoom' | 'google-meet' | 'teams';
  status: 'scheduled' | 'started' | 'ended' | 'cancelled';
  participants: VideoCallParticipant[];
}

export interface VideoCallParticipant {
  id: string;
  email: string;
  name: string;
  role: 'host' | 'participant';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface MeetingRecording {
  id: string;
  meetingId: string;
  downloadUrl: string;
  playUrl: string;
  fileSize: number;
  duration: number;
  recordingStart: Date;
  recordingEnd: Date;
}

/**
 * Zoom Integration Service
 */
export class ZoomService {
  private static readonly BASE_URL = 'https://api.zoom.us/v2';
  private static accessToken: string | null = null;

  /**
   * Get OAuth access token
   */
  private static async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      
      // Token expires in 1 hour, clear it after 50 minutes
      setTimeout(() => {
        this.accessToken = null;
      }, 50 * 60 * 1000);

      return data.access_token;
    } catch (error) {
      throw new Error(`Failed to get Zoom access token: ${error}`);
    }
  }

  /**
   * Create a Zoom meeting
   */
  static async createMeeting(
    hostEmail: string,
    topic: string,
    startTime: Date,
    settings: VideoCallSettings
  ): Promise<VideoCall> {
    try {
      const accessToken = await this.getAccessToken();
      
      const meetingData = {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration: settings.duration,
        timezone: 'UTC',
        password: settings.password,
        settings: {
          host_video: true,
          participant_video: true,
          cn_meeting: false,
          in_meeting: false,
          join_before_host: settings.joinBeforeHost,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          audio: 'both',
          auto_recording: settings.recording ? 'cloud' : 'none',
          waiting_room: settings.waitingRoom
        }
      };

      const response = await fetch(`${this.BASE_URL}/users/${hostEmail}/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }

      const meeting = await response.json();

      return {
        id: meeting.uuid,
        meetingId: meeting.id.toString(),
        topic: meeting.topic,
        startTime: new Date(meeting.start_time),
        duration: meeting.duration,
        timezone: meeting.timezone,
        joinUrl: meeting.join_url,
        hostUrl: meeting.start_url,
        password: meeting.password,
        provider: 'zoom',
        status: 'scheduled',
        participants: []
      };
    } catch (error) {
      throw new Error(`Failed to create Zoom meeting: ${error}`);
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(meetingId: string): Promise<VideoCall> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.BASE_URL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }

      const meeting = await response.json();

      return {
        id: meeting.uuid,
        meetingId: meeting.id.toString(),
        topic: meeting.topic,
        startTime: new Date(meeting.start_time),
        duration: meeting.duration,
        timezone: meeting.timezone,
        joinUrl: meeting.join_url,
        hostUrl: meeting.start_url,
        password: meeting.password,
        provider: 'zoom',
        status: this.getMeetingStatus(meeting.status),
        participants: []
      };
    } catch (error) {
      throw new Error(`Failed to get Zoom meeting: ${error}`);
    }
  }

  /**
   * Delete/Cancel meeting
   */
  static async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.BASE_URL}/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete Zoom meeting: ${error}`);
    }
  }

  /**
   * Get meeting recordings
   */
  static async getMeetingRecordings(meetingId: string): Promise<MeetingRecording[]> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.BASE_URL}/meetings/${meetingId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Zoom API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.recording_files?.map((file: any) => ({
        id: file.id,
        meetingId: data.id.toString(),
        downloadUrl: file.download_url,
        playUrl: file.play_url,
        fileSize: file.file_size,
        duration: data.duration,
        recordingStart: new Date(file.recording_start),
        recordingEnd: new Date(file.recording_end)
      })) || [];
    } catch (error) {
      throw new Error(`Failed to get Zoom recordings: ${error}`);
    }
  }

  private static getMeetingStatus(zoomStatus: string): VideoCall['status'] {
    switch (zoomStatus) {
      case 'waiting': return 'scheduled';
      case 'started': return 'started';
      case 'ended': return 'ended';
      default: return 'scheduled';
    }
  }
}

/**
 * Google Meet Integration Service
 */
export class GoogleMeetService {
  private static readonly CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

  /**
   * Create Google Meet meeting via Calendar API
   */
  static async createMeeting(
    accessToken: string,
    title: string,
    startTime: Date,
    settings: VideoCallSettings,
    attendees: string[] = []
  ): Promise<VideoCall> {
    try {
      const endTime = new Date(startTime.getTime() + settings.duration * 60000);

      const eventData = {
        summary: title,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const event = await response.json();
      const meetLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

      return {
        id: event.id,
        meetingId: event.id,
        topic: event.summary,
        startTime: new Date(event.start.dateTime),
        duration: settings.duration,
        timezone: event.start.timeZone || 'UTC',
        joinUrl: meetLink || '',
        hostUrl: meetLink || '',
        provider: 'google-meet',
        status: 'scheduled',
        participants: attendees.map(email => ({
          id: email,
          email,
          name: email.split('@')[0],
          role: 'participant' as const
        }))
      };
    } catch (error) {
      throw new Error(`Failed to create Google Meet: ${error}`);
    }
  }

  /**
   * Update Google Meet meeting
   */
  static async updateMeeting(
    accessToken: string,
    eventId: string,
    updates: Partial<{
      title: string;
      startTime: Date;
      duration: number;
      attendees: string[];
    }>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.title) {
        updateData.summary = updates.title;
      }

      if (updates.startTime && updates.duration) {
        const endTime = new Date(updates.startTime.getTime() + updates.duration * 60000);
        updateData.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: 'UTC'
        };
        updateData.end = {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        };
      }

      if (updates.attendees) {
        updateData.attendees = updates.attendees.map(email => ({ email }));
      }

      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to update Google Meet: ${error}`);
    }
  }

  /**
   * Delete Google Meet meeting
   */
  static async deleteMeeting(accessToken: string, eventId: string): Promise<void> {
    try {
      const response = await fetch(`${this.CALENDAR_API_URL}/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete Google Meet: ${error}`);
    }
  }
}

/**
 * Unified Video Service
 */
export class VideoService {
  /**
   * Create meeting based on provider preference
   */
  static async createMeeting(
    provider: 'zoom' | 'google-meet',
    hostEmail: string,
    topic: string,
    startTime: Date,
    settings: VideoCallSettings,
    attendees: string[] = [],
    accessToken?: string
  ): Promise<VideoCall> {
    switch (provider) {
      case 'zoom':
        return ZoomService.createMeeting(hostEmail, topic, startTime, settings);
      
      case 'google-meet':
        if (!accessToken) {
          throw new Error('Access token required for Google Meet');
        }
        return GoogleMeetService.createMeeting(accessToken, topic, startTime, settings, attendees);
      
      default:
        throw new Error('Unsupported video provider');
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(provider: 'zoom' | 'google-meet', meetingId: string): Promise<VideoCall> {
    switch (provider) {
      case 'zoom':
        return ZoomService.getMeeting(meetingId);
      
      default:
        throw new Error('Get meeting not implemented for this provider');
    }
  }

  /**
   * Delete meeting
   */
  static async deleteMeeting(
    provider: 'zoom' | 'google-meet', 
    meetingId: string, 
    accessToken?: string
  ): Promise<void> {
    switch (provider) {
      case 'zoom':
        return ZoomService.deleteMeeting(meetingId);
      
      case 'google-meet':
        if (!accessToken) {
          throw new Error('Access token required for Google Meet');
        }
        return GoogleMeetService.deleteMeeting(accessToken, meetingId);
      
      default:
        throw new Error('Delete meeting not implemented for this provider');
    }
  }

  /**
   * Get available time slots for scheduling
   */
  static getAvailableTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    timezone: string = 'UTC'
  ): Date[] {
    const slots: Date[] = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      // Skip weekends and outside business hours (9 AM - 5 PM)
      const day = current.getDay();
      const hour = current.getHours();
      
      if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
        slots.push(new Date(current));
      }
      
      // Increment by 30 minutes
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return slots;
  }
}