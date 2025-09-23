// DatePickerStyle Component
import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@mantine/core';
import {
    DatePickerInput,
    TimeInput,
    DateTimePicker,
    TimeGrid,
    getTimeRange
} from '@mantine/dates';
import dayjs from 'dayjs';
import { IDatePickerStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineRadius, castMantineSize } from '../../../../../../utils/style-field-extractor';

// Set dayjs locale if specified
const setDayjsLocale = (locale: string) => {
    try {
        if (locale && locale !== 'en') {
            // Import and set locale dynamically
            import(`dayjs/locale/${locale}`).then(() => {
                dayjs.locale(locale);
            }).catch(() => {
                console.warn(`Failed to load dayjs locale: ${locale}`);
            });
        } else {
            dayjs.locale('en');
        }
    } catch (error) {
        console.warn('Error setting dayjs locale:', error);
    }
};

interface IDatePickerStyleProps {
    style: IDatePickerStyle;
}

const DatePickerStyle: React.FC<IDatePickerStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const name = style.name?.content || `section-${style.id}`;
    const value = style.value?.content;
    const isRequired = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    const description = style.description?.content || '';

    // DatePicker-specific fields
    const pickerType = style.mantine_datepicker_type?.content || 'date';
    // format: Used for UI display formatting (valueFormat prop in components)
    const format = style.mantine_datepicker_format?.content;
    const locale = style.mantine_datepicker_locale?.content || 'en';
    const placeholder = style.mantine_datepicker_placeholder?.content;
    const minDateStr = style.mantine_datepicker_min_date?.content;
    const maxDateStr = style.mantine_datepicker_max_date?.content;
    const firstDayOfWeek = parseInt((style as any).mantine_datepicker_first_day_of_week?.content || '1') as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const weekendDaysStr = style.mantine_datepicker_weekend_days?.content || '[0,6]';
    const clearable = style.mantine_datepicker_clearable?.content === '1';
    const allowDeselect = style.mantine_datepicker_allow_deselect?.content === '1';
    const readonly = style.mantine_datepicker_readonly?.content === '1';
    const withTimeGrid = style.mantine_datepicker_with_time_grid?.content === '1';
    const consistentWeeks = style.mantine_datepicker_consistent_weeks?.content === '1';
    // hideOutsideDates: Hides dates from previous/next months that appear in the current month's calendar view
    const hideOutsideDates = style.mantine_datepicker_hide_outside_dates?.content === '1';
    // hideWeekends: Hides Saturday and Sunday from the calendar, useful for business applications
    const hideWeekends = style.mantine_datepicker_hide_weekends?.content === '1';
    const timeStep = parseInt((style as any).mantine_datepicker_time_step?.content || '15');
    const timeFormat = style.mantine_datepicker_time_format?.content || '24';
    // timeStep is used with TimeGrid interval generation when withTimeGrid is enabled
    // dateFormat: Used for form submission and storage (separate from display format)
    const dateFormat = style.mantine_datepicker_date_format?.content || 'YYYY-MM-DD';
    const timeGridConfigStr = style.mantine_datepicker_time_grid_config?.content;
    const withSeconds = style.mantine_datepicker_with_seconds?.content === '1';

    // Parse TimeGrid configuration
    let timeGridConfig: any = {};
    try {
        if (timeGridConfigStr) {
            timeGridConfig = JSON.parse(timeGridConfigStr);
        }
    } catch (e) {
        console.warn('Invalid time grid config JSON:', timeGridConfigStr);
    }

    // Mantine-specific fields
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Set dayjs locale for proper formatting
    useEffect(() => {
        setDayjsLocale(locale);
    }, [locale]);

    // Parse dates
    const minDate = minDateStr ? dayjs(minDateStr).toDate() : undefined;
    const maxDate = maxDateStr ? dayjs(maxDateStr).toDate() : undefined;

    // Parse weekend days
    let weekendDays: (0 | 1 | 2 | 3 | 4 | 5 | 6)[] = [0, 6];
    try {
        const parsed = JSON.parse(weekendDaysStr);
        weekendDays = parsed.map((day: number) => day as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    } catch (e) {
        console.warn('Invalid weekend days format:', weekendDaysStr);
    }

    // Determine if we should use Input.Wrapper or let the component handle labels itself
    const hasBuiltInLabels = label || description;

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formContextValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize state from form context or style configuration
    const [currentValue, setCurrentValue] = useState<Date | null>(() => {
        if (formContextValue !== null) {
            // Use form value if available
            try {
                return dayjs(formContextValue).toDate();
            } catch (error) {
                console.warn('Failed to parse form date value:', formContextValue);
            }
        }

        // Fallback to style configuration
        return value ? dayjs(value).toDate() : null;
    });

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formContextValue !== null) {
            try {
                setCurrentValue(dayjs(formContextValue).toDate());
            } catch (error) {
                console.warn('Failed to parse updated form date value:', formContextValue);
            }
        }
    }, [formContextValue]);

    // Handle value change for different component types
    const handleDateTimeChange = (value: Date | string | null) => {
        if (typeof value === 'string') {
            setCurrentValue(value ? dayjs(value).toDate() : null);
        } else {
            setCurrentValue(value);
        }
    };

    const handleTimeEventChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        if (value) {
            // Parse time considering the configured format (12/24 hour)
            let hours, minutes, seconds = 0;

            if (timeFormat === '12') {
                // Handle 12-hour format (e.g., "02:30 PM")
                const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
                if (timeMatch) {
                    hours = parseInt(timeMatch[1]);
                    minutes = parseInt(timeMatch[2]);
                    seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
                    const ampm = timeMatch[4]?.toUpperCase();

                    // Convert 12-hour to 24-hour format
                    if (ampm === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (ampm === 'AM' && hours === 12) {
                        hours = 0;
                    }
                } else {
                    // Fallback for invalid format
                    [hours, minutes] = value.split(':').map(Number);
                }
            } else {
                // Handle 24-hour format
                const timeParts = value.split(':').map(Number);
                hours = timeParts[0] || 0;
                minutes = timeParts[1] || 0;
                seconds = timeParts[2] || 0;
            }

            const date = currentValue || new Date();
            date.setHours(hours, minutes, seconds, 0);
            setCurrentValue(new Date(date));
        } else {
            setCurrentValue(null);
        }
    };

    // Determine the current value for form submission - use dateFormat for storage
    const formValue = currentValue ? dayjs(currentValue).format(dateFormat || 'YYYY-MM-DD') : '';

    // Create the appropriate date picker component based on type
    let datePickerElement: React.ReactElement;

    switch (pickerType) {
        case 'time':
            if (withTimeGrid) {
                // Use TimeGrid for predefined time slots
                const startTime = minDate ? dayjs(minDate).format('HH:mm') : '00:00';
                const endTime = maxDate ? dayjs(maxDate).format('HH:mm') : '23:59';

                // Generate time range based on timeStep
                const interval = `${Math.floor(timeStep / 60).toString().padStart(2, '0')}:${(timeStep % 60).toString().padStart(2, '0')}`;

                // Generate time data array
                const timeData = getTimeRange({
                    startTime,
                    endTime,
                    interval
                });

                // Format current value for TimeGrid (remove seconds if not needed)
                const gridValue = currentValue
                    ? dayjs(currentValue).format(withSeconds ? 'HH:mm:ss' : 'HH:mm')
                    : null;

                // Create TimeGrid props with configuration
                const timeGridProps: any = {
                    value: gridValue,
                    onChange: (value: string | null) => {
                        if (value) {
                            const [hours, minutes, seconds] = value.split(':').map(Number);
                            const date = currentValue || new Date();
                            date.setHours(hours, minutes || 0, seconds || 0, 0);
                            setCurrentValue(new Date(date));
                        } else {
                            // Handle deselection - note: TimeGrid may not support null values directly
                            // allowDeselect prop might not work as expected in current Mantine version
                            setCurrentValue(null);
                        }
                    },
                    data: timeData,
                    format: timeFormat === '12' ? '12h' : '24h',
                    withSeconds: withSeconds,
                    disabled: disabled,
                    className: cssClass,
                    style: { width: '100%' }
                };

                // Apply TimeGrid configuration if provided
                if (timeGridConfig.simpleGridProps) {
                    timeGridProps.simpleGridProps = timeGridConfig.simpleGridProps;
                }

                datePickerElement = <TimeGrid {...timeGridProps} />;
            } else {
                // Use TimeInput for free-form time entry
                const timeFormatPattern = withSeconds
                    ? (timeFormat === '12' ? 'hh:mm:ss A' : 'HH:mm:ss')
                    : (timeFormat === '12' ? 'hh:mm A' : 'HH:mm');

                datePickerElement = (
                    <TimeInput
                        value={currentValue ? dayjs(currentValue).format(timeFormatPattern) : ''}
                        onChange={handleTimeEventChange}
                        label={label}
                        placeholder={placeholder}
                        description={parse(sanitizeHtmlForParsing(description))}
                        required={isRequired}
                        disabled={disabled}
                        size={size}
                        radius={radius === 'none' ? 0 : radius}
                        withSeconds={withSeconds}
                        className={cssClass}
                        style={{ width: '100%' }}
                    />
                );
            }
            break;

        case 'datetime':
            datePickerElement = (
                <DateTimePicker
                    value={currentValue}
                    onChange={handleDateTimeChange}
                    label={label}
                    placeholder={placeholder}
                    description={parse(sanitizeHtmlForParsing(description))}
                    required={isRequired}
                    disabled={disabled}
                    size={size}
                    radius={radius === 'none' ? 0 : radius}
                    minDate={minDate}
                    maxDate={maxDate}
                    firstDayOfWeek={firstDayOfWeek}
                    weekendDays={weekendDays}
                    clearable={clearable}
                    valueFormat={format || 'YYYY-MM-DD'}
                    className={cssClass}
                    style={{ width: '100%' }}
                />
            );
            break;

        case 'date':
        default:
            // Create DatePickerInput props with all available options
            const datePickerProps: any = {
                value: currentValue,
                onChange: handleDateTimeChange,
                label: label,
                placeholder: placeholder,
                description: description,
                required: isRequired,
                disabled: disabled,
                size: size,
                radius: radius === 'none' ? 0 : radius,
                minDate: minDate,
                maxDate: maxDate,
                firstDayOfWeek: firstDayOfWeek,
                weekendDays: weekendDays,
                clearable: clearable,
                allowDeselect: allowDeselect,
                readOnly: readonly,
                valueFormat: format || 'YYYY-MM-DD HH:mm',
                className: cssClass,
                style: { width: '100%' }
            };

            // Add optional props if they are configured
            if (consistentWeeks) {
                datePickerProps.consistentWeeks = consistentWeeks;
            }
            if (hideOutsideDates) {
                datePickerProps.hideOutsideDates = hideOutsideDates;
            }
            if (hideWeekends) {
                datePickerProps.hideWeekends = hideWeekends;
            }

            datePickerElement = <DatePickerInput {...datePickerProps} />;
            break;
    }

    // Return the component with hidden input for form submission
    // Use Input.Wrapper only when there are no built-in labels to avoid duplication
    if (!hasBuiltInLabels) {
        return (
            <Input.Wrapper required={isRequired}>
                {datePickerElement}
                {/* Hidden input to ensure form submission captures the value */}
                <input
                    type="hidden"
                    name={name}
                    value={formValue || ''}
                    required={isRequired}
                />
            </Input.Wrapper>
        );
    }

    return (
        <>
            {datePickerElement}
            {/* Hidden input to ensure form submission captures the value */}
            <input
                type="hidden"
                name={name}
                value={formValue || ''}
                required={isRequired}
            />
        </>
    );
};

export default DatePickerStyle;
