import { useEffect, useState } from 'react';
import { PhaseEvent } from '../../types';

const EVENT_ICONS: Record<string, string> = {
  harvest: '🌿',
  contest: '⚔️',
  storm: '🌪️',
  trade: '🚢',
  peace: '🕊️',
  drought: '🔥',
  gold_rush: '💰',
  lumber_boom: '🌲',
  stone_age: '🪨',
  feast: '🍖',
  sabotage_wave: '💣',
  land_grab: '🏴',
  resource_drain: '💧',
};

interface PhaseEventModalProps {
  event: PhaseEvent | null;
  onClose: () => void;
}

export function PhaseEventModal({ event, onClose }: PhaseEventModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [event, onClose]);

  if (!event) return null;

  const icon = EVENT_ICONS[event.type] ?? '⚡';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{icon}</div>
        <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
          フェーズイベント
        </div>
        <h2 className="text-2xl font-bold text-amber-900 mb-3">{event.name}</h2>
        <p className="text-amber-700 text-sm leading-relaxed">{event.description}</p>
        <p className="text-xs text-gray-400 mt-4">クリックで閉じる</p>
      </div>
    </div>
  );
}
