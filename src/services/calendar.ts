import { Election } from '../types';
import { getCachedAccessToken, connectGoogleCalendar } from './firebase';

interface CalendarEventTime {
  dateTime: string;
  timeZone: string;
}

interface CalendarEvent {
  summary: string;
  description: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides: { method: string; minutes: number }[];
  };
}

// Check if an election is already in the user's primary Google Calendar
export async function checkElectionInCalendar(election: Election): Promise<string | null> {
  let token = getCachedAccessToken();
  if (!token) {
    return null; // Missing token, can't check
  }

  try {
    const q = encodeURIComponent(`VoteSecure: ${election.title}`);
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      // Token might be expired
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const existing = data.items?.find((item: any) => item.summary === `🗳️ VoteSecure: ${election.title}`);
    return existing ? existing.id : null;
  } catch (err) {
    console.error('Failed to check calendar events:', err);
    return null;
  }
}

// Add an election to the user's Google Calendar
export async function addElectionToCalendar(election: Election, appUrl: string): Promise<any> {
  let token = getCachedAccessToken();
  if (!token) {
    // Attempt to authenticate and obtain token
    token = await connectGoogleCalendar();
  }

  // Double check
  if (!token) {
    throw new Error('Authentication with Google Calendar failed.');
  }

  // Construct precise calendar event
  const url = appUrl || window.location.origin;
  const event: CalendarEvent = {
    summary: `🗳️ VoteSecure: ${election.title}`,
    description: `VoteSecure Online Voting System\n\nElection description:\n${election.description}\n\nInstitution: ${election.institutionId}\nClick here to securely cast your vote: ${url}\n\nYour identity and vote are protected via Zero-Knowledge Proofs.`,
    start: {
      dateTime: election.startDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },
    end: {
      dateTime: election.endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },
    location: 'VoteSecure Portal',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },   // 1 hour before
        { method: 'popup', minutes: 15 }    // 15 mins before
      ]
    }
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error('Google Calendar API Error:', errData);
    if (res.status === 401) {
      // Token might have expired during session, trigger reconnect
      const newToken = await connectGoogleCalendar();
      return addElectionToCalendar(election, appUrl);
    }
    throw new Error(errData?.error?.message || 'Failed to add event to Google Calendar.');
  }

  return res.json();
}

// Remove an election event from the user's primary Google Calendar
export async function removeElectionFromCalendar(eventId: string): Promise<void> {
  let token = getCachedAccessToken();
  if (!token) {
    token = await connectGoogleCalendar();
  }

  if (!token) {
    throw new Error('Authentication with Google Calendar failed.');
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      await connectGoogleCalendar();
      return removeElectionFromCalendar(eventId);
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Failed to remove event from Google Calendar.');
  }
}
