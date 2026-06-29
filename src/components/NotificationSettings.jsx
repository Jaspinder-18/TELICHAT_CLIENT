import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettingsAsync } from '../redux/notificationSlice';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RingVolumeIcon from '@mui/icons-material/RingVolume';

export default function NotificationSettings() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.notifications.settings);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    dispatch(updateSettingsAsync(updated));
  };

  const sounds = [
    { value: 'default', label: 'Default Beep' },
    { value: 'announcement', label: 'Announcement Chime' },
    { value: 'call', label: 'Vintage Telephone' },
    { value: 'bot', label: 'Synth Click' },
    { value: 'mention', label: 'Pebble Drops' }
  ];

  return (
    <div className="space-y-5 text-sm">
      {/* Global Mute / DND Switch */}
      <div className="bg-tg-borderDark/20 p-4 rounded-xl border border-tg-borderDark/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DoNotDisturbIcon className="text-red-500" />
            <div>
              <p className="font-semibold text-color-text">Do Not Disturb (DND)</p>
              <p className="text-xs text-tg-textMuted">Silence all incoming alerts immediately</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.dnd || false}
              onChange={(e) => handleChange('dnd', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-tg-borderDark/40 pt-4">
          <div className="flex items-center gap-3">
            <NotificationsActiveIcon className="text-tg-blue" />
            <div>
              <p className="font-semibold text-color-text">Global Notifications</p>
              <p className="text-xs text-tg-textMuted">Enable push & socket message notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.enabled ?? true}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>
      </div>

      {/* Media & Alert Preferences */}
      <div className="bg-tg-borderDark/20 p-4 rounded-xl border border-tg-borderDark/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VolumeUpIcon className="text-emerald-500" />
            <div>
              <p className="font-semibold text-color-text">Notification Sounds</p>
              <p className="text-xs text-tg-textMuted">Play sounds for incoming alerts</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.sound ?? true}
              onChange={(e) => handleChange('sound', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-tg-borderDark/40 pt-4">
          <div className="flex items-center gap-3">
            <RingVolumeIcon className="text-purple-400" />
            <div>
              <p className="font-semibold text-color-text">Custom Alert Tone</p>
              <p className="text-xs text-tg-textMuted">Choose custom ringtone profiles</p>
            </div>
          </div>
          <select
            value={localSettings.customSound || 'default'}
            onChange={(e) => handleChange('customSound', e.target.value)}
            className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-xs rounded-lg focus:ring-tg-blue focus:border-tg-blue p-1.5 outline-none cursor-pointer"
          >
            {sounds.map((sound) => (
              <option key={sound.value} value={sound.value}>
                {sound.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-tg-borderDark/40 pt-4">
          <div className="flex items-center gap-3">
            <VolumeOffIcon className="text-amber-500" />
            <div>
              <p className="font-semibold text-color-text">Desktop Banners</p>
              <p className="text-xs text-tg-textMuted">Display OS toast popups</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.desktop ?? true}
              onChange={(e) => handleChange('desktop', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>
      </div>

      {/* Quiet Hours Range */}
      <div className="bg-tg-borderDark/20 p-4 rounded-xl border border-tg-borderDark/40 space-y-3">
        <div className="flex items-center gap-3">
          <AccessTimeIcon className="text-tg-blue" />
          <div>
            <p className="font-semibold text-color-text">Quiet Hours Schedule</p>
            <p className="text-xs text-tg-textMuted">Bypass non-critical alerts between times</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-2 justify-between">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] uppercase font-bold text-tg-textMuted">Start Time</label>
            <input
              type="time"
              value={localSettings.quietHoursStart || '22:00'}
              onChange={(e) => handleChange('quietHoursStart', e.target.value)}
              className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-xs rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-tg-blue"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] uppercase font-bold text-tg-textMuted">End Time</label>
            <input
              type="time"
              value={localSettings.quietHoursEnd || '07:00'}
              onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
              className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-xs rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-tg-blue"
            />
          </div>
        </div>
      </div>

      {/* Filters (Mention-only toggles) */}
      <div className="bg-tg-borderDark/20 p-4 rounded-xl border border-tg-borderDark/40 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="font-semibold text-color-text">Mention Alert Mode</p>
          <p className="text-xs text-tg-textMuted">Notify only on direct @username tags</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.mentionOnly || false}
            onChange={(e) => handleChange('mentionOnly', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tg-blue"></div>
        </label>
      </div>
    </div>
  );
}
