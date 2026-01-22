# iBird Frontend - Appointments Module

## Component Hierarchy

```
AppointmentsModule/
├── AppointmentsSidebar/
│   ├── AppointmentTypeList.tsx
│   ├── AppointmentTypeItem.tsx
│   ├── QuickStats.tsx
│   └── CreateTypeButton.tsx
├── AppointmentsMain/
│   ├── AppointmentsHeader.tsx
│   ├── AppointmentsDashboard.tsx
│   ├── UpcomingBookings.tsx
│   ├── BookingCard.tsx
│   └── AvailabilityOverview.tsx
├── AppointmentTypes/
│   ├── TypeEditor.tsx
│   ├── TypePreview.tsx
│   ├── DurationSelector.tsx
│   ├── BufferTimeEditor.tsx
│   └── BookingLimitsEditor.tsx
├── AvailabilityEditor/
│   ├── AvailabilitySchedule.tsx
│   ├── WeeklyHoursEditor.tsx
│   ├── DateOverridesEditor.tsx
│   ├── TimeSlotPicker.tsx
│   └── TimezoneSelector.tsx
├── BookingPage/
│   ├── PublicBookingPage.tsx
│   ├── TypeSelector.tsx
│   ├── DatePicker.tsx
│   ├── TimeSlotGrid.tsx
│   ├── BookingForm.tsx
│   └── ConfirmationPage.tsx
└── BookingManagement/
    ├── BookingDetail.tsx
    ├── BookingActions.tsx
    ├── RescheduleModal.tsx
    └── CancelModal.tsx
```

---

## Core Components

### 1. AppointmentsModule.tsx

```typescript
// client/src/components/ibird/appointments/AppointmentsModule.tsx

import { GlassContainer } from '@/components/ui/GlassContainer';
import { useAppointmentsStore } from '@/stores/ibird/appointmentsStore';
import { AppointmentsSidebar } from './AppointmentsSidebar';
import { AppointmentsDashboard } from './AppointmentsDashboard';
import { TypeEditor } from './TypeEditor';
import { AvailabilitySchedule } from './AvailabilitySchedule';
import { BookingDetail } from './BookingDetail';

export function AppointmentsModule() {
  const {
    currentView,
    selectedTypeId,
    selectedBookingId,
    sidebarWidth
  } = useAppointmentsStore();

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AppointmentsDashboard />;
      case 'type-editor':
        return <TypeEditor typeId={selectedTypeId} />;
      case 'availability':
        return <AvailabilitySchedule />;
      case 'booking-detail':
        return <BookingDetail bookingId={selectedBookingId} />;
      default:
        return <AppointmentsDashboard />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <GlassContainer
        className="flex-shrink-0 border-r border-white/10"
        style={{ width: sidebarWidth }}
      >
        <AppointmentsSidebar />
      </GlassContainer>

      {/* Main Content */}
      <GlassContainer className="flex-1 min-w-0 overflow-auto">
        {renderMainContent()}
      </GlassContainer>
    </div>
  );
}
```

---

### 2. AppointmentsSidebar Components

#### AppointmentTypeList.tsx
```typescript
interface AppointmentTypeListProps {
  types: AppointmentType[];
  selectedTypeId: string | null;
  onSelectType: (id: string) => void;
  onCreateType: () => void;
}

export function AppointmentTypeList({
  types,
  selectedTypeId,
  onSelectType,
  onCreateType
}: AppointmentTypeListProps) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/70">Event Types</h3>
        <button
          onClick={onCreateType}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + New
        </button>
      </div>

      <div className="space-y-1">
        {types.map((type) => (
          <AppointmentTypeItem
            key={type.id}
            type={type}
            isSelected={type.id === selectedTypeId}
            onSelect={() => onSelectType(type.id)}
          />
        ))}
      </div>

      {types.length === 0 && (
        <div className="text-center py-8">
          <CalendarPlusIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-3">No event types yet</p>
          <button
            onClick={onCreateType}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg"
          >
            Create your first event type
          </button>
        </div>
      )}
    </div>
  );
}
```

#### AppointmentTypeItem.tsx
```typescript
interface AppointmentTypeItemProps {
  type: AppointmentType;
  isSelected: boolean;
  onSelect: () => void;
}

export function AppointmentTypeItem({ type, isSelected, onSelect }: AppointmentTypeItemProps) {
  const bookingsCount = useBookingsCount(type.id);

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg text-left',
        'hover:bg-white/10 transition-colors',
        isSelected && 'bg-white/20'
      )}
      onClick={onSelect}
    >
      <div
        className="w-1 h-8 rounded-full"
        style={{ backgroundColor: type.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{type.name}</div>
        <div className="text-xs text-white/50">
          {type.duration} min • {bookingsCount} bookings
        </div>
      </div>
      {!type.isActive && (
        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
          Inactive
        </span>
      )}
    </button>
  );
}
```

#### QuickStats.tsx
```typescript
export function QuickStats() {
  const { stats, isLoading } = useAppointmentStats();

  if (isLoading) {
    return <div className="p-3 animate-pulse">...</div>;
  }

  return (
    <div className="p-3 border-t border-white/10">
      <h3 className="text-sm font-medium text-white/70 mb-3">This Week</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-2xl font-bold text-white">{stats.upcoming}</div>
          <div className="text-xs text-white/50">Upcoming</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-white/50">Completed</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-white/50">Pending</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
          <div className="text-xs text-white/50">Cancelled</div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Appointment Type Editor

#### TypeEditor.tsx
```typescript
interface TypeEditorProps {
  typeId: string | null;
}

export function TypeEditor({ typeId }: TypeEditorProps) {
  const { appointmentTypes, saveAppointmentType, isSaving } = useAppointmentsStore();
  const existingType = typeId ? appointmentTypes.find(t => t.id === typeId) : null;

  const [form, setForm] = useState<AppointmentTypeForm>(() =>
    existingType || getDefaultTypeForm()
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'availability' | 'booking' | 'notifications'>('basic');

  const updateForm = (updates: Partial<AppointmentTypeForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    await saveAppointmentType(form);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">
          {existingType ? 'Edit Event Type' : 'New Event Type'}
        </h2>
        <div className="flex items-center gap-2">
          <TypePreview type={form} />
          <button
            onClick={handleSave}
            disabled={isSaving || !form.name}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['basic', 'availability', 'booking', 'notifications'] as const).map((tab) => (
          <button
            key={tab}
            className={cn(
              'px-4 py-3 text-sm font-medium capitalize',
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/50 hover:text-white/70'
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'basic' && (
          <BasicSettings form={form} updateForm={updateForm} />
        )}
        {activeTab === 'availability' && (
          <AvailabilitySettings form={form} updateForm={updateForm} />
        )}
        {activeTab === 'booking' && (
          <BookingSettings form={form} updateForm={updateForm} />
        )}
        {activeTab === 'notifications' && (
          <NotificationSettings form={form} updateForm={updateForm} />
        )}
      </div>
    </div>
  );
}
```

#### BasicSettings.tsx
```typescript
interface BasicSettingsProps {
  form: AppointmentTypeForm;
  updateForm: (updates: Partial<AppointmentTypeForm>) => void;
}

export function BasicSettings({ form, updateForm }: BasicSettingsProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Name & Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Event Name</label>
        <div className="flex gap-3">
          <ColorPicker
            value={form.color}
            onChange={(color) => updateForm({ color })}
          />
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="e.g., 30 Minute Meeting"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Description</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="Brief description of this event type"
          rows={3}
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Duration</label>
        <DurationSelector
          value={form.duration}
          onChange={(duration) => updateForm({ duration })}
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Location</label>
        <select
          value={form.locationType}
          onChange={(e) => updateForm({ locationType: e.target.value as any })}
          className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none"
        >
          <option value="in_person">In-person meeting</option>
          <option value="phone">Phone call</option>
          <option value="video">Video conference</option>
          <option value="custom">Custom</option>
        </select>

        {form.locationType === 'in_person' && (
          <input
            type="text"
            value={form.locationAddress || ''}
            onChange={(e) => updateForm({ locationAddress: e.target.value })}
            placeholder="Meeting address"
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none"
          />
        )}

        {form.locationType === 'video' && (
          <div className="flex gap-2">
            {['zoom', 'google_meet', 'teams', 'custom'].map((provider) => (
              <button
                key={provider}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm capitalize',
                  form.videoProvider === provider
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                )}
                onClick={() => updateForm({ videoProvider: provider as any })}
              >
                {provider === 'google_meet' ? 'Google Meet' : provider}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Booking URL</label>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">ibird.app/book/</span>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => updateForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="30min-meeting"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none"
          />
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <div>
          <div className="text-sm font-medium text-white">Active</div>
          <div className="text-xs text-white/50">Allow people to book this event type</div>
        </div>
        <Toggle
          checked={form.isActive}
          onChange={(isActive) => updateForm({ isActive })}
        />
      </div>
    </div>
  );
}
```

#### DurationSelector.tsx
```typescript
interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PRESETS = [15, 30, 45, 60, 90, 120];

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const [isCustom, setIsCustom] = useState(!PRESETS.includes(value));

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((duration) => (
        <button
          key={duration}
          className={cn(
            'px-4 py-2 rounded-lg text-sm',
            value === duration && !isCustom
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          )}
          onClick={() => {
            setIsCustom(false);
            onChange(duration);
          }}
        >
          {duration} min
        </button>
      ))}
      <button
        className={cn(
          'px-4 py-2 rounded-lg text-sm',
          isCustom
            ? 'bg-blue-500 text-white'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        )}
        onClick={() => setIsCustom(true)}
      >
        Custom
      </button>

      {isCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="number"
            min="5"
            max="480"
            step="5"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-20 bg-white/10 text-white rounded px-2 py-1 text-sm"
          />
          <span className="text-sm text-white/50">minutes</span>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Availability Editor

#### AvailabilitySchedule.tsx
```typescript
export function AvailabilitySchedule() {
  const { schedules, selectedScheduleId, saveSchedule, isSaving } = useAppointmentsStore();
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  const [form, setForm] = useState<AvailabilityScheduleForm>(() =>
    selectedSchedule || getDefaultScheduleForm()
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-white">Availability</h2>
          <p className="text-sm text-white/50">Set when you're available for bookings</p>
        </div>
        <button
          onClick={() => saveSchedule(form)}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-8">
          {/* Schedule Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Schedule Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Working Hours"
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Timezone</label>
            <TimezoneSelector
              value={form.timezone}
              onChange={(timezone) => setForm({ ...form, timezone })}
            />
          </div>

          {/* Weekly Hours */}
          <WeeklyHoursEditor
            value={form.weeklyHours}
            onChange={(weeklyHours) => setForm({ ...form, weeklyHours })}
          />

          {/* Date Overrides */}
          <DateOverridesEditor
            value={form.dateOverrides}
            onChange={(dateOverrides) => setForm({ ...form, dateOverrides })}
            timezone={form.timezone}
          />
        </div>
      </div>
    </div>
  );
}
```

#### WeeklyHoursEditor.tsx
```typescript
interface WeeklyHoursEditorProps {
  value: WeeklyHours;
  onChange: (value: WeeklyHours) => void;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyHoursEditor({ value, onChange }: WeeklyHoursEditorProps) {
  const updateDay = (day: typeof DAYS[number], slots: TimeSlot[]) => {
    onChange({ ...value, [day]: slots });
  };

  const copyToAllWeekdays = (sourceDay: typeof DAYS[number]) => {
    const sourceSlots = value[sourceDay];
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    const updated = { ...value };
    weekdays.forEach(day => {
      updated[day] = [...sourceSlots];
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">Weekly Hours</label>
        <button
          className="text-xs text-blue-400 hover:text-blue-300"
          onClick={() => {
            // Set default 9-5 for weekdays
            onChange({
              ...value,
              monday: [{ start: '09:00', end: '17:00' }],
              tuesday: [{ start: '09:00', end: '17:00' }],
              wednesday: [{ start: '09:00', end: '17:00' }],
              thursday: [{ start: '09:00', end: '17:00' }],
              friday: [{ start: '09:00', end: '17:00' }],
              saturday: [],
              sunday: [],
            });
          }}
        >
          Set to 9-5 weekdays
        </button>
      </div>

      <div className="space-y-2">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className="flex items-start gap-4 p-3 bg-white/5 rounded-lg"
          >
            {/* Day toggle */}
            <div className="w-16 flex items-center gap-2">
              <input
                type="checkbox"
                checked={value[day].length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateDay(day, [{ start: '09:00', end: '17:00' }]);
                  } else {
                    updateDay(day, []);
                  }
                }}
                className="rounded"
              />
              <span className={cn(
                'text-sm',
                value[day].length > 0 ? 'text-white' : 'text-white/40'
              )}>
                {DAY_LABELS[index]}
              </span>
            </div>

            {/* Time slots */}
            {value[day].length > 0 ? (
              <div className="flex-1 space-y-2">
                {value[day].map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => {
                        const updated = [...value[day]];
                        updated[slotIndex] = { ...slot, start: e.target.value };
                        updateDay(day, updated);
                      }}
                      className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                    />
                    <span className="text-white/50">-</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => {
                        const updated = [...value[day]];
                        updated[slotIndex] = { ...slot, end: e.target.value };
                        updateDay(day, updated);
                      }}
                      className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                    />
                    {value[day].length > 1 && (
                      <button
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          const updated = value[day].filter((_, i) => i !== slotIndex);
                          updateDay(day, updated);
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="text-xs text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    updateDay(day, [...value[day], { start: '13:00', end: '17:00' }]);
                  }}
                >
                  + Add hours
                </button>
              </div>
            ) : (
              <span className="text-sm text-white/40">Unavailable</span>
            )}

            {/* Copy to weekdays */}
            {value[day].length > 0 && (
              <button
                className="text-xs text-white/40 hover:text-white/60"
                onClick={() => copyToAllWeekdays(day)}
                title="Copy to all weekdays"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 5. Public Booking Page

#### PublicBookingPage.tsx
```typescript
interface PublicBookingPageProps {
  username: string;
  typeSlug?: string;
}

export function PublicBookingPage({ username, typeSlug }: PublicBookingPageProps) {
  const [step, setStep] = useState<'type' | 'date' | 'time' | 'form' | 'confirmation'>('type');
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);

  const { data: profile } = useQuery(['profile', username], () =>
    fetchPublicProfile(username)
  );

  const { data: types } = useQuery(['types', username], () =>
    fetchPublicAppointmentTypes(username)
  );

  // Auto-select type if slug provided
  useEffect(() => {
    if (typeSlug && types) {
      const type = types.find(t => t.slug === typeSlug);
      if (type) {
        setSelectedType(type);
        setStep('date');
      }
    }
  }, [typeSlug, types]);

  const handleTypeSelect = (type: AppointmentType) => {
    setSelectedType(type);
    setStep('date');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBookingComplete = (booking: Booking) => {
    setBookingResult(booking);
    setStep('confirmation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
          {profile?.bio && (
            <p className="text-white/60 mt-2">{profile?.bio}</p>
          )}
        </div>

        {/* Steps */}
        <GlassContainer className="p-6">
          {step === 'type' && (
            <TypeSelector
              types={types || []}
              onSelect={handleTypeSelect}
            />
          )}

          {step === 'date' && selectedType && (
            <DatePicker
              type={selectedType}
              username={username}
              onSelect={handleDateSelect}
              onBack={() => setStep('type')}
            />
          )}

          {step === 'time' && selectedType && selectedDate && (
            <TimeSlotGrid
              type={selectedType}
              username={username}
              date={selectedDate}
              onSelect={handleSlotSelect}
              onBack={() => setStep('date')}
            />
          )}

          {step === 'form' && selectedType && selectedDate && selectedSlot && (
            <BookingForm
              type={selectedType}
              date={selectedDate}
              slot={selectedSlot}
              username={username}
              onComplete={handleBookingComplete}
              onBack={() => setStep('time')}
            />
          )}

          {step === 'confirmation' && bookingResult && (
            <ConfirmationPage booking={bookingResult} />
          )}
        </GlassContainer>
      </div>
    </div>
  );
}
```

#### TimeSlotGrid.tsx
```typescript
interface TimeSlotGridProps {
  type: AppointmentType;
  username: string;
  date: Date;
  onSelect: (slot: TimeSlot) => void;
  onBack: () => void;
}

export function TimeSlotGrid({ type, username, date, onSelect, onBack }: TimeSlotGridProps) {
  const { data: slots, isLoading } = useQuery(
    ['slots', username, type.id, format(date, 'yyyy-MM-dd')],
    () => fetchAvailableSlots(username, type.id, date)
  );

  const [selectedTimezone, setSelectedTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Spinner className="w-8 h-8 text-blue-400 mx-auto" />
        <p className="text-white/50 mt-4">Loading available times...</p>
      </div>
    );
  }

  const morningSlots = slots?.filter(s => {
    const hour = parseInt(s.start.split(':')[0]);
    return hour < 12;
  }) || [];

  const afternoonSlots = slots?.filter(s => {
    const hour = parseInt(s.start.split(':')[0]);
    return hour >= 12 && hour < 17;
  }) || [];

  const eveningSlots = slots?.filter(s => {
    const hour = parseInt(s.start.split(':')[0]);
    return hour >= 17;
  }) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-white/50 hover:text-white">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-sm text-white/50">{type.name} • {type.duration} min</p>
        </div>
      </div>

      {/* Timezone selector */}
      <div className="mb-6">
        <TimezoneSelector
          value={selectedTimezone}
          onChange={setSelectedTimezone}
          compact
        />
      </div>

      {/* Slots by time of day */}
      {slots?.length === 0 ? (
        <div className="text-center py-8">
          <CalendarXIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No available times on this day</p>
        </div>
      ) : (
        <div className="space-y-6">
          {morningSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Morning</h3>
              <div className="grid grid-cols-3 gap-2">
                {morningSlots.map((slot) => (
                  <button
                    key={slot.start}
                    className="px-4 py-2 bg-white/10 hover:bg-blue-500/30 text-white rounded-lg text-sm transition-colors"
                    onClick={() => onSelect(slot)}
                  >
                    {formatTimeInTimezone(slot.start, selectedTimezone)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Afternoon</h3>
              <div className="grid grid-cols-3 gap-2">
                {afternoonSlots.map((slot) => (
                  <button
                    key={slot.start}
                    className="px-4 py-2 bg-white/10 hover:bg-blue-500/30 text-white rounded-lg text-sm transition-colors"
                    onClick={() => onSelect(slot)}
                  >
                    {formatTimeInTimezone(slot.start, selectedTimezone)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {eveningSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Evening</h3>
              <div className="grid grid-cols-3 gap-2">
                {eveningSlots.map((slot) => (
                  <button
                    key={slot.start}
                    className="px-4 py-2 bg-white/10 hover:bg-blue-500/30 text-white rounded-lg text-sm transition-colors"
                    onClick={() => onSelect(slot)}
                  >
                    {formatTimeInTimezone(slot.start, selectedTimezone)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### BookingForm.tsx
```typescript
interface BookingFormProps {
  type: AppointmentType;
  date: Date;
  slot: TimeSlot;
  username: string;
  onComplete: (booking: Booking) => void;
  onBack: () => void;
}

export function BookingForm({
  type,
  date,
  slot,
  username,
  onComplete,
  onBack
}: BookingFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    notes: '',
    customFields: {} as Record<string, string>,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await createPublicBooking({
        username,
        typeId: type.id,
        date: format(date, 'yyyy-MM-dd'),
        startTime: slot.start,
        inviteeName: form.name,
        inviteeEmail: form.email,
        notes: form.notes,
        customFields: form.customFields,
      });
      onComplete(booking);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={onBack} className="text-white/50 hover:text-white">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">Enter your details</h2>
          <p className="text-sm text-white/50">
            {format(date, 'EEE, MMM d')} at {slot.start} • {type.duration} min
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Your name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Email address *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Custom fields from type configuration */}
        {type.customFields?.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-sm font-medium text-white">
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                required={field.required}
                value={form.customFields[field.name] || ''}
                onChange={(e) => setForm({
                  ...form,
                  customFields: { ...form.customFields, [field.name]: e.target.value }
                })}
                rows={3}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <input
                type={field.type}
                required={field.required}
                value={form.customFields[field.name] || ''}
                onChange={(e) => setForm({
                  ...form,
                  customFields: { ...form.customFields, [field.name]: e.target.value }
                })}
                className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Additional notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything else you'd like to share?"
            rows={3}
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium"
      >
        {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
      </button>
    </form>
  );
}
```

---

## Utility Functions

```typescript
// client/src/utils/ibird/appointments.ts

export function formatTimeInTimezone(time: string, timezone: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
}

export function getDefaultTypeForm(): AppointmentTypeForm {
  return {
    name: '',
    slug: '',
    description: '',
    duration: 30,
    color: '#3B82F6',
    isActive: true,
    locationType: 'video',
    videoProvider: 'google_meet',
    bufferBefore: 0,
    bufferAfter: 0,
    minNotice: 24 * 60, // 24 hours in minutes
    maxBookingDays: 60,
    customFields: [],
  };
}

export function getDefaultScheduleForm(): AvailabilityScheduleForm {
  return {
    name: 'Working Hours',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weeklyHours: {
      sunday: [],
      monday: [{ start: '09:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }],
      saturday: [],
    },
    dateOverrides: [],
  };
}

export function calculateAvailableSlots(
  date: Date,
  type: AppointmentType,
  schedule: AvailabilitySchedule,
  existingBookings: Booking[]
): TimeSlot[] {
  const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof WeeklyHours;
  const dayHours = schedule.weeklyHours[dayOfWeek];

  // Check for date override
  const dateKey = format(date, 'yyyy-MM-dd');
  const override = schedule.dateOverrides.find(o => o.date === dateKey);

  const hoursToUse = override
    ? override.isAvailable ? override.slots : []
    : dayHours;

  const slots: TimeSlot[] = [];

  for (const period of hoursToUse) {
    let current = parseTime(period.start);
    const periodEnd = parseTime(period.end);

    while (current + type.duration <= periodEnd) {
      const slotStart = formatMinutesToTime(current);
      const slotEnd = formatMinutesToTime(current + type.duration);

      // Check if slot conflicts with existing booking
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = parseTime(booking.startTime);
        const bookingEnd = parseTime(booking.endTime);
        return !(current + type.duration <= bookingStart || current >= bookingEnd);
      });

      if (!hasConflict) {
        slots.push({ start: slotStart, end: slotEnd });
      }

      current += type.duration + (type.bufferAfter || 0);
    }
  }

  return slots;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
```

---

## Next Document

Continue to [07-STATE-MANAGEMENT.md](./07-STATE-MANAGEMENT.md) for Zustand stores and hooks.
