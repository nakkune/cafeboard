import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, CalendarDays, Zap, Trash2 } from 'lucide-react';
import { eventApi, type Event } from '../api';
import { useAuthStore } from '../store/auth';
import { useTranslation } from 'react-i18next';

export function Calendar() {
  const { user, isAuthenticated } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: true,
    color: '#6366f1', // indigo-500 default
  });
  const { t, i18n } = useTranslation();

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    try {
      const response = await eventApi.getEvents(startDate, endDate);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDate = new Date(year, month, day);
    const targetTime = targetDate.getTime();

    return events.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;

      const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

      return targetTime >= startTime && targetTime <= endTime;
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0);
    setSelectedDate(date);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) return;

    const startDateValue = newEvent.startDate;
    const endDateValue = newEvent.endDate && newEvent.endDate >= startDateValue
      ? newEvent.endDate
      : startDateValue;

    try {
      await eventApi.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        startDate: startDateValue,
        endDate: endDateValue,
        allDay: newEvent.allDay || false,
        color: newEvent.color,
      });
      setShowModal(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        allDay: true,
        color: '#6366f1',
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;
      await eventApi.deleteEvent(id);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = [t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat')];
  const monthNames = [
    t('calendar.jan'), t('calendar.feb'), t('calendar.mar'), t('calendar.apr'), t('calendar.may'), t('calendar.jun'),
    t('calendar.jul'), t('calendar.aug'), t('calendar.sep'), t('calendar.oct'), t('calendar.nov'), t('calendar.dec')
  ];

  const PRESET_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-10rem)]">
        {/* 프리미엄 헤더 영역 */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-white">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">{t('calendar.title') || '팀 캘린더'}</h1>
            </div>
            <p className="text-sm font-semibold text-slate-400 pl-1">
              중요한 일정과 이벤트를 체계적으로 관리하세요.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {isAuthenticated && (
              <button
                onClick={() => {
                  if (selectedDate) {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    setNewEvent({ ...newEvent, startDate: dateStr, endDate: dateStr });
                  } else {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setNewEvent({ ...newEvent, startDate: todayStr, endDate: todayStr });
                  }
                  setShowModal(true);
                }}
                className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                {t('calendar.addEvent') || '일정 추가'}
              </button>
            )}
          </div>
        </div>

        {/* 캘린더 메인 컨테이너 (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-6 lg:p-10 mb-8 z-20">

          {/* 달 이동 컨트롤 및 타이틀 */}
          <div className="flex justify-between items-center mb-10 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
            <button
              onClick={prevMonth}
              className="p-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm border border-slate-100 text-slate-500"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {i18n.language === 'ko'
                ? `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
            <button
              onClick={nextMonth}
              className="p-3 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm border border-slate-100 text-slate-500"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:gap-4">
            {weekDays.map(day => (
              <div key={day} className="flex items-center justify-center font-black text-slate-400 py-1.5 sm:py-3 text-[10px] sm:text-xs uppercase tracking-widest bg-slate-50/80 rounded-lg sm:rounded-xl">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}

            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              const isSelected = selectedDate &&
                day === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[140px] rounded-xl sm:rounded-2xl p-1 sm:p-2.5 transition-all duration-300 relative group overflow-hidden flex flex-col ${day
                      ? isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md shadow-indigo-500/10 cursor-pointer'
                        : isToday
                          ? 'bg-blue-50/50 border-2 border-blue-400 cursor-pointer'
                          : 'bg-white border border-slate-100 hover:border-indigo-300 hover:shadow-md sm:hover:shadow-lg sm:hover:-translate-y-1 cursor-pointer'
                      : 'bg-transparent sm:bg-slate-50/30'
                    }`}
                  onClick={() => day && handleDayClick(day)}
                >
                  {day && (
                    <>
                      <div className={`text-[10px] sm:text-sm font-black mb-1 sm:mb-1.5 w-5 h-5 sm:w-8 sm:h-8 flex flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${isSelected
                          ? 'bg-indigo-500 text-white'
                          : isToday
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-600 group-hover:text-indigo-600 sm:group-hover:bg-indigo-50 transition-colors'
                        }`}>
                        {day}
                      </div>

                      <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-hidden custom-scrollbar">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={`cal-evt-${event.id}`}
                            className="text-[9px] sm:text-[11px] font-bold px-1 sm:px-2 py-0.5 sm:py-1.5 rounded-[4px] sm:rounded-lg truncate transition-opacity flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 border border-white/20"
                            style={{
                              backgroundColor: event.color || '#6366f1',
                              color: 'white',
                              boxShadow: `0 2px 4px ${(event.color || '#6366f1')}30`
                            }}
                          >
                            <span className="hidden sm:block w-1 h-1 rounded-full bg-white/70 flex-shrink-0"></span>
                            <span className="hidden sm:inline truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                      {dayEvents.length > 3 && (
                        <div className="absolute top-1 sm:top-3 right-1 sm:right-3 text-[8px] sm:text-[10px] font-black text-slate-400 bg-slate-100/80 sm:bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md backdrop-blur-sm">
                          +{dayEvents.length - 3}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택한 날짜의 일정 목록 (상세 뷰) */}
        {selectedDate && (
          <div className="bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-lg">
                  {selectedDate.getDate()}
                </div>
                <h3 className="text-2xl font-black text-slate-800">
                  {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 일정
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">{t('calendar.noEvents') || '이벤트가 없습니다.'}</p>
                </div>
              ) : (
                getEventsForDay(selectedDate.getDate()).map((event, idx) => (
                  <div
                    key={`detail-evt-${event.id || idx}`}
                    className="flex justify-between items-center p-5 rounded-2xl group transition-all duration-300 hover:shadow-md border border-slate-100/50 relative overflow-hidden"
                    style={{ backgroundColor: `${event.color || '#6366f1'}0A` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: event.color || '#6366f1' }}></div>
                    <div className="pl-3">
                      <div className="font-black text-lg text-slate-800 mb-1 flex items-center gap-2">
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="text-sm font-medium text-slate-500 mb-2">{event.description}</div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white/50 inline-flex px-2 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5" />
                        {event.allDay ? t('calendar.allDay') || '하루 종일' : `${event.startDate} ~ ${event.endDate || ''}`}
                      </div>
                    </div>
                    {isAuthenticated && event.id && event.authorId === user?.id && (
                      <button
                        onClick={() => handleDeleteEvent(event.id!)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                        title="일정 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이벤트 작성 프리미엄 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">{t('calendar.addEvent') || '새 일정 만들기'}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 bg-slate-50/30">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('calendar.title') || '일정 제목'}</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="block w-full rounded-xl border-slate-200 bg-white px-4 py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm"
                  placeholder="무슨 일정인가요?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('calendar.description') || '설명 (선택)'}</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="block w-full rounded-xl border-slate-200 bg-white px-4 py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm custom-scrollbar"
                  rows={3}
                  placeholder="일정에 대한 간단한 설명..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('calendar.date') || '시작일'}</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="block w-full rounded-xl border-slate-200 bg-white px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{t('calendar.endDate') || '종료일'}</label>
                  <input
                    type="date"
                    min={newEvent.startDate}
                    value={newEvent.endDate}
                    onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="block w-full rounded-xl border-slate-200 bg-white px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm text-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <input
                  type="checkbox"
                  id="allDayCheckbox"
                  checked={newEvent.allDay}
                  onChange={e => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="allDayCheckbox" className="text-sm font-bold text-slate-700 cursor-pointer">{t('calendar.allDay') || '하루 종일'}</label>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">{t('calendar.color') || '테마 색상'}</label>
                <div className="flex gap-3">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newEvent.color === color ? 'ring-offset-2 ring-2 scale-110 shadow-md' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    >
                      {newEvent.color === color && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={newEvent.color}
                    onChange={e => setNewEvent({ ...newEvent, color: e.target.value })}
                    className="w-10 h-10 rounded-full cursor-pointer bg-white p-1 border border-slate-200"
                    title="커스텀 색상 선택"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[2.5rem]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t('common.cancel') || '취소'}
              </button>
              <button
                onClick={handleAddEvent}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
