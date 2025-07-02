"use client";

import React, { useState } from 'react';

interface CalendarProps {
  availableDates: string[]; // Array of YYYY-MM-DD date strings
  selectedDate: string;
  onDateSelect: (date: string) => void;
  fullyBookedDates: string[]; // Array of YYYY-MM-DD date strings that are fully booked
}

const Calendar: React.FC<CalendarProps> = ({ 
  availableDates, 
  selectedDate, 
  onDateSelect, 
  fullyBookedDates 
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth()));

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // Get first day of the month and number of days
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

  // Generate calendar days
  const calendarDays = [];
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    calendarDays.push(new Date(date));
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDateString = (date: Date) => {
    // Use local timezone formatting to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateAvailable = (date: Date) => {
    const dateString = formatDateString(date);
    return availableDates.includes(dateString);
  };

  const isDateFullyBooked = (date: Date) => {
    const dateString = formatDateString(date);
    return fullyBookedDates.includes(dateString);
  };

  const isDateSelected = (date: Date) => {
    return formatDateString(date) === selectedDate;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPastDate = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // Calculate the minimum bookable date (3 days from today)
    const minBookableDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    return dateOnly < minBookableDate;
  };

  const canGoToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return prevMonth >= currentMonthStart;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800 border border-gray-600 rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoToPreviousMonth()}
          className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-white">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white hover:bg-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateString = formatDateString(date);
          const available = isDateAvailable(date);
          const fullyBooked = isDateFullyBooked(date);
          const selected = isDateSelected(date);
          const currentMonth = isCurrentMonth(date);
          const past = isPastDate(date);
          const clickable = available && !fullyBooked && !past && currentMonth;

          return (
            <button
              key={index}
              onClick={() => clickable ? onDateSelect(dateString) : null}
              disabled={!clickable}
              className={`
                relative p-2 text-sm font-medium rounded-lg transition-all duration-200 min-h-[40px] flex items-center justify-center
                ${!currentMonth 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : past 
                  ? 'text-gray-500 cursor-not-allowed'
                  : available && !fullyBooked
                  ? selected
                    ? 'bg-[#3881ff] text-white font-bold shadow-lg ring-2 ring-[#3881ff]/50'
                    : 'text-white bg-gray-700 hover:bg-[#3881ff] hover:text-white border border-gray-600 hover:border-[#3881ff]'
                  : fullyBooked && available
                  ? 'text-gray-400 bg-gray-700/50 border border-gray-600 cursor-not-allowed'
                  : 'text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {date.getDate()}
              {fullyBooked && available && currentMonth && !past && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-800"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#3881ff] rounded"></div>
          <span>選択済み</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-700 border border-gray-600 rounded"></div>
          <span>予約可能</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-700/50 border border-gray-600 rounded relative">
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <span>満席</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
