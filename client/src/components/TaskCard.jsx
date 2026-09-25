import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, SkipForward, RotateCcw, Sparkles, Flame } from 'lucide-react';

const TYPE_TAG = {
  revision: { label: 'Revision',   cls: 'tag-teal'   },
  quiz:     { label: 'Quiz',       cls: 'tag-indigo'  },
  remedial: { label: 'Remedial',   cls: 'tag-amber'   },
  default:  { label: 'Study',      cls: 'tag-muted'   },
};

export default function TaskCard({ task, onComplete, onSkip, onStartQuiz }) {
  const [timerOn, setTimerOn] = useState(false);
  const [secs, setSecs]       = useState((task.duration || 45) * 60);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const { label, cls } = TYPE_TAG[task.type] || TYPE_TAG.default;
  const done    = task.status === 'completed';
  const skipped = task.status === 'skipped';

  return (
    <div className={`task-card space-y-3 transition-opacity ${(done || skipped) ? 'opacity-45' : ''}`}>

      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`tag ${cls}`}>{label}</span>
          <span className="text-[11px] txt-3 flex items-center gap-1 mono">
            <Clock size={11} />
            {task.timeSlot || `${task.duration}m`}
          </span>
        </div>
        {task.priority >= 80 && (
          <span className="tag tag-amber flex items-center gap-1">
            <Flame size={10} /> High priority
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="text-sm font-semibold txt-1 font-display truncate">{task.topicName}</h4>
          {task.reason && (
            <p className="text-xs txt-3 flex items-start gap-1.5 leading-relaxed">
              <Sparkles size={11} className="accent-txt shrink-0 mt-0.5" />
              {task.reason}
            </p>
          )}
        </div>
        <span className="tag tag-muted shrink-0 text-[11px]">{task.subjectName}</span>
      </div>

      {/* Focus timer */}
      {timerOn && (
        <div className="surface-raised rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs mono txt-1 font-medium">Focus · {fmt(secs)}</span>
          </div>
          <button onClick={() => setTimerOn(false)} className="text-xs txt-3 hover:txt-1 transition">Pause</button>
        </div>
      )}

      {/* Divider */}
      <div className="divider" />

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!done && !skipped && (
            <>
              {task.type === 'quiz' ? (
                <button
                  onClick={() => onStartQuiz?.(task)}
                  className="btn btn-primary text-xs"
                >
                  <Sparkles size={12} /> Take Quiz
                </button>
              ) : (
                <button
                  onClick={() => setTimerOn(!timerOn)}
                  className="btn btn-primary text-xs"
                >
                  <Play size={12} />
                  {timerOn ? 'Pause' : 'Start Focus'}
                </button>
              )}

              <button
                onClick={() => onComplete(task.id)}
                className="btn btn-secondary text-xs"
              >
                <CheckCircle2 size={12} className="text-green-400" /> Done
              </button>

              <button
                onClick={() => onSkip(task.id)}
                className="btn btn-ghost text-xs"
              >
                <SkipForward size={12} /> Skip
              </button>
            </>
          )}

          {done && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <CheckCircle2 size={13} /> Completed
            </span>
          )}

          {skipped && (
            <span className="flex items-center gap-1.5 text-xs txt-3 font-medium">
              <RotateCcw size={13} /> Rescheduled
            </span>
          )}
        </div>

        <span className="text-[11px] mono txt-3">{task.duration} min</span>
      </div>
    </div>
  );
}
