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
    <div className="space-y-4 text-xs">
      {/* Global Mute / DND Switch */}
      <div className="bg-tg-borderDark/20 p-3 rounded-xl border border-tg-borderDark/40 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <DoNotDisturbIcon className="text-red-500 shrink-0" style={{ fontSize: '18px' }} />
            <div className="min-w-0">
              <p className="font-bold text-color-text text-[11px] truncate">Do Not Disturb (DND)</p>
              <p className="text-[10px] text-tg-textMuted truncate">Mute all notifications</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localSettings.dnd || false}
              onChange={(e) => handleChange('dnd', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-tg-borderDark/40 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <NotificationsActiveIcon className="text-tg-blue shrink-0" style={{ fontSize: '18px' }} />
            <div className="min-w-0">
              <p className="font-bold text-color-text text-[11px] truncate">Global Notifications</p>
              <p className="text-[10px] text-tg-textMuted truncate">Enable push alerts</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localSettings.enabled ?? true}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>
      </div>

      {/* Media & Alert Preferences */}
      <div className="bg-tg-borderDark/20 p-3 rounded-xl border border-tg-borderDark/40 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <VolumeUpIcon className="text-emerald-500 shrink-0" style={{ fontSize: '18px' }} />
            <div className="min-w-0">
              <p className="font-bold text-color-text text-[11px] truncate">Notification Sounds</p>
              <p className="text-[10px] text-tg-textMuted truncate">Play incoming sounds</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localSettings.sound ?? true}
              onChange={(e) => handleChange('sound', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-tg-borderDark/40 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <RingVolumeIcon className="text-purple-400 shrink-0" style={{ fontSize: '18px' }} />
            <div className="min-w-0">
              <p className="font-bold text-color-text text-[11px] truncate">Custom Alert Tone</p>
              <p className="text-[10px] text-tg-textMuted truncate">Ringtone profile</p>
            </div>
          </div>
          <select
            value={localSettings.customSound || 'default'}
            onChange={(e) => handleChange('customSound', e.target.value)}
            className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-[10px] rounded-lg focus:ring-tg-blue focus:border-tg-blue p-1 max-w-[100px] truncate outline-none cursor-pointer"
          >
            {sounds.map((sound) => (
              <option key={sound.value} value={sound.value}>
                {sound.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-tg-borderDark/40 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <VolumeOffIcon className="text-amber-500 shrink-0" style={{ fontSize: '18px' }} />
            <div className="min-w-0">
              <p className="font-bold text-color-text text-[11px] truncate">Desktop Banners</p>
              <p className="text-[10px] text-tg-textMuted truncate">Display toast popups</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={localSettings.desktop ?? true}
              onChange={(e) => handleChange('desktop', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-tg-blue"></div>
          </label>
        </div>
      </div>

      {/* Quiet Hours Range */}
      <div className="bg-tg-borderDark/20 p-3 rounded-xl border border-tg-borderDark/40 space-y-2.5">
        <div className="flex items-center gap-2">
          <AccessTimeIcon className="text-tg-blue shrink-0" style={{ fontSize: '18px' }} />
          <div>
            <p className="font-bold text-color-text text-[11px]">Quiet Hours Schedule</p>
            <p className="text-[10px] text-tg-textMuted">Mute alerts between times</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1.5">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] uppercase font-bold text-tg-textMuted pl-0.5">Start</label>
            <input
              type="time"
              value={localSettings.quietHoursStart || '22:00'}
              onChange={(e) => handleChange('quietHoursStart', e.target.value)}
              className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-[10px] rounded-lg p-1 outline-none focus:ring-1 focus:ring-tg-blue w-full"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] uppercase font-bold text-tg-textMuted pl-0.5">End</label>
            <input
              type="time"
              value={localSettings.quietHoursEnd || '07:00'}
              onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
              className="bg-tg-chat border border-tg-borderDark/60 text-color-text text-[10px] rounded-lg p-1 outline-none focus:ring-1 focus:ring-tg-blue w-full"
            />
          </div>
        </div>
      </div>

      {/* Filters (Mention-only toggles) */}
      <div className="bg-tg-borderDark/20 p-3 rounded-xl border border-tg-borderDark/40 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-color-text text-[11px] truncate">Mention Alert Mode</p>
          <p className="text-[10px] text-tg-textMuted truncate">Notify only on direct @tags</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={localSettings.mentionOnly || false}
            onChange={(e) => handleChange('mentionOnly', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-tg-borderDark/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-tg-blue"></div>
        </label>
      </div>
    </div>
  );
}
