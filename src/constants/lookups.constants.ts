/**
 * Lookup constants for consistent access to lookup types and codes.
 * These constants match the backend lookup system.
 * 
 * @module constants/lookups.constants
 */

// Lookup Type Codes
export const NOTIFICATION_TYPES = 'notificationTypes';
export const ACTION_SCHEDULE_TYPES = 'actionScheduleTypes';
export const ACTION_TRIGGER_TYPES = 'actionTriggerTypes';
export const TIME_PERIOD = 'timePeriod';
export const WEEKDAYS = 'weekdays';
export const SCHEDULED_JOBS_STATUS = 'scheduledJobsStatus';
export const SCHEDULED_JOBS_SEARCH_DATE_TYPES = 'scheduledJobsSearchDateTypes';
export const TRANSACTION_TYPES = 'transactionTypes';
export const TRANSACTION_BY = 'transactionBy';
export const JOB_TYPES = 'jobTypes';
export const PAGE_ACCESS_TYPES = 'pageAccessTypes';
export const HOOK_TYPES = 'hookTypes';
export const ASSET_TYPES = 'assetTypes';
export const GROUP_TYPES = 'groupTypes';
export const USER_TYPES = 'userTypes';
export const USER_STATUS = 'userStatus';
export const PAGE_ACTIONS = 'pageActions';
export const STYLE_TYPE = 'styleType';
export const PLUGINS = 'plugins';

// Lookup Codes
// notificationTypes
export const NOTIFICATION_TYPES_EMAIL = 'email';
export const NOTIFICATION_TYPES_PUSH_NOTIFICATION = 'push_notification';

// actionScheduleTypes
export const ACTION_SCHEDULE_TYPES_IMMEDIATELY = 'immediately';
export const ACTION_SCHEDULE_TYPES_ON_FIXED_DATETIME = 'on_fixed_datetime';
export const ACTION_SCHEDULE_TYPES_AFTER_PERIOD = 'after_period';
export const ACTION_SCHEDULE_TYPES_AFTER_PERIOD_ON_DAY_AT_TIME = 'after_period_on_day_at_time';

// actionTriggerTypes
export const ACTION_TRIGGER_TYPES_STARTED = 'started';
export const ACTION_TRIGGER_TYPES_FINISHED = 'finished';
export const ACTION_TRIGGER_TYPES_DELETED = 'deleted';
export const ACTION_TRIGGER_TYPES_UPDATED = 'updated';

// timePeriod
export const TIME_PERIOD_SECONDS = 'seconds';
export const TIME_PERIOD_MINUTES = 'minutes';
export const TIME_PERIOD_HOURS = 'hours';
export const TIME_PERIOD_DAYS = 'days';
export const TIME_PERIOD_WEEKS = 'weeks';
export const TIME_PERIOD_MONTHS = 'months';

// weekdays
export const WEEKDAYS_MONDAY = 'monday';
export const WEEKDAYS_TUESDAY = 'tuesday';
export const WEEKDAYS_WEDNESDAY = 'wednesday';
export const WEEKDAYS_THURSDAY = 'thursday';
export const WEEKDAYS_FRIDAY = 'friday';
export const WEEKDAYS_SATURDAY = 'saturday';
export const WEEKDAYS_SUNDAY = 'sunday';

// scheduledJobsStatus
export const SCHEDULED_JOBS_STATUS_QUEUED = 'queued';
export const SCHEDULED_JOBS_STATUS_DELETED = 'deleted';
export const SCHEDULED_JOBS_STATUS_DONE = 'done';
export const SCHEDULED_JOBS_STATUS_FAILED = 'failed';

// scheduledJobsSearchDateTypes
export const SCHEDULED_JOBS_SEARCH_DATE_TYPES_DATE_CREATE = 'date_create';
export const SCHEDULED_JOBS_SEARCH_DATE_TYPES_DATE_TO_BE_EXECUTED = 'date_to_be_executed';
export const SCHEDULED_JOBS_SEARCH_DATE_TYPES_DATE_EXECUTED = 'date_executed';

// transactionTypes
export const TRANSACTION_TYPES_INSERT = 'insert';
export const TRANSACTION_TYPES_SELECT = 'select';
export const TRANSACTION_TYPES_UPDATE = 'update';
export const TRANSACTION_TYPES_DELETE = 'delete';
export const TRANSACTION_TYPES_STATUS_CHANGE = 'status_change';
export const TRANSACTION_TYPES_SEND_MAIL_OK = 'send_mail_ok';
export const TRANSACTION_TYPES_SEND_MAIL_FAIL = 'send_mail_fail';
export const TRANSACTION_TYPES_SEND_NOTIFICATION_OK = 'send_notification_ok';
export const TRANSACTION_TYPES_SEND_NOTIFICATION_FAIL = 'send_notification_fail';
export const TRANSACTION_TYPES_EXECUTE_TASK_OK = 'execute_task_ok';
export const TRANSACTION_TYPES_EXECUTE_TASK_FAIL = 'execute_task_fail';
export const TRANSACTION_TYPES_CHECK_SCHEDULEDJOBS = 'check_scheduledJobs';

// transactionBy
export const TRANSACTION_BY_BY_CRON_JOB = 'by_cron_job';
export const TRANSACTION_BY_BY_USER = 'by_user';
export const TRANSACTION_BY_BY_ANONYMOUS_USER = 'by_anonymous_user';
export const TRANSACTION_BY_BY_SYSTEM = 'by_system';
export const TRANSACTION_BY_BY_SYSTEM_USER = 'by_system_user';

// jobTypes
export const JOB_TYPES_EMAIL = 'email';
export const JOB_TYPES_NOTIFICATION = 'notification';
export const JOB_TYPES_TASK = 'task';

// pageAccessTypes
export const PAGE_ACCESS_TYPES_MOBILE = 'mobile';
export const PAGE_ACCESS_TYPES_WEB = 'web';
export const PAGE_ACCESS_TYPES_MOBILE_AND_WEB = 'mobile_and_web';

// hookTypes
export const HOOK_TYPES_HOOK_OVERWRITE_RETURN = 'hook_overwrite_return';
export const HOOK_TYPES_HOOK_ON_FUNCTION_EXECUTE = 'hook_on_function_execute';

// assetTypes
export const ASSET_TYPES_CSS = 'css';
export const ASSET_TYPES_ASSET = 'asset';
export const ASSET_TYPES_STATIC = 'static';

// groupTypes
export const GROUP_TYPES_DB_ROLE = 'db_role';
export const GROUP_TYPES_GROUP = 'group';

// userTypes
export const USER_TYPES_USER = 'user';
export const USER_TYPES_ADMIN = 'admin'; // If exists

// userStatus
export const USER_STATUS_INVITED = 'invited';
export const USER_STATUS_ACTIVE = 'active';
export const USER_STATUS_LOCKED = 'locked';

// pageActions
export const PAGE_ACTIONS_BACKEND = 'backend';
export const PAGE_ACTIONS_NAVIGATION = 'navigation';
export const PAGE_ACTIONS_SECTIONS = 'sections';
export const PAGE_ACTIONS_COMPONENT = 'component';
export const PAGE_ACTIONS_AJAX = 'ajax';
export const PAGE_ACTIONS_CMS_API = 'cms-api';
export const PAGE_ACTIONS_EXPERIMENT = 'experiment';
export const PAGE_ACTIONS_EXPORT = 'export';

// styleType
export const STYLE_TYPE_VIEW = 'view';
export const STYLE_TYPE_COMPONENT = 'component'; 