'use server';

import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch'; // Required for Microsoft Graph client

interface BusyBlock {
  start: string;
  end: string;
}

export async function getGroupAvailability(
  groupId: string,
  startDate: string,
  endDate: string
): Promise<BusyBlock[]> {
  const supabase = createClient();

  // 1. Fetch group members
  const { data: members, error: memberError } = await supabase
    .from('users_groups')
    .select('user_id')
    .eq('group_id', groupId);

  if (memberError || !members) {
    console.error("Error fetching group members:", memberError);
    return [];
  }
  const userIds = members.map(m => m.user_id);

  // 2. Fetch calendar connections for those members
  const { data: connections, error: connError } = await supabase
    .from('calendar_connections')
    .select('*')
    .in('user_id', userIds);

  if (connError || !connections) {
    console.error("Error fetching calendar connections:", connError);
    return [];
  }

  // 3. Fetch free/busy info in parallel
  const promises = connections.map(conn => {
    if (conn.provider === 'google') {
      return getGoogleFreeBusy(conn, startDate, endDate);
    } else if (conn.provider === 'microsoft') {
      return getMicrosoftFreeBusy(conn, startDate, endDate);
    }
    return Promise.resolve([]);
  });

  const results = await Promise.allSettled(promises);

  let allBusyBlocks: BusyBlock[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allBusyBlocks.push(...result.value);
    } else if (result.status === 'rejected') {
      console.warn("A calendar fetch failed:", result.reason);
    }
  });

  // 4. Merge overlapping intervals
  if (allBusyBlocks.length === 0) return [];

  allBusyBlocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const merged: BusyBlock[] = [allBusyBlocks[0]];
  for (let i = 1; i < allBusyBlocks.length; i++) {
    const last = merged[merged.length - 1];
    const current = allBusyBlocks[i];

    if (new Date(current.start) <= new Date(last.end)) {
      last.end = new Date(current.end) > new Date(last.end) ? current.end : last.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

async function getGoogleFreeBusy(connection: any, timeMin: string, timeMax: string): Promise<BusyBlock[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: decrypt(connection.access_token_encrypted),
    refresh_token: connection.refresh_token_encrypted
      ? decrypt(connection.refresh_token_encrypted)
      : undefined,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: 'primary' }],
    },
  });

  const busyTimes = res.data.calendars?.primary?.busy;
  return busyTimes?.map(b => ({ start: b.start!, end: b.end! })) || [];
}

async function getMicrosoftFreeBusy(connection: any, timeMin: string, timeMax: string): Promise<BusyBlock[]> {
  const accessToken = decrypt(connection.access_token_encrypted);
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  const scheduleInformation = await client.api('/me/calendar/getSchedule').post({
    schedules: ["me"],
    startTime: { dateTime: timeMin, timeZone: "UTC" },
    endTime: { dateTime: timeMax, timeZone: "UTC" },
    availabilityViewInterval: "15"
  });

  return scheduleInformation.value?.[0]?.scheduleItems?.map((item: any) => ({
    start: item.start.dateTime + 'Z',
    end: item.end.dateTime + 'Z',
  })) || [];
}

