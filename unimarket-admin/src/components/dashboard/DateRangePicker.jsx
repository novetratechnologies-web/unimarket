import React, { useState, useEffect, useRef } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Check,
  Clock,
  Download
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

const PRESET_RANGES = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      return {
        start: new Date(today.setHours(0, 0, 0, 0)),
        end: new Date(today.setHours(23, 59, 59, 999))
      }
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        start: new Date(yesterday.setHours(0, 0, 0, 0)),
        end: new Date(yesterday.setHours(23, 59, 59, 999))
      }
    }
  },
  {
    label: 'Last 7 Days',
    getValue: () => ({
      start: subDays(new Date(), 7),
      end: new Date()
    })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      start: subDays(new Date(), 30),
      end: new Date()
    })
  },
  {
    label: 'Last 90 Days',
    getValue: () => ({
      start: subDays(new Date(), 90),
      end: new Date()
    })
  },
  {
    label: 'This Week',
    getValue: () => ({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 })
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  },
  {
    label: 'Last Month',
    getValue: () => {
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      }
    }
  },
  {
    label: 'This Year',
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date())
    })
  },
  {
    label: 'All Time',
    getValue: () => ({
      start: new Date(2020, 0, 1),
      end: new Date()
    })
  }
]

const DateRangePicker = ({ 
  value, 
  onChange, 
  className = '',
  align = 'left',
  showPresets = true,
  showCompare = false,
  maxDays = 365,
  minDate = new Date(2020, 0, 1),
  maxDate = new Date()
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [startDate, setStartDate] = useState(value?.start || new Date())
  const [endDate, setEndDate] = useState(value?.end || new Date())
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareStartDate, setCompareStartDate] = useState(null)
  const [compareEndDate, setCompareEndDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState('days') // days, months, years
  
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (value?.start && value?.end) {
      setStartDate(value.start)
      setEndDate(value.end)
    }
  }, [value])

  const handlePresetClick = (preset) => {
    const range = preset.getValue()
    setStartDate(range.start)
    setEndDate(range.end)
    setSelectedPreset(preset.label)
    setCurrentMonth(range.start)
  }

  const handleApply = () => {
    onChange({ start: startDate, end: endDate })
    if (compareMode && compareStartDate && compareEndDate) {
      onChange({ 
        start: startDate, 
        end: endDate,
        compareStart: compareStartDate,
        compareEnd: compareEndDate
      })
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setStartDate(new Date())
    setEndDate(new Date())
    setSelectedPreset(null)
    setCompareMode(false)
    setCompareStartDate(null)
    setCompareEndDate(null)
    onChange({ start: new Date(), end: new Date() })
  }

  const handleQuickSelect = (days) => {
    const end = new Date()
    const start = subDays(end, days)
    setStartDate(start)
    setEndDate(end)
    setSelectedPreset(`Last ${days} Days`)
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday
    const daysInMonth = lastDay.getDate()
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false
    return date >= startDate && date <= endDate
  }

  const isDateSelected = (date) => {
    return date.toDateString() === startDate?.toDateString() ||
           date.toDateString() === endDate?.toDateString()
  }

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(null)
    } else if (date < startDate) {
      setStartDate(date)
      setEndDate(startDate)
    } else {
      setEndDate(date)
    }
  }

  const formatDateRange = () => {
    if (!value?.start || !value?.end) return 'Select date range'
    return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`
  }

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    if (view === 'days') {
      newMonth.setMonth(newMonth.getMonth() + direction)
    } else if (view === 'months') {
      newMonth.setFullYear(newMonth.getFullYear() + direction)
    } else if (view === 'years') {
      newMonth.setFullYear(newMonth.getFullYear() + direction * 10)
    }
    setCurrentMonth(newMonth)
  }

  const renderCalendar = () => {
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    const days = generateCalendarDays()

    return (
      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          
          <button
            onClick={() => setView('months')}
            className="text-sm font-medium text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </button>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isInRange = isDateInRange(day.date)
            const isSelected = isDateSelected(day.date)
            const isToday = day.date.toDateString() === new Date().toDateString()
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day.date)}
                disabled={day.date < minDate || day.date > maxDate}
                className={`
                  relative p-2 text-sm rounded-lg transition-all
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isInRange ? 'bg-primary-50' : 'hover:bg-gray-100'}
                  ${isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                  ${isToday && !isSelected ? 'border border-primary-300' : ''}
                  ${day.date < minDate || day.date > maxDate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="relative z-10">{day.date.getDate()}</span>
                {isInRange && !isSelected && (
                  <div className="absolute inset-0 bg-primary-50 rounded-lg" />
                )}
              </button>
            )
          })}
        </div>

        {/* Quick Selects */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickSelect(7)}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              7D
            </button>
            <button
              onClick={() => handleQuickSelect(30)}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              30D
            </button>
            <button
              onClick={() => handleQuickSelect(90)}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              90D
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Today
          </button>
        </div>
      </div>
    )
  }

  const renderMonthsView = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          
          <button
            onClick={() => setView('years')}
            className="text-sm font-medium text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {currentMonth.getFullYear()}
          </button>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            const date = new Date(currentMonth.getFullYear(), index, 1)
            const isSelected = startDate && date.getMonth() === startDate.getMonth() && 
                              date.getFullYear() === startDate.getFullYear()
            
            return (
              <button
                key={month}
                onClick={() => {
                  setCurrentMonth(date)
                  setView('days')
                }}
                className={`
                  p-3 text-sm rounded-lg transition-all
                  ${isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                {month}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderYearsView = () => {
    const currentYear = currentMonth.getFullYear()
    const startYear = Math.floor(currentYear / 10) * 10
    const years = Array.from({ length: 12 }, (_, i) => startYear + i - 1)

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          
          <span className="text-sm font-medium text-gray-900">
            {startYear} - {startYear + 9}
          </span>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => {
            const isSelected = startDate && startDate.getFullYear() === year
            
            return (
              <button
                key={year}
                onClick={() => {
                  setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))
                  setView('months')
                }}
                className={`
                  p-3 text-sm rounded-lg transition-all
                  ${isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                  ${year < minDate.getFullYear() || year > maxDate.getFullYear() ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={year < minDate.getFullYear() || year > maxDate.getFullYear()}
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center px-4 py-2 border border-gray-300 rounded-lg 
          hover:bg-gray-50 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${className}
          ${isOpen ? 'bg-gray-50 border-primary-500' : 'bg-white'}
        `}
      >
        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
        <span className="text-sm text-gray-700">{formatDateRange()}</span>
        {value?.start && value?.end && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="ml-2 p-0.5 hover:bg-gray-200 rounded-full"
          >
            <X className="h-3 w-3 text-gray-500" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 mt-2 bg-white rounded-lg shadow-xl border border-gray-200
            ${align === 'right' ? 'right-0' : 'left-0'}
            ${showCompare ? 'w-[700px]' : 'w-[600px]'}
          `}
        >
          <div className="flex divide-x divide-gray-200">
            {/* Presets */}
            {showPresets && (
              <div className="w-40 p-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Presets
                </h3>
                <div className="space-y-1">
                  {PRESET_RANGES.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className={`
                        w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                        ${selectedPreset === preset.label 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Date Range Summary */}
                {startDate && endDate && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Selected Range</p>
                    <p className="text-xs font-medium text-gray-900">
                      {format(startDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs font-medium text-gray-900">
                      {format(endDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar */}
            <div className="flex-1">
              {/* Calendar Views */}
              {view === 'days' && renderCalendar()}
              {view === 'months' && renderMonthsView()}
              {view === 'years' && renderYearsView()}
            </div>

            {/* Comparison Panel */}
            {showCompare && compareMode && (
              <div className="w-48 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compare to
                  </h3>
                  <button
                    onClick={() => setCompareMode(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={compareStartDate ? format(compareStartDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCompareStartDate(new Date(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={compareEndDate ? format(compareEndDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setCompareEndDate(new Date(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Presets</h4>
                    <div className="space-y-1">
                      <button className="w-full text-left px-2 py-1 text-xs hover:bg-gray-200 rounded">
                        Previous Period
                      </button>
                      <button className="w-full text-left px-2 py-1 text-xs hover:bg-gray-200 rounded">
                        Last Year
                      </button>
                      <button className="w-full text-left px-2 py-1 text-xs hover:bg-gray-200 rounded">
                        Custom
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center space-x-4">
              {showCompare && !compareMode && (
                <button
                  onClick={() => setCompareMode(true)}
                  className="text-xs text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Compare
                </button>
              )}
              <button
                onClick={handleClear}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center"
              >
                <Check className="h-3 w-3 mr-1" />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker