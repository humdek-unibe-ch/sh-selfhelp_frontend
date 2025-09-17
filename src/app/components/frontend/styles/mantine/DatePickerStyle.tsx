// DatePickerStyle Component
import React, { useState, useEffect } from 'react';
import { Input } from '@mantine/core';
import {
    DatePickerInput,
    TimeInput,
    DateTimePicker
} from '@mantine/dates';
import dayjs from 'dayjs';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IDatePickerStyle } from '../../../../../types/common/styles.types';

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
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const value = getFieldContent(style, 'value');
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const description = getFieldContent(style, 'description');
    const error = getFieldContent(style, 'error');

    // DatePicker-specific fields
    const pickerType = getFieldContent(style, 'mantine_datepicker_type') || 'date';
    const format = getFieldContent(style, 'mantine_datepicker_format');
    const locale = getFieldContent(style, 'mantine_datepicker_locale') || 'en';
    const placeholder = getFieldContent(style, 'mantine_datepicker_placeholder');
    const minDateStr = getFieldContent(style, 'mantine_datepicker_min_date');
    const maxDateStr = getFieldContent(style, 'mantine_datepicker_max_date');
    const firstDayOfWeek = parseInt(getFieldContent(style, 'mantine_datepicker_first_day_of_week') || '1') as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const weekendDaysStr = getFieldContent(style, 'mantine_datepicker_weekend_days') || '[0,6]';
    const clearable = getFieldContent(style, 'mantine_datepicker_clearable') === '1';
    const allowDeselect = getFieldContent(style, 'mantine_datepicker_allow_deselect') === '1';
    const readonly = getFieldContent(style, 'mantine_datepicker_readonly') === '1';
    const withTimeGrid = getFieldContent(style, 'mantine_datepicker_with_time_grid') === '1';
    const consistentWeeks = getFieldContent(style, 'mantine_datepicker_consistent_weeks') === '1';
    const hideOutsideDates = getFieldContent(style, 'mantine_datepicker_hide_outside_dates') === '1';
    const hideWeekends = getFieldContent(style, 'mantine_datepicker_hide_weekends') === '1';
    const timeStep = parseInt(getFieldContent(style, 'mantine_datepicker_time_step') || '15');
    const timeFormat = getFieldContent(style, 'mantine_datepicker_time_format') || '24';
    const dateFormat = getFieldContent(style, 'mantine_datepicker_date_format') || 'YYYY-MM-DD';
    const withSeconds = getFieldContent(style, 'mantine_datepicker_with_seconds') === '1';

    // Mantine-specific fields
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color');
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));

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
    const hasBuiltInLabels = label || description || error;

    // Initialize state from section_data if available (for record forms)
    const [currentValue, setCurrentValue] = useState<Date | null>(() => {
        // Check if we have existing data from section_data (for record forms)
        const sectionDataArray = style.section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            const existingValue = firstRecord[name];
            if (existingValue) {
                return dayjs(existingValue).toDate();
            }
        }

        // Fallback to style configuration
        return value ? dayjs(value).toDate() : null;
    });

    // Update value when section_data changes (for record form pre-population)
    useEffect(() => {
        const sectionDataArray = style.section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            const existingValue = firstRecord[name];
            if (existingValue) {
                setCurrentValue(dayjs(existingValue).toDate());
            }
        }
    }, [style, name]);

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
            const [hours, minutes] = value.split(':').map(Number);
            const date = currentValue || new Date();
            date.setHours(hours, minutes || 0, 0, 0);
            setCurrentValue(new Date(date));
        } else {
            setCurrentValue(null);
        }
    };

    // Determine the current value for form submission
    const formValue = currentValue ? dayjs(currentValue).format(format || dateFormat) : '';

    // Create the appropriate date picker component based on type
    let datePickerElement: React.ReactElement;

    switch (pickerType) {
        case 'time':
            datePickerElement = (
                <TimeInput
                    value={currentValue ? dayjs(currentValue).format(withSeconds ? 'HH:mm:ss' : 'HH:mm') : ''}
                    onChange={handleTimeEventChange}
                    label={label}
                    placeholder={placeholder}
                    description={description}
                    error={error}
                    required={isRequired}
                    disabled={disabled}
                    size={size}
                    radius={radius === 'none' ? 0 : radius}
                    withSeconds={withSeconds}
                    className={cssClass}
                    style={{ width: '100%' }}
                />
            );
            break;

        case 'datetime':
            datePickerElement = (
                <DateTimePicker
                    value={currentValue}
                    onChange={handleDateTimeChange}
                    label={label}
                    placeholder={placeholder}
                    description={description}
                    error={error}
                    required={isRequired}
                    disabled={disabled}
                    size={size}
                    radius={radius === 'none' ? 0 : radius}
                    minDate={minDate}
                    maxDate={maxDate}
                    firstDayOfWeek={firstDayOfWeek}
                    weekendDays={weekendDays}
                    clearable={clearable}
                    valueFormat={format}
                    className={cssClass}
                    style={{ width: '100%' }}
                />
            );
            break;

        case 'date':
        default:
            datePickerElement = (
                <DatePickerInput
                    value={currentValue}
                    onChange={handleDateTimeChange}
                    label={label}
                    placeholder={placeholder}
                    description={description}
                    error={error}
                    required={isRequired}
                    disabled={disabled}
                    size={size}
                    radius={radius === 'none' ? 0 : radius}
                    minDate={minDate}
                    maxDate={maxDate}
                    firstDayOfWeek={firstDayOfWeek}
                    weekendDays={weekendDays}
                    clearable={clearable}
                    allowDeselect={allowDeselect}
                    readOnly={readonly}
                    valueFormat={format}
                    className={cssClass}
                    style={{ width: '100%' }}
                />
            );
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
                    value={formValue}
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
                value={formValue}
            />
        </>
    );
};

export default DatePickerStyle;
