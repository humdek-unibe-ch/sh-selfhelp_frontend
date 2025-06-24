import React, { useState } from 'react';
import type { IValidateStyle } from '../../../types/common/styles.types';
import { Box, Card, Title, TextInput, Button, Radio, Group, Alert, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

interface IValidateStyleProps {
    style: IValidateStyle;
}

const ValidateStyle: React.FC<IValidateStyleProps> = ({ style }) => {
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        passwordConfirm: '',
        gender: ''
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    const title = style.title?.content;
    const subtitle = style.subtitle?.content;
    const labelName = style.label_name?.content || 'Name';
    const labelPw = style.label_pw?.content || 'Password';
    const labelPwConfirm = style.label_pw_confirm?.content || 'Confirm Password';
    const labelGender = style.label_gender?.content || 'Gender';
    const genderMale = style.gender_male?.content || 'Male';
    const genderFemale = style.gender_female?.content || 'Female';
    const genderDivers = style.gender_divers?.content || 'Other';
    const labelActivate = style.label_activate?.content || 'Activate';
    const alertFail = style.alert_fail?.content || 'Validation failed';
    const alertSuccess = style.alert_success?.content || 'Validation successful';
    const namePlaceholder = style.name_placeholder?.content;
    const nameDescription = style.name_description?.content;
    const pwPlaceholder = style.pw_placeholder?.content;
    const anonymousUserNameDescription = style.anonymous_user_name_description?.content;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: string[] = [];

        if (!formData.name.trim()) {
            newErrors.push('Name is required');
        }
        if (!formData.password) {
            newErrors.push('Password is required');
        }
        if (formData.password !== formData.passwordConfirm) {
            newErrors.push('Passwords do not match');
        }
        if (!formData.gender) {
            newErrors.push('Gender selection is required');
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
            setSuccess(false);
        } else {
            setErrors([]);
            setSuccess(true);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    return (
        <Box className={style.css}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                {title && (
                    <Title order={2} mb="md">
                        {title}
                    </Title>
                )}
                
                {subtitle && (
                    <Text size="md" c="dimmed" mb="lg">
                        {subtitle}
                    </Text>
                )}

                {success ? (
                    <Alert icon={<IconCheck size={16} />} color="green" title="Success">
                        {alertSuccess}
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {errors.length > 0 && (
                            <Alert icon={<IconX size={16} />} color="red" title={alertFail} mb="md">
                                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}

                        <TextInput
                            label={labelName}
                            placeholder={namePlaceholder}
                            description={nameDescription || anonymousUserNameDescription}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label={labelPw}
                            placeholder={pwPlaceholder}
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label={labelPwConfirm}
                            type="password"
                            value={formData.passwordConfirm}
                            onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                            required
                            mb="md"
                        />

                        <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">
                                {labelGender} <Text component="span" c="red">*</Text>
                            </Text>
                            <Radio.Group
                                value={formData.gender}
                                onChange={(value) => handleInputChange('gender', value)}
                                required
                            >
                                <Group mt="xs">
                                    <Radio value="male" label={genderMale} />
                                    <Radio value="female" label={genderFemale} />
                                    <Radio value="other" label={genderDivers} />
                                </Group>
                            </Radio.Group>
                        </Box>

                        <Button type="submit" fullWidth>
                            {labelActivate}
                        </Button>
                    </form>
                )}
            </Card>
        </Box>
    );
};

export default ValidateStyle; 