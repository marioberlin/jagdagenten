# iBird Frontend - Calendar Module

## Component Hierarchy

```
CalendarModule/
├── CalendarSidebar/
│   ├── MiniCalendar.tsx
│   ├── CalendarList.tsx
│   ├── CalendarItem.tsx
│   ├── TaskList.tsx
│   └── CreateEventButton.tsx
├── CalendarViews/
│   ├── CalendarHeader.tsx
│   ├── CalendarToolbar.tsx
│   ├── DayView.tsx
│   ├── WeekView.tsx
│   ├── MonthView.tsx
│   ├── YearView.tsx
│   └── AgendaView.tsx
├── CalendarEvents/
│   ├── EventCard.tsx
│   ├── EventPopover.tsx
│   ├── EventDetail.tsx
│   ├── AllDayEvent.tsx
│   └── MultiDayEvent.tsx
├── CalendarForms/
│   ├── EventModal.tsx
│   ├── QuickAddEvent.tsx
│   ├── RecurrenceEditor.tsx
│   ├── ReminderEditor.tsx
│   └── AttendeeEditor.tsx
└── CalendarTasks/
    ├── TaskItem.tsx
    ├── TaskModal.tsx
    └── TaskListView.tsx
```

---

## Core Components

### 1. CalendarModule.tsx

```typescript
// client/src/components/ibird/calendar/CalendarModule.tsx

import { GlassContainer } from '@/components/ui/GlassContainer';
import { useCalendarStore } from '@/stores/ibird/calendarStore';
import { CalendarSidebar } from './CalendarSidebar';
import { CalendarHeader } from './CalendarHeader';
import { DayView, WeekView, MonthView, YearView, AgendaView } from './views';
import { EventModal } from './EventModal';
import { EventPopover } from './EventPopover';

export function CalendarModule() {
  const {
    currentView,
    selectedDate,
    isEventModalOpen,
    popoverEvent,
    sidebarWidth
  } = useCalendarStore();

  const ViewComponent = {
    day: DayView,
    week: WeekView,
    month: MonthView,
    year: YearView,
    agenda: AgendaView,
  }[currentView];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <GlassContainer
        className="flex-shrink-0 border-r border-white/10"
        style={{ width: sidebarWidth }}
      >
        <CalendarSidebar />
      </GlassContainer>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <CalendarHeader />
        <div className="flex-1 overflow-hidden">
          <ViewComponent date={selectedDate} />
        </div>
      </div>

      {/* Modals */}
      {isEventModalOpen && <EventModal />}
      {popoverEvent && <EventPopover />}
    </div>
  );
}
```

---

### 2. CalendarSidebar Components

#### MiniCalendar.tsx
```typescript
interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  eventsMap: Map<string, number>; // dateKey -> event count
}

export function MiniCalendar({ selectedDate, onSelectDate, eventsMap }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));
  const days = eachDayOfInterval({
    start: startOfWeek(viewMonth),
    end: endOfWeek(endOfMonth(viewMonth))
  });

  return (
    <div className="p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
          <ChevronLeftIcon className="w-4 h-4 text-white/60" />
        </button>
        <span className="text-sm font-medium text-white">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <ChevronRightIcon className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-white/40 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const eventCount = eventsMap.get(dateKey) || 0;
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, viewMonth);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                'w-7 h-7 text-xs rounded-full relative',
                'hover:bg-white/10 transition-colors',
                isSelected && 'bg-blue-500 text-white',
                isToday && !isSelected && 'ring-1 ring-blue-400',
                !isCurrentMonth && 'text-white/30',
                isCurrentMonth && !isSelected && 'text-white/80'
              )}
            >
              {format(day, 'd')}
              {eventCount > 0 && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

#### CalendarList.tsx
```typescript
interface CalendarListProps {
  calendars: Calendar[];
  visibleCalendarIds: Set<string>;
  onToggleVisibility: (id: string) => void;
  onEditCalendar: (calendar: Calendar) => void;
}

export function CalendarList({
  calendars,
  visibleCalendarIds,
  onToggleVisibility,
  onEditCalendar
}: CalendarListProps) {
  // Group calendars by source
  const grouped = groupBy(calendars, 'source'); // 'local', 'google', 'microsoft', 'caldav'

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">My Calendars</h3>
        <button className="text-xs text-blue-400 hover:text-blue-300">
          + Add
        </button>
      </div>

      {Object.entries(grouped).map(([source, cals]) => (
        <div key={source} className="space-y-1">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-1">
            {source}
          </div>
          {cals.map((calendar) => (
            <CalendarItem
              key={calendar.id}
              calendar={calendar}
              isVisible={visibleCalendarIds.has(calendar.id)}
              onToggle={() => onToggleVisibility(calendar.id)}
              onEdit={() => onEditCalendar(calendar)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

### 3. Calendar Views

#### WeekView.tsx
```typescript
interface WeekViewProps {
  date: Date;
}

export function WeekView({ date }: WeekViewProps) {
  const { events, visibleCalendarIds, onEventClick, onTimeSlotClick } = useCalendarStore();
  const weekStart = startOfWeek(date);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(date)
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Filter and position events
  const visibleEvents = events.filter(e => visibleCalendarIds.has(e.calendarId));
  const weekEvents = visibleEvents.filter(e =>
    isWithinInterval(new Date(e.startTime), { start: weekStart, end: endOfWeek(date) }) ||
    isWithinInterval(new Date(e.endTime), { start: weekStart, end: endOfWeek(date) })
  );

  const allDayEvents = weekEvents.filter(e => e.isAllDay);
  const timedEvents = weekEvents.filter(e => !e.isAllDay);

  return (
    <div className="h-full flex flex-col">
      {/* Header with day names */}
      <div className="flex border-b border-white/10">
        <div className="w-16 flex-shrink-0" /> {/* Time gutter */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'flex-1 text-center py-2 border-l border-white/5',
              isSameDay(day, new Date()) && 'bg-blue-500/10'
            )}
          >
            <div className="text-xs text-white/50">{format(day, 'EEE')}</div>
            <div className={cn(
              'text-lg',
              isSameDay(day, new Date()) ? 'text-blue-400 font-bold' : 'text-white'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-white/10">
          <div className="w-16 flex-shrink-0 text-xs text-white/40 p-1">
            all-day
          </div>
          <div className="flex-1 relative min-h-[40px]">
            {allDayEvents.map((event) => (
              <AllDayEvent
                key={event.id}
                event={event}
                weekDays={weekDays}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-[1440px]"> {/* 24 hours * 60px */}
          {/* Time labels */}
          <div className="w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-xs text-white/40 pr-2 text-right -mt-2"
              >
                {format(setHours(new Date(), hour), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 relative border-l border-white/5"
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] border-b border-white/5"
                  onClick={() => onTimeSlotClick(day, hour)}
                />
              ))}

              {/* Events for this day */}
              {timedEvents
                .filter(e => isSameDay(new Date(e.startTime), day))
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    style={calculateEventPosition(event)}
                    onClick={() => onEventClick(event)}
                  />
                ))}

              {/* Current time indicator */}
              {isSameDay(day, new Date()) && (
                <CurrentTimeIndicator />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### MonthView.tsx
```typescript
interface MonthViewProps {
  date: Date;
}

export function MonthView({ date }: MonthViewProps) {
  const { events, visibleCalendarIds, onEventClick, onDateClick } = useCalendarStore();
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = chunk(days, 7);

  const visibleEvents = events.filter(e => visibleCalendarIds.has(e.calendarId));

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-white/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 grid grid-rows-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-white/5">
            {week.map((day) => {
              const dayEvents = visibleEvents.filter(e =>
                isSameDay(new Date(e.startTime), day) ||
                (e.isAllDay && isWithinInterval(day, {
                  start: new Date(e.startTime),
                  end: new Date(e.endTime)
                }))
              );

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[100px] p-1 border-r border-white/5 cursor-pointer',
                    'hover:bg-white/5 transition-colors',
                    !isSameMonth(day, date) && 'bg-black/20',
                    isSameDay(day, new Date()) && 'bg-blue-500/10'
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div className={cn(
                    'w-6 h-6 text-sm flex items-center justify-center rounded-full',
                    isSameDay(day, new Date()) && 'bg-blue-500 text-white'
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                        style={{
                          backgroundColor: `${event.color}30`,
                          color: event.color
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {!event.isAllDay && (
                          <span className="font-medium">
                            {format(new Date(event.startTime), 'h:mm ')}
                          </span>
                        )}
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-white/50 px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 4. Event Components

#### EventCard.tsx
```typescript
interface EventCardProps {
  event: CalendarEvent;
  style: React.CSSProperties;
  onClick: () => void;
  compact?: boolean;
}

export function EventCard({ event, style, onClick, compact }: EventCardProps) {
  return (
    <motion.div
      layoutId={`event-${event.id}`}
      className={cn(
        'absolute left-1 right-1 rounded px-1.5 py-1 cursor-pointer overflow-hidden',
        'border-l-2 hover:brightness-110 transition-all'
      )}
      style={{
        ...style,
        backgroundColor: `${event.color}20`,
        borderLeftColor: event.color,
      }}
      onClick={onClick}
    >
      <div className="text-xs font-medium truncate" style={{ color: event.color }}>
        {event.title}
      </div>
      {!compact && (
        <div className="text-xs text-white/60 truncate">
          {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
        </div>
      )}
      {event.location && !compact && (
        <div className="text-xs text-white/40 truncate flex items-center gap-1">
          <MapPinIcon className="w-3 h-3" />
          {event.location}
        </div>
      )}
    </motion.div>
  );
}
```

#### EventPopover.tsx
```typescript
export function EventPopover() {
  const {
    popoverEvent: event,
    popoverPosition,
    closePopover,
    openEventModal,
    deleteEvent
  } = useCalendarStore();

  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-50 w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl"
      style={{
        top: popoverPosition.y,
        left: popoverPosition.x,
      }}
    >
      {/* Header */}
      <div
        className="h-2 rounded-t-xl"
        style={{ backgroundColor: event.color }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <div className="flex gap-1">
            <IconButton
              icon={<PencilIcon />}
              size="sm"
              onClick={() => openEventModal(event)}
            />
            <IconButton
              icon={<TrashIcon />}
              size="sm"
              onClick={() => deleteEvent(event.id)}
            />
            <IconButton
              icon={<XIcon />}
              size="sm"
              onClick={closePopover}
            />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {/* Time */}
          <div className="flex items-center gap-2 text-white/70">
            <ClockIcon className="w-4 h-4" />
            {event.isAllDay ? (
              <span>All day</span>
            ) : (
              <span>
                {format(new Date(event.startTime), 'EEE, MMM d, h:mm a')} -{' '}
                {format(new Date(event.endTime), 'h:mm a')}
              </span>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-white/70">
              <MapPinIcon className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Video link */}
          {event.videoLink && (
            <div className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-blue-400" />
              <a
                href={event.videoLink}
                target="_blank"
                rel="noopener"
                className="text-blue-400 hover:underline"
              >
                Join video call
              </a>
            </div>
          )}

          {/* Calendar */}
          <div className="flex items-center gap-2 text-white/70">
            <CalendarIcon className="w-4 h-4" />
            <span>{event.calendarName}</span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-white/10 text-white/60">
              {event.description}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

---

### 5. Event Forms

#### EventModal.tsx
```typescript
export function EventModal() {
  const {
    editingEvent,
    closeEventModal,
    saveEvent,
    isSaving
  } = useCalendarStore();

  const [form, setForm] = useState<EventFormData>(() =>
    editingEvent || getDefaultEventData()
  );

  const updateForm = (updates: Partial<EventFormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEvent(form);
    closeEventModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h2>
            <IconButton icon={<XIcon />} onClick={closeEventModal} />
          </div>

          <div className="p-4 space-y-4">
            {/* Title */}
            <input
              type="text"
              placeholder="Add title"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              className="w-full text-xl bg-transparent text-white placeholder-white/40 outline-none"
              autoFocus
            />

            {/* Date/Time */}
            <div className="flex items-center gap-4">
              <ClockIcon className="w-5 h-5 text-white/50" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={format(new Date(form.startTime), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      const current = new Date(form.startTime);
                      current.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
                      updateForm({ startTime: current.toISOString() });
                    }}
                    className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                  />
                  {!form.isAllDay && (
                    <>
                      <input
                        type="time"
                        value={format(new Date(form.startTime), 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(form.startTime);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          updateForm({ startTime: newDate.toISOString() });
                        }}
                        className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                      />
                      <span className="text-white/50">to</span>
                      <input
                        type="time"
                        value={format(new Date(form.endTime), 'HH:mm')}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(form.endTime);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          updateForm({ endTime: newDate.toISOString() });
                        }}
                        className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                      />
                    </>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={form.isAllDay}
                    onChange={(e) => updateForm({ isAllDay: e.target.checked })}
                    className="rounded"
                  />
                  All day
                </label>
              </div>
            </div>

            {/* Recurrence */}
            <RecurrenceEditor
              value={form.recurrence}
              onChange={(recurrence) => updateForm({ recurrence })}
            />

            {/* Location */}
            <div className="flex items-center gap-4">
              <MapPinIcon className="w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Add location"
                value={form.location || ''}
                onChange={(e) => updateForm({ location: e.target.value })}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
              />
            </div>

            {/* Video link */}
            <div className="flex items-center gap-4">
              <VideoIcon className="w-5 h-5 text-white/50" />
              <input
                type="url"
                placeholder="Add video conferencing link"
                value={form.videoLink || ''}
                onChange={(e) => updateForm({ videoLink: e.target.value })}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex items-start gap-4">
              <NotesIcon className="w-5 h-5 text-white/50 mt-1" />
              <textarea
                placeholder="Add description"
                value={form.description || ''}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={3}
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg p-2 outline-none resize-none"
              />
            </div>

            {/* Calendar selector */}
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-5 h-5 text-white/50" />
              <CalendarSelector
                value={form.calendarId}
                onChange={(calendarId) => updateForm({ calendarId })}
              />
            </div>

            {/* Reminder */}
            <ReminderEditor
              value={form.reminders}
              onChange={(reminders) => updateForm({ reminders })}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
            <button
              type="button"
              className="px-4 py-2 text-white/70 hover:text-white"
              onClick={closeEventModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.title}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
```

#### RecurrenceEditor.tsx
```typescript
interface RecurrenceEditorProps {
  value: RecurrenceRule | null;
  onChange: (value: RecurrenceRule | null) => void;
}

const PRESETS = [
  { label: 'Does not repeat', value: null },
  { label: 'Daily', value: { frequency: 'daily' } },
  { label: 'Weekly', value: { frequency: 'weekly' } },
  { label: 'Monthly', value: { frequency: 'monthly' } },
  { label: 'Yearly', value: { frequency: 'yearly' } },
  { label: 'Custom...', value: 'custom' },
];

export function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
  const [showCustom, setShowCustom] = useState(false);

  if (showCustom) {
    return (
      <div className="flex items-start gap-4">
        <RepeatIcon className="w-5 h-5 text-white/50 mt-1" />
        <div className="flex-1 space-y-3 bg-white/5 rounded-lg p-3">
          {/* Frequency */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Repeat every</span>
            <input
              type="number"
              min="1"
              value={value?.interval || 1}
              onChange={(e) => onChange({ ...value, interval: parseInt(e.target.value) })}
              className="w-16 bg-white/10 text-white rounded px-2 py-1 text-sm"
            />
            <select
              value={value?.frequency || 'weekly'}
              onChange={(e) => onChange({ ...value, frequency: e.target.value as any })}
              className="bg-white/10 text-white rounded px-2 py-1 text-sm"
            >
              <option value="daily">days</option>
              <option value="weekly">weeks</option>
              <option value="monthly">months</option>
              <option value="yearly">years</option>
            </select>
          </div>

          {/* Weekly: day of week selection */}
          {value?.frequency === 'weekly' && (
            <div className="flex gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full text-sm',
                    value.byDayOfWeek?.includes(i)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  )}
                  onClick={() => {
                    const current = value.byDayOfWeek || [];
                    const updated = current.includes(i)
                      ? current.filter(d => d !== i)
                      : [...current, i];
                    onChange({ ...value, byDayOfWeek: updated });
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {/* End condition */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Ends</span>
            <select
              value={value?.until ? 'until' : value?.count ? 'count' : 'never'}
              onChange={(e) => {
                const type = e.target.value;
                if (type === 'never') onChange({ ...value, until: undefined, count: undefined });
                if (type === 'count') onChange({ ...value, until: undefined, count: 10 });
                if (type === 'until') onChange({ ...value, count: undefined, until: addMonths(new Date(), 1).toISOString() });
              }}
              className="bg-white/10 text-white rounded px-2 py-1 text-sm"
            >
              <option value="never">Never</option>
              <option value="count">After</option>
              <option value="until">On date</option>
            </select>
            {value?.count && (
              <input
                type="number"
                min="1"
                value={value.count}
                onChange={(e) => onChange({ ...value, count: parseInt(e.target.value) })}
                className="w-16 bg-white/10 text-white rounded px-2 py-1 text-sm"
              />
            )}
            {value?.until && (
              <input
                type="date"
                value={format(new Date(value.until), 'yyyy-MM-dd')}
                onChange={(e) => onChange({ ...value, until: new Date(e.target.value).toISOString() })}
                className="bg-white/10 text-white rounded px-2 py-1 text-sm"
              />
            )}
          </div>

          <button
            type="button"
            className="text-sm text-blue-400 hover:text-blue-300"
            onClick={() => setShowCustom(false)}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <RepeatIcon className="w-5 h-5 text-white/50" />
      <select
        value={JSON.stringify(value)}
        onChange={(e) => {
          const parsed = JSON.parse(e.target.value);
          if (parsed === 'custom') {
            setShowCustom(true);
            onChange({ frequency: 'weekly' });
          } else {
            onChange(parsed);
          }
        }}
        className="bg-white/10 text-white rounded px-2 py-1 text-sm"
      >
        {PRESETS.map((preset) => (
          <option key={preset.label} value={JSON.stringify(preset.value)}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## Utility Functions

```typescript
// client/src/utils/ibird/calendar.ts

export function calculateEventPosition(event: CalendarEvent): React.CSSProperties {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const duration = endMinutes - startMinutes;

  return {
    top: `${startMinutes}px`,
    height: `${Math.max(duration, 20)}px`,
  };
}

export function getOverlappingEvents(events: CalendarEvent[]): Map<string, { column: number; totalColumns: number }> {
  // Sort by start time
  const sorted = [...events].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const positions = new Map<string, { column: number; totalColumns: number }>();
  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eventStart = new Date(event.startTime).getTime();
    const eventEnd = new Date(event.endTime).getTime();

    // Find first column where event doesn't overlap
    let columnIndex = columns.findIndex(column => {
      const lastEvent = column[column.length - 1];
      return new Date(lastEvent.endTime).getTime() <= eventStart;
    });

    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push([]);
    }

    columns[columnIndex].push(event);
    positions.set(event.id, { column: columnIndex, totalColumns: 0 });
  }

  // Update total columns
  const totalColumns = columns.length;
  positions.forEach((pos) => {
    pos.totalColumns = totalColumns;
  });

  return positions;
}

export function expandRecurringEvents(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.recurrence) return [event];

  const instances: CalendarEvent[] = [];
  const rule = event.recurrence;
  let current = new Date(event.startTime);
  const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
  let count = 0;

  while (current <= rangeEnd && (!rule.until || current <= new Date(rule.until))) {
    if (current >= rangeStart) {
      // Check if this instance is in exceptions
      const dateKey = format(current, 'yyyy-MM-dd');
      if (!event.recurrenceExceptions?.includes(dateKey)) {
        instances.push({
          ...event,
          id: `${event.id}-${dateKey}`,
          startTime: current.toISOString(),
          endTime: new Date(current.getTime() + duration).toISOString(),
          isRecurrenceInstance: true,
          originalEventId: event.id,
        });
      }
    }

    // Advance to next occurrence
    const interval = rule.interval || 1;
    switch (rule.frequency) {
      case 'daily':
        current = addDays(current, interval);
        break;
      case 'weekly':
        current = addWeeks(current, interval);
        break;
      case 'monthly':
        current = addMonths(current, interval);
        break;
      case 'yearly':
        current = addYears(current, interval);
        break;
    }

    count++;
    if (rule.count && count >= rule.count) break;
  }

  return instances;
}
```

---

## Next Document

Continue to [06-FRONTEND-APPOINTMENTS.md](./06-FRONTEND-APPOINTMENTS.md) for Appointments module components.
