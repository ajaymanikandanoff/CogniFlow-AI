import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import {
  requestScheduleNotificationPermission,
  isScheduleNotificationEnabled,
  dispatchScheduleAlert
} from '../utils/scheduleNotifier';

export default function ScheduleNotificationBanner({ todayPlan = [], onNotificationSent }) {
  const [enabled, setEnabled] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);

  useEffect(() => {
    setEnabled(isScheduleNotificationEnabled());
  }, []);

  const handleToggleEnable = async () => {
    const res = await requestScheduleNotificationPermission();
    if (res === 'granted') {
      setEnabled(true);
      dispatchScheduleAlert(
        '🔔 Study Schedule Notifications Enabled!',
        'You will now receive proactive study alerts, task countdowns, and spaced revision reminders.'
      );
      setReminderToast('Schedule notifications enabled! Browser alerts are now active.');
      setTimeout(() => setReminderToast(null), 4000);
    } else if (res === 'denied') {
      alert('Notification permission was blocked in browser settings. Please allow notifications for localhost:5000 to receive schedule alerts.');
    }
  };

  const handleSendTestAlert = () => {
    const upcomingTask = todayPlan.find(t => t.status !== 'completed') || todayPlan[0];
    const taskName = upcomingTask?.topicName || 'Core Syllabus Revision';
    const subName = upcomingTask?.subjectName || 'Current Course';
    const duration = upcomingTask?.duration || 45;

    dispatchScheduleAlert(
      `⏰ Time for ${subName} (${duration}m)`,
      `Next study slot: "${taskName}". Focused revision boosts retention by up to 80%!`
    );

    setTestSent(true);
    setReminderToast(`Schedule alert dispatched for "${taskName}"! Check your screen & sound.`);
    setTimeout(() => {
      setTestSent(false);
      setReminderToast(null);
    }, 4000);

    if (onNotificationSent) onNotificationSent();
  };

  const pendingTasks = todayPlan.filter(t => t.status !== 'completed');
  const nextTask = pendingTasks[0] || null;

  return (
    <div className="rounded-2xl p-4 glass-panel border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-sm space-y-3 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            enabled
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700'
              : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
          }`}>
            {enabled ? <BellRing className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                Schedule Alerts & Notifications
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border flex items-center gap-1 ${
                enabled
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                {enabled ? 'Active Online' : 'Permission Required'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {nextTask ? (
                <>Next Scheduled Slot: <strong className="text-zinc-800 dark:text-zinc-200">{nextTask.topicName}</strong> ({nextTask.subjectName} - {nextTask.duration || 45} mins)</>
              ) : (
                'All study tasks for today are completed! Great job.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!enabled ? (
            <button
              onClick={handleToggleEnable}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Schedule Alerts</span>
            </button>
          ) : (
            <button
              onClick={handleSendTestAlert}
              disabled={testSent}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
              title="Test browser notification with sound chime"
            >
              <Volume2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              <span>{testSent ? 'Alert Dispatched!' : 'Test Schedule Alert'}</span>
            </button>
          )}
        </div>
      </div>

      {reminderToast && (
        <div className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl animate-fade-in font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}
    </div>
  );
}
