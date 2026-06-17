/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IActionTranslationRequest {
  translation_key: string;
  id_languages: number;
  content: string;
}

/**
 * Structured shape of the action scheduling config produced by
 * `ActionConfigBuilder`. Every field is optional because the builder edits a
 * partially-filled JSON document (and a raw JSON editor tab can hold any
 * subset while the admin types). The interfaces mirror the keys the builder
 * and backend read; they replace the previous `any` config typing.
 */
export interface IActionNotificationConfig {
  notification_types?: string;
  recipient?: string;
  subject?: string;
  body?: string;
  attachments?: string[];
  redirect_url?: string;
}

export interface IActionScheduleTimeConfig {
  job_schedule_types?: string;
  send_after?: number;
  send_after_type?: string;
  send_on?: string;
  send_on_day?: string;
  send_on_day_at?: string;
  custom_time?: string;
  valid?: number;
  valid_type?: string;
}

export interface IActionReminderConfig {
  condition?: string;
  on_job_execute?: { condition?: string };
  schedule_time?: IActionScheduleTimeConfig;
  notification?: IActionNotificationConfig;
}

export interface IActionJobConfig {
  job_name?: string;
  job_type?: string;
  condition?: string;
  on_job_execute?: { condition?: string };
  schedule_time?: IActionScheduleTimeConfig;
  notification?: IActionNotificationConfig;
  reminders?: IActionReminderConfig[];
  job_add_remove_groups?: string[];
  reminder_form_id?: string;
}

export interface IActionBlockConfig {
  block_name?: string;
  condition?: string;
  jobs?: IActionJobConfig[];
}

export interface IActionConfig {
  blocks?: IActionBlockConfig[];
  randomize?: boolean;
  repeat?: boolean;
  repeat_until_date?: boolean;
  target_groups?: boolean;
  overwrite_variables?: boolean;
  clear_existing_jobs_for_action?: boolean;
  clear_existing_jobs_for_record_and_action?: boolean;
  condition?: string;
  randomizer?: { even_presentation?: boolean; random_elements?: number };
  selected_target_groups?: string[];
  selected_overwrite_variables?: string[];
  repeater?: { occurrences?: number; frequency?: string; daysOfWeek?: string[]; daysOfMonth?: string[] };
  repeater_until_date?: {
    deadline?: string;
    schedule_at?: string;
    repeat_every?: number;
    frequency?: string;
    daysOfWeek?: string[];
    daysOfMonth?: string[];
  };
}

export interface ICreateActionRequest {
  name: string;
  id_action_trigger_types: number | string; // matches backend create_action schema
  id_data_tables: number; // required per schema
  config?: IActionConfig; // JSON object built from schema
  translations?: IActionTranslationRequest[]; // optional translations array
}

export interface IUpdateActionRequest {
  name?: string;
  id_action_trigger_types?: number | string;
  config?: IActionConfig;
  id_data_tables?: number | null;
  translations?: IActionTranslationRequest[]; // optional translations array
}


